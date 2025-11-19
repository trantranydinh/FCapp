import { Router } from "express";
import { getDashboardOverview, getHistoricalSummary, getSystemStatus, getAlerts } from "../services/dashboardService.js";
import { getNewsSummary } from "../services/newsService.js";
import { getMarketSentiment } from "../services/marketInsightsService.js";

const router = Router();

router.get("/overview", async (_req, res, next) => {
  try {
    const overview = await getDashboardOverview();
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

router.get("/historical-data", async (req, res, next) => {
  try {
    const monthsBack = Number(req.query.months_back || 12);
    const data = await getHistoricalSummary({ monthsBack });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/news-summary", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 5);
    const summary = await getNewsSummary(limit);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

router.get("/market-sentiment", async (_req, res, next) => {
  try {
    const sentiment = await getMarketSentiment();
    res.json(sentiment);
  } catch (error) {
    next(error);
  }
});

router.get("/system-status", async (_req, res, next) => {
  try {
    const status = await getSystemStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

router.get("/alerts", async (_req, res, next) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

export default router;
