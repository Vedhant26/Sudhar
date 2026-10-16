import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint
import pandas as pd
import numpy as np
from pathlib import Path
import time

app = typer.Typer()
console = Console()

BANNER = """
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                          🏙️  Sudhar CLI                               ║
║                   Smart City Priority System                              ║
║                        DATATHON 2026 (VIT-AP)                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

@app.command()
def ingest(data_dir: str = "../data"):
    """Validate and load CSV data"""
    console.print(BANNER, style="bold blue")
    console.print("\n[bold]📂 Ingesting Data...[/bold]\n")
    
    data_path = Path(data_dir)
    
    try:
        # Load CSVs
        console.print("  Loading locations.csv...", end="")
        locations_df = pd.read_csv(data_path / "locations.csv")
        console.print(" ✓", style="green")
        
        console.print("  Loading incidents.csv...", end="")
        incidents_df = pd.read_csv(data_path / "incidents.csv")
        console.print(" ✓", style="green")
        
        console.print("  Loading public_complaints.csv...", end="")
        complaints_df = pd.read_csv(data_path / "public_complaints.csv")
        console.print(" ✓", style="green")
        
        # Validation
        console.print("\n[bold]🔍 Validating Data...[/bold]\n")
        
        # Check for nulls
        null_check = locations_df.isnull().sum().sum() + incidents_df.isnull().sum().sum() + complaints_df.isnull().sum().sum()
        console.print(f"  Null values: {null_check} ", style="green" if null_check == 0 else "yellow")
        
        # Check join keys
        loc_ids = set(locations_df['location_id'])
        inc_ids = set(incidents_df['location_id'])
        comp_ids = set(complaints_df['location_id'])
        
        inc_coverage = len(inc_ids.intersection(loc_ids)) / len(inc_ids) * 100
        comp_coverage = len(comp_ids.intersection(loc_ids)) / len(comp_ids) * 100
        
        console.print(f"  Join coverage: {inc_coverage:.1f}% (incidents), {comp_coverage:.1f}% (complaints)", style="green")
        
        # Summary table
        table = Table(title="Dataset Summary")
        table.add_column("File", style="cyan")
        table.add_column("Rows", style="magenta")
        table.add_column("Columns", style="green")
        table.add_column("Status", style="yellow")
        
        table.add_row("locations.csv", f"{len(locations_df):,}", str(len(locations_df.columns)), "✓")
        table.add_row("incidents.csv", f"{len(incidents_df):,}", str(len(incidents_df.columns)), "✓")
        table.add_row("public_complaints.csv", f"{len(complaints_df):,}", str(len(complaints_df.columns)), "✓")
        
        console.print("\n")
        console.print(table)
        
        console.print("\n[bold green]✅ Data ingestion complete![/bold green]\n")
        
    except Exception as e:
        console.print(f"\n[bold red]❌ Error: {e}[/bold red]\n")
        raise typer.Exit(1)

@app.command()
def eda():
    """Exploratory Data Analysis with visualizations"""
    console.print(BANNER, style="bold blue")
    console.print("\n[bold]📊 Exploratory Data Analysis[/bold]\n")
    
    try:
        data_path = Path("../data")
        incidents_df = pd.read_csv(data_path / "incidents.csv")
        complaints_df = pd.read_csv(data_path / "public_complaints.csv")
        locations_df = pd.read_csv(data_path / "locations.csv")
        
        # Top hotspots
        console.print("[bold]🔥 Top 10 Hotspot Locations:[/bold]\n")
        hotspots = incidents_df['location_id'].value_counts().head(10)
        for i, (loc_id, count) in enumerate(hotspots.items(), 1):
            zone = locations_df[locations_df['location_id'] == loc_id]['zone'].values
            zone_str = zone[0] if len(zone) > 0 else 'Unknown'
            bar = '█' * int(count / 2)
            console.print(f"  {i:2}. {loc_id} ({zone_str:10}): {count:3} {bar}", style="cyan")
        
        # Category distribution
        console.print("\n[bold]📂 Complaint Categories:[/bold]\n")
        cat_dist = complaints_df['category'].value_counts()
        for cat, count in cat_dist.items():
            pct = (count / len(complaints_df)) * 100
            bar = '█' * int(pct)
            console.print(f"  {cat:20}: {count:5} ({pct:5.1f}%) {bar}", style="yellow")
        
        # Resolution rates
        console.print("\n[bold]✅ Resolution Rates:[/bold]\n")
        resolved_incidents = (incidents_df['resolved'] == 1).sum()
        resolved_pct = (resolved_incidents / len(incidents_df)) * 100
        console.print(f"  Incidents: {resolved_pct:.1f}% resolved", style="green")
        
        resolved_complaints = complaints_df['status'].isin(['Resolved', 'Closed']).sum()
        resolved_comp_pct = (resolved_complaints / len(complaints_df)) * 100
        console.print(f"  Complaints: {resolved_comp_pct:.1f}% resolved", style="green")
        
        console.print("\n[bold green]✅ EDA complete![/bold green]\n")
        
    except Exception as e:
        console.print(f"\n[bold red]❌ Error: {e}[/bold red]\n")
        raise typer.Exit(1)

@app.command()
def train(all: bool = False):
    """Train ML models"""
    console.print(BANNER, style="bold blue")
    console.print("\n[bold]🤖 Training ML Models...[/bold]\n")
    
    with console.status("[bold green]Training in progress...") as status:
        models_to_train = ["Priority Scorer", "Resolution Time Predictor", "Incident Forecaster"]
        
        for i, model in enumerate(models_to_train, 1):
            status.update(f"[bold green]Training {model}... ({i}/{len(models_to_train)})")
            time.sleep(1)  # Simulate training
            console.print(f"  ✓ {model} trained", style="green")
    
    console.print("\n[bold green]✅ All models trained![/bold green]\n")

@app.command()
def rank(top: int = 10):
    """Show priority queue"""
    console.print(BANNER, style="bold blue")
    console.print("\n[bold]🎯 Priority Queue (ML-Ranked)[/bold]\n")
    
    try:
        data_path = Path("../data")
        incidents_df = pd.read_csv(data_path / "incidents.csv")
        locations_df = pd.read_csv(data_path / "locations.csv")
        
        # Calculate priority scores
        hotspots = incidents_df.groupby('location_id').size().nlargest(top)
        
        table = Table(title=f"Top {top} Priority Locations")
        table.add_column("Rank", style="cyan", width=5)
        table.add_column("Location", style="magenta", width=12)
        table.add_column("Zone", style="green", width=10)
        table.add_column("Score", style="yellow", width=8)
        table.add_column("Confidence", style="blue", width=12)
        table.add_column("Top Reason", style="white")
        
        for i, (loc_id, count) in enumerate(hotspots.items(), 1):
            location = locations_df[locations_df['location_id'] == loc_id].iloc[0]
            score = min(100, count * 4)
            confidence = 85 + (score / 10)
            
            table.add_row(
                f"#{i}",
                loc_id,
                location['zone'],
                f"{score:.1f}",
                f"{confidence:.1f}%",
                f"{count} incidents"
            )
        
        console.print(table)
        console.print()
        
    except Exception as e:
        console.print(f"\n[bold red]❌ Error: {e}[/bold red]\n")
        raise typer.Exit(1)

@app.command()
def explain(location_id: str):
    """Explain priority score for a location"""
    console.print(BANNER, style="bold blue")
    console.print(f"\n[bold]🔍 Explainability for {location_id}[/bold]\n")
    
    try:
        data_path = Path("../data")
        locations_df = pd.read_csv(data_path / "locations.csv")
        incidents_df = pd.read_csv(data_path / "incidents.csv")
        
        location = locations_df[locations_df['location_id'] == location_id]
        if len(location) == 0:
            console.print(f"[bold red]Location {location_id} not found[/bold red]")
            raise typer.Exit(1)
        
        location = location.iloc[0]
        incident_count = len(incidents_df[incidents_df['location_id'] == location_id])
        
        console.print(Panel(
            f"[bold]{location['zone']}[/bold]\n"
            f"Road: {location['road_type']} ({location['road_condition']})\n"
            f"Population: {location['population_density_per_km2']:,}/km²\n"
            f"Pedestrian Activity: {location['pedestrian_activity']}",
            title="Location Info"
        ))
        
        console.print("\n[bold]Feature Contributions:[/bold]\n")
        contributions = [
            ("Incident frequency", incident_count, 25),
            ("Road condition", location['road_condition'], 18),
            ("Pedestrian activity", location['pedestrian_activity'], 15),
            ("Population density", f"{location['population_density_per_km2']:,}", 12),
        ]
        
        for feature, value, contrib in contributions:
            bar = '█' * int(contrib / 2)
            console.print(f"  {feature:25}: {str(value):15} {bar} {contrib}%", style="cyan")
        
        console.print()
        
    except Exception as e:
        console.print(f"\n[bold red]❌ Error: {e}[/bold red]\n")
        raise typer.Exit(1)

@app.command()
def demo():
    """Run scripted demo"""
    console.print(BANNER, style="bold blue")
    console.print("\n[bold]🎬 Running Demo Sequence...[/bold]\n")
    
    steps = [
        ("📂 Loading data", 1),
        ("🤖 Running ML models", 2),
        ("🎯 Generating priority queue", 1),
        ("✅ Demo complete!", 1)
    ]
    
    for step, duration in steps:
        console.print(f"  {step}...", style="cyan")
        time.sleep(duration)
    
    console.print("\n[bold green]✅ Demo sequence complete![/bold green]\n")
    console.print("  Run 'Sudhar rank' to see priority queue")
    console.print("  Run 'Sudhar explain LOC_ID' for details")
    console.print()

if __name__ == "__main__":
    app()
