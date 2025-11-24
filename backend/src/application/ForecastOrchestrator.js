/**
 * APPLICATION LAYER: Forecast Orchestrator
 *
 * Responsibility: Coordinate forecasting workflow (read data → run model → return result)
 * Uses: Domain models + Infrastructure services
 */

import excelReader from '../infrastructure/data/ExcelReader.js';
import LSTMModel from '../domain/models/LSTMModel.js';

class ForecastOrchestrator {
  constructor() {
    // LSTMModel is a singleton instance, not a class
    this.lstmModel = LSTMModel;
  }

  /**
   * Run LSTM forecast with default data
   * @param {number} forecastDays - Number of days to forecast (default 60)
   * @returns {Promise<object>} - Forecast result
   */
  async runLSTM(forecastDays = 60) {
    console.log(`[ForecastOrchestrator] Starting LSTM forecast for ${forecastDays} days`);

    try {
      // Step 1: Read historical data
      console.log(`[ForecastOrchestrator] Reading historical data...`);
      const historicalData = excelReader.readDefaultPriceHistory();
      const stats = excelReader.getSummaryStats(historicalData);

      console.log(`[ForecastOrchestrator] Loaded ${stats.count} data points`);
      console.log(`[ForecastOrchestrator] Date range: ${stats.startDate} to ${stats.endDate}`);
      console.log(`[ForecastOrchestrator] Latest price: $${stats.latestPrice}`);

      // Validate data
      if (historicalData.length < 90) {
        throw new Error(`Insufficient data for LSTM. Need at least 90 days, got ${historicalData.length}`);
      }

      // Step 2: Run LSTM prediction
      console.log(`[ForecastOrchestrator] Running LSTM prediction...`);
      const forecast = await this.lstmModel.predict(historicalData, forecastDays);

      // Step 3: Enrich result with historical stats
      forecast.historicalStats = stats;
      forecast.timestamp = new Date().toISOString();

      console.log(`[ForecastOrchestrator] Forecast complete!`);
      console.log(`[ForecastOrchestrator] Trend: ${forecast.trendLabel}, Confidence: ${(forecast.confidence * 100).toFixed(1)}%`);

      return forecast;

    } catch (error) {
      console.error(`[ForecastOrchestrator] Forecast failed:`, error.message);
      throw error;
    }
  }

  /**
   * Run LSTM forecast with custom data file
   * @param {string} dataFilePath - Path to Excel file
   * @param {number} forecastDays - Number of days to forecast
   * @returns {Promise<object>} - Forecast result
   */
  async runLSTMWithFile(dataFilePath, forecastDays = 60) {
    console.log(`[ForecastOrchestrator] Starting LSTM forecast with custom file: ${dataFilePath}`);

    try {
      // Read historical data from custom file
      const historicalData = excelReader.readPriceHistory(dataFilePath);
      const stats = excelReader.getSummaryStats(historicalData);

      console.log(`[ForecastOrchestrator] Loaded ${stats.count} data points from ${dataFilePath}`);

      // Validate data
      if (historicalData.length < 90) {
        throw new Error(`Insufficient data for LSTM. Need at least 90 days, got ${historicalData.length}`);
      }

      // Run LSTM prediction
      const forecast = await this.lstmModel.predict(historicalData, forecastDays);

      // Enrich result
      forecast.historicalStats = stats;
      forecast.timestamp = new Date().toISOString();
      forecast.dataSource = dataFilePath;

      return forecast;

    } catch (error) {
      console.error(`[ForecastOrchestrator] Forecast failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get LSTM model information
   */
  getModelInfo() {
    return this.lstmModel.getInfo();
  }
}

// Export singleton instance
const forecastOrchestrator = new ForecastOrchestrator();
export default forecastOrchestrator;
