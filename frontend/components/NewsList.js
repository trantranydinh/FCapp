const NewsList = ({ items = [] }) => (
  <div style={{ display: "grid", gap: "1rem" }}>
    {items.map((item) => (
      <article
        key={`${item.title}-${item.published_at}`}
        style={{
          padding: "1.25rem",
          borderRadius: "12px",
          background: "#ffffff",
          border: "2px solid #fecaca",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#dc2626" }}>{item.title}</h3>
        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          {item.source} • {new Date(item.published_at).toLocaleString()}
        </div>
        <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#1f2937" }}>{item.summary}</p>
        {item.tags?.length ? (
          <div style={{ fontSize: "0.8rem", color: "#991b1b", fontWeight: 600 }}>
            Tags: {item.tags.join(", ")}
          </div>
        ) : null}
      </article>
    ))}
  </div>
);

export default NewsList;
