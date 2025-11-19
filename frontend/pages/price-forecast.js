import { useEffect, useState } from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import PriceChart from "@/components/PriceChart";
import KpiCard from "@/components/KpiCard";
import { api, handleError } from "@/lib/apiClient";
import { useHistoricalData } from "@/hooks/useDashboardData";

const PriceForecastPage = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const { data: history } = useHistoricalData(12);

  const loadLatest = async () => {
    try {
      const response = await api.get("/api/v1/price/latest");
      setForecast(response.data);
    } catch (error) {
      console.error(handleError(error));
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  const runForecast = async (days) => {
    try {
      setLoading(true);
      const response = await api.post("/api/v1/price/run-forecast", { forecast_days: days });
      setForecast(response.data);
    } catch (error) {
      console.error(handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: "Base Price", value: `$${forecast?.basePrice?.toLocaleString()}` },
    { label: "Trend", value: forecast?.trendLabel, helper: `${(forecast?.trendPercentage || 0) * 100}%` },
    { label: "Confidence", value: `${Math.round((forecast?.confidenceScore || 0) * 100)}%` }
  ];

  return (
    <>
      <Head>
        <title>Price Forecast | Cashew Forecast</title>
      </Head>
      <Layout title="Price Forecast">
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          {[14, 30, 60].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => runForecast(days)}
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "999px",
                border: "none",
                background: "#ef4444",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                transition: "background 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.background = "#dc2626"}
              onMouseLeave={(e) => e.target.style.background = "#ef4444"}
            >
              {loading ? "Running..." : `Forecast ${days}d`}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {metrics.map((metric) => (
            <KpiCard key={metric.label} {...metric} />
          ))}
        </div>

        <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "16px" }}>
          <PriceChart
            historyDates={history?.dates || []}
            historyPrices={history?.prices || []}
            forecast={forecast?.detailedData}
          />
        </div>
      </Layout>
    </>
  );
};

export default PriceForecastPage;
