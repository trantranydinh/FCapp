import sql from 'mssql';
import { ClientSecretCredential } from '@azure/identity';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    console.log("--- DEBUG CONNECTION ---");
    const server = process.env.LAKEHOUSE_SERVER;
    const db = process.env.LAKEHOUSE_DATABASE;

    console.log(`Server: '${server}' (Len: ${server?.length})`);
    console.log(`DB: '${db}'`);

    const tenantId = process.env.FABRIC_TENANT_ID;
    const clientId = process.env.FABRIC_CLIENT_ID;
    const clientSecret = process.env.FABRIC_CLIENT_SECRET;

    try {
        console.log("1. Fetching Token...");
        const cred = new ClientSecretCredential(tenantId, clientId, clientSecret);
        const tokenResp = await cred.getToken('https://database.windows.net/.default');
        const token = tokenResp.token;
        console.log("   Token acquired length:", token.length);

        const config = {
            server: server,
            database: db,
            port: 1433,
            authentication: {
                type: 'azure-active-directory-access-token',
                options: { token: token }
            },
            options: {
                encrypt: true,
                trustServerCertificate: true,
                connectTimeout: 30000
            }
        };

        console.log("2. Connecting (SELECT 1)...");
        const pool = await sql.connect(config);
        console.log("   Connected!");

        const result = await pool.request().query("SELECT 1 as val");
        console.log("   Result:", result.recordset);

        await pool.close();
        console.log("SUCCESS");
    } catch (err) {
        console.error("FAILURE:", err.message);
        console.error("Code:", err.code);
        if (err.originalError) console.error("Original:", err.originalError.message);
    }
}

run();
