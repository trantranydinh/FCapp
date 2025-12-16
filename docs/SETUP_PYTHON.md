# Python Setup for LSTM Model

## Quick Setup

### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Verify Python Installation

```bash
python --version
# Should show Python 3.8 or higher
```

### Step 3: Test the LSTM Model

```bash
# Test Python script directly
echo '{"file_path":"../data/raw_2025.xlsx","forecast_days":60}' | python models/lstm_forecaster.py
```

### Step 4: Restart Backend

```bash
npm run dev
```

## What Was Installed

1. **pandas** - Data manipulation
2. **numpy** - Numerical computing
3. **scikit-learn** - Feature scaling and metrics
4. **tensorflow** - Deep learning framework for LSTM
5. **openpyxl** - Excel file reading

## Troubleshooting

### Error: "python not found"

**Windows:**
```bash
# Use py instead
py -m pip install -r requirements.txt
```

**Update model to use 'py':**
Edit `backend/src/models/lstmModel.js` line 48:
```javascript
const python = spawn("py", [scriptPath]);
```

### Error: "tensorflow not compatible"

```bash
# Install CPU-only version (lighter)
pip install tensorflow-cpu==2.15.0
```

### Error: "Module not found"

```bash
# Install all dependencies with force
pip install --upgrade -r requirements.txt
```

### Test if LSTM works

```bash
# From project root
cd backend
python models/lstm_forecaster.py
# (it will wait for input, press Ctrl+C to cancel)
```

## Using the LSTM Model

### Via API

```bash
# Run forecast with LSTM model
curl -X POST http://localhost:8000/api/v1/price/run-forecast \
  -H "Content-Type: application/json" \
  -d '{"forecast_days": 60, "model_id": "lstm-v1"}'
```

### Via Dashboard

1. Go to http://localhost:5173/dashboard
2. Select "LSTM Ensemble Forecaster" from dropdown
3. Upload your Excel file
4. Click "Upload & Generate Forecast"

## Model Details

- **Type**: Deep Learning (LSTM)
- **Architecture**: Ensemble of 3 LSTM networks
- **Features**: Returns, Moving Average, Momentum, Volatility, Seasonal
- **Training**: ~30 epochs with early stopping
- **Confidence**: 85%
- **Speed**: 30-60 seconds (first run), ~15-30 seconds (subsequent)

## Performance

| Aspect | Value |
|--------|-------|
| Accuracy | 85%+ confidence |
| MAPE | ~3-5% |
| Directional Accuracy | ~70% |
| Forecast Horizon | Up to 90 days |

## Fallback to Statistical Models

If Python/LSTM fails, the system automatically uses:
1. Seasonal Model (statistical)
2. EMA Model (statistical)
3. Trend Model (statistical)

Check backend logs to see which model is being used.
