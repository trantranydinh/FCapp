# 🌰 Cashew Forecast App - Full Documentation

> **Version:** 2.0.0  
> **Last Updated:** December 15, 2025  
> **Copyright:** © 2025 Intersnack Forecast App

---

## 📖 Table of Contents

1.  [Project Overview](#project-overview)
2.  [Quick Start](#quick-start)
3.  [System Architecture](#system-architecture)
4.  [Authentication & Security](#authentication--security)
5.  [Key Features & Logic](#key-features--logic)
6.  [Project Structure](#project-structure)
7.  [Testing & Troubleshooting](#testing--troubleshooting)

---

## 1. Project Overview

**Cashew Forecast App** is an AI-powered market intelligence and price forecasting system designed for the cashew industry. It integrates real-time news analysis, LSTM-based price prediction, and professional reporting into a unified dashboard.

### Key Capabilities
*   **Price Forecasting:** Neural network (LSTM) predictions for RCN prices.
*   **Market Insights:** AI-driven sentiment analysis from global news sources.
*   **Parity Tool:** Real-time calculation of Price Ck/lb based on customizable parameters.
*   **Reporting:** Consultant-style PDF reports for executive decision-making.

---

## 2. Quick Start

### Prerequisites
*   Node.js v18+
*   npm or yarn
*   Python 3.9+ (for LSTM microservice)

### Installation

#### Backend
```bash
cd backend
npm install
# Set up environment (optional, defaults provided for demo)
cp .env.example .env 
npm run dev
# Server running at: http://localhost:8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Dashboard accessible at: http://localhost:3000
```

---

## 3. System Architecture

The application follows a **Clean Architecture** pattern with a strict separation of concerns.

### Backend Layers (`backend/src/`)
1.  **API Layer (`api/`)**: Handles HTTP requests, authentication, and input validation.
2.  **Application Layer (`application/`)**: Orchestrators that manage business workflows (e.g., `ForecastOrchestrator`).
3.  **Domain Layer (`domain/`)**: Pure business logic and models (e.g., `LSTMModel`, `NewsItem`).
4.  **Infrastructure Layer (`infrastructure/`)**: External interfaces (Database, Third-party APIs, File I/O).

### Frontend Stack
*   **Framework:** Next.js 14 (React)
*   **Styling:** Tailwind CSS + Glassmorphism UI
*   **State Management:** React Hooks + SWR
*   **Visualization:** Chart.js, Lucide React

---

## 4. Authentication & Security

The system implements a secure, role-based authentication mechanism.

### Features
*   **Dual-Database Sync:** Users are synchronized between the modern `users` table (UUID) and the legacy `PTool_users` table (Integer ID) to support existing Stored Procedures.
*   **Session Management:** Cookie-based sessions with `HttpOnly` security.
*   **SSO Integration:** Supports Azure AD (Microsoft) login.
*   **Role-Based Access:** Admin, Editor, Viewer roles automatically determined by email domain.

### Access Levels
*   **Admin:** `admin@intersnack.com`, `manager@...`
*   **User:** All other `@intersnack.com` emails.

### Demo Credentials
*   **Email:** `admin@intersnack.com` (or any valid company email)
*   **Password:** `Vicc@2025`

---

## 5. Key Features & Logic

### A. Parity Calculation Tool
*   **Input:** Origin, RCN CFR Price, Quality KOR.
*   **Logic:** Calls stored procedure `PTool_run_parity_v1_0` to compute `Price Ck/lb`.
*   **History:** Tracks calculation history per user ID using `PTool_sp_get_user_calculation_history`.

### B. Price Forecasting (LSTM)
*   **Data Source:** Historical Excel/CSV uploads.
*   **Model:** Long Short-Term Memory (LSTM) recurrent neural network.
*   **Output:** 6-12 month price trajectory with confidence intervals.

### C. Market News Intelligence
*   **Crawler:** Scrapes industry sources based on keywords (`supply`, `drought`, `Vietnam`, `Ivory Coast`).
*   **Analysis:** AI evaluates sentiment (Bullish/Bearish) and relevance.

---

## 6. Project Structure

```
FCapp/
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── api/              # Routes & Controllers
│   │   ├── application/      # Business Logic Orchestrators
│   │   ├── domain/           # Models & Entities
│   │   ├── infrastructure/   # DB, Auth, External Services
│   │   └── server.js         # Entry Point
│   └── data/                 # Local data storage (JSON/Excel)
│
├── frontend/                 # Next.js Dashboard
│   ├── components/           # Reusable UI Components
│   ├── pages/                # Application Routes
│   │   ├── dashboard.js      # Main View
│   │   ├── login.js          # Auth Page
│   │   └── ...
│   └── lib/                  # Utilities (API Client, Auth)
│
├── ml-models/                # Python Microservices
│   └── lstm/                 # LSTM Price Forecaster
│
└── README.md                 # This file
```

---

## 7. Testing & Troubleshooting

### Common Issues

**1. "Invalid Date" in History Table**
*   *Cause:* Backend returns non-standard date format.
*   *Fix:* Frontend now intelligently parses `timestamp`, `calculation_time`, or `created_at`.

**2. "Network Error" / API Unreachable**
*   *Check:* Ensure Backend is running on port `8000`.
*   *Check:* Verify `NEXT_PUBLIC_API_URL` in `frontend/.env`.

**3. Login Fails / "User not found"**
*   *Solution:* Use `admin@intersnack.com` / `Vicc@2025`.
*   *Note:* The system auto-creates users in the legacy DB upon first login.

### Running Tests
*   **Backend Health Check:** `http://localhost:8000/api/v1/parity/health`
*   **Frontend Status:** Check console for "Hydration failed" or build errors.

---

**Proprietary Software - Internal Use Only**
