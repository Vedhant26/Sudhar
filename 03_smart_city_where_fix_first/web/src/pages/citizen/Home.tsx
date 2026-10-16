import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useReportsStore } from '../../stores/reportsStore'
import { useEffect } from 'react'

export default function Home() {
  const user = useAuthStore((state) => state.user)
  const { reports, fetchReports } = useReportsStore()

  useEffect(() => {
    fetchReports(user?.id)
  }, [user?.id, fetchReports])

  const myReports = reports.filter(r => r.citizen_id === user?.id)
  const stats = {
    total: myReports.length,
    pending: myReports.filter(r => !['Fixed', 'Closed'].includes(r.status)).length,
    fixed: myReports.filter(r => ['Fixed', 'Closed'].includes(r.status)).length,
    coins: user?.civic_coins || 0,
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/15">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-2">
              Citizen Champion
            </span>
            <h2 className="text-2xl font-black tracking-tight">{user?.name || 'Citizen'}</h2>
            <p className="text-xs text-blue-100 mt-1 flex items-center gap-2">
              <span>Level {user?.level || 1} Contributor</span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold">{user?.trust_score || 85}% Trust Rating</span>
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-inner">
            🪙
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">My Reports</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            ✓ {stats.fixed} resolved by city
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">CivicCoins</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="text-sm">🪙</span>
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.coins}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {stats.pending} active in review
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3.5">
          <Link
            to="/report"
            className="group flex flex-col items-center justify-center p-5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <span className="font-bold text-sm">Report Issue</span>
            <span className="text-[11px] text-blue-200 mt-0.5">+10 coins instant</span>
          </Link>

          <Link
            to="/scan"
            className="group flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="font-bold text-sm">Scan QR Code</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Quick smart tag</span>
          </Link>

          <Link
            to="/map"
            className="group flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="font-bold text-sm">City Map</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Explore nearby issues</span>
          </Link>

          <Link
            to="/rewards"
            className="group flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🏆</span>
            </div>
            <span className="font-bold text-sm">Rewards Hub</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Redeem vouchers</span>
          </Link>
        </div>
      </div>

      {/* Recent Citizen Reports */}
      {myReports.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              My Recent Submissions
            </h3>
            <Link to="/reports" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              View all ({myReports.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {myReports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3"
              >
                {report.photos && report.photos.length > 0 ? (
                  <img
                    src={report.photos[0]}
                    alt="Report"
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    📷
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white capitalize truncate">
                      {report.category}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      report.status === 'Fixed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{report.location_name || report.zone}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">{report.ticket_id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State if 0 reports */}
      {myReports.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Reports Submitted Yet
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Report a pothole, flooding, or broken streetlight to earn CivicCoins and help repair city infrastructure.
          </p>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
          >
            <span>Create First Report</span>
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  )
}
