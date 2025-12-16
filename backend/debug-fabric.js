import dotenv from 'dotenv';
import sql from 'mssql';
import { PublicClientApplication } from '@azure/msal-node';
import dns from 'dns';
import { promisify } from 'util';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars (try generic locations)
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.LAKEHOUSE_SERVER) {
    console.log('   ⚠️  .env not found in backend, trying root directory...');
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

const lookup = promisify(dns.lookup);

async function runDebug() {
    console.log('\n=================================================');
    console.log('      DEBUGGING FABRIC LAKEHOUSE CONNECTION      ');
    console.log('=================================================\n');

    const server = process.env.LAKEHOUSE_SERVER;
    const db = process.env.LAKEHOUSE_DATABASE;

    console.log('1. Checking Configuration...');
    console.log(`   Server:   ${server || '(MISSING)'}`);
    console.log(`   Database: ${db || '(MISSING)'}`);
    console.log(`   AuthType: ${process.env.LAKEHOUSE_AUTH_TYPE}`);

    if (!server || !db) {
        console.error('\n❌ ERROR: LAKEHOUSE_SERVER or LAKEHOUSE_DATABASE is missing in .env');
        process.exit(1);
    }

    // 2. DNS Check
    console.log('\n2. Checking Network / DNS...');
    try {
        const { address } = await lookup(server);
        console.log(`   ✅ DNS Resolved: ${server} -> ${address}`);
    } catch (e) {
        console.error(`   ❌ DNS Error: Could not resolve ${server}`);
        console.error('      Verify the server address. It should look like: xxxxx.datawarehouse.fabric.microsoft.com');
        console.error('      Also check your VPN connection.');
        process.exit(1);
    }

    // 3. Auth
    console.log('\n3. Authenticating (Device Code Flow)...');

    const msalConfig = {
        auth: {
            clientId: '04b07795-8ddb-461a-bbee-02f9e1bf7b46',
            authority: 'https://login.microsoftonline.com/organizations'
        }
    };
    const pca = new PublicClientApplication(msalConfig);

    let accessToken;

    const deviceCodeRequest = {
        deviceCodeCallback: (response) => {
            console.log('\n   ⚠️  ACTION REQUIRED:');
            console.log(`      1. Go to: ${response.verificationUri}`);
            console.log(`      2. Enter Code: ${response.userCode}`);
            console.log('      Waiting for you to login...\n');
        },
        scopes: ["https://database.windows.net//.default"]
    };

    try {
        const response = await pca.acquireTokenByDeviceCode(deviceCodeRequest);
        console.log(`   ✅ Authenticated as: ${response.account.username}`);
        accessToken = response.accessToken;
    } catch (e) {
        console.error(`   ❌ Auth Failed: ${e.message}`);
        process.exit(1);
    }

    // 4. SQL Connection
    console.log('\n4. Connecting to SQL Endpoint...');

    const config = {
        server: server,
        database: db,
        port: 1433,
        options: {
            encrypt: true,
            trustServerCertificate: true,
            connectTimeout: 30000,
            packetSize: 32768
        },
        authentication: {
            type: 'azure-active-directory-access-token',
            options: { token: accessToken }
        }
    };

    try {
        const pool = await sql.connect(config);
        console.log('   ✅ SQL Connection Established!');

        console.log('\n5. Testing Query...');
        const result = await pool.request().query('SELECT TOP 5 * FROM dbo.market_prices'); // Adjust table if needed
        console.log(`   ✅ Query Success. Retrieved ${result.recordset.length} rows.`);
        console.table(result.recordset);

        await pool.close();
        console.log('\n🎉 DIAGNOSTICS COMPLETE: EVERYTHING LOOKS GOOD.');

    } catch (e) {
        console.error(`   ❌ SQL Connection Failed: ${e.message}`);
        if (e.message.includes('socket hang up') || e.message.includes('timeout')) {
            console.log('      -> This usually indicates a FIREWALL, VPN, or PORT 1433 blocking issue.');
        }
    }
}

runDebug();
