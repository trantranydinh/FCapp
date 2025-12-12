# Parity Tool Setup Guide

This guide explains how to set up the Parity Tool with MySQL database to enable calculation history.

## 📋 Prerequisites

1. **MySQL Server** installed and running
2. **Database** created (e.g., `cashew_db`)
3. **Tables** and **Stored Procedure** created
4. **Backend** configured with database credentials

---

## 🔧 Step 1: Configure Backend Database

### 1.1. Copy environment file

```bash
cd backend
cp .env.example .env
```

### 1.2. Edit `.env` file

```bash
# Required settings for Parity Tool
DB_TYPE="mysql"
DB_HOST="localhost"
DB_PORT=3306
DB_NAME="cashew_db"           # Your database name
DB_USER="your_mysql_user"      # Your MySQL username
DB_PASSWORD="your_password"    # Your MySQL password
```

---

## 🗄️ Step 2: Create Database Tables

You need these tables:

### Table 1: `PTool_origin_lookup_data`

This table stores lookup data for each origin (Vietnam, Cambodia, etc.)

```sql
CREATE TABLE PTool_origin_lookup_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    origin VARCHAR(50) NOT NULL,
    sales_price_isp_fob DECIMAL(15,4),
    market_price_fob DECIMAL(15,4),
    sea_freight DECIMAL(15,4),
    isp_yield_factor_per_kor_unit DECIMAL(15,6),
    total_yield_factor_per_kor_unit DECIMAL(15,6),
    shells_price_avg_year_usd_kg DECIMAL(15,4),
    non_isp_price_avg_year_usd_kg DECIMAL(15,4),
    total_cost_m_usd DECIMAL(15,6),
    var_fixed_cost_usd_mt_vietnam DECIMAL(15,4),
    rcn_volume_mt DECIMAL(15,2),
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_origin_current (origin, is_current)
);
```

### Table 2: `PTool_rcn_parity_calculations`

This table stores calculation history.

```sql
CREATE TABLE PTool_rcn_parity_calculations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id CHAR(36) NOT NULL,
    user_id INT DEFAULT 1,
    origin VARCHAR(50),
    rcnvolume DECIMAL(15,2),
    rcncfr DECIMAL(15,2),
    qualitykor DECIMAL(10,2),
    notes TEXT,
    formula_version VARCHAR(10),
    lookup_data_version VARCHAR(10),
    lookup_data_id INT,
    material_cost DECIMAL(20,2),
    rcn_fob_norm48KOR DECIMAL(15,4),
    isp_yield_2024_pct DECIMAL(20,6),
    total_yield_2024_pct DECIMAL(20,6),
    ck_generated_mt DECIMAL(20,6),
    non_isp_volume_generated DECIMAL(20,6),
    shells_volume_mt DECIMAL(20,6),
    shells_sale_revenue_usd DECIMAL(20,6),
    non_isp_sales_revenue_usd DECIMAL(20,6),
    isp_prices DECIMAL(20,6),
    total_revenue DECIMAL(20,6),
    proportional_cost_m_usd DECIMAL(20,6),
    impact_to_isp_usd DECIMAL(20,6),
    gm DECIMAL(20,6),
    operating_result DECIMAL(20,6),
    price_per_kg DECIMAL(20,6),
    price_per_lbs DECIMAL(20,6),
    snapshot_sales_price_isp_fob DECIMAL(15,4),
    snapshot_market_price_fob DECIMAL(15,4),
    snapshot_sea_freight DECIMAL(15,4),
    snapshot_isp_yield_factor DECIMAL(15,6),
    snapshot_total_yield_factor DECIMAL(15,6),
    snapshot_shells_price DECIMAL(15,4),
    snapshot_non_isp_price DECIMAL(15,4),
    snapshot_total_cost DECIMAL(15,6),
    snapshot_base_production_volume_mt DECIMAL(15,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_origin (origin)
);
```

---

## ⚙️ Step 3: Create Stored Procedure

You already have this stored procedure: `PTool_run_parity_v1_0`

If not created yet, run the SQL you provided earlier (the one starting with `CREATE DEFINER...`)

---

## 🌱 Step 4: Insert Sample Lookup Data

You need at least one row in `PTool_origin_lookup_data` for calculations to work.

```sql
-- Example for Vietnam
INSERT INTO PTool_origin_lookup_data (
    origin,
    sales_price_isp_fob,
    market_price_fob,
    sea_freight,
    isp_yield_factor_per_kor_unit,
    total_yield_factor_per_kor_unit,
    shells_price_avg_year_usd_kg,
    non_isp_price_avg_year_usd_kg,
    total_cost_m_usd,
    var_fixed_cost_usd_mt_vietnam,
    rcn_volume_mt,
    is_current
) VALUES (
    'vietnam',
    4.50,    -- sales_price_isp_fob
    4.30,    -- market_price_fob
    0.05,    -- sea_freight
    0.0104,  -- isp_yield_factor_per_kor_unit
    0.0130,  -- total_yield_factor_per_kor_unit
    0.20,    -- shells_price_avg_year_usd_kg
    2.80,    -- non_isp_price_avg_year_usd_kg
    12.5,    -- total_cost_m_usd
    162,     -- var_fixed_cost_usd_mt_vietnam
    77265,   -- rcn_volume_mt
    TRUE     -- is_current
);
```

**Important:** Update these values with real data from your business!

---

## 🚀 Step 5: Install Dependencies & Start Backend

```bash
cd backend

# Install mysql2 driver if not already installed
npm install mysql2

# Start backend
npm start
```

You should see:
```
[DatabaseAdapter] Connecting to mysql database...
[DatabaseAdapter] ✓ Connected to mysql
```

---

## ✅ Step 6: Test Parity Tool

### 6.1. Test Calculation

1. Open frontend: http://localhost:3000
2. Go to **Parity Tool** page
3. Fill in:
   - Origin: Vietnam
   - RCN CFR: 1500
   - Quality KOR: 48
4. Click **"Check"**
5. You should see: **Price Ck/lb** result

### 6.2. Test History

1. Click **"Detail"** button (with History icon)
2. You should see a table with your calculation history
3. Columns shown:
   - Time
   - Origin
   - RCN CFR
   - Quality KOR
   - Price Ck/lb

---

## 🔍 Troubleshooting

### Problem: "Database not connected"

**Solution:**
- Check `.env` file has correct MySQL credentials
- Check MySQL server is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`

### Problem: "Stored procedure not found"

**Solution:**
- Check procedure exists: `SHOW PROCEDURE STATUS WHERE Name = 'PTool_run_parity_v1_0';`
- If not found, run the CREATE PROCEDURE SQL you provided

### Problem: "Origin not found in lookup data"

**Solution:**
- Check lookup data exists: `SELECT * FROM PTool_origin_lookup_data WHERE origin = 'vietnam' AND is_current = TRUE;`
- If empty, insert sample data (Step 4)

### Problem: "History is empty"

**Solution:**
- You need to perform at least 1 successful calculation first
- Click "Check" → Then click "Detail"
- Check table has data: `SELECT COUNT(*) FROM PTool_rcn_parity_calculations;`

---

## 📊 Database Schema Summary

```
PTool_origin_lookup_data        PTool_rcn_parity_calculations
├── id (PK)                     ├── id (PK)
├── origin                      ├── session_id
├── sales_price_isp_fob         ├── origin
├── market_price_fob            ├── rcncfr
├── sea_freight                 ├── qualitykor
├── isp_yield_factor...         ├── price_per_lbs
├── total_yield_factor...       ├── price_per_kg
├── shells_price...             ├── gm
├── non_isp_price...            ├── operating_result
├── total_cost_m_usd            └── timestamp
├── is_current
└── created_at

        ↓ (used by)

PTool_run_parity_v1_0 (Stored Procedure)
├── INPUT: session_id, origin, rcnvolume, rcncfr, qualitykor, notes
├── READS: PTool_origin_lookup_data
└── WRITES: PTool_rcn_parity_calculations
```

---

## 🎯 Expected Workflow

1. **User fills form** → Origin, RCN CFR, Quality KOR
2. **User clicks "Check"** → Frontend calls `POST /api/v1/parity/calculate`
3. **Backend calls stored procedure** → `PTool_run_parity_v1_0(...)`
4. **Stored procedure**:
   - Reads lookup data from `PTool_origin_lookup_data`
   - Calculates Price Ck/lb using formulas
   - **Inserts result** into `PTool_rcn_parity_calculations`
5. **Backend returns result** → Frontend shows Price Ck/lb
6. **User clicks "Detail"** → Frontend calls `GET /api/v1/parity/history`
7. **Backend queries** `PTool_rcn_parity_calculations`
8. **History displayed** → Table with all past calculations

---

## 📝 Files Modified

- `backend/src/api/routes/parity.routes.js` - Added MySQL integration
- `backend/src/settings.js` - Added database settings
- `backend/.env.example` - Added database configuration template

---

## ✅ Checklist

- [ ] MySQL server installed and running
- [ ] Database created (e.g., `cashew_db`)
- [ ] Table `PTool_origin_lookup_data` created
- [ ] Table `PTool_rcn_parity_calculations` created
- [ ] Stored procedure `PTool_run_parity_v1_0` created
- [ ] Lookup data inserted (at least 1 origin)
- [ ] Backend `.env` file configured
- [ ] `npm install mysql2` executed
- [ ] Backend started successfully
- [ ] Test calculation works (Click "Check")
- [ ] Test history works (Click "Detail" shows data)

---

## 🎉 Success!

Once all steps are complete:
- ✅ Calculate button will save to database
- ✅ Detail button will show history
- ✅ History persists across sessions
- ✅ Multiple users can share history

Need help? Check backend logs for detailed error messages.
