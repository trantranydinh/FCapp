import { loadEnvironment, settings } from './settings.js';

// Load environment first
loadEnvironment();

console.log('--- DEBUG SETTINGS ---');
console.log('DB Type:', settings.dbType);
console.log('DB Host:', settings.dbHost);
console.log('DB Port:', settings.dbPort);
console.log('DB User:', settings.dbUser);
console.log('DB Name:', settings.dbName);
console.log('--- END DEBUG ---');
