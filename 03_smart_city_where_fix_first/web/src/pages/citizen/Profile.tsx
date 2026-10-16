import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useSettingsStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile</h1>

      {/* User Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl text-white">
            👤
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            <p className="text-sm text-blue-500 mt-1">Level {user?.level || 1} Citizen</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{user?.reports_count || 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Reports</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{user?.verified_reports || 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Verified</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{user?.civic_coins || 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Coins</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mb-6">
        <h3 className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
          Settings
        </h3>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="text-gray-900 dark:text-white">Theme</span>
          </div>
          <span className="text-gray-600 dark:text-gray-400 capitalize">{theme}</span>
        </button>

        <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <span className="text-gray-900 dark:text-white">Language</span>
          </div>
          <span className="text-gray-600 dark:text-gray-400">English</span>
        </button>

        <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <span className="text-gray-900 dark:text-white">Notifications</span>
          </div>
          <span className="text-gray-600 dark:text-gray-400">Enabled</span>
        </button>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          🔬 <strong>Synthetic dataset</strong> for educational purposes
        </p>
        <p className="text-xs text-gray-500">
          Sudhar v1.0 • DATATHON 2026 Track 3
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition shadow-lg"
      >
        Logout
      </button>
    </div>
  )
}
