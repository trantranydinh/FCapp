import net from 'net';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Adjust path if needed

const serverHostname = process.env.LAKEHOUSE_SERVER;

console.log("--- NETWORK DIAGNOSTIC ---");
console.log(`Target: ${serverHostname}`);
console.log(`Port: 1433`);

if (!serverHostname) {
    console.error("❌ LAKEHOUSE_SERVER not set in env");
    process.exit(1);
}

// 1. DNS Query
console.log("\n1. Performing DNS Lookup...");
dns.lookup(serverHostname, (err, address, family) => {
    if (err) {
        console.error("❌ DNS Lookup FAILED:", err.message);
        return;
    }
    console.log(`✅ DNS Resolved: ${address} (IPv${family})`);

    // 2. TCP Connection
    console.log("\n2. Testing TCP Connection to Port 1433...");
    const socket = new net.Socket();
    socket.setTimeout(10000); // 10s timeout

    const startTime = Date.now();
    socket.connect(1433, serverHostname, () => {
        const duration = Date.now() - startTime;
        console.log(`✅ TCP Connection SUCCESS in ${duration}ms!`);
        console.log("   (Network path to Azure is OPEN)");
        socket.end();
    });

    socket.on('timeout', () => {
        console.error("❌ TCP Connection TIMEOUT (10s).");
        console.error("   Possible Causes:");
        console.error("   - Firewall blocking port 1433");
        console.error("   - VPN interference");
        console.error("   - Server is completely down/unreachable");
        socket.destroy();
    });

    socket.on('error', (err) => {
        console.error("❌ TCP Connection ERROR:", err.message);
        console.error("   Code:", err.code);
    });
});
