import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import dns from 'dns';
import net from 'net';
import tls from 'tls';

// Load ENV
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
console.log(`[Diagnostic] Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

async function runDiagnostics() {
    console.log('\n==================================================');
    console.log('       LAKEHOUSE DEEP DIAGNOSTICS');
    console.log('==================================================\n');

    const config = {
        server: process.env.LAKEHOUSE_SERVER,
        database: process.env.LAKEHOUSE_DATABASE,
        tenantId: process.env.FABRIC_TENANT_ID,
        clientId: process.env.FABRIC_CLIENT_ID,
        clientSecret: process.env.FABRIC_CLIENT_SECRET
    };

    // 1. Check Variables
    const vars = ['LAKEHOUSE_SERVER', 'LAKEHOUSE_DATABASE', 'FABRIC_TENANT_ID', 'FABRIC_CLIENT_ID', 'FABRIC_CLIENT_SECRET'];
    const missing = vars.filter(v => !process.env[v]);
    if (missing.length) {
        console.error(`❌ Missing ENV: ${missing.join(', ')}`);
        return;
    }

    const hostname = config.server.split(':')[0];
    console.log(`Target: ${hostname} (Port 1433)`);

    // 2. DNS
    console.log('\n--- Step 2: DNS Resolution ---');
    try {
        const addresses = await dns.promises.resolve(hostname);
        console.log(`✅ Resolved: ${JSON.stringify(addresses)}`);
    } catch (e) {
        console.error(`❌ DNS Failed: ${e.message}`);
    }

    // 3. TCP Ping
    console.log('\n--- Step 3: TCP Ping ---');
    try {
        await new Promise((resolve, reject) => {
            const s = new net.Socket();
            s.setTimeout(5000);
            s.connect(1433, hostname, () => {
                console.log('✅ TCP Open');
                s.destroy();
                resolve();
            });
            s.on('error', (e) => reject(e));
            s.on('timeout', () => { s.destroy(); reject(new Error('Timeout')); });
        });
    } catch (e) {
        console.error(`❌ TCP Failed: ${e.message}`); // If firewall blocks this, SQL won't work
    }

    // 4. TLS/SSL Handshake (Critical for "Socket Hang Up")
    console.log('\n--- Step 4: TLS Handshake Check ---');
    try {
        await new Promise((resolve, reject) => {
            const socket = tls.connect({
                host: hostname,
                port: 1433,
                servername: hostname, // SNI is often required by Azure
                rejectUnauthorized: false
            }, () => {
                console.log('✅ TLS Handshake Success!');
                const cert = socket.getPeerCertificate();
                if (cert && cert.subject) {
                    console.log(`   Cert Subject: ${cert.subject.CN}`);
                    console.log(`   Cert Valid To: ${cert.valid_to}`);
                }
                socket.end();
                resolve();
            });
            socket.on('error', (e) => reject(e));
            socket.setTimeout(10000);
            socket.on('timeout', () => { socket.destroy(); reject(new Error('TLS Timeout')); });
        });
    } catch (e) {
        console.error(`❌ TLS Failed: ${e.message}`);
        console.error('   -> If TCP works but TLS fails, it might be an SSL/Cipher mismatch or strict Firewall DPI.');
    }

    // 5. TDS Connection (Service Principal)
    console.log('\n--- Step 5: SQL Connection (Service Principal) ---');

    // We use service principal secret directly!
    const sqlConfig = {
        server: hostname, // Don't use 'https://' or port in string
        port: 1433,
        database: config.database,
        authentication: {
            type: 'azure-active-directory-service-principal-secret',
            options: {
                tenantId: config.tenantId,
                clientId: config.clientId,
                clientSecret: config.clientSecret
            }
        },
        options: {
            encrypt: true,
            trustServerCertificate: true, // Try true if false failed
            connectTimeout: 30000,
            enableArithAbort: true
        }
    };

    try {
        const pool = new sql.ConnectionPool(sqlConfig);
        pool.on('error', err => console.error('SQL Pool Error:', err)); // Catch async pool errors

        console.log('Connecting...');
        await pool.connect();
        console.log('✅ SQL Connected Successfully!');

        const result = await pool.request().query('SELECT @@VERSION as v');
        console.log(`   Version: ${result.recordset[0].v.substring(0, 40)}...`);

        await pool.close();
    } catch (err) {
        console.error(`❌ SQL Connect Failed: ${err.message}`);
        if (err.code === 'ESOCKET') {
            console.error('   -> This is a low-level network/socket error.');
        } else if (err.code === 'ELOGIN') {
            console.error('   -> Auth failed. Check credentials/permissions.');
        }
        console.error('Full Error:', err);
    }

    console.log('\n--- Diagnostics Complete ---');
}

runDiagnostics();
