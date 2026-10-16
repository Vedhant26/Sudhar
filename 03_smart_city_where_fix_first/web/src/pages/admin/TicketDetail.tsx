import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useReportsStore } from '../../stores/reportsStore'
import { calculateSmartPriority } from '../../utils/priorityBrain'
import { downloadSingleTicketAuditPDF } from '../../utils/pdfAuditReport'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    getReportById,
    verifyReport,
    rejectReport,
    sendToGovt,
    assignCrew,
    markInProgress,
    markFixed,
    reports,
  } = useReportsStore()

  // Find report from store
  const ticket = getReportById(id || '') || reports.find((r) => r.id === id || r.ticket_id === id) || reports[0]

  const [showGovtModal, setShowGovtModal] = useState(false)
  const [govtRefNumber, setGovtRefNumber] = useState<string | null>(ticket?.govt_reference_number || null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  // Initialize mini Leaflet map
  useEffect(() => {
    if (!mapRef.current || !ticket) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [ticket.latitude, ticket.longitude],
        zoom: 15,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      const icon = L.divIcon({
        className: 'custom-detail-marker',
        html: `<div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })

      L.marker([ticket.latitude, ticket.longitude], { icon })
        .addTo(map)
        .bindPopup(`<b>${ticket.location_name || ticket.zone}</b><br/>${ticket.category}`)

      mapInstanceRef.current = map
    } else {
      mapInstanceRef.current.setView([ticket.latitude, ticket.longitude], 15)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [ticket?.id, ticket?.latitude, ticket?.longitude])

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested incident record does not exist or has been archived.</p>
        <button
          onClick={() => navigate('/admin/queue')}
          className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
        >
          Return to Queue
        </button>
      </div>
    )
  }

  const brain = calculateSmartPriority(ticket)

  const handleExportPDF = () => {
    setIsExportingPDF(true)
    try {
      downloadSingleTicketAuditPDF(ticket, 'Municipal Operations Command')
      setActionNotice('Forensic Audit Dossier exported as PDF.')
      setTimeout(() => setActionNotice(null), 4000)
    } catch (err) {
      console.error(err)
      alert('Could not export PDF. Please try again.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleVerify = () => {
    verifyReport(ticket.id)
    setActionNotice('Report verified and logged into Municipal Dispatch queue.')
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleSendToGovt = () => {
    const refNum = sendToGovt(ticket.id)
    setGovtRefNumber(refNum)
    setShowGovtModal(true)
    setTimeout(() => setShowGovtModal(false), 3500)
  }

  const handleAssignCrew = () => {
    const crew = assignCrew(ticket.id)
    setActionNotice(`Maintenance crew dispatched: ${crew}. Scheduled for immediate remediation.`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleMarkInProgress = () => {
    markInProgress(ticket.id)
    setActionNotice('Status updated to In-Progress.')
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleMarkFixed = () => {
    markFixed(ticket.id)
    setActionNotice('Work order marked as Resolved. Incident closed on ground.')
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleReject = () => {
    if (confirm('Are you sure you want to dismiss this incident report?')) {
      rejectReport(ticket.id)
      setActionNotice('Report dismissed and flagged as non-actionable.')
      setTimeout(() => setActionNotice(null), 4000)
    }
  }

  const status = ticket.status

  // Workflow steps definitions
  const workflowSteps = [
    { id: 'submitted', label: 'Reported', completed: true, active: status === 'Submitted' },
    { id: 'ai-triaged', label: 'AI Triaged', completed: ['AI-triaged', 'Admin-verified', 'Govt-notified', 'Assigned', 'In-progress', 'Fixed'].includes(status), active: status === 'AI-triaged' },
    { id: 'admin-verified', label: 'Verified', completed: ['Admin-verified', 'Govt-notified', 'Assigned', 'In-progress', 'Fixed'].includes(status), active: status === 'Admin-verified' },
    { id: 'govt-notified', label: 'PWD Dispatched', completed: ['Govt-notified', 'Assigned', 'In-progress', 'Fixed'].includes(status), active: status === 'Govt-notified' },
    { id: 'assigned', label: 'Crew Assigned', completed: ['Assigned', 'In-progress', 'Fixed'].includes(status), active: status === 'Assigned' },
    { id: 'in-progress', label: 'In Progress', completed: ['In-progress', 'Fixed'].includes(status), active: status === 'In-progress' },
    { id: 'fixed', label: 'Resolved', completed: status === 'Fixed', active: status === 'Fixed' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xl flex items-center justify-between text-xs animate-slide-up border border-slate-700 dark:border-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900 rounded-md transition"
            title="Dismiss notice"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/queue')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-2.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Priority Queue</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white capitalize tracking-tight">
                {ticket.category} Incident Dossier
              </h1>
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700">
                {ticket.ticket_id}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                brain.urgencyBand === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' :
                brain.urgencyBand === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
                'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
              }`}>
                Priority Index: {brain.score}/100 • {brain.urgencyBand}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Logged: {new Date(ticket.created_at).toLocaleString()} • Operational Sector: {ticket.zone || 'ZONE_01'} • Asset ID: {ticket.location_id || 'L0362'}
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isExportingPDF ? 'Generating...' : 'Export Audit Dossier (PDF)'}</span>
            </button>

            <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
              status === 'Fixed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
              status === 'Govt-notified' ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800' :
              status === 'Assigned' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800' :
              status === 'In-progress' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
              status === 'Rejected' ? 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' :
              'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{status.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* Workflow Lifecycle Stepper */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
            {workflowSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1 min-w-[100px] last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    step.completed
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                      : step.active
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {step.completed ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-semibold text-center whitespace-nowrap ${
                    step.active
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : step.completed
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < workflowSteps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 -mt-4 transition-colors ${
                    workflowSteps[idx + 1].completed ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry & Evaluation (Left 8 cols) vs Actions & Audit Info (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Geospatial Incident Telemetry */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Geospatial Incident Telemetry
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                Lat: {ticket.latitude.toFixed(5)}, Lng: {ticket.longitude.toFixed(5)}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              {ticket.location_name || ticket.zone} • Designated Urban Operational Sector
            </p>

            <div
              ref={mapRef}
              className="h-56 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 z-0"
            />
          </div>

          {/* Citizen Grievance Statement */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Incident Description & Report Details
              </h2>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 mb-4">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {ticket.description || 'No supplementary written commentary provided with photographic submission.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize mt-0.5 block">{ticket.category}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Reported Severity</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{ticket.severity || 'Medium'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Reporting Citizen</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{ticket.citizen_name || 'Verified Citizen'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Trust Verification</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{ticket.citizen_trust_score || 85}% Score</span>
              </div>
            </div>
          </div>

          {/* Photographic Evidence Dossier */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Field Photographic Evidence
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {ticket.photos?.length || 0} attachment(s)
              </span>
            </div>

            {ticket.photos && ticket.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {ticket.photos.map((src, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(src)}
                    className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer bg-slate-100 dark:bg-slate-800"
                  >
                    <img
                      src={src}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium">
                      Inspect Image
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                No physical evidence photos attached by reporting citizen.
              </div>
            )}
          </div>

          {/* Priority Scoring & Risk Factor Analysis (Renovated - No Emojis, No Giant Harsh Bars) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Priority Scoring & Risk Factor Analysis
                </h2>
              </div>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Score: {brain.score} / 100
              </span>
            </div>

            {/* Directives Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                  Operational Directive
                </span>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {brain.recommendedAction}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                  SLA Compliance Benchmark
                </span>
                <p className={`text-xs font-semibold ${brain.slaStatus.isBreached ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {brain.slaStatus.remainingLabel}
                </p>
              </div>
            </div>

            {/* Clean Risk Weight Breakdown Table */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-medium">
                  <tr>
                    <th className="px-3.5 py-2">Risk Factor Dimension</th>
                    <th className="px-3.5 py-2 text-right">Model Weight</th>
                    <th className="px-3.5 py-2 text-right">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { name: 'Hazard Inherent Severity', score: brain.breakdown.hazardSeverityScore, max: 35 },
                    { name: 'Category Public Safety Impact', score: brain.breakdown.categoryRiskScore, max: 25 },
                    { name: 'Aging Escalation & Time Decay', score: brain.breakdown.agingEscalationScore, max: 20 },
                    { name: 'Evidence Fidelity & Citizen Credibility', score: brain.breakdown.evidenceTrustScore, max: 10 },
                    { name: 'Zone Commuter Density Multiplier', score: brain.breakdown.zoneDensityScore, max: 10 },
                  ].map((row) => {
                    const pct = Math.round((row.score / row.max) * 100)
                    return (
                      <tr key={row.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{row.name}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-slate-500">
                          {row.score} / {row.max}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {pct}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Dispatch Actions & Audit Certifications */}
        <div className="lg:col-span-4 space-y-5">
          {/* Work Order Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Operational Work Order Actions</span>
            </h2>

            <div className="space-y-2">
              {status === 'Submitted' && (
                <button
                  onClick={handleVerify}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Verify Incident Report</span>
                </button>
              )}

              {['Submitted', 'Admin-verified'].includes(status) && (
                <button
                  onClick={handleSendToGovt}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Dispatch Work Order to Public Works</span>
                </button>
              )}

              {['Submitted', 'Admin-verified', 'Govt-notified'].includes(status) && (
                <button
                  onClick={handleAssignCrew}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Assign Maintenance Crew</span>
                </button>
              )}

              {status === 'Assigned' && (
                <button
                  onClick={handleMarkInProgress}
                  className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Update Status: In-Progress</span>
                </button>
              )}

              {status !== 'Fixed' && status !== 'Rejected' && (
                <button
                  onClick={handleMarkFixed}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Mark Resolved & Close Work Order</span>
                </button>
              )}

              {status !== 'Rejected' && (
                <button
                  onClick={handleReject}
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg text-xs transition"
                >
                  Dismiss Report / Mark Ineligible
                </button>
              )}
            </div>
          </div>

          {/* Government Reference Card */}
          {(ticket.govt_reference_number || govtRefNumber) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                Municipal Dispatch Identifier
              </span>
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-1">
                {ticket.govt_reference_number || govtRefNumber}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Synchronized with State Governance Database</span>
              </div>
            </div>
          )}

          {/* Assigned Crew Card */}
          {ticket.assigned_to && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                Dispatched Remediation Unit
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {ticket.assigned_to}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Standard Civil Infrastructure Maintenance Protocol
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-slate-700">
            <img src={selectedPhoto} alt="Evidence inspection" className="w-full h-auto max-h-[85vh] object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white rounded-full p-2 transition shadow-md"
              title="Close image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Government Reference Modal */}
      {showGovtModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full shadow-xl animate-slide-up text-center border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Work Order Dispatched
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Logged in the state municipal governance system.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 mb-4 font-mono font-bold text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-700">
              {govtRefNumber}
            </div>
            <button
              onClick={() => setShowGovtModal(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
