/**
 * INFRASTRUCTURE LAYER: Python Process Bridge
 *
 * Responsibility: Spawn Python processes and handle stdin/stdout communication
 * Used by: Domain models that need Python ML execution
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PythonBridge {
  constructor() {
    this.timeout = 120000; // 2 minutes default timeout
  }

  /**
   * Execute a Python script with JSON input/output
   * @param {string} scriptPath - Relative path to Python script from project root
   * @param {object} inputData - JSON data to send via stdin
   * @param {object} options - Execution options { timeout }
   * @returns {Promise<object>} - Parsed JSON output from Python
   */
  async execute(scriptPath, inputData, options = {}) {
    const timeout = options.timeout || this.timeout;

    return new Promise((resolve, reject) => {
      // Resolve absolute path
      const projectRoot = path.resolve(__dirname, '../../../../');
      const absoluteScriptPath = path.join(projectRoot, scriptPath);

      // Verify script exists
      if (!fs.existsSync(absoluteScriptPath)) {
        return reject(new Error(`Python script not found: ${absoluteScriptPath}`));
      }

      console.log(`[PythonBridge] Executing: ${absoluteScriptPath}`);
      console.log(`[PythonBridge] Input:`, JSON.stringify(inputData).substring(0, 100) + '...');

      // Spawn Python process
      // Use 'py -3.10' on Windows to target the specific version with TensorFlow support
      // On other platforms, try 'python3.10' or fallback to 'python3'
      const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
      const pythonArgs = process.platform === 'win32' ? ['-3.10', absoluteScriptPath] : [absoluteScriptPath];

      const pythonProcess = spawn(pythonCommand, pythonArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdoutData = '';
      let stderrData = '';
      let timedOut = false;

      // Set timeout
      const timer = setTimeout(() => {
        timedOut = true;
        pythonProcess.kill();
        reject(new Error(`Python execution timed out after ${timeout}ms`));
      }, timeout);

      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`[PythonBridge] Python stderr:`, data.toString());
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        clearTimeout(timer);

        if (timedOut) {
          return; // Already rejected by timeout
        }

        if (code !== 0) {
          console.error(`[PythonBridge] Python exited with code ${code}`);
          console.error(`[PythonBridge] stderr:`, stderrData);
          console.error(`[PythonBridge] stdout (might contain error details):`, stdoutData);
          return reject(new Error(`Python process failed with code ${code}. Stderr: ${stderrData}. Stdout: ${stdoutData}`));
        }

        // Parse JSON output
        try {
          console.log(`[PythonBridge] Raw stdout (first 200 chars):`, stdoutData.substring(0, 200));
          const result = JSON.parse(stdoutData);
          console.log(`[PythonBridge] Successfully parsed JSON output`);
          resolve(result);
        } catch (error) {
          console.error(`[PythonBridge] Failed to parse JSON from Python output`);
          console.error(`[PythonBridge] stdout:`, stdoutData);
          reject(new Error(`Failed to parse Python JSON output: ${error.message}`));
        }
      });

      // Handle process error
      pythonProcess.on('error', (error) => {
        clearTimeout(timer);
        console.error(`[PythonBridge] Process error:`, error);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });

      // Send input data via stdin
      try {
        const inputJson = JSON.stringify(inputData);
        pythonProcess.stdin.write(inputJson);
        pythonProcess.stdin.end();
      } catch (error) {
        clearTimeout(timer);
        pythonProcess.kill();
        reject(new Error(`Failed to send data to Python: ${error.message}`));
      }
    });
  }

  /**
   * Check if Python is available
   * @returns {Promise<boolean>}
   */
  async checkPythonAvailable() {
    return new Promise((resolve) => {
      const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
      const pythonArgs = process.platform === 'win32' ? ['-3.10', '--version'] : ['--version'];

      const pythonProcess = spawn(pythonCommand, pythonArgs);
      pythonProcess.on('close', (code) => {
        resolve(code === 0);
      });
      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }
}

// Export singleton instance
const pythonBridge = new PythonBridge();
export default pythonBridge;
