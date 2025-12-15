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

        // Step 1: Get User ID from session (Legacy INT ID)
        let userId = 1; // Default fallback for LEGACY ID (INT)
        let sessionIdUUID = uuidv4(); // Generate UUID for session here
        let userEmail = null;

        if (req.cookies && req.cookies.session) {
            try {
                const sessionUser = JSON.parse(req.cookies.session);

                // Get Email to lookup ID
                if (sessionUser && sessionUser.email) {
                    userEmail = sessionUser.email;
                }

                // Use LEGACY ID (INT) as initial fallback
                if (sessionUser && sessionUser.legacyId) {
                    userId = sessionUser.legacyId;
                }
            } catch (e) {
                console.error('[Parity API] Error parsing session cookie:', e);
            }
        }

        // Step 1b: Verify/Lookup ID from DB if email is present
        if (userEmail) {
            try {
                const [rows] = await db.query('SELECT id FROM PTool_users WHERE email = ?', [userEmail]);
                if (rows && rows.length > 0) {
                    userId = rows[0].id;
                    console.log(`[Parity API] Resolved User ID: ${userId} for email: ${userEmail}`);
                }
            } catch (dbError) {
                console.error('[Parity API] DB Lookup Error in Calculate:', dbError);
            }
        }

        console.log(`[Parity API] Calculation Request - LegacyUserID: ${userId}, Origin: ${origin}, RCN: ${rcnValue}, KOR: ${korValue}`);

        const rcnVolume = 1000; // Auto volume as per requirements

        // Step 2: Create session
        try {
            await db.query(
                `INSERT INTO PTool_calculation_sessions (session_id, user_id) VALUES (?, ?)`,
                [sessionIdUUID, userId]
            );
            console.log(`[Parity API] Session ${sessionIdUUID} created.`);
        } catch (insertError) {
            console.error('[Parity API] Failed to create session:', insertError.message);
        }

        // Step 4: Call stored procedure
        try {
            await db.query(
                `CALL PTool_run_parity_v1_0(?, ?, ?, ?, ?, ?, ?)`,
                [
                    sessionIdUUID,
                    userId,
                    origin,
                    rcnVolume,
                    rcnValue,
                    korValue,
                    notes || null
                ]
            );
            console.log(`[Parity API] Stored Procedure executed.`);
        } catch (spError) {
            console.error('[Parity API] Stored Procedure Failed:', spError.message);
            throw new Error('Calculation Engine Failed: ' + spError.message);
        }

        // Step 5: Read result
        const [rows] = await db.query(
            `SELECT price_per_kg, price_per_lbs 
             FROM PTool_rcn_parity_calculations 
             WHERE session_id = ? 
             ORDER BY id DESC 
             LIMIT 1`,
            [sessionIdUUID]
        );

        console.log(`[Parity API] Result rows found: ${rows ? rows.length : 0}`);

        if (!rows || rows.length === 0) {
            // Check if ANY sessions exist (debugging)
            const [debugCheck] = await db.query('SELECT count(*) as count FROM PTool_calculation_sessions WHERE session_id = ?', [sessionIdUUID]);
            console.log('[Parity API] Debug - Session exists?', debugCheck[0]);

            throw new Error('Calculation successful but no result returned. Please check input parameters support.');
        }

        const resultData = rows[0];

        const result = {
            priceCkLb: parseFloat(resultData.price_per_lbs),
            priceCkKg: parseFloat(resultData.price_per_kg),
            origin,
            rcnCfr: rcnValue,
            qualityKor: korValue,
            calculatedAt: new Date().toISOString(),
            sessionId: sessionIdUUID
        };

        console.log('[Parity API] Calculation successful:', result);
        res.json(result);

    } catch (error) {
        console.error('[Parity API] Calculate failed:', error.message);
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
        const limit = parseInt(req.query.limit || '20', 10);

        // Step 1: Resolve User ID utilizing Email for reliability
        let userId = 1; // Default fallback used ONLY if absolutely no info found
        let userEmail = null;

        if (req.cookies && req.cookies.session) {
            try {
                const sessionUser = JSON.parse(req.cookies.session);
                if (sessionUser && sessionUser.email) {
                    userEmail = sessionUser.email;
                } else if (sessionUser && sessionUser.legacyId) {
                    // Fallback if email missing but ID present (unlikely)
                    userId = sessionUser.legacyId;
                }
            } catch (e) {
                console.error('[Parity API] Error parsing session for history:', e);
            }
        }

        // Step 2: If we have an email, Lookup the ID definitively from the DB
        if (userEmail) {
            try {
                const [rows] = await db.query('SELECT id FROM PTool_users WHERE email = ?', [userEmail]);
                if (rows && rows.length > 0) {
                    userId = rows[0].id;
                    console.log(`[Parity API] Resolved User ID: ${userId} for email: ${userEmail}`);
                } else {
                    console.warn(`[Parity API] User email ${userEmail} found in session but not in PTool_users. Using default ID: ${userId}`);
                }
            } catch (dbError) {
                console.error('[Parity API] DB Lookup Error:', dbError);
            }
        } else {
            console.warn('[Parity APIHistory] No email found in session. Falling back to default ID.');
        }

        console.log(`[Parity API] Fetching history for user ID (INT): ${userId}`);

        // Fetch using the User-Specific Stored Procedure
        const [results] = await db.query(
            `CALL PTool_sp_get_user_calculation_history(?, ?)`,
            [userId, limit]
        );

        // results[0] contains the actual rows from the SELECT inside the procedure
        const historyData = results[0] || [];

        res.json({ success: true, data: historyData });

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
