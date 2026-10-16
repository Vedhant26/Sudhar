import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Report } from '../types'

interface ReportsStore {
  reports: Report[]
  loading: boolean
  error: string | null
  fetchReports: (userId?: string) => Promise<void>
  createReport: (report: Partial<Report>) => Promise<Report>
  updateReport: (id: string, updates: Partial<Report>) => Promise<void>
  deleteReport: (id: string) => Promise<void>
  getReportById: (id: string) => Report | undefined
  getReportByTicketId: (ticketId: string) => Report | undefined
  getAllReports: () => Report[]
  getReportsByUser: (userId: string) => Report[]
  verifyReport: (id: string) => void
  rejectReport: (id: string) => void
  sendToGovt: (id: string) => string
  assignCrew: (id: string) => string
  markFixed: (id: string) => { coinsAwarded: number; citizenId: string }
  markInProgress: (id: string) => void
}

function generateId(): string {
  return `R${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
}

function generateTicketId(): string {
  return `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`
}

// Seed some initial reports so admin panel isn't empty
const SEED_REPORTS: Report[] = [
  {
    id: 'R-SEED-001',
    ticket_id: 'TKT-2026-0001',
    location_id: 'L0362',
    location_name: 'MG Road Junction',
    zone: 'ZONE_05',
    latitude: 16.516403,
    longitude: 80.46389,
    category: 'pothole',
    description: 'Large pothole on main road causing traffic disruptions. Multiple vehicles have been damaged.',
    severity: 'High',
    photos: [],
    citizen_id: 'U001',
    citizen_name: 'Demo Citizen',
    citizen_trust_score: 85,
    status: 'Submitted',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    ml_score: 94,
    ml_confidence: 92,
    ml_suggested_category: 'Road damage',
    ml_suggested_severity: 'High',
    civic_coins_earned: 10,
  },
  {
    id: 'R-SEED-002',
    ticket_id: 'TKT-2026-0002',
    location_id: 'L0521',
    location_name: 'Park Street Crossing',
    zone: 'ZONE_15',
    latitude: 16.527,
    longitude: 80.472,
    category: 'streetlight',
    description: 'Multiple streetlights not working on Park Street. Dangerous for pedestrians at night.',
    severity: 'Medium',
    photos: [],
    citizen_id: 'U001',
    citizen_name: 'Demo Citizen',
    citizen_trust_score: 85,
    status: 'Submitted',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    ml_score: 87,
    ml_confidence: 88,
    ml_suggested_category: 'Streetlight',
    ml_suggested_severity: 'Medium',
    civic_coins_earned: 10,
  },
  {
    id: 'R-SEED-003',
    ticket_id: 'TKT-2026-0003',
    location_id: 'L0734',
    location_name: 'College Road',
    zone: 'ZONE_18',
    latitude: 16.505,
    longitude: 80.488,
    category: 'drainage',
    description: 'Blocked drain causing waterlogging during rains. Water entering shops and houses.',
    severity: 'Critical',
    photos: [],
    citizen_id: 'U001',
    citizen_name: 'Demo Citizen',
    citizen_trust_score: 85,
    status: 'Submitted',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    ml_score: 82,
    ml_confidence: 85,
    ml_suggested_category: 'Drainage',
    ml_suggested_severity: 'Critical',
    civic_coins_earned: 10,
  },
]

import { useAuthStore } from './authStore'

export const useReportsStore = create<ReportsStore>()(
  persist(
    (set, get) => ({
      reports: SEED_REPORTS,
      loading: false,
      error: null,

      fetchReports: async (userId?: string) => {
        try {
          const url = userId ? `/api/reports?user_id=${userId}` : '/api/reports'
          const res = await fetch(url)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
              set({ reports: data, loading: false, error: null })
              return
            }
          }
        } catch (err) {
          console.warn('Could not fetch reports from backend:', err)
        }
        set({ loading: false })
      },

      createReport: async (report: Partial<Report>) => {
        set({ loading: true, error: null })
        let savedReport: Report | null = null

        const payload = {
          category: report.category || 'other',
          description: report.description || '',
          photos: report.photos || [],
          latitude: report.latitude || 16.516,
          longitude: report.longitude || 80.463,
          location_name: report.location_name || 'City Location',
          location_id: report.location_id || `L${Math.floor(100 + Math.random() * 900)}`,
          zone: report.zone || 'ZONE_01',
          citizen_id: report.citizen_id || useAuthStore.getState().user?.id || 'U001',
          severity: report.severity || 'Medium',
        }

        try {
          const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (res.ok) {
            savedReport = await res.json()
          } else {
            console.warn('API returned non-OK status:', res.status, await res.text())
          }
        } catch (err) {
          console.warn('API report creation error, using local fallback:', err)
        }

        const newReport: Report = savedReport || {
          id: generateId(),
          ticket_id: generateTicketId(),
          location_id: payload.location_id,
          location_name: payload.location_name,
          zone: payload.zone,
          latitude: payload.latitude,
          longitude: payload.longitude,
          category: payload.category,
          description: payload.description,
          severity: payload.severity,
          photos: payload.photos,
          citizen_id: payload.citizen_id,
          citizen_name: report.citizen_name || 'Demo Citizen',
          citizen_trust_score: report.citizen_trust_score || 85,
          status: 'Submitted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ml_score: report.ml_score || Math.round(75 + Math.random() * 20),
          ml_confidence: report.ml_confidence || Math.round(85 + Math.random() * 10),
          ml_suggested_category: report.ml_suggested_category || report.category,
          ml_suggested_severity: report.ml_suggested_severity || report.severity,
          civic_coins_earned: 10,
        }

        set((state) => ({
          reports: [newReport, ...state.reports.filter((r) => r.id !== newReport.id)],
          loading: false,
        }))

        // Award 10 coins for submitting
        try {
          useAuthStore.getState().addCoins(10, `Submitted report for ${newReport.category}`, newReport.id)
        } catch (e) {
          console.warn('Could not add coins to auth store:', e)
        }

        return newReport
      },

      updateReport: async (id: string, updates: Partial<Report>) => {
        try {
          await fetch(`/api/reports/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })
        } catch (e) {
          console.warn('API updateReport failed:', e)
        }
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
          ),
        }))
      },

      deleteReport: async (id: string) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }))
      },

      getReportById: (id: string) => {
        return get().reports.find((r) => r.id === id || r.ticket_id === id)
      },

      getReportByTicketId: (ticketId: string) => {
        return get().reports.find((r) => r.ticket_id === ticketId)
      },

      getAllReports: () => {
        return get().reports
      },

      getReportsByUser: (userId: string) => {
        return get().reports.filter((r) => r.citizen_id === userId)
      },

      verifyReport: (id: string) => {
        const report = get().reports.find((r) => r.id === id || r.ticket_id === id)
        const targetId = report?.id || id
        fetch(`/api/admin/reports/${targetId}/verify`, { method: 'POST' }).catch((e) =>
          console.warn('API verify failed:', e)
        )
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === targetId
              ? {
                ...r,
                status: 'Admin-verified' as const,
                civic_coins_earned: (r.civic_coins_earned || 10) + 25,
                updated_at: new Date().toISOString(),
              }
              : r
          ),
        }))

        // Award 25 coins for verification
        try {
          useAuthStore.getState().addCoins(25, `Report verified by City Admin (${report?.ticket_id || targetId})`, targetId)
        } catch (e) {
          console.warn('Could not add coins to auth store:', e)
        }
      },

      rejectReport: (id: string) => {
        const targetId = get().reports.find((r) => r.id === id || r.ticket_id === id)?.id || id
        fetch(`/api/reports/${targetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Rejected' }),
        }).catch((e) => console.warn('API reject failed:', e))
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === targetId
              ? { ...r, status: 'Rejected' as const, updated_at: new Date().toISOString() }
              : r
          ),
        }))
      },

      sendToGovt: (id: string) => {
        const targetId = get().reports.find((r) => r.id === id || r.ticket_id === id)?.id || id
        const refNum = `GOVT-2026-${Math.floor(10000 + Math.random() * 90000)}`
        fetch(`/api/admin/reports/${targetId}/send-to-govt`, { method: 'POST' }).catch((e) =>
          console.warn('API send-to-govt failed:', e)
        )
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === targetId
              ? {
                ...r,
                status: 'Govt-notified' as const,
                govt_reference_number: refNum,
                updated_at: new Date().toISOString(),
              }
              : r
          ),
        }))
        return refNum
      },

      assignCrew: (id: string) => {
        const targetId = get().reports.find((r) => r.id === id || r.ticket_id === id)?.id || id
        const crew = `Crew-${Math.floor(1 + Math.random() * 20)}`
        fetch(`/api/reports/${targetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigned_to: crew, status: 'Assigned' }),
        }).catch((e) => console.warn('API assignCrew failed:', e))
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === targetId
              ? {
                ...r,
                status: 'Assigned' as const,
                assigned_to: crew,
                updated_at: new Date().toISOString(),
              }
              : r
          ),
        }))
        return crew
      },

      markInProgress: (id: string) => {
        const targetId = get().reports.find((r) => r.id === id || r.ticket_id === id)?.id || id
        fetch(`/api/reports/${targetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'In-progress' }),
        }).catch((e) => console.warn('API markInProgress failed:', e))
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === targetId
              ? { ...r, status: 'In-progress' as const, updated_at: new Date().toISOString() }
              : r
          ),
        }))
      },

      markFixed: (id: string) => {
        const report = get().reports.find((r) => r.id === id || r.ticket_id === id)
        const targetId = report?.id || id
        const coinsAwarded = 50 // bonus coins for resolution
        fetch(`/api/reports/${targetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Fixed' }),
        }).catch((e) => console.warn('API markFixed failed:', e))
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === targetId
              ? {
                ...r,
                status: 'Fixed' as const,
                civic_coins_earned: (r.civic_coins_earned || 10) + coinsAwarded,
                updated_at: new Date().toISOString(),
              }
              : r
          ),
        }))

        // Award 50 bonus coins for resolution
        try {
          useAuthStore.getState().addCoins(50, `Issue fixed & resolved on site (${report?.ticket_id || targetId})`, targetId)
        } catch (e) {
          console.warn('Could not add coins to auth store:', e)
        }

        return { coinsAwarded, citizenId: report?.citizen_id || '' }
      },
    }),
    {
      name: 'Sudhar-reports',
    }
  )
)
