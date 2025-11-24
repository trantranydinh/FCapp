import path from "path";
import fs from "fs-extra";
import { settings } from "../settings.js";
import { enhanceNewsWithLLM } from "./llmService.js";

const newsFile = () => path.join(settings.dataDir, "demo_news.json");

const fallbackNews = () => {
  const now = new Date().toISOString();
  return [
    {
      title: "Export demand for cashew remains steady in Q1",
      source: "Cashew Market Watch",
      summary: "Key buyers in Europe maintain forward contracts, supporting price stability.",
      impact: "MEDIUM",
      reliability: 0.7,
      published_at: now,
      url: "",
      tags: ["Demand", "Europe"]
    },
    {
      title: "Logistics costs tick higher amid shipping constraints",
      source: "Logistics Daily",
      summary: "Freight rates rise 4-6% on select routes, prompting early booking strategies.",
      impact: "HIGH",
      reliability: 0.6,
      published_at: now,
      url: "",
      tags: ["Logistics"]
    }
  ];
};

export const getNewsSummary = async (limit = 5) => {
  try {
    const dataPath = newsFile();
    const exists = await fs.pathExists(dataPath);
    let items = fallbackNews();
    if (exists) {
      const raw = await fs.readFile(dataPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    }
    const top = items.slice(0, limit);

    // Enhance with AI if enabled
    let enhancedNews = top;
    try {
      enhancedNews = await enhanceNewsWithLLM(top);
    } catch (error) {
      console.warn("Failed to enhance news with AI:", error.message);
    }

    return {
      total_count: items.length,
      top_news: enhancedNews,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.warn("Failed to load news data:", error.message);
    const items = fallbackNews();
    return {
      total_count: items.length,
      top_news: items.slice(0, limit),
      last_updated: new Date().toISOString()
    };
  }
};
