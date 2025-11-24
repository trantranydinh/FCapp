# 🎯 HƯỚNG DẪN TEST NHANH (Quick Test Guide)

## Bước 1: Khởi động Backend
```bash
cd C:\Users\nqtra\Downloads\FCapp\backend
npm run dev
```

**Chờ thấy:**
```
✓ Registered model: trend-v1
Mode: DEMO
📊 Dashboard: http://localhost:8000/api/v1/dashboard
```

---

## Bước 2: Khởi động Frontend (Terminal mới)
```bash
cd C:\Users\nqtra\Downloads\FCapp\frontend
npm run dev
```

**Chờ thấy:**
```
ready - started server on 0.0.0.0:3000
```

---

## Bước 3: Kiểm tra Backend hoạt động

### Test 1: Health Check
Mở trình duyệt: **http://localhost:8000/health**

**Kỳ vọng thấy:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T..."
}
```

### Test 2: News Crawler với Keywords
```bash
cd C:\Users\nqtra\Downloads\FCapp\backend
node test-news-api.js
```

**Kỳ vọng thấy:**
```
🧪 Testing News Crawler API...
📰 Test 1: Refresh news with keywords ["price", "supply"]
✅ Result: { "success": true, "count": 5 }
```

---

## Bước 4: Kiểm tra Frontend UI

Mở trình duyệt và test từng trang:

### 1. Dashboard - http://localhost:3000/dashboard
**Checklist:**
- [ ] Trang load không lỗi
- [ ] Có 4 KPI cards (Trend, Volatility, Confidence, Seasonality)
- [ ] Biểu đồ hiển thị
- [ ] News Widget có nút refresh (icon xoay tròn)
- [ ] Nút "Export Report" ở góc phải biểu đồ

**Action:** Click nút "Export Report"
- [ ] Thấy alert: "Report generated successfully!"
- [ ] Kiểm tra file tại: `C:\Users\nqtra\Downloads\FCapp\backend\outputs\reports\REPORT-[date]-[timestamp].html`

### 2. LSTM Demo - http://localhost:3000/lstm-demo
**Checklist:**
- [ ] Model Architecture Viewer hiển thị (Input → LSTM → Dropout → Dense)
- [ ] Loss Curve Chart có 2 đường (Training + Validation)
- [ ] Dropdown "Model Version" hoạt động
- [ ] Slider "Forecast Horizon" có thể kéo

### 3. Price Forecast - http://localhost:3000/price-forecast
**Checklist:**
- [ ] Range Selector có 5 nút (7D, 1M, 3M, 1Y, ALL)
- [ ] AI Insights panel hiển thị bên phải
- [ ] Nút Export CSV/PDF có sẵn

### 4. Market Insights - http://localhost:3000/market-insights
**Checklist:**
- [ ] Market Heatmap hiển thị
- [ ] Sentiment KPIs có dữ liệu

---

## Bước 5: Test Report Generator (Chi tiết)

### Method 1: Qua Frontend (Khuyến nghị)
1. Vào: http://localhost:3000/dashboard
2. Click nút **"Export Report"**
3. Chờ alert "Report generated successfully!"
4. Mở File Explorer → Navigate đến:
   ```
   C:\Users\nqtra\Downloads\FCapp\backend\outputs\reports\
   ```
5. Tìm file mới nhất: `REPORT-2025-11-20-[timestamp].html`
6. Click đúp file → Mở trong Chrome/Edge
7. **Kiểm tra nội dung:**
   - [ ] Header có logo "CashewAI Intelligence"
   - [ ] Executive Summary có 3 bullet points
   - [ ] Key Metrics: Current Price, Volatility, AI Confidence
   - [ ] Chart placeholder
   - [ ] Footer có timestamp

8. **Xuất PDF:**
   - Nhấn `Ctrl+P` (Print)
   - Chọn "Save as PDF"
   - Lưu file PDF

### Method 2: Qua PowerShell API
```powershell
$body = @{
  trend = "UP"
  confidence = 92
  currentPrice = 148.50
  priceChange = 2.5
  forecastPrice = 155.00
  volatility = "High"
  primaryDriver = "Vietnam harvest delays"
  recommendation = "Increase forward contracts"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/dashboard/reports/generate" -Method POST -Body $body -ContentType "application/json"
```

**Kỳ vọng response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "filePath": "C:\\...\\REPORT-2025-11-20-[timestamp].html",
    "fileName": "REPORT-2025-11-20-[timestamp].html"
  }
}
```

---

## Bước 6: Test Database Connection (Nếu đã config)

### Kiểm tra log khi khởi động backend:
```
[DatabaseAdapter] Connecting to postgresql database...
[DatabaseAdapter] ✓ Connected to postgresql
```

### Nếu KHÔNG config database:
```
[DatabaseAdapter] No database configured, using file-based storage
```

**Cả 2 trường hợp đều OK!** Hệ thống hoạt động được với file-based mode.

---

## ✅ Checklist Tổng

- [ ] Backend chạy không lỗi
- [ ] Frontend chạy không lỗi
- [ ] Health check pass
- [ ] News crawler test pass
- [ ] Dashboard load OK
- [ ] Export Report tạo file HTML
- [ ] HTML report mở được và có nội dung đẹp
- [ ] LSTM Demo có model viewer + loss chart
- [ ] Tất cả 4 trang frontend đều accessible

---

## 🐛 Nếu gặp lỗi

### Lỗi: "Cannot find module"
```bash
cd backend
rm -rf node_modules
npm install
```

### Lỗi: "Network Error" trên frontend
1. Kiểm tra backend có đang chạy không
2. Kiểm tra URL: http://localhost:8000/health

### Lỗi: "Port already in use"
```powershell
# Tìm process
netstat -ano | findstr :8000

# Kill process (thay PID)
taskkill /PID [PID] /F
```

---

## 📚 Đọc thêm

- **Chi tiết test**: Xem file `TESTING_GUIDE.md`
- **Kiến trúc hệ thống**: Xem file `PROJECT_GUIDE.md`
- **Thay đổi gần đây**: Xem file `CHANGELOG.md`

---

## ✨ Hoàn tất!

Nếu tất cả các bước trên PASS → Hệ thống hoạt động hoàn hảo!

Bạn có thể:
1. Xem file HTML report được gen ra
2. Test thêm các tính năng khác
3. Cấu hình database nếu cần (xem `PROJECT_GUIDE.md`)
