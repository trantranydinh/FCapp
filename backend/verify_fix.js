import dotenv from 'dotenv';
dotenv.config();

console.log("--- VERIFYING LAKEHOUSE PROVIDER RETRY LOGIC ---");

async function testProvider() {
    try {
        // Dynamic import ensures environment variables are loaded FIRST
        const { default: LakehouseProvider } = await import('./src/infrastructure/data/LakehouseProvider.js');

        console.log("1. Requesting Historical Prices...");
        console.log("   (If server is sleeping, this should retry automatically)");

        const data = await LakehouseProvider.fetchHistoricalPrices(5);

        console.log("2. Result Received!");
        console.log(`   Count: ${data.length}`);
        if (data.length > 0) console.log("   First row:", data[0]);

        console.log("\n✅ SUCCESS: Retry logic worked (or server was awake).");
        await LakehouseProvider.close();

    } catch (err) {
        console.error("\n❌ FAILED:");
        console.error(err);
    }
}

testProvider();
