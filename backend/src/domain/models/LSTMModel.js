/**
 * DOMAIN LAYER: LSTM Forecasting Model
 *
 * Responsibility: Domain logic for LSTM-based price forecasting
 * Uses: PythonBridge (infrastructure) to execute Python LSTM
 */

import pythonBridge from '../../infrastructure/ml/PythonBridge.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LSTMModel {
  constructor() {
    this.id = 'lstm-v1';
    this.name = 'LSTM Neural Network';
    this.type = 'deep-learning';
    this.description = 'Ensemble of 3 LSTM networks with confidence intervals';
  }

  /**
   * Generate forecast using Python LSTM model
   * @param {Array} historicalData - Array of { date, price } objects
   * @param {number} forecastDays - Number of days to forecast
   * @returns {Promise<object>} - Forecast result with predictions and confidence bands
   */
  async predict(historicalData, forecastDays) {
    console.log(`[LSTMModel] Starting prediction for ${forecastDays} days`);
    console.log(`[LSTMModel] Historical data points: ${historicalData.length}`);

    // Validate input
    if (!historicalData || historicalData.length < 90) {
      throw new Error('LSTM requires at least 90 days of historical data');
    }

    if (forecastDays < 1 || forecastDays > 90) {
      throw new Error('Forecast days must be between 1 and 90');
    }

    // Prepare data for Python script
    // The Python script expects to read from a file, so we need to provide the path
    // For now, we'll use the default data file location
    const projectRoot = path.resolve(__dirname, '../../../../');
    const dataFilePath = path.join(projectRoot, 'data', 'sample_price_data.xlsx');

    const pythonInput = {
      file_path: dataFilePath,
      forecast_days: forecastDays
    };

    try {
      // Execute Python LSTM via bridge
      const result = await pythonBridge.execute(
        'ml-models/lstm/forecaster.py',
        pythonInput,
        { timeout: 120000 } // 2 minutes timeout
      );

      console.log(`[LSTMModel] Received forecast with ${result.forecast?.length || 0} predictions`);

      // Transform Python output to standard format
      return this._formatForecastResult(result, historicalData, forecastDays);

    } catch (error) {
      console.error(`[LSTMModel] Prediction failed:`, error.message);
      throw new Error(`LSTM prediction failed: ${error.message}`);
    }
  }

  /**
   * Format Python LSTM output to standard forecast format
   * @private
   */
  _formatForecastResult(pythonResult, historicalData, forecastDays) {
    const lastHistoricalPrice = historicalData[historicalData.length - 1].price;
    const baseDate = new Date(historicalData[historicalData.length - 1].date);

    // Extract forecast data
    const forecastData = pythonResult.forecast || [];
    const metadata = pythonResult.metadata || {};

    // Build detailed forecast array
    const detailedForecast = forecastData.map((item, index) => {
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(forecastDate.getDate() + index + 1);

      return {
        date: forecastDate.toISOString().split('T')[0],
        predicted: item.predicted || item.price,
        lower: item.lower || item.predicted * 0.95,
        upper: item.upper || item.predicted * 1.05,
        dayAhead: index + 1
      };
    });

    // Calculate summary metrics
    const predictions = detailedForecast.map(d => d.predicted);
    const avgPredicted = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    const finalPrice = predictions[predictions.length - 1];
    const priceChange = ((finalPrice - lastHistoricalPrice) / lastHistoricalPrice) * 100;

    // Determine trend
    let trendLabel = 'FLAT';
    if (priceChange > 2) trendLabel = 'UP';
    else if (priceChange < -2) trendLabel = 'DOWN';

    // Calculate confidence (use from metadata or default)
    const confidence = metadata.confidence || 0.75;

    return {
      modelId: this.id,
      modelName: this.name,
      modelType: this.type,
      basePrice: lastHistoricalPrice,
      avgPredicted: avgPredicted,
      finalPrice: finalPrice,
      priceChange: priceChange,
      trendLabel: trendLabel,
      confidence: confidence,
      forecastDays: forecastDays,
      detailedData: detailedForecast,
      metadata: {
        ...metadata,
        historicalDataPoints: historicalData.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get model information
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      requirements: {
        minHistoricalDays: 90,
        maxForecastDays: 90
      }
    };
  }
}

export default LSTMModel;
