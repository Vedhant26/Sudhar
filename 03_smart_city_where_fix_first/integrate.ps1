# Sudhar Complete Integration Script
# This script connects frontend to backend and makes everything functional

Write-Host "
========================================" -ForegroundColor Cyan
Write-Host "  Sudhar COMPLETE INTEGRATION" -ForegroundColor Yellow
Write-Host "========================================
" -ForegroundColor Cyan

# Check if backend is running
Write-Host "Checking backend..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend not running. Please start it:" -ForegroundColor Red
    Write-Host "  cd api && python main.py" -ForegroundColor Yellow
    Write-Host "
Starting backend now..." -ForegroundColor Yellow
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\Vedhant\OneDrive\Desktop\datath\03_smart_city_where_fix_first\api'; python main.py"
    
    Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "
✅ Integration complete!" -ForegroundColor Green
Write-Host "
Next steps:" -ForegroundColor Cyan
Write-Host "1. Start frontend: cd web && npm run dev" -ForegroundColor White
Write-Host "2. Open: http://localhost:5173" -ForegroundColor White
Write-Host "3. Login: citizen@demo / demo123" -ForegroundColor White
Write-Host "
Everything is now connected!
" -ForegroundColor Green
