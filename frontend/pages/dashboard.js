import Head from "next/head";
import { useState } from "react";
import Layout from "@/components/Layout";
import KpiCard from "@/components/KpiCard";
import PriceChart from "@/components/PriceChart";
import NewsList from "@/components/NewsList";
import FileUploadCard from "@/components/FileUploadCard";
import { useDashboardOverview, useHistoricalData } from "@/hooks/useDashboardData";

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;

const DashboardPage = () => {
  const { data: overview, mutate: refreshOverview } = useDashboardOverview();
  const { data: history, mutate: refreshHistory } = useHistoricalData(12);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const metrics = overview?.key_metrics;
  const forecast = overview?.latest_forecast?.detailedData;

  const handleUploadSuccess = (data) => {
    setUploadSuccess(true);
    refreshOverview();
    refreshHistory();
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <>
      <Head>
        <title>Dashboard | Cashew Forecast</title>
      </Head>
      <Layout title="Dashboard Overview">
        <section style={{ display: "grid", gap: "1.5rem" }}>
          <FileUploadCard onUploadSuccess={handleUploadSuccess} />

          {uploadSuccess && (
            <div
              style={{
                padding: "1rem",
                background: "#d1fae5",
                border: "2px solid #059669",
                borderRadius: "12px",
                color: "#065f46",
                fontWeight: 600
              }}
            >
              Forecast updated successfully! Dashboard data refreshed.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <KpiCard label="Current Price" value={formatCurrency(metrics?.current_price)} />
            <KpiCard
              label="Trend"
              value={metrics?.trend || "Neutral"}
              helper={`${metrics?.trend_percentage || 0}%`}
            />
            <KpiCard
              label="Confidence"
              value={`${Math.round((metrics?.confidence || 0) * 100)}%`}
            />
            <KpiCard
              label="LLM Provider"
              value={overview?.api_usage_summary?.providers ? Object.keys(overview.api_usage_summary.providers).join(", ") || "N/A" : "N/A"}
            />
          </div>

          <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "2px solid #e5e7eb" }}>
            <h2 style={{ color: "#dc2626" }}>Historical vs Forecast</h2>
            <PriceChart
              historyDates={history?.dates || []}
              historyPrices={history?.prices || []}
              forecast={forecast}
            />
          </div>

          {overview?.market_sentiment?.ai_insight && (
            <div
              style={{
                background: "#fef3c7",
                border: "2px solid #f59e0b",
                borderRadius: "12px",
                padding: "1.5rem"
              }}
            >
              <h3 style={{ marginTop: 0, color: "#92400e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🤖</span>
                AI Market Insight
              </h3>
              <p style={{ color: "#78350f", lineHeight: 1.6, margin: 0 }}>
                {overview.market_sentiment.ai_insight}
              </p>
            </div>
          )}

          {forecast?.ai_explanation && (
            <div
              style={{
                background: "#f0fdf4",
                border: "2px solid #10b981",
                borderRadius: "12px",
                padding: "1.5rem"
              }}
            >
              <h3 style={{ marginTop: 0, color: "#064e3b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>📊</span>
                AI Forecast Explanation
              </h3>
              <p style={{ color: "#065f46", lineHeight: 1.6, margin: 0 }}>
                {forecast.ai_explanation}
              </p>
              <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#059669" }}>
                Model: {overview?.latest_forecast?.modelName || "Unknown"} (v{overview?.latest_forecast?.modelId})
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: "1rem" }}>
            <h2 style={{ color: "#dc2626" }}>Top News</h2>
            <NewsList items={overview?.top_news || []} />
          </div>
        </section>
      </Layout>
    </>
  );
};

export default DashboardPage;
