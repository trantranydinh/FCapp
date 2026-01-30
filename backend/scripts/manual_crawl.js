
import fs from 'fs';
import path from 'path';
import newsCrawler from './src/infrastructure/data/NewsCrawler.js';

console.log('Running manual crawl...');
const newsItems = await newsCrawler.crawl({ keywords: ['cashew'], limit: 15 });

const filePath = path.resolve(process.cwd(), 'data', 'demo_news.json');
// Ensure dir exists
if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

fs.writeFileSync(filePath, JSON.stringify(newsItems, null, 2));
console.log(`Saved ${newsItems.length} items to ${filePath}`);
process.exit(0);
