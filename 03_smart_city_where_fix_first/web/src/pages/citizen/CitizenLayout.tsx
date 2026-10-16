import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Home from './Home'
import ReportNew from './ReportNew'
import ReportsList from './ReportsList'
import Map from './Map'
import Rewards from './Rewards'
import Profile from './Profile'
import Scan from './Scan'

export default function CitizenLayout() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const navItems = [
    {
      path: '/',
      label: 'Feed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/map',
      label: 'Map',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      path: '/report',
      label: 'Report',
      isMain: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      path: '/rewards',
      label: 'Rewards',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Sudhar Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-xs shrink-0"
            />
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Sudhar</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Hi, {user?.name || 'Citizen'}!</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* CivicCoins Pill — clean SVG icon, no emoji */}
            <Link
              to="/rewards"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.389 5.389 0 01-.421-.821H10a1 1 0 100-2H8.172a7.36 7.36 0 010-1H10a1 1 0 100-2H8.315c.163-.292.347-.567.421-.821z" />
              </svg>
              <span className="font-bold text-xs text-amber-700 dark:text-amber-400">{user?.civic_coins || 0}</span>
            </Link>

            {/* Scan QR Button */}
            <Link
              to="/scan"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
              title="Scan Geo Tag"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportNew />} />
          <Route path="/reports" element={<ReportsList />} />
          <Route path="/map" element={<Map />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scan" element={<Scan />} />
        </Routes>
      </main>

      {/* Mobile Floating Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-50 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.path)
            if (item.isMain) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative -mt-6 group focus:outline-none"
                  aria-label="Submit Report"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 group-hover:scale-105 active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900">
                    {item.icon}
                  </div>
                  <span className="block text-[10px] font-bold text-center mt-0.5 text-blue-600 dark:text-blue-400">
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all text-[11px] font-medium
                  ${active
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}>
                  {item.icon}
                </div>
                <span className="mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
