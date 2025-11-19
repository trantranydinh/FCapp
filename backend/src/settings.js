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
  llmMaxCallsPerDay: Number(process.env.LLM_MAX_CALLS_PER_DAY || 50)
};
