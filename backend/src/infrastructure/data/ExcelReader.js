/**
 * INFRASTRUCTURE LAYER: Excel Data Reader
 *
 * Responsibility: Read price data from Excel files
 * Used by: Application layer orchestrators
 */
 
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
class ExcelReader {
  /**
   * Read price history from Excel file
   * @param {string} filePath - Absolute or relative path to Excel file
   * @returns {Array} - Array of { date, price } objects sorted by date
   */
  readPriceHistory(filePath) {
    console.log(`[ExcelReader] Reading price data from: ${filePath}`);
 
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found: ${filePath}`);
    }
 
    try {
      // Read Excel file
      const workbook = XLSX.readFile(filePath, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
 
      if (!sheetName) {
        throw new Error('Excel file has no sheets');
      }
 
      // Convert to JSON
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });
 
      console.log(`[ExcelReader] Found ${json.length} rows in Excel`);
 
      // Transform and validate data
      const priceData = json
        .map((row) => ({
          date: new Date(row.Date),
          price: Number(row.Price)
        }))
        .filter((row) => !Number.isNaN(row.price) && row.date.toString() !== 'Invalid Date')
        .sort((a, b) => a.date - b.date);
 
      console.log(`[ExcelReader] Parsed ${priceData.length} valid price records`);
 
      if (priceData.length === 0) {
        throw new Error('No valid price data found in Excel file. Expected columns: Date, Price');
      }
 
      return priceData;
 
    } catch (error) {
      console.error(`[ExcelReader] Failed to read Excel:`, error.message);
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }
  }
 
  /**
   * Read price history from default data directory
   * @param {string} dataDir - Data directory path
   * @param {string} fileName - Excel file name
   * @returns {Array} - Array of { date, price } objects
   */
  readDefaultPriceHistory(dataDir = 'data', fileName = 'sample_price_data.xlsx') {
    // Resolve project root (assuming this file is in src/infrastructure/data)
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, dataDir, fileName);
    return this.readPriceHistory(filePath);
  }
 
  /**
   * Get summary stats from price data
   * @param {Array} priceData - Array of { date, price } objects
   * @returns {object} - Summary statistics
   */
  getSummaryStats(priceData) {
    if (!priceData || priceData.length === 0) {
      return null;
    }
 
    const prices = priceData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const latestPrice = prices[prices.length - 1];
 
    return {
      count: priceData.length,
      startDate: priceData[0].date.toISOString().split('T')[0],
      endDate: priceData[priceData.length - 1].date.toISOString().split('T')[0],
      minPrice: minPrice.toFixed(2),
      maxPrice: maxPrice.toFixed(2),
      avgPrice: avgPrice.toFixed(2),
      latestPrice: latestPrice.toFixed(2)
    };
  }
}
 
// Export singleton instance
const excelReader = new ExcelReader();
export default excelReader;