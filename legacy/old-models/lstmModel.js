import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * LSTM Model Wrapper
 * Bridges Node.js backend with Python LSTM forecaster
 */

class LSTMModel {
  getMetadata() {
    return {
      name: "LSTM Ensemble Forecaster (TensorFlow)",
      version: "2.0.0",
      type: "deep_learning",
      description: "Advanced LSTM ensemble model with 3 neural networks, seasonal patterns, and confidence intervals. Best accuracy for cashew price forecasting."
    };
  }

  async predict(historicalData, horizonDays) {
    // For LSTM, we need the file path since Python will read it directly
    // We'll use the settings to get the data file path
    const { settings } = await import("../settings.js");
    const dataPath = path.resolve(path.join(settings.dataDir, settings.priceDataFile));

    return this.callPythonModel(dataPath, horizonDays);
  }

  async callPythonModel(filePath, forecastDays) {
    return new Promise((resolve, reject) => {
      // Path to Python script
      const scriptPath = path.join(__dirname, "..", "..", "models", "lstm_forecaster.py");

      // Spawn Python process
      const python = spawn("python", [scriptPath]);

      let output = "";
      let error = "";

      // Send input data
      const inputData = {
        file_path: filePath,
        forecast_days: forecastDays
      };

      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();

      // Collect output
      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
      });

      // Handle completion
      python.on("close", (code) => {
        if (code !== 0) {
          console.error("Python script error:", error);
          reject(new Error(`LSTM model failed: ${error || "Unknown error"}`));
        } else {
          try {
            const result = JSON.parse(output);

            if (result.error) {
              reject(new Error(result.message || result.error));
            } else {
              resolve(result);
            }
          } catch (e) {
            console.error("Failed to parse Python output:", output);
            reject(new Error(`Failed to parse LSTM output: ${e.message}`));
          }
        }
      });

      // Handle errors
      python.on("error", (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  }
}

export default new LSTMModel();
