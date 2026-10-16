# ⚡ Sudhar - Quick Start Guide

## 🎯 What You're Building

**Sudhar** is a Smart City Priority System with:
1. **📱 Citizen Mobile App** - Report civic issues, earn rewards
2. **👔 Admin Dashboard** - Verify reports, send to government, track resolution

**Simplified Flow:**
```
Citizen Reports → AI Ranks → Admin Verifies → Send to Govt → Resolve → Reward Citizen
```

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
# Navigate to project
cd 03_smart_city_where_fix_first

# Install frontend dependencies
cd web
npm install
cd ..

# Install Python dependencies
pip install -r ml/requirements.txt
pip install -r api/requirements.txt
```

### Step 2: Prepare Data & Train Models

```bash
# Load CSV data into database
cd api
python seed_data.py
cd ..

# Train ML models
cd ml
python train_all.py
cd ..
```

### Step 3: Run the Application

**Option A: Using Make (Recommended)**
```bash
make dev
```

**Option B: Manual**
```bash
# Terminal 1: Start Backend
cd api
uvicorn main:app --reload --port 8000

# Terminal 2: Start Frontend
cd web
npm run dev
```

### Step 4: Access the App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 👤 Demo Accounts

| Role | Email | Password | Use Case |
|------|-------|----------|----------|
| **Citizen** | citizen@demo | demo123 | Report issues, earn rewards |
| **Admin** | admin@demo | admin123 | Verify reports, send to govt |

---

## 📱 Quick Demo Flow (5 Minutes)

### 1. Citizen Journey (Mobile View)
```
1. Login as citizen@demo
2. Click big "REPORT" button
3. Take/upload photo
4. GPS auto-captures location
5. AI suggests category
6. Submit → Get +10 CivicCoins + Ticket ID
```

### 2. Admin Journey (Desktop View)
```
1. Login as admin@demo
2. See priority queue (ML-ranked)
3. Click on report
4. View ML explanation panel
5. Click "Verify" 
6. Click "Send to Government" → Get reference number
7. Assign to crew
8. Mark as "Fixed" (upload after-photo)
```

### 3. Reward Cycle
```
1. Citizen confirms fix (scan QR or upload photo)
2. +100 CivicCoins awarded
3. Level up badge animation
4. Check leaderboard & impact card
```

---

## 🛠️ Current Implementation Status

### ✅ Completed
- Data audit & analysis
- Project structure
- Configuration files
- Documentation

### 🔄 In Progress
- React app (stores, routing, pages)
- FastAPI backend
- ML models (NumPy implementation)
- CLI tool

### 📝 To Complete
- [ ] Zustand stores
- [ ] Auth system
- [ ] Report submission flow
- [ ] Admin dashboard
- [ ] ML model training
- [ ] API endpoints
- [ ] PWA features (offline, install)
- [ ] QR scanner/generator
- [ ] Rewards system
- [ ] i18n (Telugu, Hindi)

---

## 📂 Project Structure

```
03_smart_city_where_fix_first/
├── web/           # React PWA (citizen + admin)
├── api/           # FastAPI backend
├── ml/            # ML models (NumPy only)
├── cli/           # Terminal tool
├── data/          # CSV files
├── reports/       # ML evaluation outputs
└── uploads/       # User photos
```

---

## 🎨 Key Features to Showcase

### Citizen App (Mobile-First 📱)
- ⚡ 3-tap report submission (< 20 seconds)
- 📸 Camera + GPS integration
- 🤖 AI category suggestion
- 🎮 Gamification (coins, levels, badges)
- 🗺️ Interactive map with clustering
- 📴 Offline-first with queue
- 📱 PWA installable

### Admin Portal (Desktop-Optimized 💼)
- 🎯 ML-powered priority queue
- 📊 Explainability panel (why this location?)
- ✅ One-click verification
- 🏛️ "Send to Government" button (mock)
- 📈 KPI dashboard
- 🔍 Anomaly alerts
- ⚖️ Fairness audit

---

## 🤖 ML Models (From Scratch in NumPy)

1. **Priority Scorer** - Ranks locations by urgency
2. **Resolution Time Predictor** - GBDT implementation
3. **Incident Forecaster** - Poisson regression
4. **Text Classifier** - TF-IDF + Softmax
5. **Anomaly Detector** - EWMA + z-score
6. **Budget Optimizer** - Knapsack DP

All with baselines, proper evaluation, and explainability!

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000
npx kill-port 8000

# Kill process on port 5173
npx kill-port 5173
```

### Module Not Found
```bash
# Reinstall dependencies
cd web && npm install
cd ../api && pip install -r requirements.txt
```

### Database Issues
```bash
# Reset database
rm api/Sudhar.db
python api/seed_data.py
```

---

## 📚 Next Steps

1. **Review Implementation Plan**: Check `implementation.txt` for full requirements
2. **Run Data Audit**: `cd ml && python data_audit.py`
3. **Start Development**: Follow build order in `BUILD_STATUS.md`
4. **Test Mobile**: Use Chrome DevTools mobile emulator (360px width)
5. **Prepare Demo**: Review `DEMO_SCRIPT.md` (to be created)

---

## 🎯 Datathon Priorities (Judging Rubric)

Focus areas for maximum marks:

1. **ML from Scratch (25 marks)** ⭐ - All models in NumPy
2. **Working Product (20 marks)** - End-to-end flow
3. **ML Quality (15 marks)** - Baselines + evaluation
4. **Dataset Usage (10 marks)** - All fields used
5. **USP (10 marks)** - Explainability + fairness + gamification

---

## 📞 Support

For questions during build:
- Check `README.md` for architecture
- Check `ASSUMPTIONS.md` for data insights
- Check `implementation.txt` for detailed specs

**Built for DATATHON 2026 | Track 3: Where Should We Fix First?**
