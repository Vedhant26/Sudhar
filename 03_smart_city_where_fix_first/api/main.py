from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import json
import os

from database import engine, get_db, Base
import models
from pydantic import BaseModel

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sudhar API", version="1.0.0")

# CORS - Allow local, mobile LAN, tunnels, and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
if not os.path.exists("../uploads"):
    os.makedirs("../uploads")
app.mount("/uploads", StaticFiles(directory="../uploads"), name="uploads")

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    trust_score: Optional[int] = None
    civic_coins: Optional[int] = None
    level: Optional[int] = None
    reports_count: Optional[int] = None
    verified_reports: Optional[int] = None
    created_at: datetime

class ReportCreate(BaseModel):
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    zone: Optional[str] = None
    latitude: Optional[float] = 16.516
    longitude: Optional[float] = 80.463
    category: str
    description: Optional[str] = None
    severity: Optional[str] = "Medium"
    photos: Optional[List[str]] = []
    citizen_id: Optional[str] = "U001"

class ReportResponse(BaseModel):
    id: str
    ticket_id: str
    location_id: Optional[str]
    location_name: Optional[str]
    zone: Optional[str]
    latitude: float
    longitude: float
    category: str
    description: Optional[str]
    severity: Optional[str]
    photos: List[str]
    citizen_id: str
    citizen_name: Optional[str]
    citizen_trust_score: Optional[int]
    status: str
    ml_score: Optional[float]
    ml_confidence: Optional[float]
    govt_reference_number: Optional[str]
    civic_coins_earned: Optional[int]
    created_at: datetime
    updated_at: datetime

class ReportUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    govt_reference_number: Optional[str] = None
    resolution_photo: Optional[str] = None

class PriorityItem(BaseModel):
    location_id: str
    location_name: str
    zone: str
    priority_score: float
    confidence: float
    incident_count: int
    complaint_count: int
    top_reasons: List[str]

# Routes
@app.get("/")
def read_root():
    return {
        "message": "Sudhar API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.post("/api/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint with demo accounts"""
    demo_users = {
        "citizen@demo": {
            "id": "U001",
            "email": "citizen@demo",
            "name": "Demo Citizen",
            "role": "citizen",
            "trust_score": 85,
            "civic_coins": 450,
            "level": 3,
            "reports_count": 12,
            "verified_reports": 10,
            "created_at": datetime.utcnow()
        },
        "admin@demo": {
            "id": "A001",
            "email": "admin@demo",
            "name": "Demo Admin",
            "role": "admin",
            "created_at": datetime.utcnow()
        }
    }
    
    if request.email in demo_users and request.password == "demo123":
        user_data = demo_users[request.email]
        return {
            "user": user_data,
            "token": f"demo-token-{user_data['role']}"
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/reports", response_model=List[ReportResponse])
def list_reports(
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List reports with filters"""
    query = db.query(models.Report)
    
    if user_id:
        query = query.filter(models.Report.citizen_id == user_id)
    if status:
        query = query.filter(models.Report.status == status)
    
    reports = query.order_by(models.Report.created_at.desc()).limit(limit).all()
    
    result = []
    for report in reports:
        citizen = db.query(models.User).filter(models.User.id == report.citizen_id).first()
        result.append({
            "id": report.id,
            "ticket_id": report.ticket_id,
            "location_id": report.location_id,
            "location_name": report.location_name,
            "zone": report.zone,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "category": report.category,
            "description": report.description,
            "severity": report.severity,
            "photos": json.loads(report.photos) if report.photos else [],
            "citizen_id": report.citizen_id,
            "citizen_name": citizen.name if citizen else None,
            "citizen_trust_score": citizen.trust_score if citizen else None,
            "status": report.status,
            "ml_score": report.ml_score,
            "ml_confidence": report.ml_confidence,
            "govt_reference_number": report.govt_reference_number,
            "civic_coins_earned": report.civic_coins_earned,
            "created_at": report.created_at,
            "updated_at": report.updated_at
        })
    
    return result

@app.post("/api/reports", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    """Create new report"""
    import random
    
    # Generate IDs
    report_id = f"R{int(datetime.utcnow().timestamp() * 1000)}"
    ticket_id = f"TKT-2026-{random.randint(1000, 9999)}"
    
    # Mock ML scoring (in production, call actual ML model)
    ml_score = 75 + random.random() * 20
    ml_confidence = 85 + random.random() * 10
    
    db_report = models.Report(
        id=report_id,
        ticket_id=ticket_id,
        location_id=report.location_id,
        location_name=report.location_name,
        zone=report.zone,
        latitude=report.latitude,
        longitude=report.longitude,
        category=report.category,
        description=report.description,
        severity=report.severity or "Medium",
        photos=json.dumps(report.photos),
        citizen_id=report.citizen_id,
        status="Submitted",
        ml_score=ml_score,
        ml_confidence=ml_confidence,
        ml_suggested_category=report.category,
        ml_suggested_severity=report.severity,
        civic_coins_earned=10
    )
    
    db.add(db_report)
    
    # Update user stats
    user = db.query(models.User).filter(models.User.id == report.citizen_id).first()
    if user:
        user.reports_count += 1
        user.civic_coins += 10
    
    db.commit()
    db.refresh(db_report)
    
    # Log audit
    audit = models.AuditLog(
        action="report_created",
        user_id=report.citizen_id,
        report_id=report_id,
        details=f"New report: {ticket_id}"
    )
    db.add(audit)
    db.commit()
    
    citizen = db.query(models.User).filter(models.User.id == report.citizen_id).first()
    
    return {
        "id": db_report.id,
        "ticket_id": db_report.ticket_id,
        "location_id": db_report.location_id,
        "location_name": db_report.location_name,
        "zone": db_report.zone,
        "latitude": db_report.latitude,
        "longitude": db_report.longitude,
        "category": db_report.category,
        "description": db_report.description,
        "severity": db_report.severity,
        "photos": json.loads(db_report.photos),
        "citizen_id": db_report.citizen_id,
        "citizen_name": citizen.name if citizen else None,
        "citizen_trust_score": citizen.trust_score if citizen else None,
        "status": db_report.status,
        "ml_score": db_report.ml_score,
        "ml_confidence": db_report.ml_confidence,
        "govt_reference_number": db_report.govt_reference_number,
        "civic_coins_earned": db_report.civic_coins_earned,
        "created_at": db_report.created_at,
        "updated_at": db_report.updated_at
    }

@app.get("/api/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Get single report"""
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    citizen = db.query(models.User).filter(models.User.id == report.citizen_id).first()
    
    return {
        "id": report.id,
        "ticket_id": report.ticket_id,
        "location_id": report.location_id,
        "location_name": report.location_name,
        "zone": report.zone,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "category": report.category,
        "description": report.description,
        "severity": report.severity,
        "photos": json.loads(report.photos) if report.photos else [],
        "citizen_id": report.citizen_id,
        "citizen_name": citizen.name if citizen else None,
        "citizen_trust_score": citizen.trust_score if citizen else None,
        "status": report.status,
        "ml_score": report.ml_score,
        "ml_confidence": report.ml_confidence,
        "govt_reference_number": report.govt_reference_number,
        "civic_coins_earned": report.civic_coins_earned,
        "created_at": report.created_at,
        "updated_at": report.updated_at
    }

@app.patch("/api/reports/{report_id}")
def update_report(report_id: str, updates: ReportUpdate, db: Session = Depends(get_db)):
    """Update report status"""
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if updates.status:
        report.status = updates.status
    if updates.assigned_to:
        report.assigned_to = updates.assigned_to
    if updates.govt_reference_number:
        report.govt_reference_number = updates.govt_reference_number
    if updates.resolution_photo:
        report.resolution_photo = updates.resolution_photo
    
    report.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Log audit
    audit = models.AuditLog(
        action="report_updated",
        user_id="system",
        report_id=report_id,
        details=f"Status: {report.status}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Report updated", "status": report.status}

@app.post("/api/admin/reports/{report_id}/verify")
def verify_report(report_id: str, db: Session = Depends(get_db)):
    """Admin verifies report"""
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = "Admin-verified"
    report.updated_at = datetime.utcnow()
    
    # Update citizen trust score
    citizen = db.query(models.User).filter(models.User.id == report.citizen_id).first()
    if citizen:
        citizen.verified_reports += 1
        citizen.trust_score = min(100, citizen.trust_score + 2)
        citizen.civic_coins += 25
    
    db.commit()
    
    return {"message": "Report verified", "status": report.status}

@app.post("/api/admin/reports/{report_id}/send-to-govt")
def send_to_government(report_id: str, db: Session = Depends(get_db)):
    """Send report to government (mock)"""
    import random
    
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Generate government reference number
    ref_number = f"GOVT-2026-{random.randint(10000, 99999)}"
    
    report.status = "Govt-notified"
    report.govt_reference_number = ref_number
    report.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Log audit
    audit = models.AuditLog(
        action="sent_to_government",
        user_id="admin",
        report_id=report_id,
        details=f"Reference: {ref_number}"
    )
    db.add(audit)
    db.commit()
    
    return {
        "message": "Sent to government",
        "reference_number": ref_number,
        "status": report.status
    }

@app.get("/api/priority-queue", response_model=List[PriorityItem])
def get_priority_queue(limit: int = 20, db: Session = Depends(get_db)):
    """Get ML-ranked priority queue"""
    # In production, this would call the actual ML model
    # For now, return top locations by incident count
    
    from sqlalchemy import func
    
    incident_counts = db.query(
        models.Incident.location_id,
        func.count(models.Incident.incident_id).label('count')
    ).group_by(models.Incident.location_id).subquery()
    
    complaint_counts = db.query(
        models.Complaint.location_id,
        func.count(models.Complaint.complaint_id).label('count')
    ).group_by(models.Complaint.location_id).subquery()
    
    locations = db.query(models.Location).limit(limit).all()
    
    result = []
    for loc in locations[:10]:
        inc_count = db.query(models.Incident).filter(models.Incident.location_id == loc.location_id).count()
        comp_count = db.query(models.Complaint).filter(models.Complaint.location_id == loc.location_id).count()
        
        # Mock priority score
        priority_score = min(100, (inc_count * 3 + comp_count * 2) / 2)
        
        reasons = [
            f"{inc_count} historical incidents",
            f"Road condition: {loc.road_condition}",
            f"Pedestrian activity: {loc.pedestrian_activity}"
        ]
        
        if loc.near_school:
            reasons.append("Near school zone")
        
        result.append({
            "location_id": loc.location_id,
            "location_name": f"{loc.zone} Junction",
            "zone": loc.zone,
            "priority_score": priority_score,
            "confidence": 85 + (priority_score / 10),
            "incident_count": inc_count,
            "complaint_count": comp_count,
            "top_reasons": reasons[:3]
        })
    
    # Sort by priority score
    result.sort(key=lambda x: x['priority_score'], reverse=True)
    
    return result

@app.get("/api/stats/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_reports = db.query(models.Report).count()
    open_reports = db.query(models.Report).filter(models.Report.status.in_(['Submitted', 'AI-triaged', 'Admin-verified'])).count()
    in_progress = db.query(models.Report).filter(models.Report.status == 'In-progress').count()
    fixed_today = db.query(models.Report).filter(
        models.Report.status == 'Fixed',
        models.Report.updated_at >= datetime.utcnow() - timedelta(days=1)
    ).count()
    
    return {
        "total_reports": total_reports,
        "open_reports": open_reports,
        "in_progress": in_progress,
        "fixed_today": fixed_today
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
