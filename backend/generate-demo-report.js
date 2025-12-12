/**
 * Generate Demo Report with Mock Data
 * Run: node generate-demo-report.js
 */

import reportGenerator from './src/application/ReportGenerator.js';
import fs from 'fs-extra';
import path from 'path';

const generateDemoReport = async () => {
    console.log('🎨 Generating demo report with mock data...\n');

    // Mock data mô phỏng dashboard thực tế
    const mockData = {
        // Market Trend
        trend: 'UP',
        confidence: 88,

        // Pricing
        currentPrice: 145.20,
        priceChange: 2.3,
        forecastPrice: 152.80,

        // Volatility
        volatility: 'Medium',

        // Risk Assessment
        primaryDriver: 'Supply chain constraints in Southeast Asia',
        riskRegion: 'Vietnam',

        // Strategic Recommendation
        recommendation: 'Increase forward contract inventory by 15%'
    };

    try {
        // Generate report
        const filePath = await reportGenerator.generateConsolidatedReport(mockData);

        console.log('✅ Demo report generated successfully!');
        console.log(`📄 File location: ${filePath}`);
        console.log(`📁 File name: ${path.basename(filePath)}\n`);

        // Copy to a more accessible location for demo
        const demoPath = path.join(process.cwd(), 'DEMO_REPORT.html');
        await fs.copy(filePath, demoPath);

        console.log('✨ Also copied to: DEMO_REPORT.html (in backend root)');
        console.log('\n📖 To view:');
        console.log('   1. Open DEMO_REPORT.html in your browser');
        console.log('   2. Press Ctrl+P to Print → Save as PDF');
        console.log('\n🎯 This demonstrates the Consulting-style format for stakeholder reports.\n');

    } catch (error) {
        console.error('❌ Failed to generate demo report:', error.message);
    }
};

generateDemoReport();
