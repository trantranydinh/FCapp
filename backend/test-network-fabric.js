/**
 * Test Network Connectivity to Fabric Lakehouse
 * Checks DNS, ping, and port 1433 connectivity
 */

import dotenv from 'dotenv';
import dns from 'dns';
import net from 'net';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const lookup = promisify(dns.lookup);
const resolve4 = promisify(dns.resolve4);

async function testNetworkConnectivity() {
    console.log('\n=======================================================');
    console.log('   FABRIC LAKEHOUSE NETWORK CONNECTIVITY TEST');
    console.log('=======================================================\n');

    const server = process.env.LAKEHOUSE_SERVER;

    if (!server || server.trim().length === 0) {
        console.error('❌ LAKEHOUSE_SERVER is not set in .env');
        process.exit(1);
    }

    console.log(`🔍 Testing connection to: ${server}`);
    console.log(`   Port: 1433 (SQL Server)`);
    console.log('');

    // Step 1: DNS Resolution
    console.log('1️⃣  DNS Resolution Test');
    console.log('─────────────────────────────────────────────────');
    try {
        const { address, family } = await lookup(server);
        console.log(`   ✅ DNS Lookup Success`);
        console.log(`      Hostname: ${server}`);
        console.log(`      IP Address: ${address}`);
        console.log(`      IP Version: IPv${family}`);

        // Try to get all A records
        try {
            const addresses = await resolve4(server);
            if (addresses.length > 1) {
                console.log(`      Additional IPs: ${addresses.slice(1).join(', ')}`);
            }
        } catch (e) {
            // Ignore if resolve4 fails
        }
    } catch (error) {
        console.error(`   ❌ DNS Resolution Failed`);
        console.error(`      Error: ${error.message}`);
        console.error(`\n   💡 Troubleshooting:`);
        console.error(`      - Check if LAKEHOUSE_SERVER is correct`);
        console.error(`      - Verify internet connection`);
        console.error(`      - Try: nslookup ${server}`);
        process.exit(1);
    }

    console.log('');

    // Step 2: TCP Connection Test to Port 1433
    console.log('2️⃣  TCP Port 1433 Connection Test');
    console.log('─────────────────────────────────────────────────');

    const testConnection = () => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const timeout = 10000; // 10 seconds

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                console.log(`   ✅ TCP Connection Success`);
                console.log(`      Server: ${server}:1433`);
                console.log(`      Status: Port is OPEN and reachable`);
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                console.error(`   ❌ Connection Timeout (${timeout / 1000}s)`);
                socket.destroy();
                reject(new Error('Connection timeout'));
            });

            socket.on('error', (err) => {
                console.error(`   ❌ TCP Connection Failed`);
                console.error(`      Error: ${err.message}`);
                reject(err);
            });

            console.log(`   ⏳ Attempting connection to ${server}:1433...`);
            socket.connect(1433, server);
        });
    };

    try {
        await testConnection();
    } catch (error) {
        console.error(`\n   🔥 CONNECTION FAILED - This explains the "socket hang up" error`);
        console.error(`\n   💡 Possible Causes:`);
        console.error(`      1. FIREWALL blocking port 1433`);
        console.error(`         - Corporate firewall`);
        console.error(`         - Local firewall (Windows/Mac)`);
        console.error(`         - Azure Fabric firewall rules`);
        console.error(`\n      2. VPN REQUIRED but not connected`);
        console.error(`         - Check if your organization requires VPN`);
        console.error(`         - Verify VPN connection is active`);
        console.error(`\n      3. IP NOT WHITELISTED in Azure Fabric`);
        console.error(`         - Azure Fabric may restrict by IP address`);
        console.error(`         - Check workspace firewall settings`);
        console.error(`\n      4. SQL ENDPOINT NOT ENABLED`);
        console.error(`         - Verify SQL endpoint is enabled in Lakehouse`);
        console.error(`         - Check Lakehouse status in Azure Portal`);
        console.error(`\n      5. NETWORK ROUTING ISSUE`);
        console.error(`         - Try from different network`);
        console.error(`         - Test from Azure VM in same region`);

        console.error(`\n   🛠️  Recommended Actions:`);
        console.error(`      a) Check your public IP: curl ifconfig.me`);
        console.error(`      b) Contact Azure Fabric admin to whitelist your IP`);
        console.error(`      c) Check Azure Fabric workspace firewall settings`);
        console.error(`      d) Verify SQL endpoint is enabled in Lakehouse`);
        console.error(`      e) Try connecting from different network`);
        console.error(`      f) Check if VPN is required and connected`);

        process.exit(1);
    }

    console.log('');
    console.log('=======================================================');
    console.log('   🎉 ALL NETWORK TESTS PASSED');
    console.log('=======================================================');
    console.log('');
    console.log('✅ DNS resolution works');
    console.log('✅ TCP port 1433 is reachable');
    console.log('');
    console.log('If you still get "socket hang up" errors, the issue may be:');
    console.log('   - SQL authentication/authorization');
    console.log('   - Connection dropped after initial handshake');
    console.log('   - TLS/SSL handshake failure');
    console.log('');
    console.log('Next step: Run the full debug script to test SQL authentication');
    console.log('   node backend/debug-fabric.js');
}

testNetworkConnectivity().catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
