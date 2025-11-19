import Link from "next/link";
import Head from "next/head";

const links = [
  { href: "/lstm-demo", label: "🚀 LSTM Demo (Golden Path)", highlight: true },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/price-forecast", label: "Price Forecast" },
  { href: "/market-insights", label: "Market Insights" },
  { href: "/news-watch", label: "News Watch" }
];

const Home = () => (
  <>
    <Head>
      <title>Cashew Forecast Demo</title>
    </Head>
    <main style={{
      padding: "3rem",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fee2e2 0%, #ffffff 50%, #fecaca 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#ffffff",
        padding: "3rem",
        borderRadius: "24px",
        boxShadow: "0 10px 30px rgba(220, 38, 38, 0.2)",
        border: "3px solid #dc2626",
        maxWidth: "600px"
      }}>
        <h1 style={{ color: "#dc2626", fontSize: "2.5rem", marginTop: 0 }}>Cashew Forecast Demo</h1>
        <p style={{ color: "#6b7280", fontSize: "1.125rem", lineHeight: 1.6 }}>
          Navigate to explore the demo dashboards powered by the Node.js backend.
        </p>
        <nav style={{ display: "grid", gap: "1rem", marginTop: "2rem" }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: "#ffffff",
                background: link.highlight ? "#16a34a" : "#dc2626",
                textDecoration: "none",
                fontWeight: 600,
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                textAlign: "center",
                transition: "all 0.3s",
                boxShadow: link.highlight ? "0 2px 8px rgba(22, 163, 74, 0.3)" : "0 2px 8px rgba(220, 38, 38, 0.3)",
                border: link.highlight ? "2px solid #16a34a" : "none"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = link.highlight ? "#15803d" : "#991b1b";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = link.highlight ? "0 4px 12px rgba(22, 163, 74, 0.4)" : "0 4px 12px rgba(220, 38, 38, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = link.highlight ? "#16a34a" : "#dc2626";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = link.highlight ? "0 2px 8px rgba(22, 163, 74, 0.3)" : "0 2px 8px rgba(220, 38, 38, 0.3)";
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  </>
);

export default Home;
