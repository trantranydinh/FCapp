
import db from './db/mysqlClient.js';

async function showProcedure() {
    try {
        console.log('Fetching definition of PTool_sp_get_user_calculation_history...');
        const [results] = await db.query('SHOW CREATE PROCEDURE PTool_sp_get_user_calculation_history');

        if (results && results.length > 0) {
            console.log('--- Procedure Definition ---');
            console.log(results[0]['Create Procedure']);
        } else {
            console.log('Procedure not found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

showProcedure();
