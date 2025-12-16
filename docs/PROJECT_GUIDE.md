# 📘 Cashew Forecast App - Project Guide

## 1. System Overview

This application is an AI-powered forecasting dashboard for the Cashew market, featuring:
- **Frontend**: Next.js, Tailwind CSS, Glassmorphism UI.
- **Backend**: Node.js (Express), Python (LSTM Models).
- **Database**: Flexible abstraction layer (PostgreSQL, MySQL, MongoDB, SQLite, or File-based).
- **AI**: LSTM for price prediction, LLM (optional) for market insights.

---

## 2. System Logic & Data Flow

### A. Market News Module
- **Logic**: Crawl tin tức từ nhiều nguồn -> Lọc theo từ khóa -> AI tóm tắt & đánh giá tác động -> Lưu DB -> Hiển thị Dashboard.
- **API Usage**:
  - `POST /api/v1/dashboard/news-refresh`: Trigger crawler (Input: keywords, limit).
  - `GET /api/v1/dashboard/news-summary`: Lấy tin đã xử lý để hiển thị.
- **Data Raw**:
  - Lưu tại: `backend/data/raw/news/` (JSON files theo ngày).
  - Database: Bảng `news_items`.
- **Hợp nhất**: Tin trùng lặp được lọc qua URL/Title similarity check.

### B. Price Forecast Module (LSTM)
- **Logic**: Upload Excel/CSV -> Tiền xử lý (Clean/Normalize) -> Chạy mô hình LSTM (Python) -> Generate Forecast -> Lưu kết quả.
- **API Usage**:
  - `POST /api/v1/price/upload`: Upload file giá lịch sử.
  - `POST /api/v1/lstm/run`: Chạy training/inference model.
  - `GET /api/v1/price/historical-data`: Lấy dữ liệu lịch sử để vẽ chart.
- **Data Raw**:
  - Lưu tại: `backend/data/raw/prices/` (File gốc người dùng upload).
  - Database: Bảng `market_prices` (Lịch sử), `forecasts` (Dự báo).

### C. Market Insights Module
- **Logic**: Tổng hợp dữ liệu giá + Tin tức -> LLM phân tích xu hướng -> Tạo báo cáo text.
- **API Usage**:
  - `GET /api/v1/dashboard/market-sentiment`: Lấy chỉ số cảm xúc thị trường.
- **Hợp nhất**: Kết hợp `Price Trend` (Quantitative) và `News Sentiment` (Qualitative).

---

## 3. Data Retention & Storage Policy

### Raw Data Storage
- **Location**: 
  - Local: `backend/data/raw/{module}/{YYYY-MM-DD}/`
  - Cloud (S3/Blob): `s3://cashew-raw-data/{module}/{YYYY-MM-DD}/`
- **Format**: JSON (News), CSV/XLSX (Prices).

### Retention Policy (Bao lâu xóa?)
1.  **Raw Staging Data** (File tạm upload, log crawl):
    - **Retention**: 7 ngày.
    - **Action**: Tự động xóa (Cron job).
2.  **Processed Historical Data** (Giá lịch sử, Tin tức đã lọc):
    - **Retention**: Vĩnh viễn (Permanent).
    - **Action**: Archive sang Cold Storage sau 3 năm.
3.  **Forecast Results** (Kết quả dự báo cũ):
    - **Retention**: 1 năm.
    - **Action**: Xóa để giảm tải DB, chỉ giữ lại metrics độ chính xác (Accuracy KPIs).

---

## 4. Reporting & Export Standards (Consulting Style)

### A. Individual Reports (Từng phần)
- **Format**: PDF (A4 Portrait).
- **Content**:
  1.  **Executive Summary**: 3-5 bullet points quan trọng nhất.
  2.  **Visuals**: Biểu đồ (Chart.js render) chiếm 40% diện tích.
  3.  **Data Table**: Top 10 rows dữ liệu chi tiết.
  4.  **AI Insights**: Nhận định xu hướng (Bullish/Bearish).

### B. Consolidated Report (Báo cáo tổng hợp)
- **Style**: McKinsey/BCG Professional Style.
- **Structure**:
  1.  **Cover Page**: Title, Date, "Confidential" watermark.
  2.  **Market Dashboard**: Heatmap thị trường + Key Metrics (Trend, Volatility).
  3.  **Price Forecast**: Biểu đồ giá 12 tháng tới + Confidence Intervals (Dải tin cậy).
  4.  **Strategic Implications**: Khuyến nghị hành động (Buy/Sell/Hold) dựa trên AI.
  5.  **Appendix**: Chi tiết kỹ thuật model LSTM (Architecture, Loss, Accuracy).

### C. Technical Implementation
- **Library**: `puppeteer` (Node.js) hoặc `reportlab` (Python) để generate PDF.
- **Template**: HTML/CSS Flexbox layout với High-resolution charts (SVG/Canvas).

---

## 5. Installation & Setup

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## 6. Database Configuration

The system uses a **Database Abstraction Layer**. You can switch databases just by changing the `.env` file.

### Option A: File-Based (Default)
```env
DB_TYPE=none
```

### Option B: PostgreSQL / MySQL (Production)
```env
DB_TYPE=postgresql
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=cashew_forecast
DB_USER=admin
DB_PASSWORD=secure_password
DB_SSL=true
```

---

## 7. Troubleshooting

- **Connection Refused**: Check firewall settings.
- **SSL Errors**: Set `DB_SSL=true` for cloud databases.
- **Missing Data**: Check `backend/data/` permissions.
