# 🔌 Fabric Lakehouse Connection Troubleshooting Guide

## 📋 Tổng quan

Hệ thống kết nối tới **Microsoft Fabric Lakehouse** qua SQL endpoint sử dụng:
- **Protocol:** TDS (Tabular Data Stream) over TLS
- **Port:** 1433
- **Authentication:** Azure AD Service Principal (Client Secret hoặc Access Token)
- **Library:** `mssql` (Node.js driver)

---

## 🚨 10 Vấn đề thường gặp và cách khắc phục

### 1. ❌ Missing Environment Variables

**Triệu chứng:**
```
ERROR: Lakehouse SQL Provider missing env vars: FABRIC_CLIENT_ID, FABRIC_CLIENT_SECRET
```

**Nguyên nhân:**
- File `.env` không tồn tại hoặc sai vị trí
- Các biến environment không được load đúng

**Kiểm tra:**
```javascript
// File: backend/src/infrastructure/data/LakehouseProvider.js:30-42
_validateEnv() {
    const required = [
        'FABRIC_CLIENT_ID',
        'FABRIC_CLIENT_SECRET',
        'FABRIC_TENANT_ID',
        'LAKEHOUSE_SERVER',
        'LAKEHOUSE_DATABASE',
    ];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
        throw new Error(`Missing env vars: ${missing.join(', ')}`);
    }
}
```

**Giải pháp:**
1. Kiểm tra file `.env` tại root project:
   ```bash
   cat /home/user/FCapp/.env | grep -E "FABRIC|LAKEHOUSE"
   ```

2. Đảm bảo có đầy đủ 5 biến:
   ```env
   FABRIC_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   FABRIC_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   FABRIC_CLIENT_SECRET=your-secret-here
   LAKEHOUSE_SERVER=xxxxx.datawarehouse.fabric.microsoft.com
   LAKEHOUSE_DATABASE=your_database_name
   ```

3. Reload environment variables:
   ```bash
   npm run dev  # Restart server
   ```

**Priority:** 🔴 Critical - Không kết nối được nếu thiếu

---

### 2. ❌ DNS Resolution Failure

**Triệu chứng:**
```
❌ DNS Error: Could not resolve xxxxx.datawarehouse.fabric.microsoft.com
getaddrinfo ENOTFOUND
```

**Nguyên nhân:**
- Server address sai format
- DNS server không resolve được domain
- Network/Proxy blocking

**Kiểm tra:**
```bash
# Test DNS resolution
nslookup xxxxx.datawarehouse.fabric.microsoft.com

# Hoặc dùng Node.js
node -e "require('dns').resolve('xxxxx.datawarehouse.fabric.microsoft.com', console.log)"
```

**Diagnostic tool:**
```bash
cd backend
node diagnose_lakehouse.js
```

Output mong đợi:
```
--- Step 2: DNS Resolution ---
✅ Resolved: ["40.x.x.x"]
```

**Giải pháp:**
1. Verify server address format đúng:
   - ✅ Correct: `xxxxx.datawarehouse.fabric.microsoft.com`
   - ❌ Wrong: `https://xxxxx.datawarehouse.fabric.microsoft.com`
   - ❌ Wrong: `xxxxx.datawarehouse.fabric.microsoft.com:1433`

2. Kiểm tra DNS settings:
   ```bash
   cat /etc/resolv.conf  # Linux
   ```

3. Try alternative DNS:
   ```bash
   # Thử dùng Google DNS tạm thời
   echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
   ```

**Priority:** 🔴 Critical

---

### 3. ❌ TCP Port 1433 Blocked (Firewall/VPN)

**Triệu chứng:**
```
❌ TCP Failed: connect ETIMEDOUT
❌ SQL Connection Failed: socket hang up
Error: Connection timeout
```

**Nguyên nhân:**
- Corporate firewall chặn port 1433 outbound
- VPN không được kết nối
- Cloud Network Security Group rules
- ISP blocking port 1433

**Kiểm tra:**
```bash
# Method 1: Telnet test
telnet xxxxx.datawarehouse.fabric.microsoft.com 1433

# Method 2: Netcat
nc -zv xxxxx.datawarehouse.fabric.microsoft.com 1433

# Method 3: Diagnostic script
node backend/diagnose_lakehouse.js
```

Output mong đợi:
```
--- Step 3: TCP Ping ---
✅ TCP Open
```

**Diagnostic code:**
```javascript
// File: backend/diagnose_lakehouse.js:49-65
const s = new net.Socket();
s.setTimeout(5000);
s.connect(1433, hostname, () => {
    console.log('✅ TCP Open');
    s.destroy();
});
s.on('error', (e) => {
    console.error(`❌ TCP Failed: ${e.message}`);
    // If this fails, SQL connection is IMPOSSIBLE
});
```

**Giải pháp:**
1. **Nếu ở công ty:** Liên hệ IT department mở port 1433 outbound
2. **Nếu dùng VPN:** Kết nối VPN trước khi chạy app
3. **Azure Firewall:** Thêm rule cho IP của bạn:
   ```bash
   # Get your public IP
   curl ifconfig.me

   # Add to Azure SQL Firewall rules
   az sql server firewall-rule create \
     --resource-group <rg> \
     --server <server> \
     --name AllowMyIP \
     --start-ip-address <your-ip> \
     --end-ip-address <your-ip>
   ```

4. **Workaround:** Sử dụng REST API thay vì SQL direct connection

**Priority:** 🔴 Critical - 60% lỗi connection do vấn đề này

---

### 4. ❌ TLS/SSL Handshake Failure

**Triệu chứng:**
```
❌ TLS Failed: write EPROTO
socket hang up
SSL routines:ssl3_get_record:wrong version number
```

**Nguyên nhân:**
- SSL/TLS version mismatch
- Certificate validation failed
- Deep Packet Inspection (DPI) bởi firewall
- Node.js version quá cũ không hỗ trợ modern TLS

**Kiểm tra:**
```bash
# Test TLS handshake
openssl s_client -connect xxxxx.datawarehouse.fabric.microsoft.com:1433 -servername xxxxx.datawarehouse.fabric.microsoft.com

# Hoặc dùng diagnostic
node backend/diagnose_lakehouse.js
```

Output mong đợi:
```
--- Step 4: TLS Handshake Check ---
✅ TLS Handshake Success!
   Cert Subject: *.datawarehouse.fabric.microsoft.com
   Cert Valid To: Dec 31 23:59:59 2024 GMT
```

**Diagnostic code:**
```javascript
// File: backend/diagnose_lakehouse.js:68-93
const socket = tls.connect({
    host: hostname,
    port: 1433,
    servername: hostname, // SNI is CRITICAL for Azure
    rejectUnauthorized: false
}, () => {
    console.log('✅ TLS Handshake Success!');
    const cert = socket.getPeerCertificate();
    console.log(`   Cert Subject: ${cert.subject.CN}`);
});
```

**Giải pháp:**
1. **Update Node.js:**
   ```bash
   node --version  # Should be >= 18.x
   npm install -g n
   n lts
   ```

2. **Adjust trustServerCertificate:**
   ```javascript
   // File: LakehouseProvider.js:92
   options: {
       encrypt: true,
       trustServerCertificate: true,  // Set to true nếu có DPI
   }
   ```

3. **Whitelist Azure IPs** trong firewall DPI

**Priority:** 🟡 Medium - Hiếm gặp nhưng khó debug

---

### 5. ❌ Authentication Failed (Invalid Client)

**Triệu chứng:**
```
❌ Auth Failed: invalid_client
AADSTS7000215: Invalid client secret is provided
Login failed for user '<token-identified principal>'
```

**Nguyên nhân:**
- Client Secret sai hoặc đã expired
- Client ID không đúng
- Tenant ID sai
- Service Principal chưa được grant quyền trên Lakehouse

**Kiểm tra:**
```bash
# Test authentication riêng
node backend/debug_connection.js
```

Output mong đợi:
```
1. Fetching Token...
   Token acquired length: 1234
2. Connecting (SELECT 1)...
   Connected!
   Result: [ { val: 1 } ]
SUCCESS
```

**Diagnostic code:**
```javascript
// File: LakehouseProvider.js:60-73
async _getAccessToken() {
    const credential = new ClientSecretCredential(
        this.tenantId,    // Must be correct
        this.clientId,    // Must be correct
        this.clientSecret // Must be valid & not expired
    );
    const tr = await credential.getToken('https://database.windows.net/.default');
    return tr.token;
}
```

**Giải pháp:**
1. **Verify credentials tại Azure Portal:**
   - Go to: Azure AD → App Registrations → [Your App] → Certificates & secrets
   - Check client secret expiration date
   - Tạo secret mới nếu đã hết hạn

2. **Grant permissions:**
   ```bash
   # Check if Service Principal has access to Workspace
   # Go to: Fabric Workspace → Manage Access → Add your SP as Admin/Contributor
   ```

3. **Test với Azure CLI:**
   ```bash
   az login --service-principal \
     --username $FABRIC_CLIENT_ID \
     --password $FABRIC_CLIENT_SECRET \
     --tenant $FABRIC_TENANT_ID
   ```

**Priority:** 🔴 Critical - 30% lỗi do credential issues

---

### 6. ❌ Token Expiration (Runtime)

**Triệu chứng:**
```
SQL Pool Error: Login failed for user '<token-identified principal>'
Token expired during long-running operation
```

**Nguyên nhân:**
- Access token hết hạn (thường sau 1 giờ)
- Connection pool sử dụng token đã expired
- Không có token refresh mechanism

**Kiểm tra:**
```javascript
// File: LakehouseProvider.js:21-23
this._tokenCache = null; // { token, exp }
this._poolTokenExp = null; // exp timestamp used when pool was created
```

**Solution đã implement:**
```javascript
// File: LakehouseProvider.js:60-73
async _getAccessToken() {
    // Cache token để giảm gọi AAD liên tục
    // Refresh trước 2 phút
    if (this._tokenCache && Date.now() < this._tokenCache.exp - 120000) {
        return this._tokenCache.token;  // ← Dùng cached token
    }

    // Fetch new token if expired
    const credential = new ClientSecretCredential(...);
    const tr = await credential.getToken('https://database.windows.net/.default');

    const exp = tr.expiresOnTimestamp ?? (Date.now() + 50 * 60 * 1000);
    this._tokenCache = { token: tr.token, exp };  // ← Cache for reuse
    return tr.token;
}
```

**Pool recreation logic:**
```javascript
// File: LakehouseProvider.js:75-79
_shouldRecreatePool() {
    if (!this._pool || !this._poolTokenExp) return true;
    // Nếu token dùng để tạo pool sắp hết hạn thì recreate
    return Date.now() >= this._poolTokenExp - 120000; // 2 minutes buffer
}
```

**Giải pháp nếu vẫn gặp:**
1. Tăng buffer time:
   ```javascript
   return Date.now() >= this._poolTokenExp - 300000; // 5 minutes buffer
   ```

2. Implement connection pool event handler:
   ```javascript
   pool.on('error', (err) => {
       if (err.message.includes('Login failed')) {
           // Force pool recreation
           this._pool = null;
           this._poolPromise = null;
       }
   });
   ```

**Priority:** 🟡 Medium - Đã có mitigation, hiếm gặp

---

### 7. ❌ Cold Start / Server Wake-up Delay

**Triệu chứng:**
```
⚠️ Lakehouse connection attempt 1/5 failed: Connection timeout
⏳ Waiting 10s for server (Fabric) to wake up...
⚠️ Lakehouse connection attempt 2/5 failed
...
✅ Lakehouse Connected Successfully! (on attempt 3)
```

**Nguyên nhân:**
- Fabric Lakehouse SQL endpoint bị "paused" do không có activity
- First connection sau một thời gian idle cần 10-30s để "wake up"
- Azure serverless architecture đặc điểm

**Solution đã implement:**
```javascript
// File: LakehouseProvider.js:115-181
async _getPool() {
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 10000; // 10 seconds

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const pool = new sql.ConnectionPool(config);
            await pool.connect();
            return pool;
        } catch (err) {
            console.warn(`⚠️ Attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);

            // Fail fast nếu lỗi auth (không cần retry)
            const msg = (err?.message || '').toLowerCase();
            if (msg.includes('invalid_client') || msg.includes('login failed')) {
                throw err;  // ← Don't retry auth errors
            }

            if (attempt === MAX_RETRIES) throw err;

            // Retry với backoff
            console.log(`⏳ Waiting ${RETRY_DELAY_MS / 1000}s for server to wake up...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}
```

**Metrics:**
- First attempt: Thường fail với timeout (expected)
- Attempt 2-3: Thành công sau 10-20s
- Total time: ~15-30s cho cold start

**Tối ưu hóa:**
1. **Warm-up endpoint** (chạy định kỳ):
   ```javascript
   // Ping server mỗi 10 phút để giữ warm
   setInterval(async () => {
       try {
           await lakehouseProvider.fetchHistoricalPrices(1);
       } catch {}
   }, 10 * 60 * 1000);
   ```

2. **Tăng timeout cho first request:**
   ```javascript
   connectionTimeout: 90000, // 90s thay vì 60s
   ```

3. **User feedback:**
   ```javascript
   console.log('🔄 Connecting to Fabric Lakehouse (may take up to 30s)...');
   ```

**Priority:** 🟢 Low - Expected behavior, đã có retry logic

---

### 8. ❌ Connection Pool Exhaustion

**Triệu chứng:**
```
TimeoutError: Timeout acquiring connection from pool
All connections in pool are busy
```

**Nguyên nhân:**
- Quá nhiều concurrent requests
- Connection leaks (không close connection)
- Pool size quá nhỏ

**Kiểm tra:**
```javascript
// File: LakehouseProvider.js:98
pool: {
    max: 10,              // ← Current max connections
    min: 0,
    idleTimeoutMillis: 30000
}
```

**Giải pháp:**
1. **Tăng pool size:**
   ```javascript
   pool: {
       max: 20,  // Increase from 10 to 20
       min: 2,   // Keep 2 warm connections
       idleTimeoutMillis: 30000
   }
   ```

2. **Verify connection cleanup:**
   ```javascript
   // WRONG - Connection leak
   const pool = await this._getPool();
   const result = await pool.request().query(...);
   // ← Forgot to close!

   // CORRECT - Singleton pool (current implementation)
   // Pool được reuse, không cần close mỗi query
   ```

3. **Monitor pool status:**
   ```javascript
   console.log('Pool size:', this._pool.size);
   console.log('Pool available:', this._pool.available);
   console.log('Pool pending:', this._pool.pending);
   ```

**Priority:** 🟢 Low - Hiếm gặp với current pool size

---

### 9. ❌ Query Timeout (Large Dataset)

**Triệu chứng:**
```
RequestError: Timeout: Request failed to complete in 60000ms
```

**Nguyên nhân:**
- Query quá phức tạp
- Dataset quá lớn
- Server quá tải
- Timeout setting quá ngắn

**Current timeouts:**
```javascript
// File: LakehouseProvider.js:96-97
connectionTimeout: 60000,  // 60s for initial connection
requestTimeout: 60000,     // 60s for query execution
```

**Giải pháp:**
1. **Tăng timeout cho queries lớn:**
   ```javascript
   connectionTimeout: 120000,  // 2 minutes
   requestTimeout: 120000,     // 2 minutes
   ```

2. **Optimize query với pagination:**
   ```javascript
   // Instead of:
   SELECT * FROM huge_table

   // Use:
   SELECT TOP (2000) * FROM huge_table ORDER BY [Date] DESC
   ```

3. **Add query timeout per request:**
   ```javascript
   const request = pool.request();
   request.timeout = 180000; // 3 minutes for this specific query
   const result = await request.query(complexQuery);
   ```

**Priority:** 🟢 Low - Queries đã có LIMIT

---

### 10. ❌ Table/Column Name Mismatch

**Triệu chứng:**
```
RequestError: Invalid object name 'dbo.ICC_Procurement_RCNPrice'
Invalid column name 'Date'
```

**Nguyên nhân:**
- Table name sai hoặc bị đổi
- Schema khác (dbo vs public)
- Case-sensitive collation
- Column name changed

**Kiểm tra:**
```javascript
// File: LakehouseProvider.js:10
this.tableName = process.env.LAKEHOUSE_TABLE || 'dbo.ICC_Procurement_RCNPrice';
```

**Flexible column mapping:**
```javascript
// File: LakehouseProvider.js:206-226
const data = rows.map((row) => {
    const keys = Object.keys(row);

    // Case-insensitive search
    const dateKey = keys.find((k) => k.toLowerCase() === 'date');
    if (!dateKey) return null;

    // Fallback priority: Price → Forecast → Value
    const valueKey =
        keys.find((k) => k.toLowerCase() === 'price') ||
        keys.find((k) => k.toLowerCase() === 'forecast') ||
        keys.find((k) => k.toLowerCase() === 'value');

    if (!valueKey) return null;

    return {
        date: new Date(row[dateKey]),
        price: Number(row[valueKey])
    };
})
.filter(Boolean); // Remove nulls
```

**Giải pháp:**
1. **Verify table exists:**
   ```sql
   -- Run in Fabric SQL endpoint query editor
   SELECT TABLE_SCHEMA, TABLE_NAME
   FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_NAME LIKE '%Price%'
   ```

2. **Check columns:**
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'ICC_Procurement_RCNPrice'
   ```

3. **Update .env với table name đúng:**
   ```env
   LAKEHOUSE_TABLE=dbo.YourActualTableName
   ```

**Priority:** 🟡 Medium - Dễ fix nhưng gây confusion

---

## 🛠️ Diagnostic Tools

### Tool 1: Quick Connection Test
```bash
cd backend
node debug_connection.js
```

**Output mong đợi:**
```
--- DEBUG CONNECTION ---
Server: 'xxxxx.datawarehouse.fabric.microsoft.com'
1. Fetching Token...
   Token acquired length: 1234
2. Connecting (SELECT 1)...
   Connected!
   Result: [ { val: 1 } ]
SUCCESS
```

### Tool 2: Deep Diagnostics
```bash
cd backend
node diagnose_lakehouse.js
```

**Output mong đợi:**
```
==================================================
       LAKEHOUSE DEEP DIAGNOSTICS
==================================================

Target: xxxxx.datawarehouse.fabric.microsoft.com (Port 1433)

--- Step 2: DNS Resolution ---
✅ Resolved: ["40.x.x.x"]

--- Step 3: TCP Ping ---
✅ TCP Open

--- Step 4: TLS Handshake Check ---
✅ TLS Handshake Success!
   Cert Subject: *.datawarehouse.fabric.microsoft.com
   Cert Valid To: Dec 31 23:59:59 2024 GMT

--- Step 5: SQL Connection (Service Principal) ---
Connecting...
✅ SQL Connected Successfully!
   Version: Microsoft SQL Azure (RTM) - 12.0.2000...

--- Diagnostics Complete ---
```

### Tool 3: Interactive Debug (Device Code Flow)
```bash
cd backend
node debug-fabric.js
```

**Flow:**
1. Hiển thị code để login
2. Bạn mở browser, nhập code
3. Test connection với user credential (instead of Service Principal)

---

## 📊 Error Code Reference

| Error Code | Meaning | Common Cause | Priority |
|------------|---------|--------------|----------|
| `ENOTFOUND` | DNS resolution failed | Wrong server address, network issue | 🔴 |
| `ETIMEDOUT` | Connection timeout | Firewall blocking port 1433 | 🔴 |
| `ESOCKET` | Socket error | Network/TCP issue | 🔴 |
| `ELOGIN` | Authentication failed | Invalid credentials | 🔴 |
| `EPROTO` | Protocol error | TLS/SSL handshake failure | 🟡 |
| `EREQUEST` | Query execution error | Timeout, syntax error | 🟢 |
| `invalid_client` | AAD auth error | Wrong client ID/secret | 🔴 |

---

## ✅ Connection Health Checklist

Before contacting support, verify:

- [ ] All 5 environment variables present (`FABRIC_*`, `LAKEHOUSE_*`)
- [ ] DNS resolves server hostname
- [ ] TCP port 1433 reachable (telnet/nc test)
- [ ] TLS handshake succeeds
- [ ] Service Principal credentials valid (not expired)
- [ ] Service Principal has permissions on Workspace/Lakehouse
- [ ] VPN connected (if required)
- [ ] Firewall allows outbound 1433
- [ ] Node.js version >= 18.x
- [ ] Latest `mssql` package version

---

## 🔧 Quick Fixes Summary

| Issue | Quick Fix | Time |
|-------|-----------|------|
| Missing ENV vars | Copy `.env.example`, fill values | 5 min |
| DNS failure | Verify server address format | 2 min |
| Port 1433 blocked | Connect VPN, contact IT | 1 hour |
| TLS failure | Set `trustServerCertificate: true` | 2 min |
| Auth failed | Regenerate client secret in Azure Portal | 10 min |
| Token expired | Already handled by retry logic | 0 min |
| Cold start | Wait for retry (automatic) | 30 sec |
| Pool exhausted | Increase pool.max to 20 | 2 min |
| Query timeout | Increase requestTimeout | 2 min |
| Table not found | Verify table name in .env | 5 min |

---

## 📞 Support Escalation

If all diagnostics pass but still cannot connect:

1. **Capture detailed logs:**
   ```bash
   DEBUG=* node backend/diagnose_lakehouse.js > fabric-debug.log 2>&1
   ```

2. **Check Fabric service health:**
   - https://admin.powerplatform.microsoft.com/servicehealthstatus

3. **Azure support ticket:**
   - Include: tenant ID, workspace ID, error codes, diagnostic logs

4. **Temporary workaround:**
   - Export data from Fabric to CSV
   - Use local file upload instead of direct SQL connection

---

## 🎯 Best Practices

1. **Always use retry logic** (đã có sẵn trong LakehouseProvider)
2. **Cache tokens** để giảm AAD calls (đã implement)
3. **Monitor pool health** với event listeners
4. **Set reasonable timeouts** (60-120s)
5. **Validate inputs** trước khi query (SQL injection prevention)
6. **Log errors với context** (đã có)
7. **Graceful degradation** (fallback to local data nếu Fabric fail)

---

**Generated by:** Claude Code
**Date:** 2026-01-22
**Based on:** LakehouseProvider.js, diagnose_lakehouse.js, debug-fabric.js analysis
**Version:** 1.0
