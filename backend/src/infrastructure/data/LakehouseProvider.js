/**
 * INFRASTRUCTURE: Lakehouse Provider (Azure Fabric / SQL)
 *
 * Responsibility: Connect to Azure Fabric Lakehouse via SQL Endpoint
 * to fetch historical price data.
 */

import sql from 'mssql';
import { settings } from '../../settings.js';
import path from 'path';
import fs from 'fs-extra';
import { PublicClientApplication } from '@azure/msal-node';
import { exec } from 'child_process';

class LakehouseProvider {
    constructor() {
        this.authType = process.env.LAKEHOUSE_AUTH_TYPE || 'sql_login'; // 'sql_login' or 'device_code'

        // SQL Connection Config Base
        this.config = {
            server: process.env.LAKEHOUSE_SERVER || '',
            database: process.env.LAKEHOUSE_DATABASE || '',
            port: 1433,

            // Pool Configuration to handle Azure Gateway idle timeouts
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            },

            options: {
                encrypt: true,
                trustServerCertificate: true,
                connectTimeout: 60000,
                requestTimeout: 60000,
                enableArithAbort: true,
                // Force TDS 7.4 (Standard for Azure/Fabric)
                tdsVersion: '7_4'
            }
        };

        // MSAL Config for Device Code Flow
        if (this.authType === 'device_code') {
            this.msalConfig = {
                auth: {
                    clientId: '04b07795-8ddb-461a-bbee-02f9e1bf7b46', // Common CLI-usable Client ID (Azure CLI / Power BI)
                    authority: 'https://login.microsoftonline.com/organizations'
                }
            };
            this.pca = new PublicClientApplication(this.msalConfig);
        } else {
            // Fallback to SQL Authentication
            this.config.user = process.env.LAKEHOUSE_USER || '';
            this.config.password = process.env.LAKEHOUSE_PASSWORD || '';
            this.config.authentication = { type: 'default' };
        }

        this.auditLogPath = path.join(process.cwd(), 'data', 'audit_lakehouse.jsonl');
    }

    /**
     * Check if Lakehouse configuration is valid
     */
    isConfigured() {
        if (this.authType === 'device_code') {
            return this.config.server && this.config.database;
        }
        return (
            this.config.user &&
            this.config.password &&
            this.config.server &&
            this.config.database
        );
    }

    /**
     * Acquire Access Token via Device Code Flow
     * @private
     */
    async _acquireTokenWithDeviceCode(res = null) {
        // If we already have a valid token (cached in memory), return it
        if (this.accessToken) {
            return this.accessToken;
        }

        let responseSent = false;

        const deviceCodeRequest = {
            deviceCodeCallback: (response) => {
                const { userCode, verificationUri, message } = response;

                console.log('\n================================================================');
                console.log('⚠️  LAKEHOUSE AUTHENTICATION REQUIRED ⚠️');
                console.log(`CODE: ${userCode}`);
                console.log(`URL:  ${verificationUri}`);
                console.log('----------------------------------------------------------------');

                // If response object provided, send to Frontend
                if (res && !res.headersSent) {
                    res.status(200).json({
                        success: false, // Not a success yet, but action required
                        isAuthRequired: true,
                        userCode,
                        verificationUri,
                        message: "Authentication required. Please enter the code in the opened browser window."
                    });
                    responseSent = true;
                }

                // Attempt auto-open
                try {
                    const openCommand = `start ${verificationUri}`;
                    exec(openCommand, (err) => {
                        if (err) console.error('Failed to open browser automatically:', err.message);
                    });
                } catch (e) { /* ignore */ }
            },
            scopes: ["https://database.windows.net//.default"]
        };

        try {
            // This awaits until user completes login!
            const response = await this.pca.acquireTokenByDeviceCode(deviceCodeRequest);
            console.log(`[LakehouseProvider] Authenticated successfully as: ${response.account.username}`);

            // Cache the token
            this.accessToken = response.accessToken;

            // If we sent a response to frontend telling them to login, 
            // we should not try to connect now (request is closed).
            if (responseSent) {
                const e = new Error('AUTH_PENDING_RESPONSE_SENT');
                e.code = 'RESPONSE_SENT';
                throw e;
            }

            return this.accessToken;
        } catch (error) {
            if (error.code === 'RESPONSE_SENT') throw error;
            console.error('[LakehouseProvider] Device Code Auth failed:', error.message);
            throw error;
        }
    }

    /**
     * Fetch historical RCN prices from Lakehouse
     * Standardizes the output to match the upload file format (Date, Price)
     */
    /**
     * Fetch historical RCN prices from Lakehouse
     * Standardizes the output to match the upload file format (Date, Price)
     */
    async fetchHistoricalPrices(limit = 1000, res = null) {
        if (!this.isConfigured()) {
            throw new Error('Lakehouse credentials are not configured in environment variables.');
        }

        console.log(`[LakehouseProvider] Connecting to SQL Endpoint: ${this.config.server} (Port: ${this.config.port}) using ${this.authType}...`);

        let pool;
        try {
            // Handle Authentication Type
            if (this.authType === 'device_code') {
                const accessToken = await this._acquireTokenWithDeviceCode(res);
                this.config.authentication = {
                    type: 'azure-active-directory-access-token',
                    options: {
                        token: accessToken
                    }
                };
            }

            pool = await sql.connect(this.config);

            // Default query: Adjust table name based on actual schema
            const tableName = process.env.LAKEHOUSE_TABLE || 'dbo.market_prices';
            const dateColumn = 'date';
            const priceColumn = 'price';

            const query = `
        SELECT TOP (@limit) ${dateColumn} as Date, ${priceColumn} as Price 
        FROM ${tableName} 
        ORDER BY ${dateColumn} DESC
      `;

            console.log(`[LakehouseProvider] Executing query: ${query}`);

            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .query(query);

            console.log(`[LakehouseProvider] Fetched ${result.recordset.length} rows.`);

            // Transform to standard simplified format [ { Date: '...', Price: 123 }, ... ]
            // And reverse to be chronological (Oldest -> Newest) for LSTM Model
            const data = result.recordset
                .map(row => ({
                    Date: row.Date instanceof Date ? row.Date.toISOString().split('T')[0] : row.Date,
                    Price: Number(row.Price)
                }))
                .sort((a, b) => new Date(a.Date) - new Date(b.Date));

            return data;

        } catch (error) {
            if (error.code === 'RESPONSE_SENT') {
                return null;
            }
            console.error('[LakehouseProvider] Connection failed:', error.message);
            throw new Error(`Lakehouse Connection Error: ${error.message}`);
        } finally {
            if (pool) {
                await pool.close();
            }
        }
    }

    /**
     * Fetch data and save to a local CSV file
     * This mimics the file upload process so the existing LSTM pipeline works unchanged.
     */
    async fetchAndSaveToLocal(userId = 'system', limit = 1000, res = null) {
        const data = await this.fetchHistoricalPrices(limit, res);

        // If data is null, it means we sent an Auth Required response or handled it elsewhere
        if (!data) return null;

        if (data.length === 0) {
            throw new Error('No data found in Lakehouse table.');
        }

        // Define output path (simulating an uploaded file)
        const fileName = `lakehouse_sync_${userId}_${Date.now()}.csv`;
        const uploadDir = path.join(process.cwd(), 'data', 'raw', 'prices');
        await fs.ensureDir(uploadDir);

        const filePath = path.join(uploadDir, fileName);

        // Convert to CSV string manually or use a helper
        const header = 'Date,Price\n';
        const rows = data.map(d => `${d.Date},${d.Price}`).join('\n');

        await fs.writeFile(filePath, header + rows, 'utf8');

        console.log(`[LakehouseProvider] Saved sync data to ${filePath}`);

        // Audit Log
        await this._logAudit(userId, 'SYNC_SUCCESS', {
            rows: data.length,
            lastDate: data[data.length - 1].Date,
            file: fileName
        });

        return {
            filePath,
            fileName,
            totalRows: data.length,
            lastDate: data[data.length - 1].Date
        };
    }

    /**
     * Append log entry to audit file
     * @private
     */
    async _logAudit(user, action, metadata = {}) {
        try {
            const entry = {
                timestamp: new Date().toISOString(),
                user,
                action,
                metadata,
                source: 'LakehouseProvider'
            };
            await fs.ensureDir(path.dirname(this.auditLogPath));
            await fs.appendFile(this.auditLogPath, JSON.stringify(entry) + '\n', 'utf8');
        } catch (e) {
            console.error('[LakehouseProvider] Audit logging failed:', e.message);
        }
    }
}

const lakehouseProvider = new LakehouseProvider();
export default lakehouseProvider;
