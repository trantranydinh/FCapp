# Hướng dẫn sửa lỗi Database Connection Timeout

## 🔴 Vấn đề hiện tại

Từ debug output, các cấu hình database hiện tại là:
- **DB_TYPE**: `none` ❌ (Nên là `mysql`)
- **DB_HOST**: `localhost` ⚠️ (Mặc định)
- **DB_PORT**: `5432` ❌ (Đây là port của PostgreSQL, MySQL dùng `3306`)
- **DB_USER**: (trống) ❌ (Cần có username)
- **DB_PASSWORD**: (không kiểm tra được)

## ✅ Giải pháp

### Bước 1: Mở file `.env` trong folder `backend`
File này đã có sẵn tại: `c:\Users\Trang.Nguyen\1. Project_AI\FCapp\backend\.env`

### Bước 2: Kiểm tra và sửa các biến sau

#### **Bắt buộc phải có:**
```env
DB_TYPE=mysql
DB_HOST=<địa_chỉ_mysql_server>    # localhost hoặc IP server
DB_PORT=3306                        # Port MySQL (không phải 5432)
DB_USER=<username>                  # MySQL username
DB_PASSWORD=<password>              # MySQL password
DB_NAME=<tên_database>              # Tên database đã tạo
```

#### **Tùy chọn (nếu cần SSL):**
```env
DB_SSL=false                        # Hoặc true nếu MySQL yêu cầu SSL
```

### Bước 3: Ví dụ cấu hình mẫu

**Trường hợp 1: MySQL local (localhost)**
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=cashew_forecast
DB_SSL=false
```

**Trường hợp 2: MySQL trên server từ xa**
```env
DB_TYPE=mysql
DB_HOST=192.168.1.100
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=secure_password_123
DB_NAME=parity_tool_db
DB_SSL=true
```

### Bước 4: Restart backend server

Sau khi sửa file `.env`, restart lại server:
1. Nhấn `Ctrl+C` trong terminal đang chạy backend
2. Chạy lại: `npm run dev`

## 🔍 Kiểm tra kết quả

Chạy lại debug script để xác nhận:
```bash
cd backend
node src/debug_settings.js
```

Kết quả mong đợi:
```
--- DEBUG SETTINGS ---
DB Type: mysql         ✅
DB Host: localhost     ✅
DB Port: 3306         ✅
DB User: your_user    ✅
--- END DEBUG ---
```

## ⚠️ Lưu ý quan trọng

1. **Đảm bảo MySQL server đang chạy** và có thể kết nối được
2. **Port 3306** phải mở (không bị firewall chặn)
3. **Database đã được tạo** trước khi chạy ứng dụng
4. **User có quyền truy cập** database đó
5. Nếu dùng remote MySQL, kiểm tra **network connectivity**

## 🚨 Các lỗi thường gặp

### `ETIMEDOUT`
- MySQL server không chạy
- Host/Port sai
- Firewall chặn kết nối
- Network không thể kết nối đến server

### `Access denied`
- Username/Password sai
- User không có quyền truy cập database

### `Unknown database`
- Database chưa được tạo
- Tên database sai

## 📞 Cần trợ giúp thêm?

Nếu vẫn gặp lỗi sau khi cấu hình:
1. Kiểm tra MySQL server có đang chạy: `mysql -u <user> -p`
2. Test connection: `telnet <host> 3306`
3. Xem log backend để biết lỗi chi tiết
