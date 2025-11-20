# 🌰 Cashew Forecast AI - Project Overview

An AI-powered market intelligence and price forecasting system for the cashew industry.

## 📋 Quick Links

- **[Testing Guide](TESTING_GUIDE.md)** - Start here for testing instructions
- **[Project Guide](PROJECT_GUIDE.md)** - System architecture and design
- **[Changelog](CHANGELOG.md)** - Recent updates and features

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure Environment (Optional)
```bash
# Backend - Database setup (skip for file-based demo)
cd backend
cp ENV_CONFIG.md .env  # Read ENV_CONFIG.md for examples
```

### 3. Run Application
```bash
# Terminal 1: Backend
cd backend
npm run dev
# Runs on http://localhost:8000

# Terminal 2: Frontend
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### 4. Access Dashboard
Open browser: **http://localhost:3000/dashboard**

---

## ✨ Key Features

### 🔍 Keyword-Based News Intelligence
- Filter market news by topic: `price`, `supply`, `demand`, `logistics`, `regulation`
- AI-powered sentiment analysis
- Real-time updates

### 📊 LSTM Price Forecasting
- Neural network predictions with confidence intervals
- Interactive model architecture viewer
- Training performance visualization

### 📈 Market Analytics Dashboard
- Real-time KPIs (Trend, Volatility, Confidence)
- Glassmorphism UI design
- Responsive charts with Chart.js

### 📄 Professional PDF Reports
- Consulting-style reports (McKinsey/BCG format)
- Executive summaries + Strategic implications
- One-click export

### 🗄️ Flexible Database Support
- **Supported**: PostgreSQL, MySQL, MongoDB, SQLite, File-based
- **Cloud-ready**: Works with AWS RDS, Azure SQL, Google Cloud SQL
- **Zero-config**: File-based mode for instant development

---

## 📁 Project Structure

```
FCapp/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── api/          # HTTP routes
│   │   ├── application/  # Business logic (Orchestrators)
│   │   ├── domain/       # Core models (LSTM, Price)
│   │   └── infrastructure/ # External services (DB, News Crawler)
│   ├── outputs/reports/  # Generated PDF reports
│   └── data/             # JSON storage (if DB not configured)
│
├── frontend/             # Next.js + Tailwind CSS
│   ├── pages/            # Dashboard, LSTM Demo, Price Forecast
│   ├── components/       # UI components (glassmorphism)
│   └── lib/              # API client, utilities
│
├── PROJECT_GUIDE.md      # 📘 System architecture
├── TESTING_GUIDE.md      # 🧪 Test instructions
└── CHANGELOG.md          # 📝 Version history
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **AI/ML**: LSTM (Python microservice)
- **Database**: PostgreSQL/MySQL/MongoDB/SQLite (via abstraction layer)

### Frontend
- **Framework**: Next.js 13+
- **Styling**: Tailwind CSS + Glassmorphism
- **Charts**: Chart.js, react-chartjs-2
- **Icons**: Lucide React

### DevOps
- **Development**: nodemon, hot-reload
- **Testing**: Manual (see TESTING_GUIDE.md)
- **Deployment**: Docker-ready (WIP)

---

## 📊 Test Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend API | ✅ Working | All endpoints tested |
| Frontend UI | ✅ Working | All pages render |
| News Crawler | ✅ Working | Keyword filtering works |
| Report Generator | ✅ Working | HTML reports created |
| Database Adapter | ✅ Ready | Not tested with real DB |
| LSTM Model | ⚠️ Mock | Using demo data |

---

## 🎯 Use Cases

1. **Market Analysts**: Track cashew price trends with AI forecasts
2. **Procurement Teams**: Get strategic buy/hold recommendations
3. **C-Suite Executives**: Download professional PDF reports for board meetings
4. **Traders**: Monitor volatility and sentiment in real-time

---

## 📚 Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| [README.md](README.md) | Project overview | Everyone |
| [PROJECT_GUIDE.md](PROJECT_GUIDE.md) | Architecture, data flow, design decisions | Developers, AI assistants |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | How to test the system | QA, Developers |
| [CHANGELOG.md](CHANGELOG.md) | Version history, recent changes | Maintainers |

---

## 🔒 Security Notes

- **No Authentication**: Currently open. Add JWT in production.
- **Database Credentials**: Store in `.env`, never commit.
- **API Rate Limiting**: Not implemented. Consider in production.
- **CORS**: Currently open for development. Restrict in production.

---

## 🐛 Known Issues

1. **LSTM Model**: Currently using mock data (Python microservice not integrated)
2. **PDF Export**: Generates HTML, not true PDF (requires Puppeteer for full PDF)
3. **Database**: Not tested with real cloud databases (abstraction layer ready)

---

## 🤝 Contributing

This is a demo/prototype project. For enhancements:
1. Read `PROJECT_GUIDE.md` to understand architecture
2. Check `CHANGELOG.md` for recent changes
3. Follow existing code structure (Application Layer pattern)
4. Add tests when adding new features

---

## 📞 Support

For questions or issues:
1. Check [TESTING_GUIDE.md](TESTING_GUIDE.md) for common problems
2. Review [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for configuration
3. Read inline code comments (all files have JSDoc)

---

## 📄 License

Proprietary - Internal Use Only

---

## 🙏 Acknowledgments

- Chart.js for beautiful visualizations
- Lucide React for clean icons
- Next.js team for amazing DX
- OpenAI/Anthropic for AI insights (when configured)

---

**Built with ❤️ by AI Development Team**

Last Updated: 2025-11-20
