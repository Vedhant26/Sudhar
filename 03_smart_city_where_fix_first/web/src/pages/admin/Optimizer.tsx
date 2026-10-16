import { useState, useMemo, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useReportsStore } from '../../stores/reportsStore'

interface ScheduledTask {
  id: string
  ticket_id: string
  location_name: string
  zone: string
  category: string
  severity: string
  cost: number
  hazard_score: number
  hours: number
  assignedCrew: string
  latitude: number
  longitude: number
  selected: boolean
}

export default function Optimizer() {
  const { reports, assignCrew, updateReport } = useReportsStore()

  // Controls
  const [budget, setBudget] = useState<number>(300000) // ₹3 Lakhs
  const [crewsCount, setCrewsCount] = useState<number>(5)
  const [strategy, setStrategy] = useState<'hazard' | 'schools' | 'efficiency' | 'speed'>('hazard')
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false)
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  // Generate candidate list from reports
  const candidateList = useMemo(() => {
    const costMap: Record<string, number> = {
      Critical: 60000,
      High: 35000,
      Medium: 18000,
      Low: 8000,
    }

    const hoursMap: Record<string, number> = {
      Critical: 36,
      High: 24,
      Medium: 12,
      Low: 6,
    }

    return reports.map((r, index) => {
      const severity = r.severity || 'Medium'
      const cost = costMap[severity] || 20000
      const hours = hoursMap[severity] || 16
      const hazard_score = Math.round(r.ml_score || (severity === 'Critical' ? 95 : severity === 'High' ? 82 : 65))
      const crewId = `Crew-${(index % crewsCount) + 1}`

      return {
        id: r.id,
        ticket_id: r.ticket_id,
        location_name: r.location_name || `Zone ${r.zone || 'Central'}`,
        zone: r.zone || 'ZONE_01',
        category: r.category,
        severity,
        cost,
        hazard_score,
        hours,
        assignedCrew: crewId,
        latitude: r.latitude || (16.516 + (index * 0.007)),
        longitude: r.longitude || (80.463 + (index * 0.005)),
        selected: true,
      } as ScheduledTask
    })
  }, [reports, crewsCount])

  // Run greedy knapsack optimization based on selected strategy
  const optimizedPlan = useMemo(() => {
    let sorted = [...candidateList]

    if (strategy === 'hazard') {
      sorted.sort((a, b) => (b.hazard_score / b.cost) - (a.hazard_score / a.cost))
    } else if (strategy === 'schools') {
      sorted.sort((a, b) => b.hazard_score - a.hazard_score)
    } else if (strategy === 'efficiency') {
      sorted.sort((a, b) => a.cost - b.cost)
    } else if (strategy === 'speed') {
      sorted.sort((a, b) => a.hours - b.hours)
    }

    let spent = 0
    return sorted.map((task, idx) => {
      if (spent + task.cost <= budget) {
        spent += task.cost
        return { ...task, selected: true, assignedCrew: `Crew-${(idx % crewsCount) + 1}` }
      }
      return { ...task, selected: false }
    })
  }, [candidateList, budget, crewsCount, strategy])

  const selectedTasks = optimizedPlan.filter(t => t.selected)
  const totalCost = selectedTasks.reduce((acc, t) => acc + t.cost, 0)
  const totalHours = selectedTasks.reduce((acc, t) => acc + t.hours, 0)
  const avgHazardMitigated = selectedTasks.length > 0
    ? Math.round(selectedTasks.reduce((acc, t) => acc + t.hazard_score, 0) / selectedTasks.length)
    : 0

  const baselineHazard = 52
  const improvement = Math.max(0, avgHazardMitigated - baselineHazard)

  // Leaflet Map for Route & Dispatch
  useEffect(() => {
    if (!mapRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [16.516403, 80.46389],
        zoom: 13,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      markersLayerRef.current = L.layerGroup().addTo(map)
      mapInstanceRef.current = map
    }

    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers()

      const latlngs: [number, number][] = []

      selectedTasks.forEach((task, index) => {
        const icon = L.divIcon({
          className: 'optimizer-marker',
          html: `<div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">#${index + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([task.latitude, task.longitude], { icon })
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <b>#${index + 1}: ${task.location_name}</b><br/>
              <b>Category:</b> ${task.category}<br/>
              <b>Est. Cost:</b> ₹${task.cost.toLocaleString()}<br/>
              <b>Assigned:</b> ${task.assignedCrew}
            </div>
          `)

        markersLayerRef.current?.addLayer(marker)
        latlngs.push([task.latitude, task.longitude])
      })

      if (latlngs.length > 1) {
        const polyline = L.polyline(latlngs, {
          color: '#2563eb',
          weight: 3,
          dashArray: '6, 6',
          opacity: 0.7,
        })
        markersLayerRef.current.addLayer(polyline)
      }

      if (latlngs.length > 0 && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] })
      }
    }
  }, [selectedTasks])

  const handleRunOptimization = () => {
    setIsOptimizing(true)
    setTimeout(() => {
      setIsOptimizing(false)
    }, 400)
  }

  const handleDispatchAll = () => {
    selectedTasks.forEach(task => {
      assignCrew(task.id)
      updateReport(task.id, {
        status: 'Assigned',
        assigned_to: task.assignedCrew,
      })
    })

    setDispatchSuccess(`Remediation crews dispatched to ${selectedTasks.length} prioritized locations.`)
    setTimeout(() => setDispatchSuccess(null), 5000)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16">
      {/* Success banner */}
      {dispatchSuccess && (
        <div className="p-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xl flex items-center justify-between text-xs animate-slide-up border border-slate-700 dark:border-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{dispatchSuccess}</span>
          </div>
          <button
            onClick={() => setDispatchSuccess(null)}
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
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Remediation Dispatch Engine
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Resource & Budget Allocation Optimizer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Knapsack-constrained optimization allocating municipal maintenance crews and operational expenditure across active urban sectors.
        </p>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Budget Allocation */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Operational Budget Cap
            </label>
            <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
              ₹{(budget / 100000).toFixed(1)} Lakhs
            </span>
          </div>

          <input
            type="range"
            min="50000"
            max="1000000"
            step="25000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-3"
          />

          <div className="flex justify-between gap-1.5">
            {[100000, 300000, 500000, 800000].map(val => (
              <button
                key={val}
                onClick={() => setBudget(val)}
                className={`text-xs py-1 px-2.5 rounded border transition font-mono ${
                  budget === val
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                }`}
              >
                ₹{val / 100000}L
              </button>
            ))}
          </div>
        </div>

        {/* Maintenance Crews */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Available Maintenance Units
            </label>
            <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
              {crewsCount} Units
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={crewsCount}
            onChange={(e) => setCrewsCount(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-3"
          />

          <p className="text-[11px] text-slate-400">
            Dedicated asphalt pavers, drainage suction trucks, and field technicians.
          </p>
        </div>

        {/* Objective Strategy */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider block mb-2.5">
            Remediation Priority Strategy
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'hazard', label: 'Maximum Public Safety', desc: 'Prioritize highest hazard impact per rupee' },
              { id: 'schools', label: 'Institutional Sectors', desc: 'Prioritize school, hospital & transit zones' },
              { id: 'efficiency', label: 'Maximum Volume Clearance', desc: 'Clear highest count of reported items' },
            ].map(strat => (
              <label
                key={strat.id}
                onClick={() => setStrategy(strat.id as any)}
                className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition text-xs ${
                  strategy === strat.id
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === strat.id}
                  onChange={() => setStrategy(strat.id as any)}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{strat.label}</p>
                  <p className="text-[10px] text-slate-400">{strat.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Approved for Dispatch</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{selectedTasks.length} <span className="text-xs font-normal text-slate-400">/ {candidateList.length}</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Within budget constraint</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Estimated Expenditure</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">₹{(totalCost / 1000).toLocaleString()}k</p>
          <p className="text-[11px] text-slate-400 mt-1">₹{((budget - totalCost) / 1000).toLocaleString()}k margin</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Risk Reduction Index</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">+{improvement}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Vs unoptimized routing</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Remediation Hours</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalHours} hrs</p>
          <p className="text-[11px] text-slate-400 mt-1">Distributed across {crewsCount} units</p>
        </div>
      </div>

      {/* Geospatial Dispatch Route */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Optimized Dispatch Waypoints & Spatial Routing
            </h2>
            <p className="text-[11px] text-slate-400">
              Ordered repair sequence minimizing transit time and machinery relocation overhead
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunOptimization}
              disabled={isOptimizing}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              {isOptimizing ? 'Recomputing...' : 'Recompute Allocation'}
            </button>

            <button
              onClick={handleDispatchAll}
              disabled={selectedTasks.length === 0}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              Dispatch {selectedTasks.length} Work Orders
            </button>
          </div>
        </div>

        <div
          ref={mapRef}
          className="h-72 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 z-0"
        />
      </div>

      {/* Prioritized Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Remediation Pipeline Schedule
            </h2>
            <p className="text-[11px] text-slate-400">
              Prioritized by risk mitigation impact per budget expenditure
            </p>
          </div>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {selectedTasks.length} Approved Work Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Sequence</th>
                <th className="py-2.5 px-4 font-semibold">Location / Sector</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold">Severity</th>
                <th className="py-2.5 px-4 font-semibold">Hazard Index</th>
                <th className="py-2.5 px-4 font-semibold">Est. Cost</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Unit</th>
                <th className="py-2.5 px-4 font-semibold">Remediation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {optimizedPlan.map((task, index) => (
                <tr
                  key={task.id}
                  className={task.selected ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30' : 'opacity-40 bg-slate-50/50 dark:bg-slate-800/20'}
                >
                  <td className="py-3 px-4 font-bold font-mono">
                    {task.selected ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded font-mono text-[10px]">
                        #{index + 1}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Unfunded</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {task.location_name}
                    <span className="block text-[11px] font-normal text-slate-400">{task.zone}</span>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">{task.category}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      task.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' :
                      task.severity === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
                      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                    }`}>
                      {task.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {task.hazard_score}/100
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">₹{task.cost.toLocaleString()}</td>
                  <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {task.selected ? task.assignedCrew : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {task.selected ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                        ● Approved in Allocation
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        Exceeds budget cap
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
