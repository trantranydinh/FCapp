
import newsCrawler from './src/infrastructure/data/NewsCrawler.js';

console.log("Testing Crawler...");
try {
    const results = await newsCrawler.crawl({ keywords: ['cashew'], limit: 5 });
    console.log("Crawl Result Count:", results.length);
    if (results.length > 0) {
        console.log("First Item Source:", results[0].source);
        console.log("First Item URL:", results[0].url);

        if (results[0].url.includes('google.com/rss')) {
            console.log("STATUS: SUCCESS (Real RSS Link)");
        } else if (results[0].url.includes('example.com') || results[0].source === 'Cashew Market Watch') {
            console.log("STATUS: FALLBACK (Simulation Active)");
        } else {
            console.log("STATUS: SUCCESS (Live Data)");
        }
    }
} catch (e) {
    console.error("Crawl Error:", e);
}
process.exit(0);
