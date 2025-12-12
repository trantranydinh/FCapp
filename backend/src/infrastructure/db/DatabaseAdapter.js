/**
 * DATABASE ABSTRACTION LAYER
 * 
 * Purpose: Provide a unified interface for database operations
 * Supports: PostgreSQL, MySQL, SQLite, MongoDB
 * 
 * This abstraction allows easy switching between:
 * - Cloud databases (AWS RDS, Azure SQL, Google Cloud SQL)
 * - Physical servers
 * - Local development databases
 */

import { settings } from '../../settings.js';

class DatabaseAdapter {
    constructor() {
        this.connection = null;
        this.dbType = settings.dbType || 'none';
        this.isConnected = false;
    }

    /**
     * Initialize database connection
     * @returns {Promise<boolean>} Connection success status
     */
    async connect() {
        console.log(`[DatabaseAdapter] Connecting to ${this.dbType} database...`);

        try {
            switch (this.dbType) {
                case 'postgresql':
                    await this._connectPostgreSQL();
                    break;
                case 'mysql':
                    await this._connectMySQL();
                    break;
                case 'sqlite':
                    await this._connectSQLite();
                    break;
                case 'mongodb':
                    await this._connectMongoDB();
                    break;
                case 'none':
                    console.log('[DatabaseAdapter] No database configured, using file-based storage');
                    this.isConnected = true;
                    return true;
                default:
                    throw new Error(`Unsupported database type: ${this.dbType}`);
            }

            this.isConnected = true;
            console.log(`[DatabaseAdapter] ✓ Connected to ${this.dbType}`);
            return true;

        } catch (error) {
            console.error(`[DatabaseAdapter] Connection failed:`, error.message);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        if (!this.isConnected) return;

        try {
            if (this.connection && typeof this.connection.end === 'function') {
                await this.connection.end();
            } else if (this.connection && typeof this.connection.close === 'function') {
                await this.connection.close();
            }

            this.isConnected = false;
            console.log('[DatabaseAdapter] Disconnected');
        } catch (error) {
            console.error('[DatabaseAdapter] Disconnect error:', error.message);
        }
    }

    /**
     * Execute a query (SQL databases)
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<any>} Query result
     */
    async query(query, params = []) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        try {
            switch (this.dbType) {
                case 'postgresql':
                case 'mysql':
                    return await this.connection.query(query, params);
                case 'sqlite':
                    return await this._querySQLite(query, params);
                default:
                    throw new Error(`Query not supported for ${this.dbType}`);
            }
        } catch (error) {
            console.error('[DatabaseAdapter] Query error:', error.message);
            throw error;
        }
    }

    /**
     * Find documents (MongoDB)
     * @param {string} collection - Collection name
     * @param {Object} filter - Query filter
     * @returns {Promise<Array>} Documents
     */
    async find(collection, filter = {}) {
        if (this.dbType !== 'mongodb') {
            throw new Error('find() is only supported for MongoDB');
        }

        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        try {
            const db = this.connection.db(settings.dbName);
            return await db.collection(collection).find(filter).toArray();
        } catch (error) {
            console.error('[DatabaseAdapter] Find error:', error.message);
            throw error;
        }
    }

    /**
     * Insert document (MongoDB)
     * @param {string} collection - Collection name
     * @param {Object} document - Document to insert
     * @returns {Promise<any>} Insert result
     */
    async insertOne(collection, document) {
        if (this.dbType !== 'mongodb') {
            throw new Error('insertOne() is only supported for MongoDB');
        }

        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        try {
            const db = this.connection.db(settings.dbName);
            return await db.collection(collection).insertOne(document);
        } catch (error) {
            console.error('[DatabaseAdapter] Insert error:', error.message);
            throw error;
        }
    }

    // ========== PRIVATE CONNECTION METHODS ==========

    /**
     * Connect to PostgreSQL
     * @private
     */
    async _connectPostgreSQL() {
        const pg = await import('pg');
        const { Pool } = pg.default;

        this.connection = new Pool({
            host: settings.dbHost,
            port: settings.dbPort || 5432,
            database: settings.dbName,
            user: settings.dbUser,
            password: settings.dbPassword,
            ssl: settings.dbSSL ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Test connection
        await this.connection.query('SELECT NOW()');
    }

    /**
     * Connect to MySQL
     * @private
     */
    async _connectMySQL() {
        const mysql = await import('mysql2/promise');

        this.connection = await mysql.createPool({
            host: settings.dbHost,
            port: settings.dbPort || 3306,
            database: settings.dbName,
            user: settings.dbUser,
            password: settings.dbPassword,
            ssl: settings.dbSSL ? { rejectUnauthorized: false } : undefined,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Test connection
        await this.connection.query('SELECT 1');
    }

    /**
     * Connect to SQLite
     * @private
     */
    async _connectSQLite() {
        const sqlite3 = await import('sqlite3');
        const { open } = await import('sqlite');

        this.connection = await open({
            filename: settings.dbPath || './data/cashew.db',
            driver: sqlite3.default.Database
        });
    }

    /**
     * Query SQLite
     * @private
     */
    async _querySQLite(query, params) {
        if (query.trim().toUpperCase().startsWith('SELECT')) {
            return await this.connection.all(query, params);
        } else {
            return await this.connection.run(query, params);
        }
    }

    /**
     * Connect to MongoDB
     * @private
     */
    async _connectMongoDB() {
        const { MongoClient } = await import('mongodb');

        const uri = settings.dbConnectionString ||
            `mongodb://${settings.dbUser}:${settings.dbPassword}@${settings.dbHost}:${settings.dbPort || 27017}`;

        this.connection = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });

        await this.connection.connect();
    }
}

// Export singleton instance
const databaseAdapter = new DatabaseAdapter();
export default databaseAdapter;
