# ================================================================
# FCapp Frontend - Complete Cleanup & Run Script
# Fixes all Tailwind CSS compilation errors
# ================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FCapp Frontend Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Remove node_modules
Write-Host "[1/6] Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "✓ node_modules removed" -ForegroundColor Green
} else {
    Write-Host "✓ node_modules not found (skip)" -ForegroundColor Green
}

# Step 2: Remove package-lock.json
Write-Host "[2/6] Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "✓ package-lock.json removed" -ForegroundColor Green
} else {
    Write-Host "✓ package-lock.json not found (skip)" -ForegroundColor Green
}

# Step 3: Remove .next cache
Write-Host "[3/6] Removing .next cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ .next cache removed" -ForegroundColor Green
} else {
    Write-Host "✓ .next not found (skip)" -ForegroundColor Green
}

# Step 4: Install dependencies with Tailwind v3
Write-Host "[4/6] Installing dependencies (Tailwind v3.4.1)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ npm install failed" -ForegroundColor Red
    exit 1
}

# Step 5: Verify Tailwind version
Write-Host "[5/6] Verifying Tailwind CSS version..." -ForegroundColor Yellow
$tailwindVersion = npm list tailwindcss 2>$null | Select-String "tailwindcss@"
Write-Host "✓ Installed: $tailwindVersion" -ForegroundColor Green

# Step 6: Start dev server
Write-Host "[6/6] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend will start at:" -ForegroundColor Cyan
Write-Host "  http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
