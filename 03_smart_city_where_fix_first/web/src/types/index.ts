// Core types for the Sudhar application

export interface Location {
  location_id: string;
  zone: string;
  road_type: string;
  road_condition: 'Good' | 'Fair' | 'Poor' | 'Critical';
  population_density_per_km2: number;
  near_school: boolean;
  near_hospital: boolean;
  pedestrian_activity: 'Low' | 'Medium' | 'High';
  latitude: number;
  longitude: number;
}

export interface Incident {
  incident_id: string;
  location_id: string;
  timestamp: string;
  incident_type: 'Pothole' | 'Flooding' | 'Streetlight outage' | 'Signal failure' | 'Blocked drain' | 'Collision';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  injuries: number;
  reported_by: 'Citizen' | 'Authority' | 'Police' | 'Sensor';
  resolved: boolean;
  resolution_hours?: number;
}

export interface Complaint {
  complaint_id: string;
  location_id: string;
  created_at: string;
  category: 'Road damage' | 'Drainage' | 'Lighting' | 'Traffic' | 'Pedestrian safety' | 'Waste';
  priority_reported: 'Low' | 'Normal' | 'High';
  status: 'Open' | 'Assigned' | 'In progress' | 'Resolved' | 'Closed';
  days_to_resolution?: number;
}

export interface Report {
  id: string;
  ticket_id: string;
  location_id: string;
  location_name?: string;
  zone?: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  photos: string[];
  citizen_id: string;
  citizen_name?: string;
  citizen_trust_score?: number;
  status: 'Submitted' | 'AI-triaged' | 'Admin-verified' | 'Govt-notified' | 'Assigned' | 'In-progress' | 'Fixed' | 'Citizen-confirmed' | 'Closed' | 'Rejected' | 'Needs-info';
  created_at: string;
  updated_at: string;
  ml_score?: number;
  ml_confidence?: number;
  ml_suggested_category?: string;
  ml_suggested_severity?: string;
  assigned_to?: string;
  resolution_photo?: string;
  govt_reference_number?: string;
  civic_coins_earned?: number;
}

export interface PriorityItem {
  location_id: string;
  location_name: string;
  zone: string;
  latitude: number;
  longitude: number;
  priority_score: number;
  confidence: number;
  top_reasons: string[];
  missing_info: string[];
  incident_count: number;
  complaint_count: number;
  last_incident: string;
  severity_distribution: Record<string, number>;
  predicted_resolution_hours?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'admin';
  trust_score?: number;
  civic_coins?: number;
  level?: number;
  reports_count?: number;
  verified_reports?: number;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface RewardTransaction {
  id: string;
  user_id: string;
  type: 'earn' | 'redeem';
  amount: number;
  reason: string;
  report_id?: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at?: string;
}

export interface MLExplanation {
  feature: string;
  contribution: number;
  value: string;
}

export interface AnomalyAlert {
  id: string;
  zone: string;
  category: string;
  current_count: number;
  expected_count: number;
  sigma: number;
  detected_at: string;
}

export interface BudgetOptimization {
  budget: number;
  crew_count: number;
  selected_locations: string[];
  total_impact: number;
  baseline_impact: number;
  improvement_pct: number;
}

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'te' | 'hi';

export interface AppSettings {
  theme: Theme;
  language: Language;
  notifications_enabled: boolean;
  location_enabled: boolean;
  high_contrast: boolean;
  large_text: boolean;
}

export interface QueuedReport {
  id: string;
  data: Partial<Report>;
  photos: Blob[];
  timestamp: number;
  synced: boolean;
}
