/**
 * INFRASTRUCTURE: Lakehouse Provider
 * ACTUAL MODE: Fabric SQL Analytics Endpoint (TDS/SQL)
 */

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
    }

    isConfigured() {
        return !!(this.server && this.database && this.clientId && this.clientSecret);
    }

    _validateEnv() {
        const required = ['FABRIC_CLIENT_ID', 'FABRIC_CLIENT_SECRET', 'FABRIC_TENANT_ID', 'LAKEHOUSE_SERVER', 'LAKEHOUSE_DATABASE'];
        const missing = required.filter(k => !process.env[k]);
        if (missing.length) {
            throw new Error(`Lakehouse SQL Provider missing env vars: ${missing.join(', ')}`);
        }
    }

    async _getAccessToken() {
        try {
            const credential = new ClientSecretCredential(this.tenantId, this.clientId, this.clientSecret);
            // Scope cho Fabric SQL Endpoint thường là database.windows.net
            const tokenResponse = await credential.getToken('https://database.windows.net/.default');
            return tokenResponse.token;
        } catch (error) {
            console.error('[Lakehouse SQL] Auth Error:', error.message);
            throw new Error(`Failed to get Azure Access Token: ${error.message}`);
        }
    }

    async fetchHistoricalPrices(limit = 2000, tableName = null) {
        console.log('--- FETCHING DATA FROM LAKEHOUSE SQL TABLE ---');
        this._validateEnv();

        const targetTable = tableName || this.tableName;

        try {
            const accessToken = await this._getAccessToken();

            const config = {
                server: this.server,
                database: this.database,
                port: 1433,
                authentication: {
                    type: 'azure-active-directory-access-token',
                    options: {
                        token: accessToken
                    }
                },
                options: {
                    encrypt: true,
                    trustServerCertificate: true,
                    connectTimeout: 30000
                }
            };

            console.log(`[Lakehouse SQL] Connecting to: ${this.server}`);
            console.log(`[Lakehouse SQL] Querying Table: ${targetTable}`);

            const pool = await sql.connect(config);
            const query = `
                SELECT TOP (${limit}) * 
                FROM ${targetTable} 
                ORDER BY [Date] DESC
            `;

            const result = await pool.request().query(query);
            await pool.close();

            const rows = result.recordset;

            // Map and format data to match app structure
            const data = rows.map(row => {
                // Handle case-insensitive keys (Date/date, Price/price)
                const dateKey = Object.keys(row).find(k => k.toLowerCase() === 'date');
                const priceKey = Object.keys(row).find(k => k.toLowerCase() === 'price'); // Or 'ForecastPrice' 

                // For forecast tables, we might have different column names, but for now assuming Date/Price structure
                // or specific logic can be added here if schemas differ significantly.
                // Assuming standard schema for now.

                if (!dateKey) return null;

                // Flexible value key: Price, Forecast, or Value
                const valueKey = Object.keys(row).find(k => ['price', 'forecast', 'value'].includes(k.toLowerCase()));

                if (!valueKey) return null;

                return {
                    date: new Date(row[dateKey]),
                    price: Number(row[valueKey])
                };
            }).filter(r => r && !isNaN(r.price) && r.date.toString() !== 'Invalid Date')
                .sort((a, b) => a.date - b.date);

            console.log(`[Lakehouse SQL] Successfully retrieved ${data.length} records.`);
            return data;

        } catch (error) {
            console.error('[Lakehouse SQL] Error:', error.message);
            throw new Error(`Lakehouse SQL Access Error: ${error.message}`);
        }
    }

    async fetchAndSaveToLocal(userId = 'system', limit = 1000) {
        const data = await this.fetchHistoricalPrices(limit);
        const uploadDir = path.join(process.cwd(), 'data', 'raw', 'prices');
        await fs.ensureDir(uploadDir);

        const fileName = `lakehouse_sync_${Date.now()}.csv`;
        const filePath = path.join(uploadDir, fileName);

        // Export to CSV for Python model compatibility
        const csvContent = 'Date,Price\n' + data.map(d => `${d.date.toISOString()},${d.price}`).join('\n');
        await fs.writeFile(filePath, csvContent, 'utf8');

        return { filePath, fileName, totalRows: data.length };
    }
}

export default new LakehouseProvider();
