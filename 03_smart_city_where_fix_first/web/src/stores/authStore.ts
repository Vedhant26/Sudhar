import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthState, RewardTransaction } from '../types'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface CashoutTransaction extends RewardTransaction {
  cash_amount?: number
  payment_method?: string
  payment_details?: string
  reference_id?: string
  status?: 'success' | 'processing' | 'failed'
}

interface AuthStore extends AuthState {
  transactions: CashoutTransaction[]
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  addCoins: (amount: number, reason: string, reportId?: string) => void
  redeemCoins: (coins: number, cashAmount: number, paymentMethod: string, paymentDetails: string) => { success: boolean; referenceId: string }
}

const DEFAULT_CITIZEN: User = {
  id: 'U001',
  email: 'citizen@demo',
  name: 'Demo Citizen',
  role: 'citizen',
  trust_score: 85,
  civic_coins: 450,
  level: 3,
  reports_count: 12,
  verified_reports: 10,
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
}

const DEFAULT_ADMIN: User = {
  id: 'A001',
  email: 'admin@demo',
  name: 'Demo Admin',
  role: 'admin',
  created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
}

const INITIAL_TRANSACTIONS: CashoutTransaction[] = [
  {
    id: 'TXN-INIT-01',
    user_id: 'U001',
    type: 'earn',
    amount: 100,
    reason: 'Welcome bonus & profile verification',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'TXN-INIT-02',
    user_id: 'U001',
    type: 'earn',
    amount: 50,
    reason: 'Report verified & resolved by PWD crew',
    report_id: 'R-SEED-001',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'TXN-INIT-03',
    user_id: 'U001',
    type: 'redeem',
    amount: 100,
    cash_amount: 50,
    payment_method: 'UPI',
    payment_details: 'citizen@okhdfcbank',
    reference_id: 'UPI/2026/89341209',
    status: 'success',
    reason: 'Converted 100 CivicCoins to ₹50 via UPI',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
]

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: DEFAULT_CITIZEN,
      token: 'demo-token-citizen',
      isAuthenticated: true,
      transactions: INITIAL_TRANSACTIONS,

      login: async (email: string, password: string) => {
        // Try calling the backend API first
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          if (response.ok) {
            const data = await response.json()
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
            })
            return
          }
        } catch (err) {
          console.warn('API unreachable, falling back to local client auth:', err)
        }

        // Offline / Demo fallback
        if (email === 'admin@demo' || email.toLowerCase().includes('admin')) {
          set({
            user: { ...DEFAULT_ADMIN, email },
            token: 'demo-token-admin',
            isAuthenticated: true,
          })
        } else {
          const existing = get().user
          set({
            user: {
              ...(existing?.role === 'citizen' ? existing : DEFAULT_CITIZEN),
              email: email || 'citizen@demo',
              name: email.split('@')[0] || 'Demo Citizen',
              role: 'citizen',
            },
            token: 'demo-token-citizen',
            isAuthenticated: true,
          })
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },

      addCoins: (amount: number, reason: string, reportId?: string) => {
        const user = get().user
        if (!user) return

        const newCoins = (user.civic_coins || 0) + amount
        const newTransaction: CashoutTransaction = {
          id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_id: user.id,
          type: 'earn',
          amount,
          reason,
          report_id: reportId,
          created_at: new Date().toISOString(),
          status: 'success',
        }

        set((state) => ({
          user: state.user
            ? {
              ...state.user,
              civic_coins: newCoins,
              trust_score: Math.min(100, (state.user.trust_score || 80) + 1),
              level: Math.floor(newCoins / 150) + 1,
            }
            : null,
          transactions: [newTransaction, ...state.transactions],
        }))
      },

      redeemCoins: (coins: number, cashAmount: number, paymentMethod: string, paymentDetails: string) => {
        const user = get().user
        if (!user || (user.civic_coins || 0) < coins) {
          return { success: false, referenceId: '' }
        }

        const referenceId = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`
        const newTransaction: CashoutTransaction = {
          id: `TXN-${Date.now()}`,
          user_id: user.id,
          type: 'redeem',
          amount: coins,
          cash_amount: cashAmount,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          reference_id: referenceId,
          status: 'success',
          reason: `Converted ${coins} CivicCoins to ₹${cashAmount} via ${paymentMethod}`,
          created_at: new Date().toISOString(),
        }

        set((state) => ({
          user: state.user
            ? {
              ...state.user,
              civic_coins: Math.max(0, (state.user.civic_coins || 0) - coins),
            }
            : null,
          transactions: [newTransaction, ...state.transactions],
        }))

        return { success: true, referenceId }
      },
    }),
    {
      name: 'Sudhar-auth',
    }
  )
)
