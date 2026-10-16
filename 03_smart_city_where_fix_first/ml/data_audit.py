"""
Data Audit Script for Sudhar
Analyzes the provided CSV files and generates a comprehensive data quality report
"""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import json

def analyze_dataframe(df, name):
    """Comprehensive analysis of a single dataframe"""
    print(f"\n{'='*80}")
    print(f"📊 {name.upper()} ANALYSIS")
    print(f"{'='*80}\n")
    
    # Basic info
    print(f"📐 Shape: {df.shape[0]:,} rows × {df.shape[1]} columns\n")
    
    # Column info
    print("📋 COLUMN SCHEMA:")
    print("-" * 80)
    for col in df.columns:
        dtype = df[col].dtype
        null_count = df[col].isnull().sum()
        null_pct = (null_count / len(df)) * 100
        unique = df[col].nunique()
        
        print(f"  {col:30} | {str(dtype):12} | Nulls: {null_count:5} ({null_pct:5.2f}%) | Unique: {unique:6}")
    
    # Null analysis
    print(f"\n🔍 NULL VALUE SUMMARY:")
    print("-" * 80)
    null_summary = df.isnull().sum()
    if null_summary.sum() == 0:
        print("  ✓ No null values found!")
    else:
        for col in null_summary[null_summary > 0].index:
            print(f"  ⚠ {col}: {null_summary[col]} nulls ({(null_summary[col]/len(df))*100:.2f}%)")
    
    # Value distributions for categorical columns
    print(f"\n📊 VALUE DISTRIBUTIONS (Categorical/Low Cardinality):")
    print("-" * 80)
    for col in df.columns:
        if df[col].dtype == 'object' or df[col].nunique() < 20:
            print(f"\n  {col}:")
            value_counts = df[col].value_counts().head(10)
            for val, count in value_counts.items():
                pct = (count / len(df)) * 100
                bar = '█' * int(pct / 2)
                print(f"    {str(val):25} | {count:6} ({pct:5.2f}%) {bar}")
    
    # Numeric statistics
    print(f"\n📈 NUMERIC COLUMN STATISTICS:")
    print("-" * 80)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) > 0:
        print(df[numeric_cols].describe().to_string())
    else:
        print("  No numeric columns found")
    
    return {
        'shape': df.shape,
        'columns': list(df.columns),
        'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
        'null_counts': null_summary.to_dict(),
        'numeric_stats': df[numeric_cols].describe().to_dict() if len(numeric_cols) > 0 else {}
    }

def analyze_joins(locations_df, incidents_df, complaints_df):
    """Analyze join keys and relationships"""
    print(f"\n{'='*80}")
    print("🔗 JOIN KEY ANALYSIS")
    print(f"{'='*80}\n")
    
    loc_ids = set(locations_df['location_id'])
    inc_ids = set(incidents_df['location_id'])
    comp_ids = set(complaints_df['location_id'])
    
    print(f"📍 Locations: {len(loc_ids):,} unique location_ids")
    print(f"🚨 Incidents: {len(inc_ids):,} unique location_ids")
    print(f"📢 Complaints: {len(comp_ids):,} unique location_ids\n")
    
    # Check coverage
    inc_coverage = len(inc_ids.intersection(loc_ids)) / len(inc_ids) * 100
    comp_coverage = len(comp_ids.intersection(loc_ids)) / len(comp_ids) * 100
    
    print(f"✓ Incident locations in master: {inc_coverage:.2f}%")
    print(f"✓ Complaint locations in master: {comp_coverage:.2f}%\n")
    
    # Orphaned records
    inc_orphaned = inc_ids - loc_ids
    comp_orphaned = comp_ids - loc_ids
    
    if inc_orphaned:
        print(f"⚠ WARNING: {len(inc_orphaned)} incident location_ids not in locations.csv")
    if comp_orphaned:
        print(f"⚠ WARNING: {len(comp_orphaned)} complaint location_ids not in locations.csv")
    
    # Locations with both incidents and complaints
    both = inc_ids.intersection(comp_ids)
    print(f"\n📊 {len(both)} locations have BOTH incidents and complaints")
    print(f"📊 {len(loc_ids - inc_ids - comp_ids)} locations have NO data (potential gaps)")
    
    return {
        'location_count': len(loc_ids),
        'incident_locations': len(inc_ids),
        'complaint_locations': len(comp_ids),
        'incident_coverage': inc_coverage,
        'complaint_coverage': comp_coverage,
        'orphaned_incidents': len(inc_orphaned),
        'orphaned_complaints': len(comp_orphaned),
        'locations_with_both': len(both)
    }

def data_quality_insights(locations_df, incidents_df, complaints_df):
    """Generate key insights and quality findings"""
    print(f"\n{'='*80}")
    print("💡 KEY INSIGHTS & DATA QUALITY FINDINGS")
    print(f"{'='*80}\n")
    
    insights = []
    
    # Temporal analysis
    incidents_df['timestamp'] = pd.to_datetime(incidents_df['timestamp'])
    complaints_df['created_at'] = pd.to_datetime(complaints_df['created_at'])
    
    inc_date_range = (incidents_df['timestamp'].min(), incidents_df['timestamp'].max())
    comp_date_range = (complaints_df['created_at'].min(), complaints_df['created_at'].max())
    
    print(f"📅 Temporal Coverage:")
    print(f"  Incidents: {inc_date_range[0].date()} to {inc_date_range[1].date()} ({(inc_date_range[1] - inc_date_range[0]).days} days)")
    print(f"  Complaints: {comp_date_range[0].date()} to {comp_date_range[1].date()} ({(comp_date_range[1] - comp_date_range[0]).days} days)")
    insights.append(f"Dataset spans approximately {(inc_date_range[1] - inc_date_range[0]).days} days")
    
    # Resolution analysis
    resolved_incidents = (incidents_df['resolved'] == 1).sum()
    resolved_pct = (resolved_incidents / len(incidents_df)) * 100
    print(f"\n✅ Resolution Rates:")
    print(f"  Incidents resolved: {resolved_incidents:,} / {len(incidents_df):,} ({resolved_pct:.1f}%)")
    
    resolved_complaints = complaints_df['status'].isin(['Resolved', 'Closed']).sum()
    resolved_comp_pct = (resolved_complaints / len(complaints_df)) * 100
    print(f"  Complaints resolved/closed: {resolved_complaints:,} / {len(complaints_df):,} ({resolved_comp_pct:.1f}%)")
    insights.append(f"Resolution rate: Incidents {resolved_pct:.1f}%, Complaints {resolved_comp_pct:.1f}%")
    
    # Severity distribution
    print(f"\n⚠️ Severity Distribution (Incidents):")
    severity_dist = incidents_df['severity'].value_counts()
    for sev, count in severity_dist.items():
        print(f"  {sev}: {count:,} ({count/len(incidents_df)*100:.1f}%)")
    
    # Category distribution
    print(f"\n📂 Category Distribution (Complaints):")
    cat_dist = complaints_df['category'].value_counts().head(10)
    for cat, count in cat_dist.items():
        print(f"  {cat}: {count:,} ({count/len(complaints_df)*100:.1f}%)")
    
    # Hotspot analysis
    print(f"\n🔥 Hotspot Locations (Top 10 by incident count):")
    hotspots = incidents_df['location_id'].value_counts().head(10)
    for loc_id, count in hotspots.items():
        zone = locations_df[locations_df['location_id'] == loc_id]['zone'].values
        zone_str = zone[0] if len(zone) > 0 else 'Unknown'
        print(f"  {loc_id} ({zone_str}): {count} incidents")
    
    # Road condition correlation
    print(f"\n🛣️ Road Condition Distribution:")
    road_cond = locations_df['road_condition'].value_counts()
    for cond, count in road_cond.items():
        print(f"  {cond}: {count:,} locations ({count/len(locations_df)*100:.1f}%)")
    
    insights.append(f"Top hotspot: {hotspots.index[0]} with {hotspots.iloc[0]} incidents")
    insights.append(f"Most common complaint: {cat_dist.index[0]} ({cat_dist.iloc[0]} cases)")
    
    # Data quality flags
    print(f"\n⚠️ DATA QUALITY FLAGS:")
    quality_issues = []
    
    # Check for missing resolution times
    missing_res_time = incidents_df['resolution_hours'].isnull().sum()
    if missing_res_time > 0:
        quality_issues.append(f"Missing resolution_hours: {missing_res_time} incidents")
        print(f"  ⚠ {missing_res_time} incidents missing resolution_hours")
    
    # Check for unrealistic resolution times
    if 'resolution_hours' in incidents_df.columns:
        high_res_time = (incidents_df['resolution_hours'] > 720).sum()  # > 30 days
        if high_res_time > 0:
            quality_issues.append(f"Unusually long resolution times (>30 days): {high_res_time} incidents")
            print(f"  ⚠ {high_res_time} incidents with resolution time > 30 days")
    
    # Check geographic distribution
    zones = locations_df['zone'].nunique()
    print(f"\n🗺️ Geographic Coverage:")
    print(f"  {zones} distinct zones")
    
    # Population density analysis
    if 'population_density_per_km2' in locations_df.columns:
        pop_stats = locations_df['population_density_per_km2'].describe()
        print(f"\n👥 Population Density:")
        print(f"  Mean: {pop_stats['mean']:.0f} per km²")
        print(f"  Median: {pop_stats['50%']:.0f} per km²")
        print(f"  Range: {pop_stats['min']:.0f} - {pop_stats['max']:.0f} per km²")
    
    if not quality_issues:
        print(f"\n  ✓ No critical data quality issues detected!")
    
    return {
        'insights': insights,
        'quality_issues': quality_issues,
        'date_range_days': (inc_date_range[1] - inc_date_range[0]).days,
        'resolution_rates': {
            'incidents': resolved_pct,
            'complaints': resolved_comp_pct
        }
    }

def main():
    """Main audit function"""
    print("""
    ╔═══════════════════════════════════════════════════════════════════════════╗
    ║                                                                           ║
    ║                     🔍 Sudhar DATA AUDIT REPORT                        ║
    ║                   Smart City Priority System - Track 3                    ║
    ║                          DATATHON 2026 (VIT-AP)                          ║
    ║                                                                           ║
    ╚═══════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Load data
    data_dir = Path(__file__).parent.parent / 'data'
    
    print(f"\n📂 Loading data from: {data_dir}\n")
    
    try:
        locations_df = pd.read_csv(data_dir / 'locations.csv')
        incidents_df = pd.read_csv(data_dir / 'incidents.csv')
        complaints_df = pd.read_csv(data_dir / 'public_complaints.csv')
        
        print("✓ Successfully loaded all CSV files\n")
        
    except FileNotFoundError as e:
        print(f"❌ Error: Could not find data files in {data_dir}")
        print(f"   {e}")
        return
    
    # Analyze each dataframe
    loc_analysis = analyze_dataframe(locations_df, "LOCATIONS")
    inc_analysis = analyze_dataframe(incidents_df, "INCIDENTS")
    comp_analysis = analyze_dataframe(complaints_df, "PUBLIC COMPLAINTS")
    
    # Analyze joins
    join_analysis = analyze_joins(locations_df, incidents_df, complaints_df)
    
    # Generate insights
    insights_analysis = data_quality_insights(locations_df, incidents_df, complaints_df)
    
    # Save report
    report = {
        'timestamp': datetime.now().isoformat(),
        'locations': loc_analysis,
        'incidents': inc_analysis,
        'complaints': comp_analysis,
        'joins': join_analysis,
        'insights': insights_analysis
    }
    
    report_path = Path(__file__).parent.parent / 'reports' / 'data_audit_report.json'
    report_path.parent.mkdir(exist_ok=True)
    
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n{'='*80}")
    print(f"✅ AUDIT COMPLETE")
    print(f"{'='*80}")
    print(f"\n📝 Full report saved to: {report_path}\n")
    
    # Summary
    print("📊 QUICK SUMMARY:")
    print(f"  • {len(locations_df):,} locations across {locations_df['zone'].nunique()} zones")
    print(f"  • {len(incidents_df):,} incidents ({insights_analysis['resolution_rates']['incidents']:.1f}% resolved)")
    print(f"  • {len(complaints_df):,} complaints ({insights_analysis['resolution_rates']['complaints']:.1f}% resolved)")
    print(f"  • Join coverage: {join_analysis['incident_coverage']:.1f}% (incidents), {join_analysis['complaint_coverage']:.1f}% (complaints)")
    quality_status = '✓ Good' if len(insights_analysis['quality_issues']) == 0 else f"⚠ {len(insights_analysis['quality_issues'])} issues found"
    print(f"  • Dataset quality: {quality_status}")
    print()

if __name__ == "__main__":
    main()
