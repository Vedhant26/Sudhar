import { useEffect, useRef, useState } from 'react'
import { useReportsStore } from '../../stores/reportsStore'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const CATEGORY_COLORS: Record<string, string> = {
  pothole: '#f97316',
  flooding: '#3b82f6',
  drainage: '#06b6d4',
  streetlight: '#eab308',
  traffic: '#ef4444',
  pedestrian: '#22c55e',
  garbage: '#6b7280',
  other: '#a855f7',
}

const CATEGORY_ICONS: Record<string, string> = {
  pothole: '🕳️',
  flooding: '💧',
  drainage: '🚰',
  streetlight: '💡',
  traffic: '🚦',
  pedestrian: '🚶',
  garbage: '🗑️',
  other: '📋',
}

const STATUS_COLORS: Record<string, string> = {
  'Submitted': '#eab308',
  'AI-triaged': '#f97316',
  'Admin-verified': '#3b82f6',
  'Govt-notified': '#a855f7',
  'Assigned': '#06b6d4',
  'In-progress': '#3b82f6',
  'Fixed': '#22c55e',
  'Closed': '#6b7280',
  'Rejected': '#ef4444',
}

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const { reports } = useReportsStore()
  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.category === filter)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Initialize map centered on Vijayawada area
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([16.516, 80.464], 13)

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Update markers when reports or filter change
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    // Add markers for each report
    filteredReports.forEach((report) => {
      if (!report.latitude || !report.longitude) return

      const color = CATEGORY_COLORS[report.category] || '#6b7280'
      const icon = CATEGORY_ICONS[report.category] || '📍'
      const statusColor = STATUS_COLORS[report.status] || '#6b7280'

      // Create custom div icon
      const divIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            width: 40px; height: 40px;
            background: ${color};
            border: 3px solid ${statusColor};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <span style="transform: rotate(45deg); font-size: 18px;">${icon}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      })

      const marker = L.marker([report.latitude, report.longitude], { icon: divIcon })
        .addTo(map)

      marker.on('click', () => {
        setSelectedReport(report)
      })
    })
  }, [filteredReports])

  const categories = [
    { id: 'all', label: 'All Issues', icon: '📍' },
    { id: 'pothole', label: 'Potholes', icon: '🕳️' },
    { id: 'flooding', label: 'Flooding', icon: '💧' },
    { id: 'drainage', label: 'Drainage', icon: '🚰' },
    { id: 'streetlight', label: 'Lights', icon: '💡' },
    { id: 'traffic', label: 'Traffic', icon: '🚦' },
    { id: 'garbage', label: 'Garbage', icon: '🗑️' },
  ]

  return (
    <div className="relative" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Filter Chips - Floating on top */}
      <div className="absolute top-3 left-3 right-3 z-[1000] overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-lg transition-all
                ${filter === cat.id
                  ? 'bg-blue-500 text-white scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              {cat.id === 'all' && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                  {reports.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Floating Panel */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 flex gap-4">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{filteredReports.length}</p>
          <p className="text-xs text-gray-500">Issues</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{filteredReports.filter(r => r.status === 'Fixed').length}</p>
          <p className="text-xs text-gray-500">Fixed</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-yellow-600">{filteredReports.filter(r => !['Fixed', 'Closed', 'Rejected'].includes(r.status)).length}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
      </div>

      {/* Report Detail Card - When a marker is clicked */}
      {selectedReport && (
        <div className="absolute bottom-3 right-3 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 w-80 max-w-[calc(100vw-100px)] animate-slide-up">
          <button
            onClick={() => setSelectedReport(null)}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition"
          >
            ✕
          </button>

          <div className="flex items-start gap-3 mb-3">
            <div className="text-3xl">
              {CATEGORY_ICONS[selectedReport.category] || '📍'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                {selectedReport.category}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {selectedReport.location_name || selectedReport.zone}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
              selectedReport.status === 'Fixed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              selectedReport.status === 'In-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {selectedReport.status}
            </span>
          </div>

          {selectedReport.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {selectedReport.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-gray-400 text-xs">{selectedReport.ticket_id}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">ML:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(selectedReport.ml_score || 0)}</span>
            </div>
          </div>

          {selectedReport.photos && selectedReport.photos.length > 0 && selectedReport.photos[0] && (
            <img
              src={selectedReport.photos[0]}
              alt="Report"
              className="w-full h-24 object-cover rounded-lg mt-3"
            />
          )}
        </div>
      )}

      {/* No reports fallback */}
      {filteredReports.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center pointer-events-auto">
            <span className="text-4xl mb-2 block">📍</span>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">No Issues Found</h3>
            <p className="text-sm text-gray-500 mb-3">
              {filter !== 'all' ? 'Try a different filter' : 'Be the first to report!'}
            </p>
            <Link
              to="/report"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
            >
              Report Issue
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
