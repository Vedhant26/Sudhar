import { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useReportsStore } from '../../stores/reportsStore'
import Dashboard from './Dashboard'
import PriorityQueue from './PriorityQueue'
import TicketDetail from './TicketDetail'
import Analytics from './Analytics'
import Optimizer from './Optimizer'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { fetchReports, reports } = useReportsStore()
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    fetchReports()
    const pollTimer = setInterval(() => {
      fetchReports()
    }, 3000)
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => {
      clearInterval(pollTimer)
      clearInterval(clockTimer)
    }
  }, [fetchReports])

  const pendingReportsCount = reports.filter(r => ['Submitted', 'AI-triaged', 'Admin-verified'].includes(r.status)).length
  const criticalReportsCount = reports.filter(r => r.severity === 'Critical' || (r.ml_score || 0) >= 80).length

  interface NavItem {
    path: string
    label: string
    description?: string
    icon: React.ReactNode
    exact?: boolean
    badge?: number
    badgeColor?: string
  }

  interface NavSection {
    title: string
    items: NavItem[]
  }

  const navSections: NavSection[] = [
    {
      title: 'OPERATIONAL COMMAND',
      items: [
        {
          path: '/admin',
          label: 'Overview Command',
          description: 'Live telemetry & overview',
          exact: true,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )
        },
        {
          path: '/admin/queue',
          label: 'Incident Triage Queue',
          description: 'Algorithmic risk ranking',
          badge: pendingReportsCount > 0 ? pendingReportsCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          )
        },
      ]
    },
    {
      title: 'FLEET & INTELLIGENCE',
      items: [
        {
          path: '/admin/analytics',
          label: 'Citywide Analytics',
          description: 'SLA metrics & ML models',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          path: '/admin/optimizer',
          label: 'Remediation Optimizer',
          description: 'Knapsack dispatch engine',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          )
        },
      ]
    }
  ]

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get current section label for breadcrumb
  const getCurrentPageTitle = () => {
    if (location.pathname === '/admin') return 'Overview Command'
    if (location.pathname.startsWith('/admin/queue')) return 'Incident Triage Queue'
    if (location.pathname.startsWith('/admin/ticket')) return 'Incident Forensic Dossier'
    if (location.pathname.startsWith('/admin/analytics')) return 'Citywide Analytics'
    if (location.pathname.startsWith('/admin/optimizer')) return 'Remediation Optimizer'
    return 'Command Operations'
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Sidebar - Desktop */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-200 border-r border-slate-800 hidden lg:flex lg:flex-col z-30 shadow-xl">
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Header / Brand Emblem */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <img
                src="/logo.png"
                alt="Sudhar Logo"
                className="w-9 h-9 rounded-xl object-contain shadow-md shadow-purple-500/25 ring-1 ring-white/10 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-white">SUDHAR</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    HQ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">Municipal Ops Suite</p>
              </div>
            </div>

            {/* Live Operational Status Widget */}
            <div className="mb-5 p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-semibold text-slate-300">Live Telemetry</span>
              </div>
              <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                {reports.length} Incidents
              </span>
            </div>

            {/* Navigation Sections */}
            <nav className="space-y-5">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider px-2 uppercase block">
                    {section.title}
                  </span>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.path, item.exact)
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`
                            group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-xs font-medium
                            ${active
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-500/50'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </div>

                          {item.badge !== undefined && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              active ? 'bg-white text-blue-700' : 'bg-amber-500 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* User Profile Card & Quick Actions */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
              title="Preview Citizen View"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Citizen Mobile App</span>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {user?.name || 'Municipal Officer'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@demo'}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-md transition"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 flex-1 flex flex-col pb-20 lg:pb-8">
        {/* Top Command Bar (Desktop & Mobile) */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-2xs backdrop-blur-md">
          {/* Breadcrumb & Live indicator */}
          <div className="flex items-center gap-3">
            <img
              src="/sudhar-logo.png"
              alt="SUDHAR"
              className="lg:hidden w-7 h-7 rounded-lg object-contain"
            />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">Municipal Command</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {getCurrentPageTitle()}
              </span>
            </div>
          </div>

          {/* Right Status Pill & Clock */}
          <div className="flex items-center gap-3">
            {criticalReportsCount > 0 && (
              <Link
                to="/admin/queue"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{criticalReportsCount} Critical Hazards</span>
              </Link>
            )}

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{currentTime}</span>
            </div>

            <button
              onClick={handleLogout}
              className="lg:hidden p-1.5 text-slate-500 hover:text-rose-600 transition"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/queue" element={<PriorityQueue />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/optimizer" element={<Optimizer />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around">
          {navSections.flatMap(s => s.items).map((item) => {
            const active = isActive(item.path, item.exact)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition text-[10px] font-medium
                  ${active
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }
                `}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-1">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

