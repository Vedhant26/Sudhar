import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReportsStore } from '../../stores/reportsStore'
import { downloadAuditReportPDF } from '../../utils/pdfAuditReport'
import { calculateSmartPriority } from '../../utils/priorityBrain'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function Dashboard() {
  const { reports } = useReportsStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)

  // Real-time stats from the store
  const openReports = reports.filter(r => ['Submitted', 'AI-triaged', 'Admin-verified'].includes(r.status)).length
  const inProgress = reports.filter(r => ['Assigned', 'In-progress', 'Govt-notified'].includes(r.status)).length
  const fixedCount = reports.filter(r => r.status === 'Fixed').length
  const totalReports = reports.length
  const criticalCount = reports.filter(r => r.severity === 'Critical' || (r.ml_score || 0) >= 80).length

  const handleExportPDF = () => {
    setIsExporting(true)
    try {
      downloadAuditReportPDF(reports, {
        filterTitle: 'Comprehensive Municipal Infrastructure Audit',
        adminName: 'Municipal Operations Command',
      })
      setDownloadNotice('Audit Dossier PDF exported successfully.')
      setTimeout(() => setDownloadNotice(null), 4000)
    } catch (err) {
      console.error('PDF Export error:', err)
      alert('Could not generate PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Recent reports from store (newest first)
  const recentReports = [...reports]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Anomaly detection: check for spikes in categories
  const categoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const avgPerCategory = totalReports / Math.max(Object.keys(categoryCounts).length, 1)
  const anomalies = Object.entries(categoryCounts)
    .filter(([_, count]) => count > avgPerCategory * 2)
    .map(([cat, count]) => ({ category: cat, count, expected: Math.round(avgPerCategory) }))

  // Mini map
  useEffect(() => {
    if (!mapRef.current) return

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([16.516, 80.464], 12)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      mapInstance.current = map
    }

    const map = mapInstance.current

    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    reports.forEach(r => {
      if (!r.latitude || !r.longitude) return
      const color = r.status === 'Fixed' ? '#10b981' :
                    r.status === 'Rejected' ? '#64748b' :
                    r.severity === 'Critical' ? '#ef4444' :
                    r.severity === 'High' ? '#f97316' : '#2563eb'

      L.circleMarker([r.latitude, r.longitude], {
        radius: r.severity === 'Critical' ? 6 : 5,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.85,
      }).addTo(map).bindPopup(`
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
          <strong style="text-transform: capitalize;">${r.category}</strong> [${r.ticket_id}]<br/>
          <span>${r.location_name || r.zone}</span><br/>
          <span style="color: ${color}; font-weight: bold;">Status: ${r.status}</span>
        </div>
      `)
    })
  }, [reports])

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Toast Notice */}
      {downloadNotice && (
        <div className="p-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xl flex items-center justify-between text-xs animate-slide-up border border-slate-700 dark:border-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{downloadNotice}</span>
          </div>
          <button
            onClick={() => setDownloadNotice(null)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900 rounded-md transition"
            title="Dismiss notice"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Active
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Heartbeat: 3000ms</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Municipal Operations Command
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time civic asset telemetry, risk prioritization, predictive hazard triage, and work order dispatch
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isExporting ? 'Generating...' : 'Export Audit Dossier (PDF)'}</span>
            </button>

            <Link
              to="/admin/queue"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 transition active:scale-95"
            >
              <span>Priority Queue</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{totalReports}</span>
            <span className="text-xs text-slate-400 font-medium">logged records</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* High Risk Hazards */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-xs relative overflow-hidden group hover:border-rose-400 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Critical Hazards</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">{criticalCount}</span>
            <span className="text-xs text-rose-600/80 font-semibold">immediate triage</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${totalReports ? (criticalCount / totalReports) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Pending / Active */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs relative overflow-hidden group hover:border-amber-400 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{openReports}</span>
            <span className="text-xs text-slate-400 font-medium">{inProgress} in-progress</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalReports ? (openReports / totalReports) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Resolved Work Orders</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{fixedCount}</span>
            <span className="text-xs text-slate-400 font-medium">closed on site</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalReports ? (fixedCount / totalReports) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Cluster Anomaly Alerts if any */}
      {anomalies.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Cluster Anomaly Detected in Incoming Reports
              </h3>
              <div className="mt-1 space-y-0.5">
                {anomalies.map((a, i) => (
                  <p key={i} className="text-xs text-slate-600 dark:text-slate-300">
                    Volume spike in <span className="font-semibold capitalize text-slate-900 dark:text-white">{a.category}</span> ({a.count} incidents vs expected baseline {a.expected}). Potential localized infrastructure failure requiring immediate dispatch.
                  </p>
                ))}
              </div>
              <div className="mt-2.5">
                <Link
                  to="/admin/queue"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Filter anomaly queue</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Stream & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Recent Reports Stream */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Incident Records
              </h2>
              <p className="text-[11px] text-slate-500">Live prioritized feed from citizen reports</p>
            </div>
            <Link
              to="/admin/queue"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Queue ({reports.length})</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No incident reports recorded in database.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const brain = calculateSmartPriority(report)
                return (
                  <Link
                    key={report.id}
                    to={`/admin/ticket/${report.id}`}
                    className="group block p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {report.ticket_id}
                        </span>
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white capitalize group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {report.category}
                        </h3>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        brain.urgencyBand === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' :
                        brain.urgencyBand === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
                        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                      }`}>
                        Score: {brain.score} • {brain.urgencyBand}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mb-2.5">
                      {report.description || 'No detailed written commentary submitted with report.'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>{report.location_name || report.zone || 'Central Sector'}</span>
                        </div>
                        <span>•</span>
                        <span>{report.citizen_name || 'Citizen'}</span>
                      </div>

                      <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        report.status === 'Fixed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
                        report.status === 'Rejected' ? 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300' :
                        'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Geospatial Map & Category Distribution */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Incident Geospatial Map
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Sector 16 Grid</span>
            </div>
            
            <div
              ref={mapRef}
              className="h-56 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 z-0"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Critical
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> High
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Medium
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Resolved
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Distribution by Infrastructure Asset
            </h2>
            <div className="space-y-2.5">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / (totalReports || 1)) * 100)
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                        {cat}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
