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
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import priceOrchestrator from '../../application/PriceOrchestrator.js';
import { settings } from '../../settings.js';

const router = Router();

// ========== FILE UPLOAD CONFIGURATION ==========

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.resolve(settings.dataDir);
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Save with timestamp to avoid overwriting
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.xlsx' && ext !== '.xls') {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
      return;
    }

    cb(null, true);
  }
});

// ========== ROUTE HANDLERS ==========

/**
 * POST /api/v1/price/upload-and-forecast
 * Upload Excel file and run forecast
 *
 * Body (multipart/form-data):
 * - file: Excel file
 * - forecast_days: Number of days to forecast (optional, default: 60)
 * - model_id: Model to use (optional, default: lstm-v1)
 *
 * Response: Forecast result
 */
router.post('/upload-and-forecast', upload.single('file'), async (req, res, next) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload an Excel file.'
      });
    }

    const forecastDays = parseInt(req.body.forecast_days || '60', 10);
    const modelId = req.body.model_id || null;

    // Validate forecast days
    if (isNaN(forecastDays) || forecastDays < 1 || forecastDays > 90) {
      return res.status(400).json({
        success: false,
        error: 'Invalid forecast_days. Must be between 1 and 90'
      });
    }

    console.log(`[Price API] POST /upload-and-forecast (file: ${req.file.filename}, days: ${forecastDays})`);

    // Run forecast with uploaded file
    const forecast = await priceOrchestrator.runForecast(
      forecastDays,
      modelId,
      req.file.path
    );

    res.json({
      success: true,
      message: 'File uploaded and forecast generated successfully',
      data: {
        filename: req.file.filename,
        forecast
      }
    });

  } catch (error) {
    console.error('[Price API] Upload and forecast failed:', error.message);
    next(error);
  }
});

/**
 * POST /api/v1/price/run-forecast
 * Run forecast with default data
 *
 * Body:
 * - forecast_days: Number of days to forecast (optional, default: 60)
 * - model_id: Model to use (optional, default: lstm-v1)
 *
 * Response: Forecast result
 */
router.post('/run-forecast', async (req, res, next) => {
  try {
    const forecastDays = parseInt(req.body.forecast_days || '60', 10);
    const modelId = req.body.model_id || null;

    // Validate forecast days
    if (isNaN(forecastDays) || forecastDays < 1 || forecastDays > 90) {
      return res.status(400).json({
        success: false,
        error: 'Invalid forecast_days. Must be between 1 and 90'
      });
    }

    console.log(`[Price API] POST /run-forecast (days: ${forecastDays}, model: ${modelId || 'default'})`);

    const forecast = await priceOrchestrator.runForecast(forecastDays, modelId);

    res.json({
      success: true,
      data: forecast
    });

  } catch (error) {
    console.error('[Price API] Forecast failed:', error.message);
    next(error);
  }
});

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
    if (isNaN(monthsBack) || monthsBack < 1 || monthsBack > 24) {
      return res.status(400).json({
        success: false,
        error: 'Invalid months_back. Must be between 1 and 24'
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

// ========== ERROR HANDLER FOR MULTER ==========

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${error.message}`
    });
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
    console.log('[Price API] POST /sync-lakehouse');
    // const userId = req.user?.id || 'demo_user';
    const userId = 'demo_user'; // Simplified for now

    const result = await lakehouseProvider.fetchAndSaveToLocal(userId, 1000, res);

    // If result is null, it means auth response was sent or handled internally
    if (!result) return;

    // We can optionally trigger the forecast run immediately here, 
    // but better to let the frontend decide (return file details)
    res.json({
      success: true,
      message: 'Lakehouse data synced successfully',
      data: result
    });
  } catch (error) {
    console.error('[Price API] Lakehouse sync failed:', error.message);
    next(error);
  }
});

export default router;
