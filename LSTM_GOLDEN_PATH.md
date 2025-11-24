# LSTM Golden Path - Quick Reference

## ✅ What Has Been Completed

### 1. **New 4-Layer Backend Architecture**

```
backend/src/
├── api/                          # LAYER 1: HTTP endpoints
│   └── routes/
│       └── lstm.routes.js        # NEW: LSTM API (POST /run, GET /info, GET /health)
│
├── application/                  # LAYER 2: Business workflow orchestration
│   └── ForecastOrchestrator.js   # NEW: Coordinates forecast workflow
│
├── domain/                       # LAYER 3: Business logic & models
│   └── models/
│       └── LSTMModel.js          # NEW: LSTM prediction wrapper
│
└── infrastructure/               # LAYER 4: External services & data
    ├── data/
    │   └── ExcelReader.js        # NEW: Reads Excel price data
    └── ml/
        └── PythonBridge.js       # NEW: Spawns Python processes
```

### 2. **Python ML Models**

```
ml-models/
└── lstm/
    └── forecaster.py             # Moved from backend/models/
```

### 3. **Frontend Demo**

```
frontend/pages/
└── lstm-demo.js                  # NEW: Simple LSTM test page
```

---

## 🚀 How to Test the LSTM Golden Path

### Step 1: Start Backend (Port 8000)

```bash
cd backend
npm run dev
```

**Expected output:**
```
✓ Registered model: trend-v1
✓ Registered model: ema-v1
✓ Registered model: seasonal-v1
✓ Registered model: lstm-v1
Cashew Forecast backend listening on http://localhost:8000
```

### Step 2: Start Frontend (Port 5173)

```bash
cd frontend
npm install  # if not already done
npm run dev
```

**Expected output:**
```
ready - started server on 0.0.0.0:5173, url: http://localhost:5173
```

### Step 3: Access LSTM Demo

1. Open browser: **http://localhost:5173**
2. Click the **🚀 LSTM Demo (Golden Path)** button (green)
3. On the LSTM demo page:
   - Set forecast days (default: 60)
   - Click **"Run LSTM Forecast"**
4. Wait ~1-2 minutes for Python LSTM to train and forecast
5. View results:
   - Summary cards (Model, Base Price, Final Price, Trend, Confidence)
   - Price forecast chart with confidence bands
   - Raw JSON output (expandable)

---

## 🔄 LSTM Flow (End-to-End)

```
┌──────────────────────────────────────────────────────────┐
│ USER                                                      │
│ Browser: http://localhost:5173/lstm-demo                 │
│ Action: Click "Run LSTM Forecast"                        │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ FRONTEND                                                  │
│ File: frontend/pages/lstm-demo.js                        │
│ Action: POST /api/v1/lstm/run { forecast_days: 60 }     │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ API LAYER (HTTP)                                          │
│ File: backend/src/api/routes/lstm.routes.js              │
│ Action: Validate request, call orchestrator              │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (Orchestration)                         │
│ File: backend/src/application/ForecastOrchestrator.js    │
│ Actions:                                                  │
│   1. Read historical data (ExcelReader)                   │
│   2. Run LSTM prediction (LSTMModel)                      │
│   3. Enrich and return result                            │
└──────────────────────────────────────────────────────────┘
           ↓                              ↓
┌─────────────────────┐      ┌──────────────────────────┐
│ INFRASTRUCTURE      │      │ DOMAIN LAYER              │
│ ExcelReader.js      │      │ LSTMModel.js              │
│ Reads:              │      │ Calls:                    │
│ data/*.xlsx         │      │ PythonBridge.execute()    │
└─────────────────────┘      └──────────────────────────┘
                                        ↓
                        ┌──────────────────────────────┐
                        │ INFRASTRUCTURE               │
                        │ PythonBridge.js              │
                        │ Spawns: python forecaster.py │
                        │ Sends: JSON via stdin        │
                        │ Receives: JSON via stdout    │
                        └──────────────────────────────┘
                                        ↓
                        ┌──────────────────────────────┐
                        │ PYTHON ML MODEL              │
                        │ ml-models/lstm/forecaster.py │
                        │ Actions:                     │
                        │   1. Load price data          │
                        │   2. Feature engineering      │
                        │   3. Train 3 LSTM networks    │
                        │   4. Generate forecast        │
                        │   5. Return JSON              │
                        └──────────────────────────────┘
                                        ↓
┌──────────────────────────────────────────────────────────┐
│ RESPONSE                                                  │
│ Frontend displays:                                        │
│   - Price forecast chart                                  │
│   - Confidence bands                                      │
│   - Summary metrics                                       │
│   - Raw JSON data                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 📝 API Endpoints

### LSTM Forecasting

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/v1/lstm/run` | Run LSTM forecast | `{ "forecast_days": 60 }` |
| GET | `/api/v1/lstm/info` | Get LSTM model info | - |
| GET | `/api/v1/lstm/health` | Health check | - |

### Example API Call

```bash
curl -X POST http://localhost:8000/api/v1/lstm/run \
  -H "Content-Type: application/json" \
  -d '{"forecast_days": 60}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modelId": "lstm-v1",
    "modelName": "LSTM Neural Network",
    "basePrice": 2500.00,
    "finalPrice": 2650.00,
    "trendLabel": "UP",
    "confidence": 0.75,
    "detailedData": [...]
  }
}
```

---

## 🛠️ Troubleshooting

### Backend Won't Start

**Issue:** "require is not defined in ES module scope"

**Solution:** All new modules use ES6 syntax (`import`/`export`). Check that files use:
- `import` instead of `require()`
- `export default` instead of `module.exports`

### Python Not Found

**Issue:** "Failed to spawn Python process"

**Solution:**
1. Ensure Python 3.x is installed: `python --version`
2. Install dependencies: `pip install tensorflow pandas numpy scikit-learn`
3. Check Python path in system PATH

### Frontend Can't Connect

**Issue:** "Network Error" or "CORS blocked"

**Solution:**
1. Verify backend is running on port 8000
2. Check frontend `.env` has: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
3. CORS is configured for `http://localhost:5173` in `server.js`

### LSTM Timeout

**Issue:** "Python execution timed out"

**Solution:**
1. LSTM training can take 1-2 minutes
2. Ensure system has sufficient RAM (4GB+ recommended)
3. Check Python LSTM script is in: `ml-models/lstm/forecaster.py`
4. Verify data file exists: `data/sample_price_data.xlsx`

---

## 📊 Current Status

✅ **Backend**: Running on port 8000
✅ **Frontend**: Ready on port 5173
✅ **LSTM Golden Path**: Fully functional
✅ **API Layer**: Working
✅ **4-Layer Architecture**: Implemented

---

## 🔜 Next Steps (Not Yet Done)

1. Move existing models (Trend, EMA, Seasonal) to domain layer
2. Extract remaining infrastructure modules (JSONCache, LLMProvider)
3. Migrate existing routes to API layer structure
4. Move legacy code to `/legacy` folder
5. Update main ARCHITECTURE_NOTES.md with full details
6. Test all existing functionality still works

---

## 📁 File Locations

| Component | File Path |
|-----------|-----------|
| LSTM API Route | `backend/src/api/routes/lstm.routes.js` |
| Forecast Orchestrator | `backend/src/application/ForecastOrchestrator.js` |
| LSTM Model Wrapper | `backend/src/domain/models/LSTMModel.js` |
| Python Bridge | `backend/src/infrastructure/ml/PythonBridge.js` |
| Excel Reader | `backend/src/infrastructure/data/ExcelReader.js` |
| Python LSTM | `ml-models/lstm/forecaster.py` |
| Frontend Demo | `frontend/pages/lstm-demo.js` |
| Server Entry | `backend/src/server.js` |

---

**Generated**: November 18, 2025
**Version**: 1.0 - Golden Path Implementation
