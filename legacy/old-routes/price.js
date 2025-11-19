import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import {
  runForecast,
  fetchLatestForecast,
  fetchForecastById,
  listForecastHistory,
  fetchHistoricalPrices,
  getAccuracySummary,
  listAvailableModels
} from "../services/priceService.js";
import { settings } from "../settings.js";

const router = Router();

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.resolve(settings.dataDir);
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, "raw_2025.xlsx");
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xlsx" && ext !== ".xls") {
      cb(new Error("Only Excel files are allowed"));
      return;
    }
    cb(null, true);
  }
});

router.post("/upload-and-forecast", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const forecastDays = Number(req.body.forecast_days || 60);
    const forecast = await runForecast(forecastDays);
    res.json({
      message: "File uploaded and forecast generated successfully",
      filename: req.file.filename,
      forecast
    });
  } catch (error) {
    next(error);
  }
});

router.post("/run-forecast", async (req, res, next) => {
  try {
    const forecastDays = Number(req.body.forecast_days || 60);
    const modelId = req.body.model_id || null;
    const forecast = await runForecast(forecastDays, modelId);
    res.json(forecast);
  } catch (error) {
    next(error);
  }
});

router.get("/models", async (_req, res, next) => {
  try {
    const models = listAvailableModels();
    res.json({
      models,
      count: models.length
    });
  } catch (error) {
    next(error);
  }
});

router.get("/latest", async (_req, res, next) => {
  try {
    const latest = await fetchLatestForecast();
    res.json(latest);
  } catch (error) {
    next(error);
  }
});

router.get("/forecast/:id", async (req, res, next) => {
  try {
    const forecast = await fetchForecastById(req.params.id);
    if (!forecast) {
      res.status(404).json({ message: "Forecast not found" });
      return;
    }
    res.json(forecast);
  } catch (error) {
    next(error);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 10);
    const history = await listForecastHistory(limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

router.get("/historical-data", async (req, res, next) => {
  try {
    const monthsBack = Number(req.query.months_back || 12);
    const data = await fetchHistoricalPrices(monthsBack);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/accuracy", async (_req, res, next) => {
  try {
    const summary = await getAccuracySummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;
