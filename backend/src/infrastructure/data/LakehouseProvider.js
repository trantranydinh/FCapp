import sql from 'mssql';
import { ClientSecretCredential } from '@azure/identity';
import path from 'path';
import fs from 'fs-extra';

class LakehouseProvider {
    constructor() {
        this.server = process.env.LAKEHOUSE_SERVER;
        this.database = process.env.LAKEHOUSE_DATABASE;
        this.tableName = process.env.LAKEHOUSE_TABLE || 'dbo.ICC_Procurement_RCNPrice';

        this.tenantId = process.env.FABRIC_TENANT_ID;
        this.clientId = process.env.FABRIC_CLIENT_ID;
        this.clientSecret = process.env.FABRIC_CLIENT_SECRET;

        this.auditLogPath = path.join(process.cwd(), 'data', 'audit_lakehouse.jsonl');

        this._poolPromise = null;
        this._pool = null;

        // Token cache
        this._tokenCache = null; // { token, exp }
        this._poolTokenExp = null; // exp timestamp used when pool was created
    }

    isConfigured() {
        return !!(this.server && this.database && this.tenantId && this.clientId && this.clientSecret);
    }

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
            throw new Error(`Lakehouse SQL Provider missing env vars: ${missing.join(', ')}`);
        }
    }

    _sanitizeLimit(limit, fallback = 2000, max = 5000) {
        const n = Number(limit);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(1, Math.min(max, Math.floor(n)));
    }

    // Basic hardening to avoid obvious SQL injection when tableName is passed in.
    // Best practice: DO NOT accept tableName from user input; use whitelist if needed.
    _sanitizeTableName(tableName) {
        const t = tableName || this.tableName;
        // allow schema.table, brackets, underscore
        const ok = /^[\w\.\[\]]+$/.test(t);
        if (!ok) throw new Error(`Invalid table name: ${t}`);
        return t;
    }

    async _getAccessToken() {
        // Cache token để giảm gọi AAD liên tục
        // refresh trước 2 phút
        if (this._tokenCache && Date.now() < this._tokenCache.exp - 120000) {
            return this._tokenCache.token;
        }

        const credential = new ClientSecretCredential(this.tenantId, this.clientId, this.clientSecret);
        const tr = await credential.getToken('https://database.windows.net/.default');

        const exp = tr.expiresOnTimestamp ?? (Date.now() + 50 * 60 * 1000);
        this._tokenCache = { token: tr.token, exp };
        return tr.token;
    }

    _shouldRecreatePool() {
        if (!this._pool || !this._poolTokenExp) return true;
        // Nếu token dùng để tạo pool sắp hết hạn thì recreate
        return Date.now() >= this._poolTokenExp - 120000; // 2 minutes buffer
    }

    _buildConfig(accessToken) {
        return {
            server: this.server,
            database: this.database,
            port: 1433,
            authentication: {
                type: 'azure-active-directory-access-token',
                options: { token: accessToken },
            },
            options: {
                encrypt: true,
                trustServerCertificate: false, // recommended
                enableArithAbort: true,
            },
            // timeouts must be top-level in mssql
            connectionTimeout: 60000,
            requestTimeout: 60000,
            pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
        };
    }

    async _getPool() {
        // Nếu đã có pool promise và token vẫn “ok” thì dùng lại
        if (this._poolPromise && !this._shouldRecreatePool()) return this._poolPromise;

        // Nếu token sắp hết hạn mà đang có pool -> đóng pool và tạo lại
        if (this._pool && this._shouldRecreatePool()) {
            try {
                await this._pool.close();
            } catch { }
            this._pool = null;
            this._poolPromise = null;
        }

        this._poolPromise = (async () => {
            const MAX_RETRIES = 5;
            const RETRY_DELAY_MS = 10000;

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const token = await this._getAccessToken();
                    const config = this._buildConfig(token);

                    const pool = new sql.ConnectionPool(config);

                    pool.on('error', (err) => {
                        console.error('❌ SQL Pool Error:', {
                            message: err?.message,
                            code: err?.code,
                            number: err?.number,
                            original: err?.originalError?.message,
                        });
                        this._poolPromise = null;
                        this._pool = null;
                        this._poolTokenExp = null;
                    });

                    await pool.connect();

                    this._pool = pool;
                    this._poolTokenExp = this._tokenCache?.exp ?? null;

                    console.log('✅ Lakehouse Connected Successfully! (Access Token)');
                    return pool;
                } catch (err) {
                    const info = {
                        message: err?.message,
                        code: err?.code,
                        number: err?.number,
                        original: err?.originalError?.message,
                    };

                    console.warn(`⚠️ Lakehouse connection attempt ${attempt}/${MAX_RETRIES} failed:`, info);

                    // Fail fast nếu lỗi auth/config rõ ràng
                    const msg = (err?.message || '').toLowerCase();
                    const isAuthLikely =
                        msg.includes('invalid_client') ||
                        msg.includes('unauthorized') ||
                        msg.includes('login failed') ||
                        msg.includes('aad') && msg.includes('error');

                    if (isAuthLikely) {
                        this._poolPromise = null;
                        this._pool = null;
                        this._poolTokenExp = null;
                        throw err;
                    }

                    if (attempt === MAX_RETRIES) {
                        this._poolPromise = null;
                        this._pool = null;
                        this._poolTokenExp = null;
                        throw err;
                    }

                    console.log(`⏳ Waiting ${RETRY_DELAY_MS / 1000}s for server (Fabric) to wake up...`);
                    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                }
            }
        })();

        return this._poolPromise;
    }

    async fetchHistoricalPrices(limit = 2000, tableName = null) {
        console.log('--- FETCHING DATA FROM LAKEHOUSE SQL TABLE ---');
        this._validateEnv();

        const safeLimit = this._sanitizeLimit(limit);
        const targetTable = this._sanitizeTableName(tableName);

        const pool = await this._getPool();

        const query = `
      SELECT TOP (${safeLimit}) *
      FROM ${targetTable}
      ORDER BY [Date] DESC
    `;

        const result = await pool.request().query(query);
        const rows = result.recordset ?? [];

        // Map giống file 2: output {date, price}
        const data = rows
            .map((row) => {
                const keys = Object.keys(row);

                const dateKey = keys.find((k) => k.toLowerCase() === 'date');
                if (!dateKey) return null;

                // ưu tiên Price, nếu không có thì fallback Forecast/Value
                const valueKey =
                    keys.find((k) => k.toLowerCase() === 'price') ||
                    keys.find((k) => k.toLowerCase() === 'forecast') ||
                    keys.find((k) => k.toLowerCase() === 'value');

                if (!valueKey) return null;

                const d = new Date(row[dateKey]);
                const p = Number(row[valueKey]);

                if (d.toString() === 'Invalid Date' || Number.isNaN(p)) return null;

                return { date: d, price: p };
            })
            .filter(Boolean)
            .sort((a, b) => a.date - b.date);

        console.log(`[Lakehouse SQL] Successfully retrieved ${data.length} records.`);
        return data;
    }

    async fetchAndSaveToLocal(userId = 'system', limit = 1000) {
        const data = await this.fetchHistoricalPrices(limit);

        const uploadDir = path.join(process.cwd(), 'data', 'raw', 'prices');
        await fs.ensureDir(uploadDir);

        const fileName = `lakehouse_sync_${Date.now()}.csv`;
        const filePath = path.join(uploadDir, fileName);

        const csvContent = 'Date,Price\n' + data.map((d) => `${d.date.toISOString()},${d.price}`).join('\n');
        await fs.writeFile(filePath, csvContent, 'utf8');

        // (Optional) audit log jsonl
        try {
            await fs.ensureDir(path.dirname(this.auditLogPath));
            await fs.appendFile(
                this.auditLogPath,
                JSON.stringify({
                    ts: new Date().toISOString(),
                    userId,
                    action: 'fetchAndSaveToLocal',
                    rows: data.length,
                    fileName,
                }) + '\n',
                'utf8'
            );
        } catch { }

        return { filePath, fileName, totalRows: data.length };
    }

    async fetchForecastResults(limit = 90, tableName = null) {
        console.log('--- FETCHING FORECAST FROM LAKEHOUSE SQL TABLE ---');
        this._validateEnv();

        const safeLimit = this._sanitizeLimit(limit);
        const targetTable = this._sanitizeTableName(tableName || process.env.LAKEHOUSE_FORECAST_TABLE || 'dbo.ICC_Procurement_Forecast');

        const pool = await this._getPool();

        // Forecast often looks forward, so we might want ASC order from today
        const query = `
      SELECT TOP (${safeLimit}) *
      FROM ${targetTable}
      ORDER BY [Date] ASC
    `;

        const result = await pool.request().query(query);
        const rows = result.recordset ?? [];

        // Map to standard format
        const data = rows
            .map((row) => {
                const keys = Object.keys(row);

                const dateKey = keys.find((k) => k.toLowerCase() === 'date');
                if (!dateKey) return null;

                // Look for price or forecast value
                const valueKey =
                    keys.find((k) => k.toLowerCase() === 'price') ||
                    keys.find((k) => k.toLowerCase() === 'forecast') ||
                    keys.find((k) => k.toLowerCase() === 'value');

                if (!valueKey) return null;

                const d = new Date(row[dateKey]);
                const p = Number(row[valueKey]);

                if (d.toString() === 'Invalid Date' || Number.isNaN(p)) return null;

                // Look for bounds if available
                const lowerKey = keys.find((k) => k.toLowerCase().includes('lower'));
                const upperKey = keys.find((k) => k.toLowerCase().includes('upper'));

                return {
                    date: d,
                    price: p,
                    lower_bound: lowerKey ? Number(row[lowerKey]) : p * 0.95, // Default 5% band
                    upper_bound: upperKey ? Number(row[upperKey]) : p * 1.05
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.date - b.date); // Ensure ASC sort

        console.log(`[Lakehouse SQL] Successfully retrieved ${data.length} forecast records.`);
        return data;
    }

    async close() {
        try {
            await this._pool?.close();
        } catch { }
        try {
            await sql.close();
        } catch { }
        this._pool = null;
        this._poolPromise = null;
        this._poolTokenExp = null;
    }
}

export default new LakehouseProvider();
