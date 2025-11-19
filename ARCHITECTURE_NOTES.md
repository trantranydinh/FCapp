 FCAPP ARCHITECTURE ANALYSIS

  1. CURRENT FUNCTIONALITY SUMMARY

  Your project is a Cashew Price Forecasting Application with these capabilities:

  Core Features:

  - Price Forecasting: Multiple models (LSTM, Trend, EMA, Seasonal)
  - Dashboard: Historical data visualization, KPIs, alerts
  - Market Insights: Sentiment analysis from price movements
  - News Watch: News summaries (with optional LLM enhancement)
  - LLM Integration: OpenAI & Anthropic support for insights
  - Data Upload: Excel file upload for new price data

  Tech Stack Reality:

  Frontend:  Next.js 14 (port 5173) + React 18 + Chart.js
  Backend:   Node.js + Express (port 8000)
  ML:        Python (LSTM/TensorFlow, Prophet, Ensemble)
  AI Broker: TypeScript separate module (Perplexity, Gemini, ChatGPT, Claude)
  Storage:   JSON file cache (not PostgreSQL despite docker-compose)

  ---
  2. DATA FLOW (INPUT → PROCESS → OUTPUT)

  ┌─────────────────────────────────────────────────────────────┐
  │ INPUT LAYER                                                  │
  ├─────────────────────────────────────────────────────────────┤
  │ • Excel Upload (raw_2025.xlsx)                               │
  │ • User triggers forecast via UI                              │
  │ • Historical data stored in data/ folder                     │
  └─────────────────────────────────────────────────────────────┘
                            │
                            ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ BACKEND PROCESSING (Node.js)                                │
  ├─────────────────────────────────────────────────────────────┤
  │ 1. Express Server (server.js)                                │
  │    ├─> Routes: /api/v1/dashboard, /api/v1/price            │
  │    └─> CORS, JSON parsing, error handling                   │
  │                                                               │
  │ 2. Price Service (priceService.js)                          │
  │    ├─> Reads Excel data (XLSX library)                      │
  │    ├─> Model Registry selects forecasting model             │
  │    └─> Coordinates prediction workflow                      │
  │                                                               │
  │ 3. Model Execution                                           │
  │    Option A: JavaScript Models (trend, EMA, seasonal)       │
  │    Option B: Python LSTM (spawn child process)              │
  │    └─> Returns forecast object                              │
  │                                                               │
  │ 4. LLM Enhancement (Optional)                                │
  │    ├─> Generates natural language explanation               │
  │    └─> Calls OpenAI or Anthropic API                        │
  │                                                               │
  │ 5. Caching (demoCache.js)                                   │
  │    └─> Saves to outputs/cache/*.json                        │
  └─────────────────────────────────────────────────────────────┘
                            │
                            ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ OUTPUT LAYER                                                 │
  ├─────────────────────────────────────────────────────────────┤
  │ • REST API responses (JSON)                                  │
  │ • Frontend renders charts & KPIs                             │
  │ • Confidence bands, trend labels, explanations              │
  └─────────────────────────────────────────────────────────────┘

  ---
  3. MAIN MODULES/FUNCTIONS

  Backend (Node.js)

  | Module                   | Location        | Responsibility                                                |
  |--------------------------|-----------------|---------------------------------------------------------------|
  | server.js                | Backend entry   | Express app setup, middleware, routing                        |
  | settings.js              | Config          | Environment variable loading                                  |
  | Routes                   |                 |                                                               |
  | dashboard.js             | Routes          | Dashboard endpoints (overview, historical, sentiment, alerts) |
  | price.js                 | Routes          | Price forecasting endpoints (run, history, accuracy)          |
  | Services                 |                 |                                                               |
  | priceService.js          | Core logic      | Orchestrates forecasting, reads Excel, model registry         |
  | dashboardService.js      | Aggregation     | KPI calculation, overview generation                          |
  | llmService.js            | AI calls        | OpenAI/Anthropic integration                                  |
  | newsService.js           | News            | Demo news loading/ranking                                     |
  | marketInsightsService.js | Sentiment       | Price-based sentiment analysis                                |
  | modelRegistry.js         | Model mgmt      | Dynamic model selection/registration                          |
  | demoCache.js             | Persistence     | JSON file-based caching                                       |
  | Models                   |                 |                                                               |
  | trendModel.js            | Simple forecast | Linear trend projection                                       |
  | movingAverageModel.js    | EMA             | Exponential moving average                                    |
  | seasonalModel.js         | Seasonal        | Month-based patterns                                          |
  | lstmModel.js             | ML bridge       | Spawns Python LSTM process                                    |

  Frontend (Next.js)

  | Module              | Location | Responsibility           |
  |---------------------|----------|--------------------------|
  | _app.js             | App root | Global layout, providers |
  | dashboard.js        | Page     | Main KPI dashboard       |
  | price-forecast.js   | Page     | Forecasting interface    |
  | market-insights.js  | Page     | Sentiment analysis view  |
  | news-watch.js       | Page     | News feed                |
  | useDashboardData.js | Hook     | SWR data fetching        |

  Python ML Models

  | File                                      | Purpose                                 |
  |-------------------------------------------|-----------------------------------------|
  | Version_2.0.py                            | DUPLICATE: Standalone LSTM (600+ lines) |
  | backend/models/lstm_forecaster.py         | DUPLICATE: Same LSTM for Node.js bridge |
  | ml-models/rcn-price/prophet_forecaster.py | Prophet-based forecasting (unused?)     |
  | ml-models/ensemble/ensemble.py            | Ensemble combiner (unused?)             |

  AI Broker (TypeScript)

  | File           | Purpose                                |
  |----------------|----------------------------------------|
  | broker.ts      | LLM request router with retry/fallback |
  | providers/*.ts | Individual provider implementations    |

  ---
  4. ARCHITECTURE VIOLATIONS & PROBLEMS

  🔴 CRITICAL ISSUES

  A. Duplicated Logic

  ❌ TWO IDENTICAL LSTM IMPLEMENTATIONS
     • Version_2.0.py (root folder)
     • backend/models/lstm_forecaster.py
     → Same class, same features, same 250+ lines
     → KEEP: lstm_forecaster.py (integrated)
     → DELETE: Version_2.0.py

  B. Unused/Orphaned Code

  ❌ DOCKER-COMPOSE REFERENCES NON-EXISTENT CODE
     • Defines 5 workers (price, market, news, ensemble)
     • Workers never implemented (no worker-*.js files)
     • PostgreSQL configured but never used
     • Redis configured but never used
     → Using JSON file cache instead

  ❌ AI BROKER MODULE (ai-broker/)
     • Separate TypeScript project
     • NOT imported/used by backend
     • Backend has its own llmService.js
     → Duplicate LLM handling

  ❌ ML-MODELS FOLDER
     • prophet_forecaster.py - not integrated
     • ensemble.py - not integrated
     → May be exploration/prototypes

  C. Inconsistent Module Placement

  ❌ MIXED CONCERNS
     • lstmModel.js spawns Python BUT
     • Python script in backend/models/ not ml-models/
     • ai-broker is TypeScript but backend is JavaScript
     → No clear language/technology boundaries

  D. Circular/Tangled Dependencies

  priceService.js
     ├─> modelRegistry (good)
     ├─> llmService (okay)
     ├─> demoCache (okay)
     └─> Each model imports settings directly
         → Tight coupling to settings

  ---
  🟡 DESIGN SMELLS

  Violation 1: God Service

  // priceService.js does TOO MUCH:
  - Reads Excel files
  - Manages model registry
  - Calls LLM for explanations
  - Caches forecasts
  - Calculates volatility
  - Fetches historical data
  - Calculates accuracy
  Should be split into: DataReader, ForecastOrchestrator, ResultsCache

  Violation 2: Anemic Services

  // newsService.js DOES TOO LITTLE:
  - Just loads JSON file
  - No real news fetching
  - No ranking logic
  - Demo data only
  Either enhance or remove

  Violation 3: Settings as Global State

  // settings.js is imported everywhere
  // Makes testing hard, creates hidden dependencies
  Should use: Dependency injection or environment context

  Violation 4: Mixed Abstraction Levels

  // routes/price.js mixes:
  - HTTP concerns (multer, file upload)
  - Business logic (forecast orchestration)
  - File system operations
  Should separate: HTTP layer / Service layer / Storage layer

  ---
  5. MISSING BOUNDARIES

  What Should Be Merged:

  ✅ llmService.js + ai-broker/
     → One unified LLM abstraction
     → Keep routing logic from ai-broker
     → Keep provider implementations

  ✅ Version_2.0.py → lstm_forecaster.py
     → Delete standalone version

  What Should Be Removed:

  🗑️ docker-compose.yml (or implement workers)
  🗑️ Version_2.0.py (duplicate)
  🗑️ ml-models/prophet* and ensemble* (if unused)
  🗑️ Excessive documentation files (5+ MD files)

  What Should Be Split:

  📦 priceService.js →
     - dataReader.js
     - forecastOrchestrator.js
     - forecastCache.js
     - accuracyCalculator.js

  📦 dashboardService.js →
     - kpiCalculator.js
     - alertsGenerator.js

  ---
  6. CLEAN ARCHITECTURE (RECONSTRUCTED)

  Here's how your system SHOULD be organized:

  ┌────────────────────────────────────────────────────────────┐
  │ PRESENTATION LAYER (Frontend)                               │
  │ • Next.js Pages, React Components, Charts                   │
  └────────────────────────────────────────────────────────────┘
                            │
                            ▼
  ┌────────────────────────────────────────────────────────────┐
  │ API GATEWAY (Backend/Routes)                                │
  │ • Express routes, request validation, response formatting   │
  │ • NO business logic here                                    │
  └────────────────────────────────────────────────────────────┘
                            │
                            ▼
  ┌────────────────────────────────────────────────────────────┐
  │ APPLICATION SERVICES (Orchestration)                        │
  │ • ForecastOrchestrator: Coordinates forecasting workflow    │
  │ • DashboardAggregator: Composes dashboard views            │
  │ • MarketAnalyzer: Sentiment + insights                     │
  └────────────────────────────────────────────────────────────┘
                            │
                            ▼
  ┌────────────────────────────────────────────────────────────┐
  │ DOMAIN LAYER (Business Logic)                               │
  │ • Model Registry: Strategy pattern for model selection     │
  │ • Forecast Models: Prediction algorithms (JS + Python)     │
  │ • Price Analyzer: Volatility, trends, accuracy             │
  │ • News Ranker: Scoring + filtering                         │
  └────────────────────────────────────────────────────────────┘
                            │
                            ▼
  ┌────────────────────────────────────────────────────────────┐
  │ INFRASTRUCTURE LAYER                                        │
  │ • Data Adapters:                                            │
  │   - ExcelReader (xlsx)                                      │
  │   - JSONCache (file system)                                 │
  │   - PostgresRepo (future)                                   │
  │ • External Services:                                        │
  │   - LLMProvider (OpenAI, Anthropic, unified interface)     │
  │   - PythonBridge (spawn process for ML models)             │
  └────────────────────────────────────────────────────────────┘

  ---
  PROPOSED FILE STRUCTURE (Clean)

  project/
  ├── frontend/                    # Next.js app (unchanged)
  ├── backend/
  │   ├── api/                     # NEW: HTTP layer only
  │   │   ├── routes/
  │   │   ├── middleware/
  │   │   └── validators/
  │   ├── application/             # NEW: Orchestration
  │   │   ├── ForecastOrchestrator.js
  │   │   ├── DashboardAggregator.js
  │   │   └── MarketAnalyzer.js
  │   ├── domain/                  # NEW: Business logic
  │   │   ├── models/
  │   │   │   ├── ModelRegistry.js
  │   │   │   ├── TrendModel.js
  │   │   │   ├── LSTMModel.js (bridge)
  │   │   │   └── [other models]
  │   │   ├── PriceAnalyzer.js
  │   │   └── NewsRanker.js
  │   ├── infrastructure/          # NEW: External deps
  │   │   ├── data/
  │   │   │   ├── ExcelReader.js
  │   │   │   ├── JSONCache.js
  │   │   │   └── PostgresRepo.js (future)
  │   │   ├── llm/
  │   │   │   ├── LLMProvider.js   # Unified interface
  │   │   │   ├── OpenAIAdapter.js
  │   │   │   └── ClaudeAdapter.js
  │   │   └── ml/
  │   │       └── PythonBridge.js
  │   └── config/
  │       └── settings.js
  ├── ml-models/                   # Python ML models
  │   ├── lstm/
  │   │   └── forecaster.py        # SINGLE LSTM implementation
  │   ├── prophet/
  │   │   └── forecaster.py
  │   └── ensemble/
  │       └── combiner.py
  └── shared/
      └── types/                   # TypeScript definitions

  ---
  7. SPECIFIC RECOMMENDATIONS

  Phase 1: Immediate Cleanup (No Refactor)

  # Delete duplicates
  rm Version_2.0.py
  rm -rf ai-broker/  # Consolidate into backend/infrastructure/llm

  # Remove unused docs (keep README + PROJECT_SUMMARY)
  rm AI_INTEGRATION_GUIDE.md
  rm LSTM_INTEGRATION_COMPLETE.md
  rm CURRENT_API_STATUS.md

  # Remove or implement docker-compose
  # Option A: Delete if not using
  rm docker-compose.yml

  # Option B: Align with reality (no workers, no DB)

  Phase 2: Consolidate LLM Services

  // NEW: backend/infrastructure/llm/LLMProvider.js
  class LLMProvider {
    constructor() {
      this.providers = {
        openai: new OpenAIAdapter(),
        anthropic: new ClaudeAdapter()
      }
    }

    async call(task, prompt, options) {
      // Routing logic from ai-broker
      // Provider implementations from llmService
    }
  }

  Phase 3: Split PriceService

  // BEFORE: priceService.js (189 lines, 10 functions)
  // AFTER:
  - ExcelReader.js (readPriceHistory)
  - ForecastOrchestrator.js (runForecast, model coordination)
  - ForecastCache.js (fetchLatest, list, save)
  - AccuracyAnalyzer.js (getAccuracySummary)

  Phase 4: Introduce Layering

  // routes/price.js
  router.post("/run-forecast", async (req, res) => {
    const forecast = await forecastOrchestrator.execute(req.body);
    res.json(forecast);
  });

  // application/ForecastOrchestrator.js
  async execute({ forecastDays, modelId }) {
    const history = await dataReader.readPrices();
    const model = modelRegistry.get(modelId);
    const result = await model.predict(history, forecastDays);
    const enhanced = await llmProvider.enhance(result);
    await forecastCache.save(enhanced);
    return enhanced;
  }

  ---
  8. SUMMARY: MENTAL MODEL

  Current State: "Vibe Code"

  ❌ Scattered responsibilities
  ❌ Duplicate implementations (2x LSTM, 2x LLM)
  ❌ Unused code (workers, DB, Prophet)
  ❌ Mixed tech without boundaries (JS/TS/Py)
  ❌ "God services" doing everything
  ❌ Documentation doesn't match reality

  Target State: "Clean Architecture"

  ✅ Layered: API → Application → Domain → Infrastructure
  ✅ Single responsibility per module
  ✅ Clear boundaries between layers
  ✅ Dependency injection instead of global imports
  ✅ One LSTM, one LLM provider abstraction
  ✅ Tests can mock infrastructure easily

  The Core Flow (Simplified)

  User → Frontend → API Routes → Orchestrator → Model → Python/JS Logic
                                      ↓
                                  LLM Provider → OpenAI/Claude
                                      ↓
                                  Cache → JSON/DB
## GOLDEN PATH v0 – LSTM ONLY

Goal: Bấm 1 nút trên frontend (http://localhost:5173) 
→ gọi 1 API riêng 
→ Node.js gọi Python LSTM 
→ trả về forecast JSON.

Tạm thời **bỏ qua**:
- Trend/EMA/Seasonal models
- News & Market Insights
- LLM giải thích
- Docker compose, Postgres, Redis
