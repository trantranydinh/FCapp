/**
 * API LAYER: Parity Tool Routes
 *
 * Responsibility: HTTP endpoints for parity calculations
 */

import { Router } from 'express';
import databaseAdapter from '../../infrastructure/db/DatabaseAdapter.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/v1/parity/calculate
 * Calculate Price Ck/lb using stored procedure PTool_run_parity_v1_0
 */
router.post('/calculate', async (req, res, next) => {
    try {
        console.log('[Parity API] POST /calculate');
        const { origin, rcnCfr, qualityKor, rcnVolume, notes } = req.body;

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

        // Generate session ID
        const sessionId = uuidv4();

        // Default values
        const userId = req.user?.id || 1; // From auth middleware, or default to 1
        const volume = rcnVolume || 77265; // Default production volume
        const userNotes = notes || null;

        // Check database connection
        if (!databaseAdapter.isConnected) {
            await databaseAdapter.connect();
        }

        // Call stored procedure PTool_run_parity_v1_0
        console.log('[Parity API] Calling stored procedure PTool_run_parity_v1_0');
        await databaseAdapter.query(
            'CALL PTool_run_parity_v1_0(?, ?, ?, ?, ?, ?, ?)',
            [
                sessionId,
                userId,
                origin,
                volume,
                rcnValue,
                korValue,
                userNotes
            ]
        );

        // Fetch the calculation result
        const [rows] = await databaseAdapter.query(
            'SELECT * FROM PTool_rcn_parity_calculations WHERE session_id = ? ORDER BY timestamp DESC LIMIT 1',
            [sessionId]
        );

        if (!rows || rows.length === 0) {
            throw new Error('Calculation completed but result not found');
        }

        const result = rows[0];

        // Format response
        const response = {
            sessionId: result.session_id,
            priceCkLb: parseFloat(result.price_per_lbs),
            priceCkKg: parseFloat(result.price_per_kg),
            origin: result.origin,
            rcnCfr: parseFloat(result.rcncfr),
            qualityKor: parseFloat(result.qualitykor),
            rcnVolume: parseFloat(result.rcnvolume),
            materialCost: parseFloat(result.material_cost),
            grossMargin: parseFloat(result.gm),
            operatingResult: parseFloat(result.operating_result),
            calculatedAt: result.timestamp
        };

        console.log('[Parity API] Calculation successful:', response);

        res.json({ success: true, data: response });

    } catch (error) {
        console.error('[Parity API] Calculate failed:', error.message);
        next(error);
    }
});

/**
 * GET /api/v1/parity/history
 * Get calculation history from MySQL
 */
router.get('/history', async (req, res, next) => {
    try {
        console.log('[Parity API] GET /history');
        const limit = parseInt(req.query.limit || '20', 10);

        // Check database connection
        if (!databaseAdapter.isConnected) {
            await databaseAdapter.connect();
        }

        // Query calculation history
        const [rows] = await databaseAdapter.query(
            `SELECT
                session_id,
                origin,
                rcncfr,
                qualitykor,
                rcnvolume,
                price_per_lbs,
                price_per_kg,
                material_cost,
                gm,
                operating_result,
                timestamp
            FROM PTool_rcn_parity_calculations
            ORDER BY timestamp DESC
            LIMIT ?`,
            [limit]
        );

        // Format response
        const history = rows.map(row => ({
            sessionId: row.session_id,
            origin: row.origin,
            rcnCfr: parseFloat(row.rcncfr),
            qualityKor: parseFloat(row.qualitykor),
            rcnVolume: parseFloat(row.rcnvolume),
            priceCkLb: parseFloat(row.price_per_lbs),
            priceCkKg: parseFloat(row.price_per_kg),
            materialCost: parseFloat(row.material_cost),
            grossMargin: parseFloat(row.gm),
            operatingResult: parseFloat(row.operating_result),
            timestamp: row.timestamp
        }));

        console.log(`[Parity API] Found ${history.length} history records`);

        res.json({ success: true, data: history });

    } catch (error) {
        console.error('[Parity API] History failed:', error.message);

        // If database not available, return empty array
        if (error.message.includes('not connected') || error.message.includes('ECONNREFUSED')) {
            console.warn('[Parity API] Database not available, returning empty history');
            return res.json({ success: true, data: [] });
        }

        next(error);
    }
});

/**
 * GET /api/v1/parity/health
 * Health check
 */
router.get('/health', async (_req, res) => {
    const dbStatus = databaseAdapter.isConnected ? 'connected' : 'disconnected';
    res.json({
        success: true,
        service: 'Parity API',
        status: 'healthy',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

export default router;
