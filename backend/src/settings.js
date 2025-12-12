import dotenv from "dotenv";

export const loadEnvironment = () => {
  dotenv.config({ path: process.env.ENV_FILE || "../.env" });
};

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

  // Database settings
  dbType: process.env.DB_TYPE || "none", // mysql, postgresql, sqlite, mongodb, none
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbName: process.env.DB_NAME || "cashew_db",
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbSSL: process.env.DB_SSL === "true"
};
