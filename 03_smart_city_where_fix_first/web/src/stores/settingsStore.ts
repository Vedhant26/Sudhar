import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, Theme, Language } from '../types'

interface SettingsStore extends AppSettings {
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleNotifications: () => void
  toggleLocation: () => void
  toggleHighContrast: () => void
  toggleLargeText: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      notifications_enabled: true,
      location_enabled: true,
      high_contrast: false,
      large_text: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () =>
        set((state) => ({ notifications_enabled: !state.notifications_enabled })),
      toggleLocation: () =>
        set((state) => ({ location_enabled: !state.location_enabled })),
      toggleHighContrast: () =>
        set((state) => ({ high_contrast: !state.high_contrast })),
      toggleLargeText: () =>
        set((state) => ({ large_text: !state.large_text })),
    }),
    {
      name: 'Sudhar-settings',
    }
  )
)
