import mysql from 'mysql2/promise';
import { settings } from '../settings.js';

/**
 * MySQL Database Client
 * Handles connection pooling and query execution
 */

// Create a connection pool
const pool = mysql.createPool({
    host: settings.dbHost,
    user: settings.dbUser,
    password: settings.dbPassword,
    database: settings.dbName,
    port: settings.dbPort || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: settings.dbSSL ? { rejectUnauthorized: false } : undefined
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('[MySQL] Database connection established successfully');
        connection.release();
    })
    .catch(err => {
        console.error('[MySQL] Error connecting to database:', err.message);
    });

/**
 * Execute a query with parameters
 * @param {string} sql SQL query
 * @param {Array} params Query parameters
 * @returns {Promise<[any, any]>} [rows, fields]
 */
export const query = async (sql, params) => {
    try {
        const [results, fields] = await pool.execute(sql, params);
        return [results, fields];
    } catch (error) {
        console.error('[MySQL] Query error:', error.message);
        throw error;
    }
};

/**
 * Get a connection from the pool (for transactions)
 * @returns {Promise<import('mysql2/promise').PoolConnection>}
 */
export const getConnection = async () => {
    return await pool.getConnection();
};

export default {
    query,
    getConnection,
    pool
};
