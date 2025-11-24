/**
 * INFRASTRUCTURE LAYER: JSON File Cache
 *
 * Responsibility: Persist and retrieve data from JSON files
 * Used by: Application layer services
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class JSONCache {
  constructor(cacheDir = 'outputs/cache', logDir = 'logs') {
    const projectRoot = path.resolve(__dirname, '../../../../');
    this.cacheDir = path.join(projectRoot, cacheDir);
    this.logDir = path.join(projectRoot, logDir);
    this.ensureDirectories();
  }

  /**
   * Ensure cache and log directories exist
   */
  ensureDirectories() {
    fs.ensureDirSync(this.cacheDir);
    fs.ensureDirSync(this.logDir);
  }

  /**
   * Load JSON from file with fallback
   * @private
   */
  async _loadJson(filePath, fallback) {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) return fallback;
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`[JSONCache] Failed to read ${filePath}:`, error.message);
      return fallback;
    }
  }

  /**
   * Save JSON to file
   * @private
   */
  async _saveJson(filePath, payload) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  }

  /**
   * Get file path for forecasts
   */
  _forecastsFile() {
    return path.join(this.cacheDir, 'forecasts.json');
  }

  /**
   * Get file path for API usage
   */
  _usageFile() {
    return path.join(this.cacheDir, 'api_calls.json');
  }

  /**
   * Get file path for job runs
   */
  _runsFile() {
    return path.join(this.cacheDir, 'job_runs.json');
  }

  // ===== FORECAST METHODS =====

  /**
   * Cache a forecast result
   * @param {object} forecast - Forecast object to cache
   */
  async cacheForecast(forecast) {
    console.log(`[JSONCache] Caching forecast: ${forecast.forecastId || 'unknown'}`);
    const list = await this._loadJson(this._forecastsFile(), []);
    list.push(forecast);
    await this._saveJson(this._forecastsFile(), list);
  }

  /**
   * List all cached forecasts
   * @returns {Promise<Array>} - Array of forecast objects
   */
  async listForecasts() {
    return this._loadJson(this._forecastsFile(), []);
  }

  /**
   * Get latest forecast
   * @returns {Promise<object|null>}
   */
  async getLatestForecast() {
    const forecasts = await this.listForecasts();
    return forecasts.length > 0 ? forecasts[forecasts.length - 1] : null;
  }

  /**
   * Clear all forecasts
   */
  async clearForecasts() {
    await this._saveJson(this._forecastsFile(), []);
  }

  // ===== API USAGE METHODS =====

  /**
   * Log API usage
   * @param {object} entry - API usage entry
   */
  async logApiUsage(entry) {
    const list = await this._loadJson(this._usageFile(), []);
    list.push(entry);
    await this._saveJson(this._usageFile(), list);
  }

  /**
   * Get API usage log
   * @returns {Promise<Array>}
   */
  async getApiUsage() {
    return this._loadJson(this._usageFile(), []);
  }

  /**
   * Clear API usage log
   */
  async clearApiUsage() {
    await this._saveJson(this._usageFile(), []);
  }

  // ===== JOB RUN METHODS =====

  /**
   * Log a job run
   * @param {object} entry - Job run entry
   */
  async logJobRun(entry) {
    const list = await this._loadJson(this._runsFile(), []);
    list.push(entry);
    await this._saveJson(this._runsFile(), list);
  }

  /**
   * Get job runs log
   * @returns {Promise<Array>}
   */
  async getJobRuns() {
    return this._loadJson(this._runsFile(), []);
  }

  /**
   * Clear job runs log
   */
  async clearJobRuns() {
    await this._saveJson(this._runsFile(), []);
  }

  // ===== UTILITY METHODS =====

  /**
   * Clear all cache files
   */
  async clearAll() {
    await this.clearForecasts();
    await this.clearApiUsage();
    await this.clearJobRuns();
    console.log('[JSONCache] All cache cleared');
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const forecasts = await this.listForecasts();
    const apiUsage = await this.getApiUsage();
    const jobRuns = await this.getJobRuns();

    return {
      forecasts: forecasts.length,
      apiCalls: apiUsage.length,
      jobRuns: jobRuns.length,
      cacheDir: this.cacheDir,
      logDir: this.logDir
    };
  }
}

// Export singleton instance
const jsonCache = new JSONCache();
export default jsonCache;

// Also export for backwards compatibility with old imports
export const ensureDemoDirectories = () => jsonCache.ensureDirectories();
export const cacheForecast = (forecast) => jsonCache.cacheForecast(forecast);
export const listForecasts = () => jsonCache.listForecasts();
export const logApiUsage = (entry) => jsonCache.logApiUsage(entry);
export const getApiUsage = () => jsonCache.getApiUsage();
export const logJobRun = (entry) => jsonCache.logJobRun(entry);
export const getJobRuns = () => jsonCache.getJobRuns();
