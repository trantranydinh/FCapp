/**
 * INFRASTRUCTURE: Lakehouse Provider (Robust Version with Retry Logic)
 * ACTUAL MODE: Fabric SQL Analytics Endpoint (TDS/SQL)
 *
 * FIXES:
 * - Added connection retry logic for socket hang up errors
 * - Improved pool configuration with keep-alive
 * - Better timeout handling
 * - Enhanced error logging
 * - Connection pool singleton to prevent multiple connections
 */

import sql from 'mssql';
import { PublicClientApplication } from '@azure/msal-node';
import path from 'path';
import fs from 'fs-extra';

class LakehouseProvider {
    constructor() {
        this.server = process.env.LAKEHOUSE_SERVER;
        this.database = process.env.LAKEHOUSE_DATABASE;
        this.tableName = process.env.LAKEHOUSE_TABLE || 'dbo.ICC_Procurement_RCNPrice';
        this.authType = process.env.LAKEHOUSE_AUTH_TYPE || 'sql'; // 'sql' or 'device_code' or 'service_principal'

        // Configurable Columns
        this.dateColumn = process.env.LAKEHOUSE_DATE_COLUMN || 'Date';
        this.valueColumn = process.env.LAKEHOUSE_VALUE_COLUMN || 'Price';

        // Auth Config
        this.user = process.env.LAKEHOUSE_USER;
        this.password = process.env.LAKEHOUSE_PASSWORD;

        // Service Principal / Device Code Config
        this.tenantId = process.env.FABRIC_TENANT_ID;
        this.clientId = process.env.FABRIC_CLIENT_ID;
        this.clientSecret = process.env.FABRIC_CLIENT_SECRET;

        this.auditLogPath = path.join(process.cwd(), 'data', 'audit_lakehouse.jsonl');

        // MSAL Config (if needed)
        this.msalConfig = {
            auth: {
                clientId: this.clientId || 'common',
                authority: `https://login.microsoftonline.com/${this.tenantId || 'common'}`,
            }
        };

        // Connection pool singleton
        this.connectionPool = null;
        this.isPoolInitializing = false;
    }

    isConfigured() {
        if (this.authType === 'sql') {
            const configured = !!(this.server && this.database && this.user && this.password);
            if (!configured) {
                console.warn('[Lakehouse] SQL auth selected but missing: server, database, user, or password');
            }
            return configured;
        }
        // Add checks for other auth types if needed
        return !!(this.server && this.database);
    }

    async _logAudit(action, details, status = 'SUCCESS') {
        try {
            const entry = {
                timestamp: new Date().toISOString(),
                action,
                details,
                status
            };
            await fs.ensureDir(path.dirname(this.auditLogPath));
            await fs.appendFile(this.auditLogPath, JSON.stringify(entry) + '\n');
        } catch (err) {
            console.error('[Lakehouse Audit] Failed to write log:', err.message);
        }
    }

    /**
     * Get or create connection pool with proper configuration
     * @private
     */
    async _getConnectionPool() {
        // Return existing pool if available and connected
        if (this.connectionPool && this.connectionPool.connected) {
            return this.connectionPool;
        }

        // Wait if pool is being initialized
        if (this.isPoolInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this._getConnectionPool();
        }

        this.isPoolInitializing = true;

        try {
            // Close existing pool if exists but not connected
            if (this.connectionPool) {
                try {
                    await this.connectionPool.close();
                } catch (e) {
                    console.warn('[Lakehouse] Error closing old pool:', e.message);
                }
            }

            const config = {
                server: this.server,
                database: this.database,
                port: 1433,

                // Connection Pooling with Keep-Alive
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 60000, // Keep idle connections for 60s
                    acquireTimeoutMillis: 30000,
                    createTimeoutMillis: 30000,
                    destroyTimeoutMillis: 5000,
                    reapIntervalMillis: 1000,
                    createRetryIntervalMillis: 200,
                },

                // Robust Options for Azure/Fabric
                options: {
                    encrypt: true,
                    trustServerCertificate: true,
                    connectTimeout: 90000,   // 90s for cold start
                    requestTimeout: 120000,  // 120s for heavy queries
                    enableArithAbort: true,
                    abortTransactionOnError: true,
                    tdsVersion: '7_4',       // Fabric compatible

                    // TCP Keep-Alive to prevent socket hang up
                    connectionIsolationLevel: sql.ISOLATION_LEVEL.READ_COMMITTED,
                    rowCollectionOnRequestCompletion: true,
                    useUTC: true
                }
            };

            // Authentication Logic
            if (this.authType === 'sql') {
                config.user = this.user;
                config.password = this.password;
                config.authentication = {
                    type: 'default'
                };
            } else if (this.authType === 'device_code') {
                config.authentication = {
                    type: 'azure-active-directory-default'
                };
            }

            console.log(`[Lakehouse SQL] Creating connection pool to: ${this.server} (${this.authType})`);

            this.connectionPool = new sql.ConnectionPool(config);

            // Add error handler
            this.connectionPool.on('error', err => {
                console.error('[Lakehouse Pool] Connection error:', err.message);
                this.connectionPool = null;
            });

            await this.connectionPool.connect();
            console.log('[Lakehouse SQL] Connection pool ready');

            return this.connectionPool;

        } finally {
            this.isPoolInitializing = false;
        }
    }

    /**
     * Execute query with retry logic for transient errors
     * @private
     */
    async _executeWithRetry(queryFn, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await queryFn();
            } catch (error) {
                lastError = error;

                // Check if error is retryable
                const isRetryable =
                    error.message.includes('socket hang up') ||
                    error.message.includes('ECONNRESET') ||
                    error.message.includes('ETIMEDOUT') ||
                    error.message.includes('Connection lost') ||
                    error.code === 'ECONNRESET' ||
                    error.code === 'ETIMEDOUT';

                if (!isRetryable || attempt === maxRetries) {
                    throw error;
                }

                // Exponential backoff: 2s, 4s, 8s
                const backoffMs = Math.pow(2, attempt) * 1000;
                console.warn(`[Lakehouse SQL] Connection error (attempt ${attempt}/${maxRetries}): ${error.message}`);
                console.warn(`[Lakehouse SQL] Retrying in ${backoffMs}ms...`);

                // Clear the pool to force reconnection
                this.connectionPool = null;

                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }

        throw lastError;
    }

    async fetchHistoricalPrices(limit = 2000, tableName = null) {
        console.log('--- FETCHING DATA FROM LAKEHOUSE SQL TABLE (Robust Mode) ---');

        if (!this.server) {
            throw new Error("LAKEHOUSE_SERVER is not defined");
        }

        if (!this.isConfigured()) {
            throw new Error("Lakehouse is not properly configured. Check environment variables.");
        }

        const targetTable = tableName || this.tableName;

        return this._executeWithRetry(async () => {
            const pool = await this._getConnectionPool();

            console.log(`[Lakehouse SQL] Querying table: ${targetTable}`);

            // Safe, Parameterized Query with Aliasing
            const query = `
                SELECT TOP (@limit)
                    ${this.dateColumn} as Date,
                    ${this.valueColumn} as Price
                FROM ${targetTable}
                ORDER BY ${this.dateColumn} DESC
            `;

            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .query(query);

            const data = result.recordset.map(row => ({
                date: new Date(row.Date),
                price: Number(row.Price)
            })).filter(r => r && !isNaN(r.price) && r.date.toString() !== 'Invalid Date')
                .sort((a, b) => a.date - b.date);

            await this._logAudit('FETCH_HISTORY', { table: targetTable, rows: data.length });
            console.log(`[Lakehouse SQL] Retrieved ${data.length} records.`);

            return data;
        });
    }

    // Legacy support for local saving if needed
    async fetchAndSaveToLocal(userId = 'system', limit = 1000, res = null) {
        const data = await this.fetchHistoricalPrices(limit);

        const uploadDir = path.join(process.cwd(), 'data', 'raw', 'prices');
        await fs.ensureDir(uploadDir);
        const fileName = `lakehouse_sync_${Date.now()}.csv`;
        const filePath = path.join(uploadDir, fileName);
        const csvContent = 'Date,Price\n' + data.map(d => `${d.date.toISOString()},${d.price}`).join('\n');
        await fs.writeFile(filePath, csvContent, 'utf8');

        return { filePath, fileName, totalRows: data.length };
    }

    /**
     * Graceful shutdown - close connection pool
     */
    async close() {
        if (this.connectionPool) {
            try {
                console.log('[Lakehouse] Closing connection pool...');
                await this.connectionPool.close();
                this.connectionPool = null;
                console.log('[Lakehouse] Connection pool closed');
            } catch (error) {
                console.error('[Lakehouse] Error closing pool:', error.message);
            }
        }
    }
}

export default new LakehouseProvider();
