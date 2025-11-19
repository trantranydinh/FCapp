import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { loadEnvironment, settings } from "./settings.js";
import dashboardRouter from "./routes/dashboard.js";
import priceRouter from "./routes/price.js";
import lstmRouter from "./api/routes/lstm.routes.js";
import { ensureDemoDirectories } from "./services/demoCache.js";
import { ensureSampleData } from "./services/dashboardService.js";

loadEnvironment();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/static", express.static(path.join(__dirname, "..", "static")));

app.get("/", (_req, res) => {
  res.json({
    message: "Cashew Forecast API - Node.js Demo",
    version: settings.appVersion,
    demoMode: settings.demoMode,
    status: "running"
  });
});

app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/price", priceRouter);
app.use("/api/v1/lstm", lstmRouter); // NEW: LSTM Golden Path

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

const port = settings.port;

ensureDemoDirectories();
ensureSampleData();

app.listen(port, () => {
  console.log(`Cashew Forecast backend listening on http://localhost:${port}`);
});
