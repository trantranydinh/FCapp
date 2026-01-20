import { ClientSecretCredential } from '@azure/identity';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env explicitly
dotenv.config({ path: path.join(__dirname, '../.env') });

async function debugAuth() {
    console.log('--- DEBUGGING AZURE AUTH ---');
    console.log('Tenant ID:', process.env.FABRIC_TENANT_ID);
    console.log('Client ID:', process.env.FABRIC_CLIENT_ID);
    const secret = process.env.FABRIC_CLIENT_SECRET || '';
    console.log('Client Secret (First 3 chars):', secret.substring(0, 3) + '...');

    const credential = new ClientSecretCredential(
        process.env.FABRIC_TENANT_ID,
        process.env.FABRIC_CLIENT_ID,
        process.env.FABRIC_CLIENT_SECRET
    );

    try {
        console.log('\nAttempting to get token for scope: https://database.windows.net/.default ...');
        const token = await credential.getToken('https://database.windows.net/.default');
        console.log('✅ SUCCESS! Token received.');
        console.log('Token starts with:', token.token.substring(0, 20) + '...');
    } catch (error) {
        console.log('\n❌ AUTHENTICATION FAILED');
        console.log('Error Name:', error.name);
        console.log('Error Message:', error.message);

        if (error.message.includes('7000112')) {
            console.log('\n⚠️  DIAGNOSIS: Error 7000112 usually means the Service Principal is disabled.');
            console.log('   Please check: Azure Portal -> Enterprise Applications -> Select the App -> Properties -> Enabled for users to sign-in?');
            console.log('   (Note: This is different from App Registrations)');
        }
    }
}

debugAuth();
