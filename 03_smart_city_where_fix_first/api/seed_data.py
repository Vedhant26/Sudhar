"""
Seed the database with CSV data and demo reports
"""
import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Location, Incident, Complaint, User, Report
from datetime import datetime, timedelta
import json
import random

def seed_database():
    print("🌱 Seeding database...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Clear existing data
    print("  Clearing existing data...")
    db.query(Report).delete()
    db.query(Complaint).delete()
    db.query(Incident).delete()
    db.query(Location).delete()
    db.query(User).delete()
    db.commit()
    
    # Load CSVs
    print("  Loading CSV files...")
    locations_df = pd.read_csv('../data/locations.csv')
    incidents_df = pd.read_csv('../data/incidents.csv')
    complaints_df = pd.read_csv('../data/public_complaints.csv')
    
    # Seed Locations
    print(f"  Inserting {len(locations_df)} locations...")
    for _, row in locations_df.iterrows():
        location = Location(
            location_id=row['location_id'],
            zone=row['zone'],
            road_type=row['road_type'],
            road_condition=row['road_condition'],
            population_density_per_km2=int(row['population_density_per_km2']),
            near_school=bool(row['near_school']),
            near_hospital=bool(row['near_hospital']),
            pedestrian_activity=row['pedestrian_activity'],
            latitude=float(row['latitude']),
            longitude=float(row['longitude'])
        )
        db.add(location)
    
    db.commit()
    print("  ✓ Locations inserted")
    
    # Seed Incidents
    print(f"  Inserting {len(incidents_df)} incidents...")
    for _, row in incidents_df.iterrows():
        incident = Incident(
            incident_id=row['incident_id'],
            location_id=row['location_id'],
            timestamp=pd.to_datetime(row['timestamp']),
            incident_type=row['incident_type'],
            severity=row['severity'],
            injuries=int(row['injuries']),
            reported_by=row['reported_by'],
            resolved=bool(row['resolved']),
            resolution_hours=float(row['resolution_hours']) if pd.notna(row['resolution_hours']) else None
        )
        db.add(incident)
    
    db.commit()
    print("  ✓ Incidents inserted")
    
    # Seed Complaints
    print(f"  Inserting {len(complaints_df)} complaints...")
    for _, row in complaints_df.iterrows():
        complaint = Complaint(
            complaint_id=row['complaint_id'],
            location_id=row['location_id'],
            created_at=pd.to_datetime(row['created_at']),
            category=row['category'],
            priority_reported=row['priority_reported'],
            status=row['status'],
            days_to_resolution=float(row['days_to_resolution']) if pd.notna(row['days_to_resolution']) else None
        )
        db.add(complaint)
    
    db.commit()
    print("  ✓ Complaints inserted")
    
    # Create demo users
    print("  Creating demo users...")
    demo_users = [
        User(
            id="U001",
            email="citizen@demo",
            name="Demo Citizen",
            password_hash="demo123",  # In production, use proper hashing
            role="citizen",
            trust_score=85,
            civic_coins=450,
            level=3,
            reports_count=12,
            verified_reports=10,
            created_at=datetime.utcnow() - timedelta(days=30)
        ),
        User(
            id="A001",
            email="admin@demo",
            name="Demo Admin",
            password_hash="demo123",
            role="admin",
            created_at=datetime.utcnow() - timedelta(days=60)
        )
    ]
    
    for user in demo_users:
        db.add(user)
    
    db.commit()
    print("  ✓ Demo users created")
    
    # Create demo reports
    print("  Creating demo reports...")
    categories = ['Pothole', 'Flooding', 'Drainage', 'Streetlight', 'Traffic', 'Pedestrian safety', 'Garbage']
    severities = ['Low', 'Medium', 'High', 'Critical']
    statuses = ['Submitted', 'AI-triaged', 'Admin-verified', 'Govt-notified', 'Assigned', 'In-progress', 'Fixed']
    
    # Get top 20 locations by incident count
    top_locations = incidents_df.groupby('location_id').size().nlargest(20).index.tolist()
    
    for i in range(40):
        location_id = random.choice(top_locations)
        location = db.query(Location).filter(Location.location_id == location_id).first()
        
        if location:
            report = Report(
                id=f"R{1000 + i}",
                ticket_id=f"TKT-2026-{1000 + i}",
                location_id=location_id,
                location_name=f"{location.zone} Junction",
                zone=location.zone,
                latitude=location.latitude,
                longitude=location.longitude,
                category=random.choice(categories),
                description=f"Issue reported at {location.zone}. Requires immediate attention.",
                severity=random.choice(severities),
                photos=json.dumps([f"/demo/photo{i}.jpg"]),
                citizen_id="U001",
                status=random.choice(statuses),
                ml_score=round(70 + random.random() * 25, 2),
                ml_confidence=round(80 + random.random() * 15, 2),
                ml_suggested_category=random.choice(categories),
                ml_suggested_severity=random.choice(severities),
                civic_coins_earned=10,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 720)),
                updated_at=datetime.utcnow() - timedelta(hours=random.randint(0, 48))
            )
            
            # Add govt reference for some reports
            if report.status in ['Govt-notified', 'Assigned', 'In-progress', 'Fixed']:
                report.govt_reference_number = f"GOVT-2026-{10000 + i}"
            
            # Add crew assignment for some reports
            if report.status in ['Assigned', 'In-progress', 'Fixed']:
                report.assigned_to = f"Crew-{random.randint(1, 10)}"
            
            db.add(report)
    
    db.commit()
    print("  ✓ Demo reports created")
    
    # Print summary
    print("\n📊 DATABASE SEEDED SUCCESSFULLY!")
    print(f"  Locations: {db.query(Location).count()}")
    print(f"  Incidents: {db.query(Incident).count()}")
    print(f"  Complaints: {db.query(Complaint).count()}")
    print(f"  Users: {db.query(User).count()}")
    print(f"  Reports: {db.query(Report).count()}")
    print("\n✅ Ready to use!")
    
    db.close()

if __name__ == "__main__":
    seed_database()
