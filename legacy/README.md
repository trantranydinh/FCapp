# Legacy Code Archive

This directory contains code that has been superseded by the new 4-layer clean architecture.

## Purpose

Code is archived here (not deleted) to:
1. Preserve history for reference
2. Allow easy rollback if needed
3. Enable gradual migration of functionality

## Structure

```
legacy/
├── old-routes/              # Legacy Express routes
│   ├── dashboard.js         # Old dashboard endpoints
│   └── price.js             # Old price forecasting endpoints
│
├── old-services/            # Legacy service layer (god services)
│   ├── priceService.js      # Old price orchestration (GOD SERVICE)
│   ├── dashboardService.js  # Old dashboard aggregation
│   ├── llmService.js        # Old LLM integration
│   ├── newsService.js       # Old news loading
│   ├── marketInsightsService.js  # Old sentiment analysis
│   ├── modelRegistry.js     # Old model registry
│   ├── demoCache.js         # Old JSON caching
│   ├── orchestrator.ts      # Old forecast orchestrator
│   └── freshness-check.ts   # Old SLA monitoring
│
├── old-models/              # Legacy model implementations
│   ├── lstmModel.js         # Old LSTM bridge (replaced by domain/models/LSTMModel.js)
│   ├── trendModel.js        # Old trend model
│   ├── movingAverageModel.js # Old EMA model
│   └── seasonalModel.js     # Old seasonal model
│
└── backend-models-duplicate/
    └── lstm_forecaster.py   # DUPLICATE of ml-models/lstm/forecaster.py
```

## Replaced By

| Legacy Component | New Component | Layer |
|-----------------|---------------|-------|
| `old-routes/dashboard.js` | `backend/src/api/routes/dashboard.routes.js` | API |
| `old-routes/price.js` | `backend/src/api/routes/price.routes.js` | API |
| `old-services/priceService.js` | `backend/src/application/ForecastOrchestrator.js` | Application |
| `old-services/dashboardService.js` | `backend/src/application/DashboardAggregator.js` | Application |
| `old-models/lstmModel.js` | `backend/src/domain/models/LSTMModel.js` | Domain |
| `old-models/trendModel.js` | `backend/src/domain/models/TrendModel.js` | Domain |
| `old-models/movingAverageModel.js` | `backend/src/domain/models/EMAModel.js` | Domain |
| `old-models/seasonalModel.js` | `backend/src/domain/models/SeasonalModel.js` | Domain |
| `backend/models/lstm_forecaster.py` | `ml-models/lstm/forecaster.py` | ML Models |

## Migration Status

- ✅ **LSTM Golden Path**: Fully migrated to new architecture
- ⚠️ **Dashboard**: Routes exist, may need service logic migration
- ⚠️ **Price Multi-Model**: Routes exist, may need orchestration refinement
- ❌ **LLM Integration**: Needs migration to infrastructure/llm/
- ❌ **News Service**: Needs migration
- ❌ **Market Insights**: Needs migration

## When to Use Legacy Code

- **DO NOT** import legacy code in new components
- **DO** reference for business logic during migration
- **DO** copy algorithms/logic (not structure) when needed
- **DELETE** this folder once migration is 100% complete and tested

## Deletion Timeline

This legacy code can be safely deleted after:
1. All endpoints in new API layer are working
2. Full test coverage exists for new implementation
3. Production has been stable for 2+ weeks on new architecture

---

**Archived on:** 2025-11-18
**Reason:** Refactoring to 4-layer clean architecture
