import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

// User attached photos for login slideshow
const SLIDESHOW_PHOTOS = [
  '/slideshow/image1.jpg',
  '/slideshow/image2.jpg',
  '/slideshow/image3.avif',
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)

  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  // 2-second slideshow interval with smooth fade
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_PHOTOS.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Invalid credentials. Use one-click demo login below.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (role: 'citizen' | 'admin') => {
    const credentials = {
      citizen: { email: 'citizen@demo', password: 'demo123' },
      admin: { email: 'admin@demo', password: 'demo123' },
    }

    setLoading(true)
    setError('')
    try {
      await login(credentials[role].email, credentials[role].password)
      navigate(role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError('Quick login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background Photo Slideshow with 2-second crossfade & medium opacity */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {SLIDESHOW_PHOTOS.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out transform scale-105 ${
              index === currentSlide ? 'opacity-45' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${src})`,
            }}
          />
        ))}

        {/* Medium-opacity dark gradient overlay for deep contrast & readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/60 backdrop-blur-[2px]" />
      </div>

      {/* Main Glassmorphic Login Container */}
      <div className="relative z-10 w-full max-w-md animate-fade-in my-auto">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Sudhar Logo"
            className="inline-block w-20 h-20 rounded-2xl shadow-2xl shadow-purple-500/30 mb-3 ring-4 ring-white/15 transform hover:scale-105 transition-transform duration-300 object-contain"
          />
          
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <span>Sudhar</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-medium tracking-normal">
              v2.0
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-300 mt-1">
            Smart Municipal Priority & Grievance Intelligence
          </p>
        </div>

        {/* Frosted Glass Login Card */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Sign In</h2>
              <p className="text-xs text-slate-400">Access citizen reporting or municipal command</p>
            </div>
            {/* Live slideshow indicator dot */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              {SLIDESHOW_PHOTOS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'w-4 bg-blue-400' : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-slide-up">
              <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  placeholder="admin@demo or citizen@demo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons with sleek micro-interactions */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Fast Demo One-Click Access
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => quickLogin('citizen')}
                disabled={loading}
                className="group relative flex flex-col items-center justify-center p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition-all text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">Citizen</span>
                <span className="text-[11px] text-slate-400">Report & Earn Coins</span>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('admin')}
                disabled={loading}
                className="group relative flex flex-col items-center justify-center p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 transition-all text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">City Admin</span>
                <span className="text-[11px] text-slate-400">Audit & Triage Queue</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-5">
          <p className="text-xs text-slate-400 font-medium">
            Smart City Datathon • Track 3 Infrastructure AI
          </p>
        </div>
      </div>
    </div>
  )
}
