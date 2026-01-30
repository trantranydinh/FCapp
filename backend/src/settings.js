import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define and execute loading immediately
const loadEnvironment = () => {
  // Priority 1: .env.local (Local overrides)
  const localEnvPath = path.resolve(__dirname, '../../.env.local');
  if (fs.existsSync(localEnvPath)) {
    console.log('[Settings] Loading overrides from:', localEnvPath);
    dotenv.config({ path: localEnvPath });
  }

  // Priority 2: .env (Base configuration)
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    console.log('[Settings] Loading defaults from:', envPath);
    // dotenv will not overwrite existing variables from .env.local
    dotenv.config({ path: envPath });
  }

  if (!fs.existsSync(localEnvPath) && !fs.existsSync(envPath)) {
    console.warn('[Settings] Warning: Neither .env.local nor .env found in root.');
  } else {
    console.log('[Settings] ✓ Environment Configuration Complete');
  }
};

// Execute immediately upon module import
loadEnvironment();

export { loadEnvironment };

export const settings = {
  port: Number(process.env.PORT || 50005),
  appName: process.env.APP_NAME || "Cashew Forecast System",
  appVersion: process.env.APP_VERSION || "0.2.0-node",
  demoMode: process.env.APP_MODE !== "production",
  dataDir: process.env.DATA_DIR || "../data",
  priceDataFile: process.env.DEMO_PRICE_DATA_FILE || "raw_2025.xlsx",
  cacheDir: process.env.CACHE_DIR || "outputs/cache",
  logDir: process.env.LOG_DIR || "logs",
  llmProvider: process.env.LLM_PROVIDER || "none",
  openAiKey: process.env.OPENAI_API_KEY || "",
  claudeKey: process.env.ANTHROPIC_API_KEY || "",
  llmMaxCallsPerMinute: Number(process.env.LLM_MAX_CALLS_PER_MIN || 5),
  llmMaxCallsPerDay: Number(process.env.LLM_MAX_CALLS_PER_DAY || 50),

  // External APIs
  newsApiKey: process.env.NEWS_API_KEY || "",
  serpApiKey: process.env.SERP_API_KEY || "",     // Google/SerpAPI
  bingApiKey: process.env.BING_API_KEY || "",

  // Database Configuration
  dbType: process.env.DB_TYPE || "none", // postgresql, mysql, sqlite, mongodb, none
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 5432),
  dbName: process.env.DB_NAME || "cashew_forecast",
  dbUser: process.env.DB_USER || "",
  dbPassword: process.env.DB_PASSWORD || "",
  dbSSL: process.env.DB_SSL === "true",
  dbConnectionString: process.env.DB_CONNECTION_STRING || "",
  dbPath: process.env.DB_PATH || "./data/cashew.db" // For SQLite
};
