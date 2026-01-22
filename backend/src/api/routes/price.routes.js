/**
 * API LAYER: Price Routes
 *
 * Responsibility: HTTP endpoints for price forecasting (validation, response formatting only)
 * Uses: PriceOrchestrator (application layer)
 *
 * Principles:
 * - Thin HTTP layer with no business logic
 * - Input validation and sanitization
 * - File upload handling
 * - Standardized error responses
 * - Proper HTTP status codes
 */

import { Router } from 'express';
import priceOrchestrator from '../../application/PriceOrchestrator.js';

const router = Router();

// ========== ROUTE HANDLERS ==========

const fetchForecastHandler = async (req, res, next) => {
  try {
    const forecastDays = parseInt(req.body.forecast_days || '60', 10);
    const modelId = req.body.model_id || null;

    // Validate forecast days
    if (isNaN(forecastDays) || forecastDays < 1 || forecastDays > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid forecast_days. Must be between 1 and 180'
      });
    }

    console.log(`[Price API] POST ${req.path} (days: ${forecastDays})`);

    // runForecast now automatically prioritizes Lakehouse ("FC" table)
    const forecast = await priceOrchestrator.runForecast(forecastDays, modelId);

    res.json({
      success: true,
      data: forecast
    });

  } catch (error) {
    console.error('[Price API] Fetch forecast failed:', error.message);
    next(error);
  }
};

/**
 * POST /api/v1/price/fetch-forecast
 * Fetch forecast results from Lakehouse
 */
router.post('/fetch-forecast', fetchForecastHandler);

/**
 * POST /api/v1/price/run-forecast
 * Alias for fetch-forecast for backward compatibility with frontend
 */
router.post('/run-forecast', fetchForecastHandler);



/**
 * GET /api/v1/price/models
 * List all available forecasting models
 *
 * Response: List of models with metadata
 */
router.get('/models', (_req, res, next) => {
  try {
    console.log('[Price API] GET /models');

    const models = priceOrchestrator.listAvailableModels();

    res.json({
      success: true,
      data: {
        models,
        count: models.length
      }
    });

  } catch (error) {
    console.error('[Price API] Failed to list models:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/price/latest
 * Get latest forecast
 *
 * Response: Latest forecast or newly generated one
 */
router.get('/latest', async (_req, res, next) => {
  try {
    console.log('[Price API] GET /latest');

    const latest = await priceOrchestrator.getLatestForecast();

    if (!latest) {
      return res.status(404).json({
        success: false,
        error: 'No forecast available'
      });
    }

    res.json({
      success: true,
      data: latest
    });

  } catch (error) {
    console.error('[Price API] Failed to get latest forecast:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/price/forecast/:id
 * Get forecast by ID
 *
 * Path params:
 * - id: Forecast ID
 *
 * Response: Forecast object or 404
 */
router.get('/forecast/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Forecast ID is required'
      });
    }

    console.log(`[Price API] GET /forecast/${id}`);

    const forecast = await priceOrchestrator.getForecastById(id);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'Forecast not found'
      });
    }

    res.json({
      success: true,
      data: forecast
    });

  } catch (error) {
    console.error('[Price API] Failed to get forecast:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/price/history
 * Get forecast history
 *
 * Query params:
 * - limit: Number of forecasts to return (default: 10, max: 100)
 *
 * Response: List of historical forecasts
 */
router.get('/history', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100'
      });
    }

    console.log(`[Price API] GET /history (limit: ${limit})`);

    const history = await priceOrchestrator.getForecastHistory(limit);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('[Price API] Failed to get history:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/price/historical-data
 * Get historical price data
 *
 * Query params:
 * - months_back: Number of months to look back (default: 12, max: 24)
 *
 * Response: Historical price data with statistics
 */
router.get('/historical-data', async (req, res, next) => {
  try {
    const monthsBack = parseInt(req.query.months_back || '12', 10);

    // Validate months back
    if (isNaN(monthsBack) || (monthsBack !== 0 && (monthsBack < 1 || monthsBack > 60))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid months_back. Must be 0 (all) or between 1 and 60'
      });
    }

    console.log(`[Price API] GET /historical-data (months: ${monthsBack})`);

    const data = await priceOrchestrator.getHistoricalPrices(monthsBack);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Price API] Failed to get historical data:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/price/accuracy
 * Get forecast accuracy metrics
 *
 * Response: Accuracy summary with MAPE, trend accuracy
 */
router.get('/accuracy', async (_req, res, next) => {
  try {
    console.log('[Price API] GET /accuracy');

    const summary = await priceOrchestrator.getAccuracySummary();

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('[Price API] Failed to get accuracy:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/price/health
 * Health check endpoint
 *
 * Response: Simple health status
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'Price Forecast API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ========== ERROR HANDLER ==========
// Standard error handling is sufficient for now
router.use((error, req, res, next) => {
  if (error.status) {
    return res.status(error.status).json({ success: false, error: error.message });
  }
  next(error);
});

import lakehouseProvider from '../../infrastructure/data/LakehouseProvider.js';

/**
 * POST /api/v1/price/sync-lakehouse
 * Connect to Azure Fabric Lakehouse and fetch latest data
 */
router.post('/sync-lakehouse', async (req, res, next) => {
  try {
    console.log('[Price API] POST /sync-lakehouse (Direct Table Mode)');

    // Check if configured
    if (!lakehouseProvider.isConfigured()) {
      return res.status(400).json({ success: false, error: 'Lakehouse not configured.' });
    }

    // Just verify connection by fetching 1 row from 'raw' table
    try {
      const checkData = await lakehouseProvider.fetchHistoricalPrices(1, 'raw');
      res.json({
        success: true,
        message: 'Lakehouse connection verified (Direct Mode)',
        data: { totalRows: checkData.length > 0 ? '>0' : '0' }
      });
    } catch (err) {
      // If it's an auth error that requires interaction, we might need to handle it. 
      // But assuming Service Principal is used as per latest changelog.
      throw err;
    }

  } catch (error) {
    console.error('[Price API] Lakehouse sync failed:', error.message);
    next(error);
  }
});

export default router;
