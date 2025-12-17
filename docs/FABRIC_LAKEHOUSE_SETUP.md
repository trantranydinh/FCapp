# 🔧 Azure Fabric Lakehouse Setup Guide

## Tổng Quan

Hướng dẫn này giúp bạn cấu hình kết nối từ Cashew Forecast System đến Azure Fabric Lakehouse để đồng bộ dữ liệu giá market tự động.

## 📋 Yêu Cầu

- Azure Fabric workspace với Lakehouse đã được tạo
- SQL Analytics Endpoint được bật trong Lakehouse
- Quyền truy cập vào workspace (ít nhất Viewer role)
- Table chứa dữ liệu giá (mặc định: `dbo.market_prices`)

## 🚀 Các Bước Cấu Hình

### Bước 1: Lấy Thông Tin Lakehouse

1. **Đăng nhập vào Azure Fabric Portal**
   - Truy cập: https://app.fabric.microsoft.com

2. **Mở Lakehouse của bạn**
   - Vào workspace
   - Chọn Lakehouse cần kết nối

3. **Lấy SQL Analytics Endpoint**
   - Click vào **SQL analytics endpoint** (ở menu bên trái)
   - Copy connection string từ phần **Server**
   - Format: `xxxxx.datawarehouse.fabric.microsoft.com`
   - ⚠️ **Không** bao gồm port (`,1433`) trong connection string

4. **Xác định Database và Table**
   - Database name: Thường là tên Lakehouse của bạn
   - Table name: Mặc định là `dbo.market_prices`
   - Schema table cần có: `date` (DATE) và `price` (DECIMAL/FLOAT)

### Bước 2: Cấu Hình Environment Variables

1. **Tạo file .env trong thư mục gốc của project**
   ```bash
   cd /path/to/FCapp
   cp .env.example .env
   ```

2. **Chỉnh sửa file .env**
   ```bash
   # Mở với editor yêu thích
   nano .env
   # hoặc
   code .env
   ```

3. **Điền các giá trị cần thiết**
   ```env
   # ========== AZURE FABRIC LAKEHOUSE ==========
   LAKEHOUSE_SERVER=your-lakehouse.datawarehouse.fabric.microsoft.com
   LAKEHOUSE_DATABASE=your_database_name
   LAKEHOUSE_TABLE=dbo.market_prices
   LAKEHOUSE_AUTH_TYPE=device_code
   ```

   **Ví dụ thực tế:**
   ```env
   LAKEHOUSE_SERVER=abc123xyz.datawarehouse.fabric.microsoft.com
   LAKEHOUSE_DATABASE=CashewMarketData
   LAKEHOUSE_TABLE=dbo.market_prices
   LAKEHOUSE_AUTH_TYPE=device_code
   ```

### Bước 3: Chọn Phương Thức Xác Thực

#### Option 1: Device Code Flow (Khuyến nghị)

Phương thức này sử dụng browser để login, dễ dùng nhất.

```env
LAKEHOUSE_AUTH_TYPE=device_code
```

Khi kết nối lần đầu:
1. Hệ thống sẽ hiển thị một mã code
2. Mở browser và truy cập URL được cung cấp
3. Nhập mã code
4. Đăng nhập với tài khoản Microsoft của bạn
5. Token sẽ được cache, không cần login lại mỗi lần

#### Option 2: SQL Login (Nếu được hỗ trợ)

```env
LAKEHOUSE_AUTH_TYPE=sql_login
LAKEHOUSE_USER=your_username
LAKEHOUSE_PASSWORD=your_password
```

⚠️ **Lưu ý:** Hầu hết Azure Fabric Lakehouse không hỗ trợ SQL authentication, chỉ hỗ trợ Azure AD.

### Bước 4: Kiểm Tra Kết Nối

Sử dụng script debug để test kết nối:

```bash
cd backend
node debug-fabric.js
```

**Kết quả mong đợi:**
```
=================================================
      DEBUGGING FABRIC LAKEHOUSE CONNECTION
=================================================

1. Checking Configuration...
   Server:   abc123xyz.datawarehouse.fabric.microsoft.com
   Database: CashewMarketData
   AuthType: device_code

2. Checking Network / DNS...
   ✅ DNS Resolved: abc123xyz.datawarehouse.fabric.microsoft.com -> 40.x.x.x

3. Authenticating (Device Code Flow)...
   ⚠️  ACTION REQUIRED:
      1. Go to: https://microsoft.com/devicelogin
      2. Enter Code: ABCD1234
      Waiting for you to login...

   ✅ Authenticated as: your.email@company.com

4. Connecting to SQL Endpoint...
   ✅ SQL Connection Established!

5. Testing Query...
   ✅ Query Success. Retrieved 5 rows.

🎉 DIAGNOSTICS COMPLETE: EVERYTHING LOOKS GOOD.
```

### Bước 5: Test Qua API

Khởi động backend và test endpoint:

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Test API
curl http://localhost:8000/api/v1/price/lakehouse-status
```

**Response nếu cấu hình đúng:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "authType": "device_code",
    "missing": [],
    "message": "Lakehouse is configured and ready to connect"
  }
}
```

**Response nếu thiếu config:**
```json
{
  "success": true,
  "data": {
    "configured": false,
    "authType": "device_code",
    "missing": ["LAKEHOUSE_SERVER", "LAKEHOUSE_DATABASE"],
    "message": "Missing required environment variables: LAKEHOUSE_SERVER, LAKEHOUSE_DATABASE"
  }
}
```

## 🔥 Troubleshooting

### Lỗi: "socket hang up"

**Nguyên nhân:**
- LAKEHOUSE_SERVER không đúng hoặc để trống
- Port 1433 bị firewall/VPN chặn
- Server không tồn tại hoặc không accessible

**Giải pháp:**
1. Kiểm tra lại LAKEHOUSE_SERVER trong .env
2. Đảm bảo không có port trong connection string
3. Test DNS resolution:
   ```bash
   nslookup your-lakehouse.datawarehouse.fabric.microsoft.com
   ```
4. Kiểm tra firewall/VPN
5. Thử ping:
   ```bash
   ping your-lakehouse.datawarehouse.fabric.microsoft.com
   ```

### Lỗi: "Connection timeout"

**Nguyên nhân:**
- Network chậm
- VPN không hoạt động
- Server overload

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Kết nối VPN nếu cần
3. Đợi vài phút rồi thử lại

### Lỗi: "Authentication failed"

**Nguyên nhân:**
- Device code login chưa hoàn thành
- Token hết hạn
- Không có quyền truy cập workspace

**Giải pháp:**
1. Hoàn thành device code login trong browser
2. Clear token cache và login lại
3. Kiểm tra quyền trong Azure Fabric workspace

### Lỗi: "Server not found (DNS resolution failed)"

**Nguyên nhân:**
- LAKEHOUSE_SERVER sai format
- Typo trong tên server

**Giải pháp:**
1. Double-check connection string từ Fabric portal
2. Đảm bảo format: `xxxxx.datawarehouse.fabric.microsoft.com`
3. Không có `https://` hoặc trailing `/`

### Lỗi: "Missing environment variables: LAKEHOUSE_SERVER, LAKEHOUSE_DATABASE"

**Nguyên nhân:**
- File .env không tồn tại
- File .env ở sai vị trí
- Biến để trống (empty string)

**Giải pháp:**
1. Tạo file .env từ .env.example
2. Đặt file .env ở thư mục gốc project (cùng cấp với backend/)
3. Điền đầy đủ giá trị, **không để trống**
4. Restart backend server

## 📊 Schema Table Yêu Cầu

Table trong Lakehouse cần có ít nhất 2 columns:

```sql
CREATE TABLE dbo.market_prices (
    date DATE NOT NULL,
    price DECIMAL(18, 2) NOT NULL,
    -- Optional additional columns
    volume INT,
    source VARCHAR(100)
);
```

**Ví dụ dữ liệu:**
```
date       | price
-----------|-------
2025-01-01 | 1250.50
2025-01-02 | 1248.75
2025-01-03 | 1255.00
```

## 🔄 Sử Dụng Sync Feature

Sau khi cấu hình xong, bạn có thể sync dữ liệu qua:

### Via API:
```bash
curl -X POST http://localhost:8000/api/v1/price/sync-lakehouse
```

### Via Frontend:
1. Mở dashboard
2. Click nút "Sync Lakehouse Data"
3. Đợi authentication nếu là lần đầu
4. Data sẽ được tải về và lưu local

## 📝 Best Practices

1. **Security:**
   - Không commit file .env vào git
   - Sử dụng .env.local cho development
   - Dùng Azure Key Vault cho production

2. **Performance:**
   - Giới hạn số rows sync (mặc định: 1000)
   - Schedule sync vào off-peak hours
   - Cache data locally để giảm API calls

3. **Monitoring:**
   - Check logs thường xuyên
   - Set up alerts cho connection failures
   - Monitor API quota/rate limits

## 🆘 Hỗ Trợ

Nếu vẫn gặp vấn đề:
1. Check logs trong `backend/logs/`
2. Run debug script: `node backend/debug-fabric.js`
3. Kiểm tra Azure Fabric service health
4. Liên hệ admin của Fabric workspace

## 📚 Tài Liệu Tham Khảo

- [Azure Fabric Documentation](https://learn.microsoft.com/en-us/fabric/)
- [SQL Analytics Endpoint](https://learn.microsoft.com/en-us/fabric/data-warehouse/connectivity)
- [Device Code Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-device-code)
