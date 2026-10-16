import type { Report } from '../types'

export interface PriorityEvaluation {
  score: number // 0 to 100
  urgencyBand: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'RESOLVED'
  urgencyColor: string
  breakdown: {
    hazardSeverityScore: number // max 35
    categoryRiskScore: number   // max 25
    agingEscalationScore: number // max 20
    evidenceTrustScore: number  // max 10
    zoneDensityScore: number    // max 10
  }
  slaStatus: {
    hoursElapsed: number
    targetResolutionHours: number
    isBreached: boolean
    remainingLabel: string
  }
  recommendedAction: string
}

// Category inherent risk weights
const CATEGORY_HAZARD_MAP: Record<string, number> = {
  flooding: 25,       // Severe public safety and structural hazard
  drainage: 23,       // Health hazard, water contamination & road collapse risk
  pothole: 20,        // Accident hazard for motorists and two-wheelers
  streetlight: 17,    // Nocturnal pedestrian safety & crime risk
  traffic: 18,        // Gridlock & emergency response blockage
  pedestrian: 15,     // Walkway hazards
  garbage: 12,        // Sanitation & hygiene concern
  other: 10,
}

// Severity base scores
const SEVERITY_BASE_MAP: Record<string, number> = {
  Critical: 35,
  High: 28,
  Medium: 18,
  Low: 8,
}

// Zone density and vulnerability multipliers
const ZONE_DENSITY_WEIGHTS: Record<string, number> = {
  ZONE_01: 9, // Commercial / High Transit
  ZONE_05: 10, // Main arterial & Hospital corridor
  ZONE_15: 8, // School & Residential
  ZONE_18: 7, // Industrial / Outskirts
}

/**
 * Intelligent Multi-Factor Civic Priority Evaluator ("Proper Brain")
 * Evaluates reports using:
 * 1. Hazard Severity (35%)
 * 2. Inherent Public Hazard of Category (25%)
 * 3. Time Decay / Aging Escalation (20%) - unaddressed reports grow more critical over time
 * 4. Evidence Fidelity & Citizen Trust (10%)
 * 5. Zone Transit & Vulnerability Density (10%)
 */
export function calculateSmartPriority(report: Report): PriorityEvaluation {
  // If report is already fixed or rejected, mark as resolved
  if (report.status === 'Fixed') {
    return {
      score: 15,
      urgencyBand: 'RESOLVED',
      urgencyColor: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      breakdown: {
        hazardSeverityScore: 5,
        categoryRiskScore: 4,
        agingEscalationScore: 2,
        evidenceTrustScore: 2,
        zoneDensityScore: 2,
      },
      slaStatus: {
        hoursElapsed: 0,
        targetResolutionHours: 24,
        isBreached: false,
        remainingLabel: 'Resolved on-site',
      },
      recommendedAction: 'Completed & Verified in Field',
    }
  }

  if (report.status === 'Rejected') {
    return {
      score: 5,
      urgencyBand: 'RESOLVED',
      urgencyColor: 'text-gray-500 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      breakdown: {
        hazardSeverityScore: 1,
        categoryRiskScore: 1,
        agingEscalationScore: 1,
        evidenceTrustScore: 1,
        zoneDensityScore: 1,
      },
      slaStatus: {
        hoursElapsed: 0,
        targetResolutionHours: 0,
        isBreached: false,
        remainingLabel: 'Dismissed / Non-actionable',
      },
      recommendedAction: 'Closed - Insufficient or Invalid Evidence',
    }
  }

  // 1. Hazard Severity (0 - 35)
  const severityScore = (report.severity && report.severity in SEVERITY_BASE_MAP)
    ? SEVERITY_BASE_MAP[report.severity]
    : 18

  // 2. Category Hazard (0 - 25)
  const catKey = report.category ? report.category.toLowerCase() : ''
  const categoryRisk = catKey in CATEGORY_HAZARD_MAP ? CATEGORY_HAZARD_MAP[catKey] : 15

  // 3. Time Aging Escalation (0 - 20)
  const createdTime = new Date(report.created_at).getTime()
  const now = Date.now()
  const hoursElapsed = Math.max(0, Math.floor((now - createdTime) / 3600000))
  
  // Aging SLA logic:
  // Critical issues SLA: 12h, High: 24h, Medium: 48h, Low: 72h
  const targetResolutionHours = report.severity === 'Critical' ? 12 :
                                report.severity === 'High' ? 24 :
                                report.severity === 'Medium' ? 48 : 72
  
  const isBreached = hoursElapsed > targetResolutionHours

  // Aging adds up to 20 points
  let agingScore = 0
  if (hoursElapsed < 4) {
    agingScore = 4
  } else if (hoursElapsed < 12) {
    agingScore = 8
  } else if (hoursElapsed < 24) {
    agingScore = 14
  } else if (hoursElapsed < 48) {
    agingScore = 18
  } else {
    agingScore = 20 // Escalated max due to prolonged citizen impact
  }

  // 4. Evidence & Trust (0 - 10)
  let evidenceScore = 4
  if (report.photos && report.photos.length > 0) {
    evidenceScore += 3 // Verified physical evidence attached
  }
  const trust = report.citizen_trust_score ?? 80
  if (trust >= 85) evidenceScore += 3
  else if (trust >= 60) evidenceScore += 1

  // 5. Zone Density (0 - 10)
  const zoneKey = report.zone || ''
  const zoneScore = zoneKey in ZONE_DENSITY_WEIGHTS ? ZONE_DENSITY_WEIGHTS[zoneKey] : 7

  // Total raw score (0 - 100)
  const totalRaw = severityScore + categoryRisk + agingScore + evidenceScore + zoneScore
  const totalScore = Math.min(100, Math.max(10, totalRaw))

  // Urgency classification
  let urgencyBand: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'RESOLVED' = 'MODERATE'
  let urgencyColor = 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
  let recommendedAction = 'Standard municipal maintenance queue'

  if (totalScore >= 82 || report.severity === 'Critical' || isBreached) {
    urgencyBand = 'CRITICAL'
    urgencyColor = 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
    recommendedAction = 'Immediate dispatch • Notify Municipal Zonal Engineer'
  } else if (totalScore >= 68 || report.severity === 'High') {
    urgencyBand = 'HIGH'
    urgencyColor = 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800'
    recommendedAction = 'High priority triage • Assign repair crew within 12h'
  } else if (totalScore >= 50) {
    urgencyBand = 'ELEVATED'
    urgencyColor = 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
    recommendedAction = 'Scheduled maintenance in current operational cycle'
  }

  const remainingHours = targetResolutionHours - hoursElapsed
  const remainingLabel = isBreached 
    ? `SLA Breached by +${hoursElapsed - targetResolutionHours}h` 
    : `${remainingHours}h remaining on SLA`

  return {
    score: totalScore,
    urgencyBand,
    urgencyColor,
    breakdown: {
      hazardSeverityScore: severityScore,
      categoryRiskScore: categoryRisk,
      agingEscalationScore: agingScore,
      evidenceTrustScore: evidenceScore,
      zoneDensityScore: zoneScore,
    },
    slaStatus: {
      hoursElapsed,
      targetResolutionHours,
      isBreached,
      remainingLabel,
    },
    recommendedAction,
  }
}
