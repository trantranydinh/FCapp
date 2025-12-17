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
                // Reduced timeouts for faster error detection
                connectTimeout: 15000, // 15 seconds (was 60s)
                requestTimeout: 30000, // 30 seconds (was 60s)
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
     * Returns true if all required configs are set (not empty)
     */
    isConfigured() {
        // Helper to check if a value is truly set (not empty/whitespace)
        const isSet = (value) => value && String(value).trim().length > 0;

        if (this.authType === 'device_code') {
            return isSet(this.config.server) && isSet(this.config.database);
        }
        return (
            isSet(this.config.user) &&
            isSet(this.config.password) &&
            isSet(this.config.server) &&
            isSet(this.config.database)
        );
    }

    /**
     * Get detailed configuration status for debugging
     * @returns {Object} Configuration status with missing fields
     */
    getConfigStatus() {
        const isSet = (value) => value && String(value).trim().length > 0;

        const status = {
            configured: false,
            authType: this.authType,
            missing: []
        };

        if (!isSet(this.config.server)) status.missing.push('LAKEHOUSE_SERVER');
        if (!isSet(this.config.database)) status.missing.push('LAKEHOUSE_DATABASE');

        if (this.authType === 'sql_login') {
            if (!isSet(this.config.user)) status.missing.push('LAKEHOUSE_USER');
            if (!isSet(this.config.password)) status.missing.push('LAKEHOUSE_PASSWORD');
        }

        status.configured = status.missing.length === 0;
        return status;
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
        // Check configuration with detailed status
        const configStatus = this.getConfigStatus();

        if (!configStatus.configured) {
            const missingVars = configStatus.missing.join(', ');
            const errorMsg = `Lakehouse configuration incomplete. Missing environment variables: ${missingVars}\n` +
                           `Please check your .env file and ensure these values are set.\n` +
                           `See .env.example for configuration instructions.`;

            console.error(`[LakehouseProvider] ❌ Configuration Error:`);
            console.error(`   Missing: ${missingVars}`);
            console.error(`   Auth Type: ${configStatus.authType}`);
            console.error(`   Hint: Copy .env.example to .env and fill in your Fabric Lakehouse details`);

            throw new Error(errorMsg);
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

            // Enhanced error messages for common issues
            let errorMsg = error.message;
            let troubleshootingHints = [];

            if (error.message.includes('socket hang up') || error.message.includes('ESOCKET')) {
                errorMsg = 'Connection lost - socket hang up';
                troubleshootingHints = [
                    'Check if LAKEHOUSE_SERVER is correct (format: xxxxx.datawarehouse.fabric.microsoft.com)',
                    'Verify network connectivity to Azure Fabric',
                    'Ensure port 1433 is not blocked by firewall/VPN',
                    'Confirm your Azure Fabric Lakehouse is running and accessible',
                    'Check if SQL endpoint is enabled in your Lakehouse settings'
                ];
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMsg = 'Connection timeout';
                troubleshootingHints = [
                    'Server took too long to respond (>15 seconds)',
                    'Check your network connection',
                    'Verify VPN connection if required',
                    'Confirm the server address is reachable'
                ];
            } else if (error.message.includes('Login failed') || error.message.includes('authentication')) {
                errorMsg = 'Authentication failed';
                troubleshootingHints = [
                    'Verify your credentials are correct',
                    'Check if device code authentication completed successfully',
                    'Ensure you have proper permissions in Azure Fabric'
                ];
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
                errorMsg = 'Server not found (DNS resolution failed)';
                troubleshootingHints = [
                    'LAKEHOUSE_SERVER address may be incorrect',
                    'Check for typos in the server address',
                    'Verify the format: xxxxx.datawarehouse.fabric.microsoft.com'
                ];
            }

            console.error('[LakehouseProvider] ❌ Connection Failed');
            console.error(`   Error: ${errorMsg}`);
            console.error(`   Server: ${this.config.server}`);
            console.error(`   Database: ${this.config.database}`);
            console.error(`   Port: ${this.config.port}`);
            console.error(`   Auth Type: ${this.authType}`);

            if (troubleshootingHints.length > 0) {
                console.error('\n   Troubleshooting:');
                troubleshootingHints.forEach((hint, i) => {
                    console.error(`   ${i + 1}. ${hint}`);
                });
            }

            console.error(`\n   Original Error: ${error.message}`);

            throw new Error(`Lakehouse Error: ${errorMsg}`);
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
