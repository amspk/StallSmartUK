import { useNavigate } from "react-router-dom";
import { useCart } from "../../lib/CartContext";

export default function CartPage() {
  const { lines, addItem, decrementItem, removeItem, total } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Your basket</h1>
        <div style={styles.empty}>
          <p style={{ margin: 0, fontWeight: 700 }}>Nothing in here yet.</p>
          <button style={styles.linkBtn} onClick={() => navigate("/")}>
            ← Back to the menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Your basket</h1>

      <div style={styles.list}>
        {lines.map(({ item, quantity }) => (
          <div key={item.id} style={styles.row} className="ticket-edge">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={styles.itemName}>{item.name}</p>
              <p style={styles.unitPrice}>£{Number(item.price).toFixed(2)} each</p>
            </div>
            <div style={styles.stepper}>
              <button style={styles.stepBtn} onClick={() => decrementItem(item.id)}>
                −
              </button>
              <span style={styles.stepCount}>{quantity}</span>
              <button style={styles.stepBtn} onClick={() => addItem(item)}>
                +
              </button>
            </div>
            <p style={styles.lineTotal}>£{(item.price * quantity).toFixed(2)}</p>
            <button style={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={styles.summary}>
        <span>Total</span>
        <span style={styles.totalAmount}>£{total.toFixed(2)}</span>
      </div>

      <div style={styles.actions}>
        <button style={styles.secondaryBtn} onClick={() => navigate("/")}>
          Add more items
        </button>
        <button style={styles.primaryBtn} onClick={() => navigate("/checkout")}>
          Checkout →
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 640, margin: "0 auto", padding: "20px 16px 40px" },
  title: { fontFamily: "var(--font-display)", fontSize: 28, margin: "4px 0 18px" },
  empty: {
    textAlign: "center",
    padding: "50px 16px",
    background: "var(--paper)",
    borderRadius: "var(--radius-md)",
    border: "1px dashed var(--rust-line)",
  },
  linkBtn: {
    marginTop: 12,
    background: "none",
    border: "none",
    color: "var(--ember)",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "var(--paper)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    boxShadow: "var(--shadow-ticket)",
  },
  itemName: { margin: 0, fontWeight: 700, fontSize: 15 },
  unitPrice: { margin: "2px 0 0", fontSize: 12.5, color: "#8a7c5e", fontFamily: "var(--font-mono)" },
  stepper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--cream-dim)",
    borderRadius: 999,
    padding: "4px 6px",
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "none",
    background: "var(--ember)",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  stepCount: { fontFamily: "var(--font-mono)", fontWeight: 700, minWidth: 16, textAlign: "center" },
  lineTotal: { width: 70, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, margin: 0 },
  removeBtn: { background: "none", border: "none", color: "#b5a586", fontSize: 16, cursor: "pointer", padding: 4 },
  summary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    padding: "16px 4px",
    borderTop: "2px dashed var(--rust-line)",
    fontWeight: 700,
    fontSize: 16,
  },
  totalAmount: { fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--ember-dark)" },
  actions: { display: "flex", gap: 10, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    background: "none",
    border: "2px solid var(--ink)",
    borderRadius: 999,
    padding: "13px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryBtn: {
    flex: 1.4,
    background: "var(--ember)",
    color: "white",
    border: "none",
    borderRadius: 999,
    padding: "13px 16px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
  },
};
