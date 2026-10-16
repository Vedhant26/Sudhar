// API Service
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  getReports: async (userId?: string) => {
    const url = userId ? `${API_URL}/reports?user_id=${userId}` : `${API_URL}/reports`;
    const res = await fetch(url);
    return res.json();
  },

  createReport: async (report: any) => {
    const res = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
    return res.json();
  },

  verifyReport: async (id: string) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}/verify`, {
      method: 'POST'
    });
    return res.json();
  },

  sendToGovt: async (id: string) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}/send-to-govt`, {
      method: 'POST'
    });
    return res.json();
  },

  updateReport: async (id: string, updates: any) => {
    const res = await fetch(`${API_URL}/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  getPriorityQueue: async () => {
    const res = await fetch(`${API_URL}/priority-queue`);
    return res.json();
  },

  getStats: async () => {
    const res = await fetch(`${API_URL}/stats/dashboard`);
    return res.json();
  },

  getReport: async (id: string) => {
    const res = await fetch(`${API_URL}/reports/${id}`);
    return res.json();
  },

  assignCrew: async (id: string, crewId: string) => {
    const res = await fetch(`${API_URL}/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: crewId, status: 'Assigned' })
    });
    return res.json();
  },

  markFixed: async (id: string) => {
    const res = await fetch(`${API_URL}/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Fixed' })
    });
    return res.json();
  }
};
