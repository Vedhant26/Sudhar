import { jsPDF } from 'jspdf'
import type { Report } from '../types'
import { calculateSmartPriority } from './priorityBrain'

/**
 * Downloads a comprehensive Executive Audit Report of all citizen complaints as a formatted PDF.
 */
export function downloadAuditReportPDF(reports: Report[], options: { filterTitle?: string; adminName?: string } = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = 16

  const totalReports = reports.length
  const criticalCount = reports.filter(r => r.severity === 'Critical' || (r.ml_score || 0) >= 80).length
  const pendingCount = reports.filter(r => ['Submitted', 'AI-triaged', 'Admin-verified'].includes(r.status)).length
  const resolvedCount = reports.filter(r => r.status === 'Fixed').length
  const auditRef = `AUD-2026-${Math.floor(100000 + Math.random() * 900000)}`
  const generatedAt = new Date().toLocaleString()

  // 1. Header Banner
  doc.setFillColor(15, 23, 42) // Dark Navy
  doc.rect(margin, y, contentWidth, 24, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('SUDHAR SMART CITY MISSION • INFRASTRUCTURE AUDIT REPORT', margin + 6, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(190, 205, 225)
  doc.text(`Official Municipal Grievance Audit Dossier • Reference: ${auditRef}`, margin + 6, y + 16)
  doc.text(`Generated: ${generatedAt}  |  Officer: ${options.adminName || 'Municipal Admin'}`, margin + 6, y + 21)

  y += 30

  // 2. Summary KPI Metric Boxes
  const boxWidth = (contentWidth - 9) / 4
  const stats = [
    { label: 'TOTAL PROBLEMS', value: totalReports.toString(), color: [30, 58, 138] },
    { label: 'CRITICAL / URGENT', value: criticalCount.toString(), color: [185, 28, 28] },
    { label: 'PENDING ACTION', value: pendingCount.toString(), color: [180, 83, 9] },
    { label: 'RESOLVED / FIXED', value: resolvedCount.toString(), color: [21, 128, 61] },
  ]

  stats.forEach((s, i) => {
    const x = margin + i * (boxWidth + 3)
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.rect(x, y, boxWidth, 16, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(s.color[0], s.color[1], s.color[2])
    doc.text(s.value, x + 4, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text(s.label, x + 4, y + 12.5)
  })

  y += 22

  // 3. Section Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(`CITIZEN INCIDENT AUDIT LOG (${reports.length} ISSUES REGISTERED)`, margin, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Ranked with intelligent civic risk analysis, location telemetry, and citizen problem descriptions.', margin, y + 4.5)

  y += 9

  // Helper for page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage()
      y = 16
      // Sub-header for subsequent pages
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 116, 139)
      doc.text(`SUDHAR AUDIT DOSSIER (${auditRef}) — Page Continuation`, margin, y)
      doc.setDrawColor(203, 213, 225)
      doc.line(margin, y + 2, margin + contentWidth, y + 2)
      y += 8
    }
  }

  // 4. Render Each Issue Record
  reports.forEach((item, index) => {
    const brain = calculateSmartPriority(item)
    const cardHeight = 36 // base height

    checkPageBreak(cardHeight)

    // Card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(margin, y, contentWidth, 33, 2, 2, 'FD')

    // Severity indicator strip
    if (item.severity === 'Critical' || brain.urgencyBand === 'CRITICAL') {
      doc.setFillColor(239, 68, 68) // Red
    } else if (item.severity === 'High' || brain.urgencyBand === 'HIGH') {
      doc.setFillColor(249, 115, 22) // Orange
    } else if (item.status === 'Fixed') {
      doc.setFillColor(34, 197, 94) // Green
    } else {
      doc.setFillColor(59, 130, 246) // Blue
    }
    doc.rect(margin, y, 3, 33, 'F')

    // Top info line
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(`#${index + 1} [${item.ticket_id}] ${item.category.toUpperCase()}`, margin + 6, y + 6)

    // Severity & Urgency badge text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(`Severity: ${item.severity || 'Medium'}  |  Priority Score: ${brain.score}/100 [${brain.urgencyBand}]`, margin + 68, y + 6)

    // Status on the right
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    if (item.status === 'Fixed') doc.setTextColor(22, 163, 74)
    else if (item.status === 'Rejected') doc.setTextColor(220, 38, 38)
    else doc.setTextColor(37, 99, 235)
    doc.text(`STATUS: ${item.status.toUpperCase()}`, margin + contentWidth - 36, y + 6)

    // Location & telemetry line
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(51, 65, 85)
    const locText = `Location: ${item.location_name || item.zone || 'City'} (Zone: ${item.zone || '01'}) | Lat: ${Number(item.latitude || 16.5).toFixed(4)}, Lng: ${Number(item.longitude || 80.4).toFixed(4)}`
    doc.text(locText, margin + 6, y + 11.5)

    // Citizen problem description (Crucial for admin understanding)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(30, 41, 59)
    const desc = item.description 
      ? `Citizen Problem: "${item.description.length > 130 ? item.description.substring(0, 130) + '...' : item.description}"`
      : 'Citizen Problem: [No additional text notes submitted with report]'
    doc.text(desc, margin + 6, y + 17.5)

    // Metadata: Citizen, Photos, SLA & Gov reference
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    const reporterInfo = `Reporter: ${item.citizen_name || 'Citizen'} (Trust: ${item.citizen_trust_score || 85}%) | Photos: ${item.photos?.length || 0} attached | Coins: ${item.civic_coins_earned || 10}`
    doc.text(reporterInfo, margin + 6, y + 23)

    const dispatchInfo = `Action Required: ${brain.recommendedAction} ${item.govt_reference_number ? `| Govt Ref: ${item.govt_reference_number}` : ''} ${item.assigned_to ? `| Crew: ${item.assigned_to}` : ''}`
    doc.text(dispatchInfo, margin + 6, y + 28)

    y += 36
  })

  // Add Page Numbers at bottom of all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(`Sudhar Smart City Audit System • Confidential Municipal Document • Page ${i} of ${pageCount}`, margin, pageHeight - 8)
    doc.text(`Timestamp: ${new Date().toISOString()}`, pageWidth - margin - 45, pageHeight - 8)
  }

  // Trigger browser download
  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`Sudhar_Civic_Audit_Report_${dateStr}.pdf`)
}

/**
 * Downloads a focused, high-detail Single Incident Forensic Audit Sheet for a specific ticket.
 */
export function downloadSingleTicketAuditPDF(ticket: Report, adminName: string = 'Municipal Admin') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  let y = 18

  const brain = calculateSmartPriority(ticket)

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(margin, y, contentWidth, 26, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('INCIDENT FORENSIC AUDIT DOSSIER', margin + 6, y + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(203, 213, 225)
  doc.text(`Official Ticket: ${ticket.ticket_id}  |  Category: ${ticket.category.toUpperCase()}`, margin + 6, y + 17)
  doc.text(`Audit Generated: ${new Date().toLocaleString()}  |  Officer: ${adminName}`, margin + 6, y + 22)

  y += 33

  // Core Status Bar
  doc.setFillColor(241, 245, 249)
  doc.setDrawColor(203, 213, 225)
  doc.rect(margin, y, contentWidth, 20, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('CURRENT WORKFLOW STATUS', margin + 6, y + 6)
  doc.text('AI PRIORITY SCORE', margin + 60, y + 6)
  doc.text('SEVERITY HAZARD', margin + 110, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(ticket.status.toUpperCase(), margin + 6, y + 13.5)
  doc.text(`${brain.score} / 100 [${brain.urgencyBand}]`, margin + 60, y + 13.5)
  doc.text((ticket.severity || 'Medium').toUpperCase(), margin + 110, y + 13.5)

  y += 27

  // Citizen Description Section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  doc.text('1. CITIZEN PROBLEM STATEMENT & GRIEVANCE REPORT', margin, y)
  y += 4

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  const splitDesc = doc.splitTextToSize(ticket.description || 'No detailed written description was entered.', contentWidth - 10)
  doc.text(splitDesc, margin + 5, y + 7)

  y += 32

  // Geographic & Location Telemetry
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  doc.text('2. GEOGRAPHIC TELEMETRY & ZONE ATTRIBUTES', margin, y)
  y += 4

  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y, contentWidth, 22, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Location Landmark: ${ticket.location_name || ticket.zone || 'Designated Urban Sector'}`, margin + 5, y + 6)
  doc.text(`Municipal Zone: ${ticket.zone || 'ZONE_01'}  |  Location ID: ${ticket.location_id || 'L-UNKNOWN'}`, margin + 5, y + 11)
  doc.text(`GPS Coordinates: Latitude ${ticket.latitude.toFixed(6)}, Longitude ${ticket.longitude.toFixed(6)}`, margin + 5, y + 16)

  y += 28

  // Risk & Prioritization Factors
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  doc.text('3. MULTI-FACTOR CIVIC RISK EVALUATION (BRAIN ENGINE)', margin, y)
  y += 4

  const factorItems = [
    { name: 'Hazard Inherent Severity Base', val: `${brain.breakdown.hazardSeverityScore} / 35` },
    { name: 'Category Public Hazard Impact', val: `${brain.breakdown.categoryRiskScore} / 25` },
    { name: 'Aging Escalation & Time Decay', val: `${brain.breakdown.agingEscalationScore} / 20` },
    { name: 'Physical Evidence & Reporter Trust', val: `${brain.breakdown.evidenceTrustScore} / 10` },
    { name: 'Zone Commuter Density Multiplier', val: `${brain.breakdown.zoneDensityScore} / 10` },
  ]

  factorItems.forEach((f, i) => {
    const rowY = y + i * 6.5
    doc.setFillColor(i % 2 === 0 ? 255 : 248, 250, 252)
    doc.rect(margin, rowY, contentWidth, 6.5, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(f.name, margin + 5, rowY + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.text(f.val, margin + contentWidth - 30, rowY + 4.5)
  })

  y += factorItems.length * 6.5 + 8

  // Dispatch & Municipal Authority Action
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  doc.text('4. ADMINISTRATIVE ACTION & DISPATCH AUDIT', margin, y)
  y += 4

  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y, contentWidth, 24, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text(`Official Municipal Reference ID: ${ticket.govt_reference_number || 'Pending Dispatch Registration'}`, margin + 5, y + 6)
  doc.text(`Assigned Repair Unit: ${ticket.assigned_to || 'Pending Operational Assignment'}`, margin + 5, y + 11)
  doc.text(`Recommended Action Directive: ${brain.recommendedAction}`, margin + 5, y + 16)
  doc.text(`SLA Target Benchmark: ${brain.slaStatus.remainingLabel}`, margin + 5, y + 21)

  // Footer Sign-off
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Sudhar Smart City Mission • Official Digital Audit Certificate • Verified by City Command Center', margin, 285)

  doc.save(`Sudhar_Incident_Audit_${ticket.ticket_id}.pdf`)
}
