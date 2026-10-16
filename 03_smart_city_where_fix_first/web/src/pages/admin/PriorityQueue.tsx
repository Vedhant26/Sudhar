import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useReportsStore } from '../../stores/reportsStore'
import { calculateSmartPriority } from '../../utils/priorityBrain'
import { downloadAuditReportPDF } from '../../utils/pdfAuditReport'

export default function PriorityQueue() {
  const { reports } = useReportsStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'brain' | 'severity' | 'sla' | 'recency'>('brain')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  // Filter and search
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending' && !['Submitted', 'AI-triaged', 'Admin-verified'].includes(r.status)) return false
        if (filterStatus === 'in_progress' && !['Assigned', 'In-progress', 'Govt-notified'].includes(r.status)) return false
        if (filterStatus === 'fixed' && r.status !== 'Fixed') return false
        if (!['pending', 'in_progress', 'fixed'].includes(filterStatus) && r.status !== filterStatus) return false
      }

      // Category filter
      if (filterCategory !== 'all' && r.category.toLowerCase() !== filterCategory.toLowerCase()) {
        return false
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchTicket = r.ticket_id?.toLowerCase().includes(q)
        const matchCat = r.category?.toLowerCase().includes(q)
        const matchLoc = (r.location_name || r.zone || '').toLowerCase().includes(q)
        const matchDesc = (r.description || '').toLowerCase().includes(q)
        const matchCitizen = (r.citizen_name || '').toLowerCase().includes(q)
        return matchTicket || matchCat || matchLoc || matchDesc || matchCitizen
      }

      return true
    })
  }, [reports, filterStatus, filterCategory, searchTerm])

  // Algorithmic Sorting Logic
  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const brainA = calculateSmartPriority(a)
      const brainB = calculateSmartPriority(b)

      if (sortBy === 'brain') {
        return brainB.score - brainA.score
      }

      if (sortBy === 'severity') {
        const severityRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }
        const diff = (severityRank[b.severity || 'Medium'] || 0) - (severityRank[a.severity || 'Medium'] || 0)
        if (diff !== 0) return diff
        return brainB.score - brainA.score
      }

      if (sortBy === 'sla') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filteredReports, sortBy])

  const handleExportPDF = () => {
    setIsExporting(true)
    try {
      downloadAuditReportPDF(sortedReports, {
        filterTitle: `Filtered Priority Queue Audit (${sortedReports.length} Issues)`,
        adminName: 'Municipal Operations Command',
      })
      setExportNotice(`Exported audit dossier for ${sortedReports.length} records.`)
      setTimeout(() => setExportNotice(null), 4000)
    } catch (e) {
      console.error(e)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const statusCounts = useMemo(() => {
    return {
      all: reports.length,
      pending: reports.filter(r => ['Submitted', 'AI-triaged', 'Admin-verified'].includes(r.status)).length,
      in_progress: reports.filter(r => ['Assigned', 'In-progress', 'Govt-notified'].includes(r.status)).length,
      fixed: reports.filter(r => r.status === 'Fixed').length,
    }
  }, [reports])

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Toast Notice */}
      {exportNotice && (
        <div className="p-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xl flex items-center justify-between text-xs animate-slide-up border border-slate-700 dark:border-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Asset Remediation Queue
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                Multi-Factor Dynamic Scoring
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Incident Triage & Prioritization
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Dynamically ordered by algorithmic severity, infrastructure criticality, citizen validation weight, and SLA decay.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportPDF}
              disabled={isExporting || sortedReports.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isExporting ? 'Generating...' : `Export Queue Audit (${sortedReports.length} PDF)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Ticket ID, location, category, or problem keyword..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                title="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="brain">Algorithmic Priority Index (Recommended)</option>
              <option value="severity">Public Hazard Severity (Critical First)</option>
              <option value="sla">SLA Escalation / Oldest Pending</option>
              <option value="recency">Registration Timestamp (Newest First)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Records ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Pending Action ({statusCounts.pending})
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'in_progress'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              In Progress ({statusCounts.in_progress})
            </button>
            <button
              onClick={() => setFilterStatus('fixed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'fixed'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Resolved ({statusCounts.fixed})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Potholes & Roadways</option>
              <option value="drainage">Drainage & Sewage</option>
              <option value="flooding">Flooding & Hydrology</option>
              <option value="streetlight">Lighting & Electrical</option>
              <option value="traffic">Traffic Control & Signals</option>
              <option value="garbage">Sanitation & Waste</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Queue List */}
      {sortedReports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No matching incident records found</p>
          <p className="text-[11px] text-slate-400 mt-1">Adjust search terms or active filters to view incidents.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {sortedReports.map((item, index) => {
            const brain = calculateSmartPriority(item)
            return (
              <Link
                key={item.id}
                to={`/admin/ticket/${item.id}`}
                className="group relative block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all"
              >
                {/* Left status accent strip */}
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl ${
                    item.status === 'Fixed' ? 'bg-emerald-500' :
                    item.status === 'Rejected' ? 'bg-slate-400' :
                    brain.urgencyBand === 'CRITICAL' ? 'bg-rose-500' :
                    brain.urgencyBand === 'HIGH' ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`}
                />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Rank Indicator */}
                    <div className="shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                      #{index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.ticket_id}
                        </span>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.category}
                        </h2>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          brain.urgencyBand === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' :
                          brain.urgencyBand === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
                          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                        }`}>
                          {brain.urgencyBand}
                        </span>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          item.status === 'Fixed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
                          item.status === 'Rejected' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                          'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-2.5 line-clamp-2 leading-relaxed">
                        {item.description || 'Photographic evidence attached without supplementary text commentary.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>{item.location_name || item.zone}</span>
                        </div>
                        <span>•</span>
                        <span>Sector: {item.zone}</span>
                        <span>•</span>
                        <span>Citizen: {item.citizen_name || 'Reporter'}</span>
                        {item.photos && item.photos.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{item.photos.length} photo(s)</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left lg:text-right">
                      <div className="flex items-baseline lg:justify-end gap-1">
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                          {brain.score}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/100</span>
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Priority Index</p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700">
                      <span>View Dossier</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <div className="flex flex-wrap items-center gap-3 font-mono">
                    <span>Severity: {brain.breakdown.hazardSeverityScore}/35</span>
                    <span>Category: {brain.breakdown.categoryRiskScore}/25</span>
                    <span>SLA Aging: {brain.breakdown.agingEscalationScore}/20</span>
                    <span>Evidence: {brain.breakdown.evidenceTrustScore}/10</span>
                  </div>

                  <div className={`font-semibold ${brain.slaStatus.isBreached ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                    {brain.slaStatus.remainingLabel}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
