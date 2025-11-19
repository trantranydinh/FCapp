import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/price-forecast", label: "Price Forecast" },
  { href: "/market-insights", label: "Market Insights" },
  { href: "/news-watch", label: "News Watch" }
];

const Layout = ({ title, children }) => (
  <div style={{ display: "flex", minHeight: "100vh", background: "#ffffff" }}>
    <aside
      style={{
        width: "240px",
        padding: "2rem",
        background: "#dc2626",
        color: "#ffffff",
        borderRight: "1px solid #991b1b"
      }}
    >
      <h2 style={{ marginTop: 0, color: "#ffffff" }}>Cashew Forecast</h2>
      <nav style={{ display: "grid", gap: "1rem", marginTop: "2rem" }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              color: "#ffffff",
              textDecoration: "none",
              padding: "0.5rem",
              borderRadius: "8px",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#991b1b"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
    <main style={{ flex: 1, padding: "2.5rem", background: "#f9fafb" }}>
      <h1 style={{ marginTop: 0, color: "#dc2626" }}>{title}</h1>
      {children}
    </main>
  </div>
);

export default Layout;
