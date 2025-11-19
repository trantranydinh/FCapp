# FCApp - Forecasting Application

Comprehensive market analysis and price forecasting system using AI/ML models.

## Architecture

The system follows a **6-layer architecture**:

1. **User Actions** - Login, profile selection, forecast triggering
2. **Frontend** - Next.js 14 dashboard with ISR
3. **Backend** - Node.js API Gateway + orchestrator
4. **AI Models** - LLM Broker routing to Perplexity, Gemini, ChatGPT, Claude
5. **Data Layer** - Medallion architecture (Bronze → Silver → Gold)
6. **Ensemble** - Combined analysis from all models

## Features

- **Price Forecasting** using Prophet/ARIMA/LSTM
- **Market Movement Analysis** via Perplexity + Gemini
- **News Ranking** using Claude 3.5 Sonnet
- **Ensemble Model** combining all sources
- **Real-time Dashboards** with confidence bands
- **Deviation Alerts** for anomaly detection
- **SLA-based Freshness** tracking

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- Chart.js
- Tailwind CSS
- TypeScript

### Backend
- Node.js + Express
- TypeScript
- BullMQ (job queue)
- PostgreSQL (database)
- Redis (cache)

### ML/AI
- Python (Prophet, ARIMA, LSTM)
- OpenAI GPT-4
- Anthropic Claude
- Google Gemini
- Perplexity AI

### Infrastructure
- Docker + Docker Compose
- PostgreSQL 15
- Redis 7

---

## Quick Start

```bash
# 1. Clone repo and move into project root
cp .env.example .env

# 2. Provide input data (required)
#    Place data/sample_price_data.xlsx with columns: Date, Price

# 3. Install backend dependencies
cd backend
npm install

# 4. Start backend (port 8000 by default)
npm run dev

# 5. Install frontend dependencies (new terminal)
cd ../frontend
npm install

# 6. Start Next.js (port 3000 by default)
npm run dev
```

Open http://localhost:3000 to browse the dashboard UI. The frontend consumes the REST API served from http://localhost:8000.

Optional: supply OpenAI/Anthropic keys in `.env` to test rate-limited LLM calls; otherwise the app uses offline heuristics.

---

## Project Layout

```
backend/
  package.json             # Scripts & dependencies
  src/
    server.js              # Express bootstrap
    settings.js            # Environment & config
    routes/                # REST endpoints (dashboard, price)
    services/              # Forecast, insights, news, cache helpers
frontend/
  package.json             # Next.js project config
  pages/                   # Next route pages
  components/              # Reusable UI widgets
  hooks/                   # SWR data hooks
  lib/                     # Axios client
data/
  sample_price_data.xlsx   # Source data (user-provided)
outputs/
  cache/                   # Forecast + API usage JSON
logs/
  app.log                  # Backend log file (created on demand)
```

---

## Backend Overview

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/dashboard/overview` | KPIs, latest forecast, sentiment, top news |
| `GET /api/v1/dashboard/historical-data` | Normalised historical price series |
| `GET /api/v1/dashboard/news-summary` | Ranked news items (demo JSON seed) |
| `GET /api/v1/price/latest` | Latest forecast (auto-generates if none) |
| `POST /api/v1/price/run-forecast` | Regenerate forecast (`forecast_days` body) |
| `GET /api/v1/price/history` | Recent forecast runs |

Key implementation notes:

- Historical data is read from `data/sample_price_data.xlsx` using `xlsx`.
- Forecast logic uses a simple trend projection with volatility-based bands to stay offline-friendly.
- Forecasts, job runs, and LLM usage counters persist to `outputs/cache/*.json`.
- Demo warnings trigger when forecast trend exceeds ±5% or LLM day-limit is reached.

---

## Frontend Overview

Next.js pages map one-to-one with business experiences:

1. **Dashboard** (`/dashboard`) – KPIs, history vs forecast chart, and top news cards.
2. **Price Forecast** (`/price-forecast`) – run new forecasts and inspect confidence bands.
3. **Market Insights** (`/market-insights`) – sentiment summary and qualitative signals.
4. **News Watch** (`/news-watch`) – adjustable feed of ranked articles.

Implementation stack:

- `axios` + `swr` for data fetching/caching.
- `react-chartjs-2`/Chart.js for time-series visualisations.
- Lightweight shared components (`Layout`, `KpiCard`, `NewsList`, `PriceChart`) for consistent styling.

---

## Environment Variables

`.env` (root) configures both backend and frontend defaults:

```
APP_NAME=Cashew Forecast API
APP_VERSION=0.2.0
APP_MODE=demo
BACKEND_PORT=8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
LLM_PROVIDER=none
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
LLM_MAX_CALLS_PER_MIN=5
LLM_MAX_CALLS_PER_DAY=50
DATA_DIR=data
CACHE_DIR=outputs/cache
LOG_DIR=logs
```

For Next.js-only overrides create `frontend/.env.local` (the repo ships with `.env.example` for reference).

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `sample_price_data.xlsx not found` | Ensure `data/` exists with the file (Date, Price columns). |
| API returns 500 | Check backend logs in terminal or `logs/app.log`. |
| Frontend cannot reach API | Confirm backend is running on port 8000 and `NEXT_PUBLIC_BACKEND_URL` matches. |
| LLM limit reached | Delete `outputs/cache/api_calls.json` or adjust limits in `.env`. |

Reset the demo by stopping both services, clearing `outputs/cache/`, and restarting.

---

## Next Steps

- Swap heuristic forecaster with production ML service (can be deployed as microservice).
- Connect to Fabric Lakehouse / PostgreSQL instead of Excel/JSON.
- Integrate auth, role-based content, and notification channels.
- Add CI/CD pipeline for lint/test/build (GitHub Actions template ready to add).

---

**Version**: 0.2.0-node-demo — maintained by the Cashew Forecast internal team.
