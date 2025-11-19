/**
 * API LAYER: Dashboard Routes
 *
 * Responsibility: HTTP endpoints for dashboard data (validation, response formatting only)
 * Uses: DashboardOrchestrator, NewsOrchestrator, MarketOrchestrator (application layer)
 *
 * Principles:
 * - Thin HTTP layer with no business logic
 * - Input validation and sanitization
 * - Standardized error responses
 * - Proper HTTP status codes
 */

import { Router } from 'express';
import dashboardOrchestrator from '../../application/DashboardOrchestrator.js';
import newsOrchestrator from '../../application/NewsOrchestrator.js';
import marketOrchestrator from '../../application/MarketOrchestrator.js';
import { settings } from '../../settings.js';

const router = Router();

/**
 * GET /api/v1/dashboard/overview
 * Get complete dashboard overview
 *
 * Response: Dashboard data with forecasts, metrics, usage
 */
router.get('/overview', async (_req, res, next) => {
  try {
    console.log('[Dashboard API] GET /overview');

    const overview = await dashboardOrchestrator.getOverview();

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('[Dashboard API] Overview failed:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/historical-data
 * Get historical forecast data
 *
 * Query params:
 * - months_back: Number of months to look back (default: 12, max: 24)
 *
 * Response: Historical forecasts
 */
router.get('/historical-data', async (req, res, next) => {
  try {
    const monthsBack = parseInt(req.query.months_back || '12', 10);

    // Validate input
    if (isNaN(monthsBack) || monthsBack < 1 || monthsBack > 24) {
      return res.status(400).json({
        success: false,
        error: 'Invalid months_back. Must be between 1 and 24'
      });
    }

    console.log(`[Dashboard API] GET /historical-data (months: ${monthsBack})`);

    const data = await dashboardOrchestrator.getHistoricalSummary(monthsBack);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Dashboard API] Historical data failed:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/news-summary
 * Get top news items with AI enhancements
 *
 * Query params:
 * - limit: Number of news items (default: 5, max: 20)
 *
 * Response: News summary
 */
router.get('/news-summary', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '5', 10);

    // Validate input
    if (isNaN(limit) || limit < 1 || limit > 20) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 20'
      });
    }

    console.log(`[Dashboard API] GET /news-summary (limit: ${limit})`);

    const summary = await newsOrchestrator.getNewsSummary(limit);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('[Dashboard API] News summary failed:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/market-sentiment
 * Get market sentiment analysis
 *
 * Response: Market sentiment with AI insights
 */
router.get('/market-sentiment', async (_req, res, next) => {
  try {
    console.log('[Dashboard API] GET /market-sentiment');

    const sentiment = await marketOrchestrator.getMarketSentiment();

    res.json({
      success: true,
      data: sentiment
    });

  } catch (error) {
    console.error('[Dashboard API] Market sentiment failed:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/system-status
 * Get system health and status
 *
 * Response: System status including cache stats, LLM status, recent jobs
 */
router.get('/system-status', async (_req, res, next) => {
  try {
    console.log('[Dashboard API] GET /system-status');

    const status = await dashboardOrchestrator.getSystemStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('[Dashboard API] System status failed:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/alerts
 * Get active system alerts
 *
 * Response: Alert list based on system state
 */
router.get('/alerts', async (_req, res, next) => {
  try {
    console.log('[Dashboard API] GET /alerts');

    const alerts = await dashboardOrchestrator.getAlerts({
      llmMaxCallsPerDay: settings.llmMaxCallsPerDay
    });

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('[Dashboard API] Alerts failed:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/health
 * Health check endpoint
 *
 * Response: Simple health status
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'Dashboard API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
