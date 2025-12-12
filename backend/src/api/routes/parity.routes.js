/**
 * API LAYER: Parity Tool Routes
 *
 * Responsibility: HTTP endpoints for parity calculations
 */

import { Router } from 'express';

const router = Router();

/**
 * POST /api/v1/parity/calculate
 * Calculate Price Ck/lb based on RCN CFR and Quality KOR
 */
router.post('/calculate', async (req, res, next) => {
    try {
        console.log('[Parity API] POST /calculate');
        const { origin, rcnCfr, qualityKor } = req.body;

        // Validation
        if (!origin) {
            return res.status(400).json({ success: false, error: 'Origin is required' });
        }

        const rcnValue = parseFloat(rcnCfr);
        if (isNaN(rcnValue) || rcnValue < 1000 || rcnValue > 2500) {
            return res.status(400).json({
                success: false,
                error: 'Kindly enter the RCN price correctly.'
            });
        }

        const korValue = parseFloat(qualityKor);
        if (isNaN(korValue) || korValue < 40 || korValue > 60) {
            return res.status(400).json({
                success: false,
                error: 'Kindly enter the KOR (lbs/bag) correctly.'
            });
        }

        // TODO: Replace with actual calculation logic and database storage
        // For now, using a simplified formula
        // Price Ck/lb = (RCN CFR / 2204.62) * (Quality KOR / 50) * Origin Factor

        const originFactors = {
            'vietnam': 1.0,
            'cambodia': 0.98,
            'ivory_coast': 1.05,
            'tanzania': 1.02,
            'benin': 1.01,
            'burkina_faso': 1.03,
            'ghana': 1.04,
            'nigeria': 0.99
        };

        const originFactor = originFactors[origin] || 1.0;
        const priceCkLb = (rcnValue / 2204.62) * (korValue / 50) * originFactor;

        const result = {
            priceCkLb: parseFloat(priceCkLb.toFixed(2)),
            origin,
            rcnCfr: rcnValue,
            qualityKor: korValue,
            calculatedAt: new Date().toISOString()
        };

        // TODO: Save to MySQL database
        console.log('[Parity API] Calculation result:', result);

        res.json({ success: true, data: result });

    } catch (error) {
        console.error('[Parity API] Calculate failed:', error.message);
        next(error);
    }
});

/**
 * GET /api/v1/parity/history
 * Get calculation history (TODO: from MySQL)
 */
router.get('/history', async (req, res, next) => {
    try {
        console.log('[Parity API] GET /history');
        const limit = parseInt(req.query.limit || '10', 10);

        // TODO: Fetch from MySQL database
        const mockHistory = [];

        res.json({ success: true, data: mockHistory });

    } catch (error) {
        console.error('[Parity API] History failed:', error.message);
        next(error);
    }
});

/**
 * GET /api/v1/parity/health
 * Health check
 */
router.get('/health', (_req, res) => {
    res.json({ success: true, service: 'Parity API', status: 'healthy', timestamp: new Date().toISOString() });
});

export default router;
