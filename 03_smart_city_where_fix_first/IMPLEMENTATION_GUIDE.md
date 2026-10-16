# 🏗️ Sudhar Implementation Guide

## 📊 Project Status Summary

### ✅ COMPLETED (Foundation Layer)

#### 1. Data & Analysis
- ✅ Data audit script with comprehensive analysis
- ✅ Schema validation (1,000 locations, 10,000 incidents, 8,000 complaints)
- ✅ Quality report generated with insights
- ✅ ASSUMPTIONS.md documenting data findings

#### 2. Project Structure
- ✅ Complete directory tree (`web/`, `api/`, `ml/`, `cli/`, `data/`, `reports/`)
- ✅ Build configuration (Makefile, package.json, requirements.txt)
- ✅ Vite + React + TypeScript + Tailwind setup
- ✅ PWA configuration with service worker
- ✅ Type definitions (30+ TypeScript interfaces)

#### 3. State Management & Routing
- ✅ Zustand stores (auth, reports, settings)
- ✅ React Router with role-based guards
- ✅ Persist middleware for auth & settings
- ✅ Demo accounts system

#### 4. Documentation
- ✅ Comprehensive README with architecture
- ✅ QUICKSTART guide
- ✅ BUILD_STATUS tracking
- ✅ Data quality report (JSON + console output)

---

## 🔄 NEXT STEPS (Implementation Priority)

### Phase 1: Frontend Core (2-3 hours)

#### A. Pages to Create

**Login Page** (`/web/src/pages/Login.tsx`)
```
- One-click demo login chips
- Email/password form
- Role selector visual
- Mobile-responsive design
```

**Citizen Pages** (`/web/src/pages/citizen/`)
```
1. CitizenLayout.tsx - Bottom nav + routing
2. Home.tsx - Dashboard with stats
3. ReportNew.tsx - Camera + GPS + category
4. ReportsList.tsx - My reports timeline
5. Map.tsx - Clustered pins with Leaflet
6. Rewards.tsx - CivicCoins + badges + leaderboard
7. Profile.tsx - Settings + language
8. Scan.tsx - QR scanner
```

**Admin Pages** (`/web/src/pages/admin/`)
```
1. AdminLayout.tsx - Sidebar + routing
2. Dashboard.tsx - KPIs + charts
3. PriorityQueue.tsx - ML-ranked list
4. TicketDetail.tsx - Review + verify + "Send to Govt"
5. Analytics.tsx - Trends + anomalies
6. Optimizer.tsx - Budget allocation
```

#### B. Reusable Components (`/web/src/components/`)
```
- Button.tsx
- Card.tsx
- Input.tsx
- Select.tsx
- Modal.tsx
- Badge.tsx
- StatusChip.tsx
- LoadingSpinner.tsx
- BottomNav.tsx (mobile)
- Sidebar.tsx (admin)
- PhotoUpload.tsx
- MapView.tsx (Leaflet wrapper)
- QRScanner.tsx
- ConfettiAnimation.tsx
```

#### C. Utilities (`/web/src/utils/`)
```
- api.ts - Axios instance with auth
- storage.ts - IndexedDB for offline queue
- geolocation.ts - GPS + snap to location
- imageCompression.ts - Resize photos
- validation.ts - Form validators
```

#### D. i18n Setup (`/web/src/i18n.ts` + `/locales/`)
```
- Configure i18next
- English translations (en.json)
- Telugu translations (te.json)
- Hindi translations (hi.json)
```

---

### Phase 2: Backend API (2-3 hours)

#### A. FastAPI Setup (`/api/main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Sudhar API")

# CORS
app.add_middleware(CORSMiddleware, ...)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory="../uploads"), name="uploads")

# Routes
from routers import auth, reports, locations, ml, admin

app.include_router(auth.router, prefix="/api/auth")
app.include_router(reports.router, prefix="/api/reports")
app.include_router(locations.router, prefix="/api/locations")
app.include_router(ml.router, prefix="/api/ml")
app.include_router(admin.router, prefix="/api/admin")
```

#### B. Database Models (`/api/models.py`)
```python
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    name = Column(String)
    role = Column(String)  # citizen / admin
    # ... more fields

class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True)
    ticket_id = Column(String, unique=True)
    location_id = Column(String)
    # ... more fields

class Location(Base):
    __tablename__ = "locations"
    location_id = Column(String, primary_key=True)
    # ... from CSV

class Incident(Base):
    __tablename__ = "incidents"
    # ... from CSV

class Complaint(Base):
    __tablename__ = "complaints"
    # ... from CSV
```

#### C. API Routes (`/api/routers/`)

**auth.py**
```python
@router.post("/login")
async def login(credentials: LoginRequest):
    # JWT token generation
    pass

@router.get("/me")
async def get_current_user(token: str):
    pass
```

**reports.py**
```python
@router.post("/")
async def create_report(report: ReportCreate):
    # Save report, call ML for scoring
    pass

@router.get("/")
async def list_reports(user_id: str = None):
    pass

@router.patch("/{id}")
async def update_report(id: str, updates: ReportUpdate):
    pass
```

**admin.py**
```python
@router.post("/reports/{id}/verify")
async def verify_report(id: str):
    pass

@router.post("/reports/{id}/send-to-govt")
async def send_to_government(id: str):
    # Mock govt API call, generate reference number
    return {"reference": "GOVT-2026-XXXXX"}

@router.get("/priority-queue")
async def get_priority_queue():
    # Call ML priority scorer
    pass
```

#### D. Data Seeding (`/api/seed_data.py`)
```python
import pandas as pd
from models import Location, Incident, Complaint
from database import SessionLocal

def seed_database():
    db = SessionLocal()
    
    # Load CSVs
    locations_df = pd.read_csv('../data/locations.csv')
    incidents_df = pd.read_csv('../data/incidents.csv')
    complaints_df = pd.read_csv('../data/public_complaints.csv')
    
    # Insert into DB
    for _, row in locations_df.iterrows():
        db.add(Location(**row.to_dict()))
    
    # ... same for incidents, complaints
    
    # Generate demo reports
    demo_reports = [...]
    
    db.commit()
```

---

### Phase 3: ML Models (4-5 hours)

#### A. Priority Scorer (`/ml/models/priority_scorer.py`)
```python
import numpy as np

class PriorityScorer:
    """
    Transparent weighted formula + learned component
    Score = w1*severity + w2*frequency + w3*recency + w4*exposure + learned_adjustment
    """
    
    def __init__(self):
        self.weights = {
            'severity': 0.25,
            'frequency': 0.20,
            'recency': 0.15,
            'exposure': 0.15,
            'complaint_density': 0.10,
            'trust_score': 0.10,
            'road_condition': 0.05
        }
        self.learned_model = None  # Ridge regression from scratch
    
    def fit(self, X, y):
        """Train the learned component"""
        # Implement Ridge regression with gradient descent
        pass
    
    def predict(self, location_data):
        """Return score, confidence, and top reasons"""
        base_score = self._weighted_formula(location_data)
        learned_adj = self.learned_model.predict(location_data) if self.learned_model else 0
        
        score = base_score + learned_adj
        confidence = self._compute_confidence(location_data)
        reasons = self._get_top_reasons(location_data)
        
        return score, confidence, reasons
```

#### B. Resolution Time Predictor (`/ml/models/gbdt.py`)
```python
class GradientBoostedTrees:
    """
    GBDT from scratch using NumPy
    Histogram-based splits, MSE loss, shrinkage
    """
    
    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=5):
        self.n_estimators = n_estimators
        self.lr = learning_rate
        self.max_depth = max_depth
        self.trees = []
    
    def fit(self, X, y):
        # Initialize with mean
        predictions = np.full(len(y), y.mean())
        
        for _ in range(self.n_estimators):
            # Compute residuals
            residuals = y - predictions
            
            # Fit tree to residuals
            tree = self._build_tree(X, residuals, depth=0)
            self.trees.append(tree)
            
            # Update predictions
            predictions += self.lr * self._predict_tree(tree, X)
    
    def _build_tree(self, X, y, depth):
        # Recursive tree building with histogram-based splits
        pass
```

#### C. Other Models
```
- incident_forecaster.py - Poisson GLM with gradient descent
- text_classifier.py - TF-IDF + Softmax regression
- anomaly_detector.py - Seasonal EWMA + robust z-score
- budget_optimizer.py - 0/1 Knapsack DP
```

#### D. Training Pipeline (`/ml/train_all.py`)
```python
import numpy as np
from models import *

def train_all_models():
    # Load data
    X_train, y_train, X_test, y_test = load_and_split_data()
    
    # 1. Priority Scorer
    print("Training Priority Scorer...")
    priority_scorer = PriorityScorer()
    priority_scorer.fit(X_train, y_train)
    
    # 2. Resolution Time Predictor
    print("Training GBDT...")
    gbdt = GradientBoostedTrees()
    gbdt.fit(X_train, y_train)
    
    # ... train all models
    
    # Save artifacts
    np.savez('models/priority_scorer.npz', weights=priority_scorer.weights, ...)
    
    # Evaluate
    evaluate_all_models()
```

---

### Phase 4: CLI Tool (1-2 hours)

#### A. CLI Setup (`/cli/Sudhar/main.py`)
```python
import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer()
console = Console()

@app.command()
def ingest(data_dir: str = "./data"):
    """Validate and load CSV data"""
    console.print("[bold blue]📂 Ingesting data...[/bold blue]")
    # Load CSVs, validate, show summary
    pass

@app.command()
def train(all: bool = False):
    """Train ML models"""
    with console.status("[bold green]Training models..."):
        # Call ML training pipeline
        pass

@app.command()
def rank(top: int = 10, crews: int = None):
    """Show priority queue"""
    table = Table(title="Priority Queue")
    table.add_column("Rank")
    table.add_column("Location")
    table.add_column("Score")
    table.add_column("Confidence")
    table.add_column("Top Reason")
    
    # ... populate table
    console.print(table)

@app.command()
def demo():
    """Run scripted demo"""
    console.print("[bold]🎬 Sudhar DEMO[/bold]\n")
    # Scripted sequence with pauses
    pass
```

---

## ⏱️ Time Allocation (Datathon Day)

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| **DONE** | Data audit + setup | 1h | ✅ |
| **Phase 1** | React pages + components | 3h | 🔴 HIGH |
| **Phase 2** | FastAPI backend | 2h | 🔴 HIGH |
| **Phase 3** | ML models (NumPy) | 4h | 🔴 CRITICAL |
| **Phase 4** | CLI tool | 1h | 🟡 MEDIUM |
| **Polish** | PWA, i18n, demo prep | 1h | 🟢 LOW |

**Total**: ~12 hours (fits within event timeline with margin)

---

## 🎯 Minimum Viable Demo (If Time-Constrained)

**Cut if necessary (in order):**
1. ❌ i18n (Telugu/Hindi) - keep English only
2. ❌ Voice input - keep text only
3. ❌ PDF certificates
4. ❌ Docker setup
5. ❌ Advanced charts - keep simple bars

**Never cut:**
1. ✅ From-scratch ML models (25 marks!)
2. ✅ Explainability panel
3. ✅ End-to-end workflow
4. ✅ Mobile PWA install
5. ✅ "Send to Government" button

---

## 🚀 Quick Commands for Development

```bash
# Start development
make dev

# Train models
make train

# Run data audit
cd ml && python data_audit.py

# Test API
curl http://localhost:8000/docs

# Build for production
cd web && npm run build

# Demo CLI
Sudhar demo
```

---

## 📝 Files Still Needed

### Critical (Build Now)
- [ ] `/web/src/pages/Login.tsx`
- [ ] `/web/src/pages/citizen/CitizenLayout.tsx`
- [ ] `/web/src/pages/citizen/ReportNew.tsx`
- [ ] `/web/src/pages/admin/AdminLayout.tsx`
- [ ] `/web/src/pages/admin/Dashboard.tsx`
- [ ] `/api/main.py`
- [ ] `/api/models.py`
- [ ] `/ml/models/priority_scorer.py`
- [ ] `/ml/models/gbdt.py`

### Important (Build Next)
- [ ] All other citizen pages
- [ ] All other admin pages
- [ ] Remaining ML models
- [ ] API routers
- [ ] CLI commands

### Nice-to-Have
- [ ] i18n translations
- [ ] Advanced animations
- [ ] Comprehensive tests

---

## 🎬 Demo Preparation Checklist

- [ ] Seed database with demo data
- [ ] Train all ML models
- [ ] Test citizen flow end-to-end
- [ ] Test admin flow end-to-end
- [ ] Verify "Send to Government" button
- [ ] Check rewards calculation
- [ ] Test on mobile viewport (360px)
- [ ] Prepare backup screen recording
- [ ] Create PPT slides
- [ ] Practice 5-minute pitch

---

**Next Action**: Start building Login page and CitizenLayout!
