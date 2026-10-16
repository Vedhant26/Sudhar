import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useAuthStore } from '../../stores/authStore'
import { useReportsStore } from '../../stores/reportsStore'
import type { Report } from '../../types'

export default function ReportsList() {
  const user = useAuthStore((state) => state.user)
  const { reports, fetchReports, loading, updateReport } = useReportsStore()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [confirmedId, setConfirmedId] = useState<string | null>(null)

  useEffect(() => {
    fetchReports(user?.id)
  }, [user?.id])

  // Get reports for user or demo fallback
  const myReports = reports.filter(r => r.citizen_id === user?.id || r.citizen_id === 'U001')

  const handleConfirmFixed = (reportId: string) => {
    updateReport(reportId, { status: 'Citizen-confirmed' as any })
    setConfirmedId(reportId)
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
    setTimeout(() => {
      setConfirmedId(null)
      setSelectedReport(null)
    }, 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading your citizen reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-28">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Reports</h1>
          <p className="text-xs text-gray-500">Track real-time municipal status and earned CivicCoins</p>
        </div>
        <Link
          to="/report"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>New Report</span>
        </Link>
      </div>

      {myReports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-700">
          <span className="text-6xl mb-4 block">📝</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No Reports Submitted Yet
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Report hazards like potholes, broken streetlights, or drainage issues to earn CivicCoins.
          </p>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:bg-blue-700 transition"
          >
            <span>📸</span>
            <span>Report Your First Issue</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-blue-500/50"
            >
              <div className="flex gap-4">
                {report.photos && report.photos[0] ? (
                  <img
                    src={report.photos[0]}
                    alt="Report Evidence"
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl flex-shrink-0">
                    {report.category === 'pothole' ? '🕳️' :
                     report.category === 'streetlight' ? '💡' :
                     report.category === 'drainage' ? '🚰' :
                     report.category === 'flooding' ? '💧' : '📋'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white capitalize truncate">
                      {report.category}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                      report.status === 'Fixed' || report.status === 'Citizen-confirmed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : report.status === 'Assigned' || report.status === 'In-progress'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : report.status === 'Govt-notified'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : report.status === 'Admin-verified'
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      ● {report.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 truncate mb-2">
                    📍 {report.location_name || report.zone || 'City Road'}
                  </p>

                  {report.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mb-2">
                      {report.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="font-mono text-gray-400">
                      {report.ticket_id}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-yellow-600 dark:text-yellow-400">
                      <span>🪙</span>
                      <span>+{report.civic_coins_earned || 10} Coins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                  {selectedReport.ticket_id}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize mt-1">
                  {selectedReport.category} Issue
                </h2>
                <p className="text-xs text-gray-500">
                  📍 {selectedReport.location_name || selectedReport.zone}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Photo preview */}
            {selectedReport.photos && selectedReport.photos[0] && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 border border-gray-200 dark:border-gray-700">
                <img
                  src={selectedReport.photos[0]}
                  alt="Evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl text-xs text-gray-700 dark:text-gray-300 mb-4">
              <p className="font-semibold text-gray-500 mb-0.5">Description:</p>
              <p>{selectedReport.description || 'No description provided.'}</p>
            </div>

            {/* Lifecycle Timeline */}
            <div className="mb-6">
              <h4 className="text-xs uppercase font-bold text-gray-500 mb-3 tracking-wider">
                Resolution Journey
              </h4>
              <div className="space-y-3">
                {[
                  { step: 'Report Submitted', sub: 'Logged in civic database', done: true },
                  { step: 'Admin Verified', sub: 'Verified by municipal engineers (+25 coins)', done: ['Admin-verified', 'Govt-notified', 'Assigned', 'In-progress', 'Fixed', 'Citizen-confirmed'].includes(selectedReport.status) },
                  { step: 'Govt Reference Issued', sub: selectedReport.govt_reference_number ? `Official Ref: ${selectedReport.govt_reference_number}` : 'Forwarded to Municipal Dept', done: ['Govt-notified', 'Assigned', 'In-progress', 'Fixed', 'Citizen-confirmed'].includes(selectedReport.status) },
                  { step: 'Crew Dispatched', sub: selectedReport.assigned_to ? `Assigned to: ${selectedReport.assigned_to}` : 'Crew allocation in progress', done: ['Assigned', 'In-progress', 'Fixed', 'Citizen-confirmed'].includes(selectedReport.status) },
                  { step: 'Fixed & Closed', sub: 'Repair completed on-site (+50 coins)', done: ['Fixed', 'Citizen-confirmed'].includes(selectedReport.status) },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                      item.done
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {item.done ? '✓' : idx + 1}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${item.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {item.step}
                      </p>
                      <p className="text-[11px] text-gray-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coin Summary */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <div>
                  <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200">Total Coins Earned</p>
                  <p className="text-[11px] text-yellow-700 dark:text-yellow-300">Convertible to real money</p>
                </div>
              </div>
              <span className="text-lg font-black text-yellow-800 dark:text-yellow-200">
                +{selectedReport.civic_coins_earned || 10} Coins
              </span>
            </div>

            {/* Citizen Confirmation button if marked fixed */}
            {selectedReport.status === 'Fixed' && (
              <button
                onClick={() => handleConfirmFixed(selectedReport.id)}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow transition text-sm mb-2"
              >
                {confirmedId === selectedReport.id ? '✓ Confirmed as Fixed!' : '👍 Confirm Fix & Close Ticket'}
              </button>
            )}

            <button
              onClick={() => setSelectedReport(null)}
              className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
