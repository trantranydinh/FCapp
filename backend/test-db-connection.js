import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Testing Database Connection...');
console.log('--------------------------------');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log('--------------------------------');

async function testConnection() {
    try {
        console.log('Attempting to connect...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            connectTimeout: 10000 // 10 seconds timeout
        });

        console.log('✅ Connection Successful!');

        // Try a simple query
        const [rows] = await connection.execute('SELECT 1 as val');
        console.log('✅ Query Test Successful (Result:', rows[0].val, ')');

        await connection.end();
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);

        if (error.code === 'ETIMEDOUT') {
            console.error('\nPossible causes for ETIMEDOUT:');
            console.error('1. The Host/Server Name is incorrect or unreachable.');
            console.error('2. A Firewall is blocking port ' + (process.env.DB_PORT || 3306) + '.');
            console.error('3. The Database Server is down.');
            console.error('4. You need to be connected to a VPN to access this server.');
        } else if (error.code === 'ENOTFOUND') {
            console.error('\nPossible cause: The Server Name could not be resolved to an IP address.');
        }
    }
}

testConnection();
