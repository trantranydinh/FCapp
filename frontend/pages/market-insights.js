import Head from "next/head";
import Layout from "../components/Layout";
import { useMarketSentiment } from "../hooks/useDashboardData";

const MarketInsightsPage = () => {
  const { data } = useMarketSentiment();

  return (
    <>
      <Head>
        <title>Market Insights | Cashew Forecast</title>
      </Head>
      <Layout title="Market Insights">
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "16px",
            background: "#1e293b",
            marginBottom: "2rem"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Sentiment</h2>
          <p>
            Overall sentiment: <strong>{data?.overall_sentiment || "NEUTRAL"}</strong>
          </p>
          <p>Score: {data?.sentiment_score}</p>
          <p>Confidence: {Math.round((data?.confidence || 0) * 100)}%</p>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          {data?.insights?.map((insight) => (
            <article
              key={insight.section}
              style={{
                padding: "1.25rem",
                borderRadius: "12px",
                background: "#1e293b",
                border: "1px solid rgba(148, 163, 184, 0.2)"
              }}
            >
              <h3 style={{ marginTop: 0 }}>{insight.headline}</h3>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{insight.section}</div>
              <p style={{ marginTop: "0.75rem" }}>{insight.summary}</p>
              <div style={{ fontSize: "0.8rem", color: "#ef4444" }}>
                Impact: {insight.impact_score.toFixed(1)} | Confidence:{" "}
                {Math.round(insight.confidence * 100)}%
              </div>
            </article>
          ))}
        </div>
      </Layout>
    </>
  );
};

export default MarketInsightsPage;
