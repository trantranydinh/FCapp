
# Installation Guide – Cashew Forecast Demo (Node + Next)

This walkthrough covers preparing the local environment, supplying demo data, and running both services.

---

## 1. Prerequisites

- Node.js 18+ (includes npm)
- Excel demo data `data/sample_price_data.xlsx` (columns: `Date`, `Price`)
- Optional: OpenAI / Anthropic API keys

Directory layout is generated automatically; only the Excel file must exist before startup.

---

## 2. Environment Setup

```bash
# In project root
cp .env.example .env
cp frontend/.env.example frontend/.env

# Ensure required folders exist
mkdir -p data outputs/cache logs
```

Update `.env` if you need custom ports, directories, or API keys. The backend reads this file on boot.

---

## 3. Backend (Node.js + Express)

```bash
cd backend
npm install
npm run dev
```

The API listens on http://localhost:8000 (configurable via `BACKEND_PORT`). On first run the backend creates cache/log directories and validates the Excel file.

---

## 4. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000 for the dashboard. The app uses `NEXT_PUBLIC_BACKEND_URL` to call the API; ensure it points to the backend host/port.

---

## 5. Data Requirements

`data/sample_price_data.xlsx` must include:

| Date | Price |
| --- | --- |
| 2024-01-01 | 950 |
| 2024-01-02 | 955 |

- Dates should be consecutive (daily) for best results.
- Missing data is skipped; fewer than ~60 rows will degrade the demo forecast.
- To seed demo news, create `data/demo_news.json` with an array of objects (title, source, summary, etc.).

---

## 6. Verifications

1. **Health check** – `curl http://localhost:8000/api/v1/dashboard/overview` returns JSON.
2. **UI load** – open `/dashboard`, confirm KPI tiles and chart render.
3. **Forecast run** – use `/price-forecast`, click “Forecast 30d” and observe the chart update.
4. **Cache files** – `outputs/cache/forecasts.json` and `outputs/cache/api_calls.json` should appear after actions.

---

## 7. Maintenance Tasks

- **Reset demo**: delete `outputs/cache/*.json` and restart services.
- **Change data source**: update `.env` (`DATA_DIR`, `DEMO_PRICE_DATA_FILE`) and restart backend.
- **Upgrade dependencies**: run `npm outdated` in each project, then update packages carefully.
- **Logs**: backend prints to console; pipe to file if needed (`npm run dev 2>&1 | tee logs/app.log`).

---

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `ENOENT: sample_price_data.xlsx` | Ensure the Excel file exists and path matches `.env`. |
| `AxiosError: connect ECONNREFUSED 127.0.0.1:8000` | Backend not running or port mismatch. |
| Forecast chart empty | Check Excel data (no rows / invalid price values). |
| LLM limit reached | Remove `outputs/cache/api_calls.json` or raise limits in `.env`. |

Contact the Cashew Forecast engineering team for deeper issues. Version `0.2.0-node-demo`.
