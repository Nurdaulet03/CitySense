# Fix Next.js build permission error on Windows
Write-Host "Fixing Next.js build issue..." -ForegroundColor Yellow

# Stop all Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove .next folder
Write-Host "Cleaning .next folder..." -ForegroundColor Cyan
$nextPath = "frontend\.next"
if (Test-Path $nextPath) {
    Remove-Item -Recurse -Force $nextPath -ErrorAction SilentlyContinue
    Write-Host "✓ Removed .next folder" -ForegroundColor Green
} else {
    Write-Host "✓ .next folder doesn't exist" -ForegroundColor Green
}

# Rebuild
Write-Host "`nBuilding frontend..." -ForegroundColor Cyan
Set-Location frontend
npm run build

Write-Host "`n✓ Done! If build succeeded, you're ready to deploy." -ForegroundColor Green

