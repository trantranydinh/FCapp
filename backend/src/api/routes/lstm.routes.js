/**
 * API LAYER: LSTM Routes
 *
 * Responsibility: HTTP endpoints for LSTM forecasting (validation, response formatting only)
 * Uses: ForecastOrchestrator (application layer)
 */

import express from 'express';
import forecastOrchestrator from '../../application/ForecastOrchestrator.js';

const router = express.Router();

/**
 * POST /api/v1/lstm/run
 * Run LSTM forecast with default data
 *
 * Body: { forecast_days?: number }
 * Response: Forecast object with predictions
 */
router.post('/run', async (req, res) => {
  try {
    const { forecast_days = 60 } = req.body;

    // Validate input
    const forecastDays = Number(forecast_days);
    if (isNaN(forecastDays) || forecastDays < 1 || forecastDays > 90) {
      return res.status(400).json({
        error: 'Invalid forecast_days. Must be between 1 and 90'
      });
    }

    console.log(`[LSTM API] Received forecast request for ${forecastDays} days`);

    // Run forecast via orchestrator
    const forecast = await forecastOrchestrator.runLSTM(forecastDays);

    // Return result
    res.json({
      success: true,
      data: forecast
    });

  } catch (error) {
    console.error(`[LSTM API] Error:`, error.message);

    // Return error response
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/v1/lstm/info
 * Get LSTM model information
 */
router.get('/info', (req, res) => {
  try {
    const modelInfo = forecastOrchestrator.getModelInfo();

    res.json({
      success: true,
      data: modelInfo
    });

  } catch (error) {
    console.error(`[LSTM API] Error getting model info:`, error.message);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/lstm/health
 * Health check for LSTM service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'LSTM Forecasting',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
