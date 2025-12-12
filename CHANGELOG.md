# 📝 Changelog - Cashew Forecast App

All notable changes to this project are documented here.

---

## [v0.3.0] - 2025-11-20

### 🎉 Major Features Added

#### 1. **Keyword-Based News Crawler**
- **File**: `backend/src/infrastructure/data/NewsCrawler.js`
- **What**: Smart news crawler với khả năng filter theo từ khóa
- **Keywords supported**: `price`, `supply`, `demand`, `logistics`, `regulation`
- **API**: `POST /api/v1/dashboard/news-refresh`
  - Body: `{ keywords: ['price', 'supply'], limit: 10 }`
- **Why**: Cho phép lọc tin tức theo chủ đề quan tâm thay vì crawl random

#### 2. **Database Abstraction Layer**
- **File**: `backend/src/infrastructure/db/DatabaseAdapter.js`
- **What**: Unified interface để kết nối nhiều loại database
- **Supported DBs**: PostgreSQL, MySQL, MongoDB, SQLite, File-based (none)
- **Config**: Chỉ cần thay đổi `.env` file, không cần sửa code
- **Example**:
  ```env
  DB_TYPE=postgresql
  DB_HOST=mydb.rds.amazonaws.com
  DB_SSL=true
  ```
- **Why**: Dễ dàng migrate giữa cloud (AWS RDS, Azure SQL) và physical servers

#### 3. **Hybrid Storage Logic**
- **File**: `backend/src/application/NewsOrchestrator.js`
- **What**: Tự động lưu vào Database nếu có, fallback sang File nếu không
- **Priority**: Database (primary) → File System (backup) → Fallback data (hardcoded)
- **Why**: Đảm bảo data luôn được lưu kể cả khi DB fail

#### 4. **Professional PDF Report Generator**
- **File**: `backend/src/application/ReportGenerator.js`
- **What**: Generate báo cáo chuẩn Consulting (McKinsey/BCG style)
- **Output**: HTML file (có thể print to PDF)
- **Style**: Executive summary, KPI metrics, forecast charts, strategic implications
- **API**: `POST /api/v1/dashboard/reports/generate`
- **Frontend Button**: "Export Report" trên Dashboard
- **Why**: Cung cấp báo cáo chuyên nghiệp cho stakeholders

### 🔧 Backend Changes

#### New Files Created:
- `src/infrastructure/data/NewsCrawler.js` - News crawler with keyword support
- `src/infrastructure/db/DatabaseAdapter.js` - Database abstraction
- `src/application/ReportGenerator.js` - Report generation service
- `test-news-api.js` - API testing script

#### Modified Files:
- `src/settings.js` - Added database configuration variables
- `src/application/NewsOrchestrator.js` - Hybrid storage logic, keyword support
- `src/api/routes/dashboard.routes.js` - Added `/reports/generate` endpoint

#### API Endpoints Added:
- `POST /api/v1/dashboard/news-refresh` (enhanced with keywords parameter)
- `POST /api/v1/dashboard/reports/generate`

### 🎨 Frontend Changes

#### New Components:
- `components/ModelArchitectureViewer.js` - LSTM layer visualization
- `components/LossCurveChart.js` - Training performance chart

#### Modified Components:
- `pages/dashboard.js` - Added news refresh + report export functionality
- `components/NewsWidget.js` - Added refresh button with loading state
- `pages/lstm-demo.js` - Integrated model viewer and loss chart

#### UI Enhancements:
- All pages follow consistent glassmorphism design
- Red-White-Black-Gray color theme maintained
- Micro-animations and smooth transitions

### 📚 Documentation Added

#### New Documentation Files:
- `PROJECT_GUIDE.md` - Complete system overview, architecture, data flow
- `TESTING_GUIDE.md` - Step-by-step testing instructions
- `CHANGELOG.md` (this file) - Change history
- `backend/ENV_CONFIG.md` - Environment variable examples (removed, merged into PROJECT_GUIDE)
- `backend/DATABASE_GUIDE.md` - Database setup guide (removed, merged into PROJECT_GUIDE)

#### Documentation Improvements:
- All code files have comprehensive JSDoc comments
- Inline comments explain complex logic
- README files updated with new features

### 🗄️ Data Management

#### Storage Policy Defined:
- **Raw staging data**: Auto-delete after 7 days
- **Historical data**: Permanent (Archive to cold storage after 3 years)
- **Forecast results**: Keep for 1 year

#### Data Flow:
```
News Module: Crawl → Filter by Keywords → AI Enhancement → DB/File → Display
Price Module: Upload → Preprocess → LSTM Inference → DB/File → Chart
Reports: Fetch Data → Generate HTML/PDF → Save to outputs/reports/
```

### 🐛 Bug Fixes
- Fixed duplicate routes in `dashboard.routes.js`
- Corrected missing imports in `NewsOrchestrator.js`
- Resolved syntax errors in route definitions

---

## [v0.2.0] - 2025-11-19

### Features
- LSTM Demo page with model configuration
- Market Insights page with sentiment analysis
- Price Chart with range selectors
- File upload for historical data

### Components
- Created glassmorphism UI components
- Implemented DashboardLayout with Sidebar/Topbar
- Added KPI cards and trend indicators

---

## [v0.1.0] - 2025-11-18

### Initial Release
- Basic dashboard structure
- Backend API scaffolding
- LSTM model integration (Python)
- Next.js frontend setup

---

## 🔜 Roadmap (Future Versions)

### v0.4.0 (Planned)
- [ ] Real-time news API integration (replace mock crawler)
- [ ] WebSocket for live price updates
- [ ] User authentication (JWT)
- [ ] Multi-language support (EN/VI)

### v0.5.0 (Planned)
- [ ] Advanced PDF with real Chart.js renders (using Puppeteer)
- [ ] Email report scheduling
- [ ] Historical forecast accuracy tracking
- [ ] A/B testing for different LSTM architectures

---

## 📦 Dependencies Added

### Backend
- `fs-extra@^11.0.0` - File system utilities
- `path` (built-in) - Path manipulation

### Frontend
(No new dependencies in this version)

---

## Migration Guide

### From v0.2.0 to v0.3.0

**Backend:**
1. Update `backend/src/settings.js` with new DB config variables
2. Create `backend/outputs/reports/` directory
3. Optional: Configure database in `.env`

**Frontend:**
1. Update `pages/dashboard.js` to use new `NewsWidget` props
2. No breaking changes for existing pages

**Database Migration:**
If switching to database from file-based:
1. Set `DB_TYPE` in `.env`
2. Run migration script (to be created) to import existing JSON data
3. Restart backend

---

## Contributors
- AI Development Team
- Tester: [Your Name]

---

## Support
For issues or questions, refer to:
- `TESTING_GUIDE.md` for testing procedures
- `PROJECT_GUIDE.md` for system architecture
- GitHub Issues (if applicable)
