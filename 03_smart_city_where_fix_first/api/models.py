from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    role = Column(String)  # 'citizen' or 'admin'
    trust_score = Column(Integer, default=50)
    civic_coins = Column(Integer, default=0)
    level = Column(Integer, default=1)
    reports_count = Column(Integer, default=0)
    verified_reports = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reports = relationship("Report", back_populates="citizen")

class Location(Base):
    __tablename__ = "locations"
    
    location_id = Column(String, primary_key=True, index=True)
    zone = Column(String, index=True)
    road_type = Column(String)
    road_condition = Column(String)
    population_density_per_km2 = Column(Integer)
    near_school = Column(Boolean)
    near_hospital = Column(Boolean)
    pedestrian_activity = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

class Incident(Base):
    __tablename__ = "incidents"
    
    incident_id = Column(String, primary_key=True, index=True)
    location_id = Column(String, ForeignKey("locations.location_id"), index=True)
    timestamp = Column(DateTime)
    incident_type = Column(String)
    severity = Column(String)
    injuries = Column(Integer)
    reported_by = Column(String)
    resolved = Column(Boolean)
    resolution_hours = Column(Float, nullable=True)

class Complaint(Base):
    __tablename__ = "complaints"
    
    complaint_id = Column(String, primary_key=True, index=True)
    location_id = Column(String, ForeignKey("locations.location_id"), index=True)
    created_at = Column(DateTime)
    category = Column(String)
    priority_reported = Column(String)
    status = Column(String)
    days_to_resolution = Column(Float, nullable=True)

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True)
    location_id = Column(String, ForeignKey("locations.location_id"))
    location_name = Column(String)
    zone = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    category = Column(String)
    description = Column(Text)
    severity = Column(String)
    photos = Column(Text)  # JSON array as string
    citizen_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default='Submitted')
    ml_score = Column(Float, nullable=True)
    ml_confidence = Column(Float, nullable=True)
    ml_suggested_category = Column(String, nullable=True)
    ml_suggested_severity = Column(String, nullable=True)
    assigned_to = Column(String, nullable=True)
    resolution_photo = Column(String, nullable=True)
    govt_reference_number = Column(String, nullable=True)
    civic_coins_earned = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    citizen = relationship("User", back_populates="reports")
    location = relationship("Location")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    user_id = Column(String)
    report_id = Column(String, nullable=True)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
