import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

/**
 * Model Registry - Central system for managing forecasting models
 * Supports pluggable models: statistical, ML, or custom implementations
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Model storage directory
const MODELS_DIR = path.join(__dirname, "..", "..", "models");

/**
 * Model interface specification
 * All models must implement these methods:
 * - predict(historicalData, horizonDays): Promise<forecast>
 * - getMetadata(): { name, version, type, description }
 */

class ModelRegistry {
  constructor() {
    this.models = new Map();
    this.defaultModel = "trend-v1";
  }

  /**
   * Register a new forecasting model
   */
  register(modelId, modelImplementation) {
    if (!modelImplementation.predict || !modelImplementation.getMetadata) {
      throw new Error(`Model ${modelId} must implement predict() and getMetadata()`);
    }
    this.models.set(modelId, modelImplementation);
    console.log(`✓ Registered model: ${modelId}`);
  }

  /**
   * Get a model by ID
   */
  get(modelId) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    return model;
  }

  /**
   * List all available models
   */
  list() {
    const modelList = [];
    for (const [id, model] of this.models.entries()) {
      modelList.push({
        id,
        ...model.getMetadata()
      });
    }
    return modelList;
  }

  /**
   * Set default model
   */
  setDefault(modelId) {
    if (!this.models.has(modelId)) {
      throw new Error(`Cannot set default: model ${modelId} not found`);
    }
    this.defaultModel = modelId;
  }

  /**
   * Get default model
   */
  getDefault() {
    return this.get(this.defaultModel);
  }

  /**
   * Load custom model from file (Python bridge, ONNX, etc.)
   */
  async loadCustomModel(modelPath, modelId) {
    // Check if model file exists
    const exists = await fs.pathExists(modelPath);
    if (!exists) {
      throw new Error(`Model file not found: ${modelPath}`);
    }

    // Detect model type by extension
    const ext = path.extname(modelPath).toLowerCase();

    if (ext === ".onnx") {
      // ONNX model - would need onnxruntime-node
      return this.loadOnnxModel(modelPath, modelId);
    } else if (ext === ".json") {
      // JSON-based model configuration
      return this.loadJsonModel(modelPath, modelId);
    } else {
      throw new Error(`Unsupported model format: ${ext}`);
    }
  }

  /**
   * Load ONNX model (placeholder - requires onnxruntime-node)
   */
  async loadOnnxModel(modelPath, modelId) {
    // Would require: npm install onnxruntime-node
    throw new Error("ONNX support not yet implemented. Install onnxruntime-node to enable.");
  }

  /**
   * Load JSON-based model configuration
   */
  async loadJsonModel(modelPath, modelId) {
    const config = await fs.readJSON(modelPath);

    // Create a model wrapper based on JSON config
    const model = {
      getMetadata: () => ({
        name: config.name || modelId,
        version: config.version || "1.0.0",
        type: config.type || "custom",
        description: config.description || "Custom JSON-configured model"
      }),
      predict: async (historicalData, horizonDays) => {
        // This would call out to an external service or use embedded logic
        throw new Error("JSON model must define prediction logic");
      }
    };

    this.register(modelId, model);
    return model;
  }

  /**
   * Save model metadata to disk
   */
  async saveModelMetadata() {
    await fs.ensureDir(MODELS_DIR);
    const metadata = this.list();
    await fs.writeJSON(path.join(MODELS_DIR, "registry.json"), {
      models: metadata,
      defaultModel: this.defaultModel,
      updatedAt: new Date().toISOString()
    }, { spaces: 2 });
  }

  /**
   * Call external Python model via subprocess
   */
  async callPythonModel(scriptPath, data) {
    const { spawn } = await import("child_process");

    return new Promise((resolve, reject) => {
      const python = spawn("python", [scriptPath]);
      let output = "";
      let error = "";

      python.stdin.write(JSON.stringify(data));
      python.stdin.end();

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${error}`));
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(new Error(`Invalid JSON from Python: ${output}`));
          }
        }
      });
    });
  }
}

// Singleton instance
export const modelRegistry = new ModelRegistry();

export default modelRegistry;
