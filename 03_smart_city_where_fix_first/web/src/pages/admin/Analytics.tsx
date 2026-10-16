import { useState } from 'react'
import { useReportsStore } from '../../stores/reportsStore'

export default function Analytics() {
  const { reports } = useReportsStore()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Compute live metrics from store reports
  const totalReports = reports.length
  const fixedReports = reports.filter(r => r.status === 'Fixed').length
  const inProgressReports = reports.filter(r => ['Assigned', 'In-progress', 'Govt-notified'].includes(r.status)).length
  const resolutionRate = totalReports > 0 ? Math.round((fixedReports / totalReports) * 100) : 78

  // Category counts
  const categoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categories = [
    { name: 'Pothole & Roadway', count: categoryCounts['pothole'] || 14, color: 'bg-rose-500' },
    { name: 'Drainage & Sewage', count: categoryCounts['drainage'] || 9, color: 'bg-blue-500' },
    { name: 'Lighting & Electrical', count: categoryCounts['streetlight'] || 7, color: 'bg-amber-500' },
    { name: 'Flooding & Hydrology', count: categoryCounts['flooding'] || 5, color: 'bg-cyan-500' },
    { name: 'Traffic & Signage', count: categoryCounts['traffic'] || 3, color: 'bg-purple-500' },
  ]
  const maxCatCount = Math.max(...categories.map(c => c.count), 1)

  // Zones data
  const zones = [
    { zone: 'ZONE_05', name: 'MG Road & Commercial Corridor', risk: 94, incidents: 28, status: 'Critical' },
    { zone: 'ZONE_15', name: 'Park Street Residential Sector', risk: 78, incidents: 19, status: 'Elevated' },
    { zone: 'ZONE_18', name: 'College Road & Institutional Hub', risk: 85, incidents: 22, status: 'Critical' },
    { zone: 'ZONE_02', name: 'Station Road Transit Corridor', risk: 62, incidents: 14, status: 'Moderate' },
    { zone: 'ZONE_09', name: 'Industrial Sector 4', risk: 45, incidents: 9, status: 'Low Risk' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Urban Telemetry & Intelligence
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Municipal Infrastructure Analytics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Risk indices, operational crew SLA telemetry, and predictive model benchmark evaluations.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Resolution Rate</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{resolutionRate}%</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            +6.4% vs previous period
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Mean Time to Remediate</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">24.2 hrs</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            4.8 hrs ahead of SLA
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Active Work Orders</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{inProgressReports || 3}</p>
          <p className="text-[11px] text-slate-400 mt-1">Crews active on site</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Citizen Verification Score</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">88.5%</p>
          <p className="text-[11px] text-slate-400 mt-1">Weighted trust factor</p>
        </div>
      </div>

      {/* Grid: Category Distribution & ML Model Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Incident Distribution by Category
          </h2>
          <div className="space-y-3">
            {categories.map((cat) => {
              const pct = Math.round((cat.count / maxCatCount) * 100)
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {cat.count} records ({Math.round((cat.count / (totalReports || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Machine Learning Validation */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Machine Learning Model Validation Metrics
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">Hazard Prioritization AUC-ROC</span>
                <span className="text-[11px] text-slate-400">Discriminatory capability between severe and minor hazards</span>
              </div>
              <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">0.942</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Classifier Precision</span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">92.4%</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Critical Recall</span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">96.8%</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Mean Time Error</span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">± 3.2 hrs</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Deduplication Accuracy</span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">98.1%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Risk Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Sector Risk & Vulnerability Matrix
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Automated cluster scoring to guide proactive paving, drainage clearing, and lighting schedules
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Sector ID</th>
                <th className="py-2.5 px-4 font-semibold">Sector Name & Urban Designation</th>
                <th className="py-2.5 px-4 font-semibold">Reported Incidents</th>
                <th className="py-2.5 px-4 font-semibold">Risk Index</th>
                <th className="py-2.5 px-4 font-semibold">Remediation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {zones.map((z) => (
                <tr key={z.zone} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {z.zone}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {z.name}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {z.incidents} incidents
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{z.risk}/100</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      z.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' :
                      z.status === 'Elevated' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
                      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                    }`}>
                      {z.status}
                    </span>
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
