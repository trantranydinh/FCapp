
import newsOrchestrator from './src/application/NewsOrchestrator.js';

console.log('Starting manual news refresh...');
try {
    await newsOrchestrator.refreshNews({ keywords: ['cashew', 'vietnam', 'africa'], limit: 15 });
    console.log('News refresh complete!');
} catch (err) {
    console.error('Error refreshing news:', err);
}
process.exit(0);
