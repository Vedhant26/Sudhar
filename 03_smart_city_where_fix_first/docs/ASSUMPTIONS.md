# Data Analysis & Assumptions

## Dataset Analysis (Verified)

### Locations (1,000 records)
- **Fields**: location_id, zone, road_type, road_condition, population_density_per_km2, near_school, near_hospital, pedestrian_activity, latitude, longitude
- **Coverage**: 20 distinct zones, all location IDs present in both incidents and complaints
- **Quality**: ✓ No nulls, complete dataset

### Incidents (10,000 records)  
- **Fields**: incident_id, location_id, timestamp, incident_type, severity, injuries, reported_by, resolved, resolution_hours
- **Types**: Streetlight outage (17.3%), Signal failure (17%), Pothole (16.9%), Blocked drain (16.5%), Collision (16.4%), Flooding (16%)
- **Resolution Rate**: 71.3% resolved
- **Time Range**: Jan 1, 2025 - Dec 31, 2025 (364 days)

### Public Complaints (8,000 records)
- **Fields**: complaint_id, location_id, created_at, category, priority_reported, status, days_to_resolution
- **Categories**: Road damage, Traffic, Lighting, Waste, Pedestrian safety, Drainage (evenly distributed ~16-17% each)
- **Resolution Rate**: 57% resolved/closed
- **Time Range**: Jan 1, 2025 - Dec 31, 2025 (364 days)

## Key Findings

1. **Perfect Join Coverage**: 100% of incidents and complaints have matching location_ids
2. **All locations active**: Every location has both incidents AND complaints (no cold-start problem)
3. **Top Hotspots**: L0362 (23 incidents), L0521 (21), L0734 (20)
4. **Road Conditions**: 38.3% Fair, 30.9% Poor, 23% Good, 7.8% Critical
5. **No data quality issues**: Zero nulls, consistent formats, realistic ranges

## Derived Features for ML

Since the dataset doesn't contain free-text complaint descriptions, we will:

1. **Text Classifier**: Use category + priority_reported + status combinations as pseudo-text for classification training
2. **Severity Prediction**: Map complaint categories to incident types for transfer learning
3. **Trust Score**: Simulate based on resolution outcome patterns (will be generated during seed)
4. **Missing Context**: No text descriptions means NLP features are limited; we'll focus on temporal + spatial patterns

## Assumptions for Demo

1. **Synthetic Data Disclaimer**: Will be prominently displayed in UI footer and all documentation
2. **Photo Evidence**: Demo photos will be royalty-free placeholders (Unsplash/Pexels)
3. **Citizen Trust Scores**: Generated algorithmically based on report accuracy patterns
4. **QR Codes**: Generated for top 50 hotspot locations for demo scanning
5. **Real-time Features**: Simulated with mock websockets/polling
6. **Govt Gateway**: Mock API with hash-chain ledger for demo purposes

## Technical Constraints

1. **No real geocoding API**: Offline reverse lookup against dataset's zone/location data
2. **Browser APIs**: Camera, Geolocation, Service Worker (PWA support required)
3. **From-scratch ML**: Core models in NumPy only; sklearn allowed ONLY for evaluation metrics
4. **Time limit**: Single-day build (10 AM - 4 PM, Round 1 at 12 PM)

## Data Integrity

- ✓ No missing values
- ✓ Consistent timestamp formats
- ✓ Realistic numeric ranges (resolution hours: 1-192h, days: 0.1-31.3d)
- ✓ Balanced category/type distributions
- ✓ Geographic spread across 20 zones
