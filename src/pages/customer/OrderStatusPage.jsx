import { useParams, Link } from "react-router-dom";
import { useOrder } from "../../lib/useOrders";

const STAGES = [
  { key: "placed", label: "Order placed" },
  { key: "accepted", label: "Being prepared" },
  { key: "ready", label: "Ready for pickup" },
  { key: "completed", label: "Collected" },
];

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const { order, loading } = useOrder(orderId);

  if (loading) return <div style={styles.page}><p style={styles.muted}>Fetching your ticket…</p></div>;
  if (!order) {
    return (
      <div style={styles.page}>
        <p style={{ fontWeight: 700 }}>We couldn't find that order.</p>
        <Link to="/" style={styles.link}>← Back to menu</Link>
      </div>
    );
  }

  if (order.status === "rejected") {
    return (
      <div style={styles.page}>
        <div style={styles.rejectedBox}>
          <p style={{ fontSize: 32, margin: 0 }}>✕</p>
          <h1 style={styles.rejTitle}>Order declined</h1>
          <p style={styles.muted}>
            {order.rejection_reason || "The stall couldn't take this order."}
          </p>
          <p style={styles.muted}>If you were charged, you'll be refunded.</p>
          <Link to="/" style={styles.primaryLink}>Back to menu</Link>
        </div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === order.status);

  return (
    <div style={styles.page}>
      <div style={styles.ticket} className="ticket-edge">
        <p style={styles.ticketEyebrow}>ORDER TICKET</p>
        <h1 style={styles.ticketNumber}>#{order.id.slice(0, 8).toUpperCase()}</h1>
        <p style={styles.customerLine}>{order.customer_name}</p>

        <div style={styles.itemsList}>
          {order.order_items?.map((it) => (
            <div key={it.id} style={styles.itemRow}>
              <span>{it.quantity}× {it.name_snapshot}</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>£{Number(it.line_total).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={styles.totalRow}>
          <span>Total paid</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>£{Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      <div style={styles.stages}>
        {STAGES.map((s, i) => {
          const done = i <= currentIndex;
          return (
            <div key={s.key} style={styles.stageRow}>
              <span style={{ ...styles.stageDot, background: done ? "var(--basil)" : "var(--rust-line)" }} />
              <span style={{ ...styles.stageLabel, fontWeight: done ? 700 : 500, color: done ? "var(--ink)" : "#a99a7a" }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <Link to="/" style={styles.link}>← Place another order</Link>
    </div>
  );
}

const styles = {
  page: { maxWidth: 480, margin: "0 auto", padding: "24px 16px 60px" },
  muted: { color: "#8a7c5e" },
  link: { display: "inline-block", marginTop: 20, color: "var(--ember)", fontWeight: 700, textDecoration: "none" },
  primaryLink: {
    display: "inline-block",
    marginTop: 16,
    background: "var(--ember)",
    color: "white",
    padding: "12px 22px",
    borderRadius: 999,
    fontWeight: 700,
    textDecoration: "none",
  },
  rejectedBox: {
    textAlign: "center",
    background: "var(--paper)",
    borderRadius: "var(--radius-lg)",
    padding: "36px 20px",
    boxShadow: "var(--shadow-ticket)",
  },
  rejTitle: { fontFamily: "var(--font-display)", margin: "8px 0" },
  ticket: {
    background: "var(--paper)",
    borderRadius: "var(--radius-lg)",
    padding: "26px 22px",
    boxShadow: "var(--shadow-ticket)",
  },
  ticketEyebrow: { margin: 0, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", color: "var(--ember)", fontWeight: 700 },
  ticketNumber: { fontFamily: "var(--font-display)", fontSize: 28, margin: "4px 0" },
  customerLine: { margin: "0 0 16px", color: "#6b5d42", fontWeight: 600 },
  itemsList: { borderTop: "1px dashed var(--rust-line)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 },
  itemRow: { display: "flex", justifyContent: "space-between", fontSize: 14.5 },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 700,
    borderTop: "1px dashed var(--rust-line)",
    marginTop: 10,
    paddingTop: 10,
  },
  stages: { marginTop: 22, display: "flex", flexDirection: "column", gap: 14 },
  stageRow: { display: "flex", alignItems: "center", gap: 12 },
  stageDot: { width: 12, height: 12, borderRadius: "50%", flexShrink: 0 },
  stageLabel: { fontSize: 15 },
};
