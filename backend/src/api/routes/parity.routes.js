/**
 * API LAYER: Parity Tool Routes
 *
 * Responsibility: HTTP endpoints for parity calculations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db/mysqlClient.js';

const router = Router();

/**
 * POST /api/v1/parity/calculate
 * Calculate Price Ck/lb based on RCN CFR and Quality KOR
 */
router.post('/calculate', async (req, res, next) => {
    try {
        console.log('[Parity API] POST /calculate');
        const { origin, rcnCfr, qualityKor, notes } = req.body;

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

        // Step 1: Get User ID from session email lookup
        let userId = 1; // Default fallback

        if (req.cookies && req.cookies.session) {
            try {
                const sessionUser = JSON.parse(req.cookies.session);
                const userEmail = sessionUser.email;

                if (userEmail) {
                    // Lookup user ID by email
                    const [userRows] = await db.query(
                        'SELECT id FROM users WHERE email = ?',
                        [userEmail]
                    );

                    if (userRows && userRows.length > 0) {
                        userId = userRows[0].id;
                        console.log(`[Parity API] Found user ID ${userId} for email ${userEmail}`);
                    } else {
                        console.warn(`[Parity API] User with email ${userEmail} not found in DB. Using default ID 1.`);
                    }
                }
            } catch (e) {
                console.error('[Parity API] Error parsing session cookie or looking up user:', e);
            }
        }

        const sessionId = uuidv4();
        const rcnVolume = 1000; // Auto volume as per requirements

        console.log(`[Parity API] Starting calculation session: ${sessionId} for user: ${userId}`);

        // Step 2: Create session
        // INSERT INTO PTool_calculation_sessions (session_id, user_id) VALUES ...
        await db.query(
            `INSERT INTO PTool_calculation_sessions (session_id, user_id) VALUES (?, ?)`,
            [sessionId, userId]
        );

        // Step 4: Call stored procedure
        // CALL PTool_run_parity_v1_0(...)
        await db.query(
            `CALL PTool_run_parity_v1_0(?, ?, ?, ?, ?, ?, ?)`,
            [
                sessionId,
                userId,
                origin,
                rcnVolume,
                rcnValue,
                korValue,
                notes || null
            ]
        );

        // Step 5: Read result
        // SELECT price_per_kg, price_per_lbs FROM PTool_rcn_parity_calculations ...
        const [rows] = await db.query(
            `SELECT price_per_kg, price_per_lbs 
             FROM PTool_rcn_parity_calculations 
             WHERE session_id = ? 
             ORDER BY id DESC 
             LIMIT 1`,
            [sessionId]
        );

        if (!rows || rows.length === 0) {
            throw new Error('Calculation failed: No result returned from database');
        }

        const resultData = rows[0];

        const result = {
            priceCkLb: parseFloat(resultData.price_per_lbs),
            priceCkKg: parseFloat(resultData.price_per_kg),
            origin,
            rcnCfr: rcnValue,
            qualityKor: korValue,
            calculatedAt: new Date().toISOString(),
            sessionId: sessionId
        };

        console.log('[Parity API] Calculation successful:', result);

        res.json({ success: true, data: result });

    } catch (error) {
        console.error('[Parity API] Calculate failed:', error.message);
        // If it's a DB error, it might contain sensitive info, but for internal tool it's okay to log
        next(error);
    }
});

/**
 * GET /api/v1/parity/history
 * Get calculation history
 */
router.get('/history', async (req, res, next) => {
    try {
        console.log('[Parity API] GET /history');
        const limit = parseInt(req.query.limit || '10', 10);

        // Fetch from MySQL database
        const [rows] = await db.query(
            `SELECT * FROM PTool_rcn_parity_calculations ORDER BY timestamp DESC LIMIT ?`,
            [limit]
        );

        res.json({ success: true, data: rows });

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
