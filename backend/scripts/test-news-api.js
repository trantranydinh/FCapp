/**
 * Test Script for News Crawler API
 * 
 * Run with: node test-news-api.js
 */

const testNewsAPI = async () => {
    console.log('🧪 Testing News Crawler API...\n');

    try {
        // Test 1: Refresh news with keywords
        console.log('📰 Test 1: Refresh news with keywords ["price", "supply"]');
        const response1 = await fetch('http://localhost:8000/api/v1/dashboard/news-refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords: ['price', 'supply'], limit: 5 })
        });

        const result1 = await response1.json();
        console.log('✅ Result:', JSON.stringify(result1, null, 2));
        console.log('');

        // Test 2: Get news summary
        console.log('📋 Test 2: Get news summary');
        const response2 = await fetch('http://localhost:8000/api/v1/dashboard/news-summary?limit=5');
        const result2 = await response2.json();
        console.log('✅ Result:', JSON.stringify(result2, null, 2));
        console.log('');

        // Test 3: Refresh all news (no keywords)
        console.log('🌐 Test 3: Refresh all news (no keywords)');
        const response3 = await fetch('http://localhost:8000/api/v1/dashboard/news-refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: 10 })
        });

        const result3 = await response3.json();
        console.log('✅ Result:', JSON.stringify(result3, null, 2));

        console.log('\n✨ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testNewsAPI();
