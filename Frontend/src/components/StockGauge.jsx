// A small horizontal gauge showing stock level relative to a healthy ceiling
// (4x the low-stock threshold, so the bar has meaningful headroom).
// This is the app's signature visual: every product row gets a "fuel gauge"
// read at a glance, styled like a warehouse shelf tag.
export default function StockGauge({ quantity, threshold, compact = false }) {
  const ceiling = Math.max(threshold * 4, quantity, 1);
  const pct = Math.min(100, Math.round((quantity / ceiling) * 100));
  const isLow = quantity <= threshold;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: compact ? 80 : 120 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: "var(--paper-dim)",
          border: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: isLow ? "var(--amber)" : "var(--teal)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span
        className="mono"
        style={{
          fontSize: 12,
          color: isLow ? "#8A5A16" : "var(--text-muted)",
          fontWeight: isLow ? 600 : 400,
          minWidth: compact ? 30 : 50,
        }}
      >
        {quantity}
      </span>
    </div>
  );
}
