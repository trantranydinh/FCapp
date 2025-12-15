import db from './db/mysqlClient.js';

async function countCalculations() {
    try {
        console.log('Counting calculations per user...');
        const [results] = await db.query('SELECT user_id, COUNT(*) as count FROM PTool_rcn_parity_calculations GROUP BY user_id');

        console.log('--- Counts ---');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

countCalculations();
