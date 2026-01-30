import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- AZURE CONNECTION INFO ---');
const info = {
    LAKEHOUSE_SERVER: process.env.LAKEHOUSE_SERVER || '(NOT SET)',
    LAKEHOUSE_DATABASE: process.env.LAKEHOUSE_DATABASE || '(NOT SET)',
    AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID ? 'SET' : '(NOT SET)',
    AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID ? 'SET' : '(NOT SET)'
};
console.log(JSON.stringify(info, null, 2));
console.log('--- END ---');
