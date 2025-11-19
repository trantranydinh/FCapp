import fs from "fs-extra";
import path from "path";
import { settings } from "../settings.js";

const forecastsFile = () => path.join(settings.cacheDir, "forecasts.json");
const usageFile = () => path.join(settings.cacheDir, "api_calls.json");
const runsFile = () => path.join(settings.cacheDir, "job_runs.json");

export const ensureDemoDirectories = () => {
  fs.ensureDirSync(settings.cacheDir);
  fs.ensureDirSync(settings.logDir);
};

const loadJson = async (filePath, fallback) => {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) return fallback;
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to read ${filePath}:`, error.message);
    return fallback;
  }
};

const saveJson = async (filePath, payload) => {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
};

export const cacheForecast = async (forecast) => {
  const list = await loadJson(forecastsFile(), []);
  list.push(forecast);
  await saveJson(forecastsFile(), list);
};

export const listForecasts = async () => loadJson(forecastsFile(), []);

export const logApiUsage = async (entry) => {
  const list = await loadJson(usageFile(), []);
  list.push(entry);
  await saveJson(usageFile(), list);
};

export const getApiUsage = async () => loadJson(usageFile(), []);

export const logJobRun = async (entry) => {
  const list = await loadJson(runsFile(), []);
  list.push(entry);
  await saveJson(runsFile(), list);
};

export const getJobRuns = async () => loadJson(runsFile(), []);
