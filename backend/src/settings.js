import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define and execute loading immediately
const loadEnvironment = () => {
  // Load from root .env with absolute path (backend/src -> backend -> root)
  // Load from root .env with absolute path (backend/src -> backend -> root)
  console.log('[Settings] Current Dir:', __dirname);
  const envPath = path.resolve(__dirname, '../../.env');
  console.log('[Settings] Resolving .env path to:', envPath);
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn('[Settings] Warning: Could not load .env file from:', envPath);
  } else {
    console.log('[Settings] ✓ Environment loaded from:', envPath);
  }
};

// Execute immediately upon module import
loadEnvironment();

export { loadEnvironment };

export const settings = {
  port: Number(process.env.BACKEND_PORT || 8000),
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
