# 🧪 Testing Guide - Cashew Forecast App

## Prerequisites
- Node.js v18+ installed
- npm or yarn
- Terminal/PowerShell access

---

## 🚀 Quick Start Testing

### Step 1: Start Backend Server
```bash
cd backend
npm install
npm run dev
```

**Expected Output:**
```
✓ Registered model: trend-v1
✓ Registered model: ema-v1
✓ Registered model: seasonal-v1
============================================================
  Mode: DEMO
  LLM Provider: none
  📊 Dashboard: http://localhost:8000/api/v1/dashboard   
  💰 Price API: http://localhost:8000/api/v1/price       
  🤖 LSTM API: http://localhost:8000/api/v1/lstm
  🔍 Health: http://localhost:8000/health
============================================================
```

### Step 2: Start Frontend Server
```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## 📋 Test Cases

### Test 1: Backend Health Check
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T15:21:00.000Z"
}
```

### Test 2: News Crawler (Keyword-based)
```bash
# Run the test script
cd backend
node test-news-api.js
```

**Expected Output:**
```
🧪 Testing News Crawler API...
📰 Test 1: Refresh news with keywords ["price", "supply"]
✅ Result: {
  "success": true,
  "count": 5,
  "keywords": ["price", "supply"]
}
```

### Test 3: Generate PDF Report
**Method 1: Via Frontend**
1. Open browser: `http://localhost:3000/dashboard`
2. Click nút **"Export Report"** (ở góc phải biểu đồ chính)
3. Chờ alert: "Report generated successfully!"
4. Kiểm tra file tại: `backend/outputs/reports/REPORT-YYYY-MM-DD-[timestamp].html`

**Method 2: Via API (PowerShell)**
```powershell
$body = @{
  trend = "UP"
  confidence = 88
  currentPrice = 145.20
  forecastPrice = 150.00
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/dashboard/reports/generate" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "filePath": "C:\\...\\backend\\outputs\\reports\\REPORT-2025-11-20-1732112488123.html",
    "fileName": "REPORT-2025-11-20-1732112488123.html"
  }
}
```

**Method 3: Open the HTML Report**
1. Navigate to `backend/outputs/reports/`
2. Open the `.html` file in browser
3. Press `Ctrl+P` to Print → "Save as PDF"
4. Result: Professional consulting-style PDF report

### Test 4: Database Connection (Optional)
**If you configured a database in `.env`:**
```bash
# Check backend logs when starting
# Should see:
[DatabaseAdapter] Connecting to postgresql database...
[DatabaseAdapter] ✓ Connected to postgresql
```

**Test query:**
```javascript
// In backend/test-db.js
import databaseAdapter from './src/infrastructure/db/DatabaseAdapter.js';

await databaseAdapter.connect();
console.log('Connected:', databaseAdapter.isConnected);
await databaseAdapter.disconnect();
```

### Test 5: Frontend UI Components
Open these pages in browser:

1. **Dashboard**: `http://localhost:3000/dashboard`
   - ✅ Verify: File upload card hiển thị
   - ✅ Verify: 4 KPI cards (Trend, Volatility, Confidence, Seasonality)
   - ✅ Verify: Chart có dữ liệu
   - ✅ Verify: News widget có nút refresh

2. **LSTM Demo**: `http://localhost:3000/lstm-demo`
   - ✅ Verify: Model Architecture Viewer
   - ✅ Verify: Loss Curve Chart
   - ✅ Verify: Model Version dropdown
   - ✅ Verify: Forecast Horizon slider

3. **Price Forecast**: `http://localhost:3000/price-forecast`
   - ✅ Verify: Range selector (7D, 1M, 3M, 1Y, ALL)
   - ✅ Verify: AI Insights panel
   - ✅ Verify: Export CSV/PDF buttons

4. **Market Insights**: `http://localhost:3000/market-insights`
   - ✅ Verify: Market Heatmap
   - ✅ Verify: Sentiment KPIs

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend "Cannot find module"
**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module ...
```

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Frontend "Network Error"
**Error:**
```
AxiosError: Network Error
```

**Solution:**
1. Check backend is running on port 8000
2. Verify `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Issue 3: "Port already in use"
**Error:**
```
Error: listen EADDRINUSE: address already in use :::8000
```

**Solution (PowerShell):**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Issue 4: Report Generation Fails
**Error:**
```
Error: ENOENT: no such file or directory
```

**Solution:**
```bash
# Ensure outputs directory exists
cd backend
mkdir -p outputs/reports
```

---

## 🧹 Cleanup & Reset

### Reset Demo Data
```bash
cd backend
rm -rf data/demo_news.json
rm -rf outputs/reports/*
npm run dev  # Will regenerate defaults
```

### Full Clean Install
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json outputs data/demo_news.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

---

## 📊 Performance Benchmarks

| Endpoint | Expected Response Time |
|----------|----------------------|
| GET /health | < 50ms |
| GET /dashboard/overview | < 500ms |
| POST /news-refresh | 1-2 seconds |
| POST /reports/generate | < 1 second |
| POST /lstm/run | 3-5 seconds |

---

## ✅ Full System Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Health check returns 200 OK
- [ ] Dashboard loads with data
- [ ] News refresh works (keyword filter)
- [ ] PDF report generates successfully
- [ ] LSTM demo page interactive
- [ ] Database connection (if configured)
- [ ] All 4 pages accessible
- [ ] No console errors in browser DevTools

---

## 🔍 Debugging Tips

1. **Check Backend Logs:**
   - Watch for `[NewsOrchestrator]`, `[ReportGenerator]` prefixes
   - Errors will show stack traces

2. **Check Frontend DevTools:**
   - Network tab: Verify API calls return 200
   - Console: Look for axios errors

3. **Test API Directly:**
   ```bash
   # PowerShell
   Invoke-RestMethod http://localhost:8000/api/v1/dashboard/overview
   ```

4. **Verify Files:**
   - `backend/data/demo_news.json` should exist after news refresh
   - `backend/outputs/reports/` should contain HTML files after export

---

## 📝 Test Report Template

After testing, fill this out:

```
Test Date: _______________
Tester: _______________

Backend:
- [ ] Starts successfully
- [ ] Health check passes
- [ ] News API works
- [ ] Report generation works

Frontend:
- [ ] Starts successfully
- [ ] All pages load
- [ ] UI components render
- [ ] API calls succeed

Issues Found:
1. _______________________
2. _______________________

Notes:
_______________________
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. Review generated PDF report quality
2. Check database storage (if configured)
3. Test with real data upload
4. Performance profiling (if needed)

If tests fail:
1. Check error messages
2. Refer to "Common Issues" section
3. Review file `PROJECT_GUIDE.md` for configuration
4. Check `CHANGELOG.md` for recent changes
