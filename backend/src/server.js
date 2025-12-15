/**
 * BACKEND SERVER: Main Entry Point
 *
 * Responsibility: Initialize Express app, configure middleware, register routes
 *
 * Architecture:
 * - Clean separation of concerns
 * - Centralized error handling
 * - Proper initialization sequence
 * - Graceful shutdown handling
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration
import { loadEnvironment, settings } from './settings.js';

// API Routes
import dashboardRouter from './api/routes/dashboard.routes.js';
import priceRouter from './api/routes/price.routes.js';
import lstmRouter from './api/routes/lstm.routes.js';
import parityRouter from './api/routes/parity.routes.js';
import authRouter from './api/routes/auth.routes.js';

// Infrastructure initialization
import jsonCache from './infrastructure/data/JSONCache.js';
import llmProvider from './infrastructure/llm/LLMProvider.js';

// ========== ENVIRONMENT SETUP ==========

loadEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== EXPRESS APP CONFIGURATION ==========

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Static files
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

// ========== INITIALIZE INFRASTRUCTURE ==========

/**
 * Initialize all infrastructure services
 */
function initializeInfrastructure() {
  console.log('[Server] Initializing infrastructure services...');

  // Ensure cache directories exist
  jsonCache.ensureDirectories();
  console.log('[Server] ✓ Cache directories initialized');

  // Configure LLM provider
  llmProvider.configure({
    provider: settings.llmProvider,
    openAiKey: settings.openAiKey,
    claudeKey: settings.claudeKey
  });
  console.log(`[Server] ✓ LLM provider configured: ${settings.llmProvider}`);

  // Ensure sample data exists (optional - creates demo file if missing)
  ensureSampleDataExists();
  console.log('[Server] ✓ Sample data verified');

  console.log('[Server] Infrastructure initialization complete');
}

/**
 * Ensure sample data file exists
 */
async function ensureSampleDataExists() {
  const fsModule = await import('fs-extra');
  const fs = fsModule.default;
  const { formatISO } = await import('date-fns');

  const filePath = path.join(settings.dataDir, settings.priceDataFile);
  const exists = await fs.pathExists(filePath);

  if (!exists) {
    console.log('[Server] Sample data file not found, creating default...');
    await fs.ensureDir(settings.dataDir);

    // Create minimal CSV header (Excel reader will handle this)
    const sampleData = `Date,Price\n${formatISO(new Date(), { representation: 'date' })},1000\n`;

    await fs.writeFile(filePath, sampleData, 'utf-8');
    console.log(`[Server] Created sample data file: ${filePath}`);
  }
}

// ========== HEALTH CHECK ENDPOINT ==========

app.get('/', (_req, res) => {
  res.json({
    service: 'Cashew Forecast API',
    version: settings.appVersion,
    status: 'running',
    mode: settings.demoMode ? 'demo' : 'production',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      dashboard: '/api/v1/dashboard',
      price: '/api/v1/price',
      lstm: '/api/v1/lstm'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ========== API ROUTES REGISTRATION ==========

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/price', priceRouter);
app.use('/api/v1/lstm', lstmRouter);
app.use('/api/v1/parity', parityRouter);

// ========== ERROR HANDLING MIDDLEWARE ==========

/**
 * 404 handler - Route not found
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

/**
 * Global error handler
 * Catches all errors from routes and middleware
 */
app.use((err, _req, res, _next) => {
  // Log error details
  console.error('[Server] Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error('[Server] Stack trace:', err.stack);
  }

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  };

  res.status(statusCode).json(errorResponse);
});

// ========== SERVER STARTUP ==========

const port = settings.port;

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize infrastructure
    await initializeInfrastructure();

    // Start listening
    const server = app.listen(port, () => {
      console.log('\n' + '='.repeat(60));
      console.log('  🚀 Cashew Forecast Backend Server');
      console.log('='.repeat(60));
      console.log(`  📡 Server: http://localhost:${port}`);
      console.log(`  🔐 Auth API: http://localhost:${port}/api/v1/auth`);
      console.log(`  📊 Dashboard: http://localhost:${port}/api/v1/dashboard`);
      console.log(`  💰 Price API: http://localhost:${port}/api/v1/price`);
      console.log(`  🤖 LSTM API: http://localhost:${port}/api/v1/lstm`);
      console.log(`  🔍 Health: http://localhost:${port}/health`);
      console.log('='.repeat(60));
      console.log(`  Mode: ${settings.demoMode ? 'DEMO' : 'PRODUCTION'}`);
      console.log(`  LLM Provider: ${settings.llmProvider}`);
      console.log('='.repeat(60) + '\n');
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[Server] ${signal} received, shutting down gracefully...`);

      server.close(async () => {
        console.log('[Server] HTTP server closed');

        // Cleanup operations (if any)
        try {
          // Save any pending cache data
          console.log('[Server] Cleanup complete');
          process.exit(0);
        } catch (error) {
          console.error('[Server] Error during cleanup:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
