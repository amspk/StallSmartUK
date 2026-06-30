import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMenu } from "../../lib/useMenu";
import { useCart } from "../../lib/CartContext";

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23f1e5cc'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23c9b89a' text-anchor='middle' dy='.3em'>no photo</text></svg>`
  );

export default function MenuPage() {
  const { items, loading } = useMenu();
  const { lines, addItem, decrementItem, count, total } = useCart();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);

  const qtyFor = (id) => lines.find((l) => l.item.id === id)?.quantity || 0;

  return (
    <div style={styles.page}>
      <header style={styles.hero}>
        <div style={styles.heroTag}>ORDER · No 1–10</div>
        <h1 style={styles.heroTitle}>Today's Menu</h1>
        <p style={styles.heroSub}>Pick what you fancy — pay, and we'll fire it on the grill.</p>
      </header>

      {loading && <p style={styles.muted}>Loading the board…</p>}

      {!loading && items.length === 0 && (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>The board's empty.</p>
          <p style={styles.muted}>The stall hasn't added any items yet — check back soon.</p>
        </div>
      )}

      <div style={styles.grid}>
        {items.map((it) => {
          const qty = qtyFor(it.id);
          const outOfStock = it.is_out_of_stock || it.quantity_available <= 0;
          return (
            <div key={it.id} style={{ ...styles.card, opacity: outOfStock ? 0.55 : 1 }}>
              <div style={styles.imgWrap}>
                <img
                  src={it.image_url || PLACEHOLDER_IMG}
                  alt={it.name}
                  style={styles.img}
                  onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                />
                {outOfStock && <span style={styles.soldOutBadge}>SOLD OUT</span>}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <h3 style={styles.itemName}>{it.name}</h3>
                  <span style={styles.price}>£{Number(it.price).toFixed(2)}</span>
                </div>
                <p style={styles.desc}>{it.description}</p>

                {it.allergies?.length > 0 && (
                  <button
                    style={styles.allergyToggle}
                    onClick={() => setExpanded(expanded === it.id ? null : it.id)}
                  >
                    ⚠ contains {it.allergies.join(", ")}
                  </button>
                )}

                <div style={styles.cardFooter}>
                  {!outOfStock ? (
                    qty === 0 ? (
                      <button style={styles.addBtn} onClick={() => addItem(it)}>
                        Add
                      </button>
                    ) : (
                      <div style={styles.stepper}>
                        <button
                          style={styles.stepBtn}
                          onClick={() => decrementItem(it.id)}
                          aria-label={`Remove one ${it.name}`}
                        >
                          −
                        </button>
                        <span style={styles.stepCount}>{qty}</span>
                        <button
                          style={styles.stepBtn}
                          onClick={() => addItem(it)}
                          aria-label={`Add one more ${it.name}`}
                        >
                          +
                        </button>
                      </div>
                    )
                  ) : (
                    <span style={styles.soldOutText}>Out of stock</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 0 && (
        <button style={styles.cartBar} onClick={() => navigate("/cart")}>
          <span>
            {count} item{count > 1 ? "s" : ""} in basket
          </span>
          <span style={styles.cartBarTotal}>£{total.toFixed(2)} · View basket →</span>
        </button>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "20px 16px 120px",
    minHeight: "100%",
  },
  hero: { marginBottom: 24 },
  heroTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    letterSpacing: "0.12em",
    color: "var(--ember)",
    fontWeight: 600,
  },
  heroTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(28px, 7vw, 40px)",
    margin: "6px 0 4px",
    color: "var(--ink)",
    lineHeight: 1.05,
  },
  heroSub: { margin: 0, color: "#5a4d36", fontSize: 15 },
  muted: { color: "#8a7c5e" },
  empty: {
    textAlign: "center",
    padding: "40px 16px",
    background: "var(--paper)",
    borderRadius: "var(--radius-md)",
    border: "1px dashed var(--rust-line)",
  },
  emptyTitle: { fontWeight: 700, fontSize: 18, margin: "0 0 6px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 14,
  },
  card: {
    background: "var(--paper)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    boxShadow: "var(--shadow-ticket)",
    display: "flex",
    flexDirection: "column",
  },
  imgWrap: { position: "relative", aspectRatio: "16 / 10", background: "var(--cream-dim)" },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  soldOutBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    background: "var(--ink)",
    color: "var(--cream)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.06em",
    padding: "4px 8px",
    borderRadius: 6,
  },
  cardBody: { padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  itemName: { margin: 0, fontSize: 17, fontWeight: 700, fontFamily: "var(--font-body)" },
  price: { fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ember-dark)", whiteSpace: "nowrap" },
  desc: { margin: 0, fontSize: 13.5, color: "#6b5d42", lineHeight: 1.4 },
  allergyToggle: {
    alignSelf: "flex-start",
    background: "var(--danger-bg)",
    color: "var(--danger)",
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: 6,
    cursor: "pointer",
  },
  cardFooter: { marginTop: "auto", display: "flex", justifyContent: "flex-end" },
  addBtn: {
    background: "var(--ember)",
    color: "white",
    border: "none",
    fontWeight: 700,
    fontSize: 14,
    padding: "9px 20px",
    borderRadius: 999,
    cursor: "pointer",
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "var(--cream-dim)",
    borderRadius: 999,
    padding: "4px 6px",
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "none",
    background: "var(--ember)",
    color: "white",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  stepCount: { fontFamily: "var(--font-mono)", fontWeight: 700, minWidth: 18, textAlign: "center" },
  soldOutText: { fontSize: 13, color: "#9b8b6a", fontWeight: 600 },
  cartBar: {
    position: "fixed",
    left: 16,
    right: 16,
    bottom: 16,
    maxWidth: 688,
    margin: "0 auto",
    background: "var(--ink)",
    color: "var(--cream)",
    border: "none",
    borderRadius: 999,
    padding: "16px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "var(--shadow-pop)",
  },
  cartBarTotal: { fontFamily: "var(--font-mono)" },
};
