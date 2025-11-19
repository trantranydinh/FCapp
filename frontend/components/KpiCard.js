const KpiCard = ({ label, value, helper }) => (
  <div
    style={{
      padding: "1.25rem",
      borderRadius: "12px",
      background: "#ffffff",
      border: "2px solid #fecaca",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
    }}
  >
    <div style={{ fontSize: "0.85rem", color: "#991b1b", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.5rem", color: "#dc2626" }}>{value}</div>
    {helper && (
      <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#6b7280" }}>
        {helper}
      </div>
    )}
  </div>
);

export default KpiCard;
