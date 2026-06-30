import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../../lib/useOrders";
import { ownerAction, ownerLogout, getOwnerSession } from "../../lib/ownerAuth";

const FILTERS = [
  { key: "active", label: "Active", statuses: ["placed", "accepted", "ready"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
  { key: "rejected", label: "Rejected / Cancelled", statuses: ["rejected", "cancelled"] },
  { key: "all", label: "All", statuses: null },
];

export default function OwnerOrdersPage() {
  const { orders, loading } = useOrders();
  const [filter, setFilter] = useState("active");
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const navigate = useNavigate();
  const session = getOwnerSession();

  const activeFilter = FILTERS.find((f) => f.key === filter);
  const visible = orders.filter((o) => {
    if (o.payment_status !== "paid") return false; // don't show unpaid/abandoned carts
    if (!activeFilter.statuses) return true;
    return activeFilter.statuses.includes(o.status);
  });

  async function handleStatus(orderId, status, rejection_reason) {
    setBusyId(orderId);
    try {
      await ownerAction("update_order_status", { order_id: orderId, status, rejection_reason });
      setRejectingId(null);
      setRejectReason("");
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleLogout() {
    ownerLogout();
    navigate("/owner/login");
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>STALL COUNTER</p>
          <h1 style={styles.title}>Orders</h1>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.navBtn} onClick={() => navigate("/owner/menu")}>
            Edit menu
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div style={styles.tabs}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ ...styles.tab, ...(filter === f.key ? styles.tabActive : {}) }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p style={styles.muted}>Loading orders…</p>}
      {!loading && visible.length === 0 && (
        <div style={styles.empty}>
          <p style={{ fontWeight: 700, margin: 0 }}>No orders here.</p>
          <p style={styles.muted}>New paid orders will appear automatically.</p>
        </div>
      )}

      <div style={styles.list}>
        {visible.map((o) => (
          <div key={o.id} style={styles.card} className="ticket-edge">
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.orderNum}>#{o.id.slice(0, 8).toUpperCase()}</p>
                <p style={styles.customerName}>{o.customer_name}{o.customer_phone ? ` · ${o.customer_phone}` : ""}</p>
              </div>
              <StatusPill status={o.status} />
            </div>

            <div style={styles.itemsList}>
              {o.order_items?.map((it) => (
                <div key={it.id} style={styles.itemRow}>
                  <span>{it.quantity}× {it.name_snapshot}</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>£{Number(it.line_total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {o.notes && <p style={styles.notes}>"{o.notes}"</p>}

            <div style={styles.cardFooter}>
              <span style={styles.total}>£{Number(o.total_amount).toFixed(2)}</span>

              {o.status === "placed" && rejectingId !== o.id && (
                <div style={styles.actionRow}>
                  <button
                    style={styles.rejectBtn}
                    disabled={busyId === o.id}
                    onClick={() => setRejectingId(o.id)}
                  >
                    Reject
                  </button>
                  <button
                    style={styles.acceptBtn}
                    disabled={busyId === o.id}
                    onClick={() => handleStatus(o.id, "accepted")}
                  >
                    Accept
                  </button>
                </div>
              )}

              {o.status === "accepted" && (
                <button
                  style={styles.acceptBtn}
                  disabled={busyId === o.id}
                  onClick={() => handleStatus(o.id, "ready")}
                >
                  Mark ready
                </button>
              )}

              {o.status === "ready" && (
                <button
                  style={styles.acceptBtn}
                  disabled={busyId === o.id}
                  onClick={() => handleStatus(o.id, "completed")}
                >
                  Mark collected
                </button>
              )}
            </div>

            {rejectingId === o.id && (
              <div style={styles.rejectBox}>
                <input
                  style={styles.rejectInput}
                  placeholder="Reason (e.g. ran out of stock) — optional"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div style={styles.actionRow}>
                  <button style={styles.cancelBtn} onClick={() => setRejectingId(null)}>
                    Cancel
                  </button>
                  <button
                    style={styles.rejectConfirmBtn}
                    onClick={() => handleStatus(o.id, "rejected", rejectReason)}
                  >
                    Confirm reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    placed: { label: "New", bg: "#fde7c2", color: "#8a5a00" },
    accepted: { label: "Preparing", bg: "#e1efe2", color: "var(--basil-dark)" },
    ready: { label: "Ready", bg: "#dff0e6", color: "var(--basil-dark)" },
    completed: { label: "Collected", bg: "#ece6d8", color: "#6b5d42" },
    rejected: { label: "Rejected", bg: "var(--danger-bg)", color: "var(--danger)" },
    cancelled: { label: "Cancelled", bg: "#ece6d8", color: "#6b5d42" },
  };
  const s = map[status] || map.placed;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11.5, fontWeight: 700, padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

const styles = {
  page: { maxWidth: 760, margin: "0 auto", padding: "20px 16px 60px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 },
  eyebrow: { margin: 0, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", color: "var(--ember)", fontWeight: 700 },
  title: { fontFamily: "var(--font-display)", fontSize: 28, margin: "4px 0 0" },
  headerRight: { display: "flex", gap: 8 },
  navBtn: {
    background: "var(--ink)",
    color: "var(--cream)",
    border: "none",
    borderRadius: 999,
    padding: "9px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  logoutBtn: {
    background: "none",
    border: "1.5px solid var(--rust-line)",
    borderRadius: 999,
    padding: "9px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  tabs: { display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" },
  tab: {
    background: "var(--cream-dim)",
    border: "none",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: "#6b5d42",
  },
  tabActive: { background: "var(--ink)", color: "var(--cream)" },
  muted: { color: "#8a7c5e" },
  empty: { textAlign: "center", padding: "40px 16px", background: "var(--paper)", borderRadius: "var(--radius-md)", border: "1px dashed var(--rust-line)" },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  card: { background: "var(--paper)", borderRadius: "var(--radius-md)", padding: "16px 18px", boxShadow: "var(--shadow-ticket)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  orderNum: { margin: 0, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14 },
  customerName: { margin: "2px 0 0", fontSize: 13.5, color: "#6b5d42" },
  itemsList: { marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--rust-line)", display: "flex", flexDirection: "column", gap: 4 },
  itemRow: { display: "flex", justifyContent: "space-between", fontSize: 14 },
  notes: { fontSize: 13, fontStyle: "italic", color: "#8a7c5e", margin: "8px 0 0" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  total: { fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: "var(--ember-dark)" },
  actionRow: { display: "flex", gap: 8 },
  acceptBtn: { background: "var(--basil)", color: "white", border: "none", borderRadius: 999, padding: "9px 18px", fontWeight: 700, fontSize: 13.5, cursor: "pointer" },
  rejectBtn: { background: "none", border: "1.5px solid var(--danger)", color: "var(--danger)", borderRadius: 999, padding: "9px 16px", fontWeight: 700, fontSize: 13.5, cursor: "pointer" },
  rejectBox: { marginTop: 12, display: "flex", flexDirection: "column", gap: 8 },
  rejectInput: { padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--rust-line)", fontSize: 13.5, fontFamily: "inherit" },
  cancelBtn: { background: "none", border: "1.5px solid var(--rust-line)", borderRadius: 999, padding: "9px 16px", fontWeight: 600, fontSize: 13.5, cursor: "pointer" },
  rejectConfirmBtn: { background: "var(--danger)", color: "white", border: "none", borderRadius: 999, padding: "9px 16px", fontWeight: 700, fontSize: 13.5, cursor: "pointer" },
};
