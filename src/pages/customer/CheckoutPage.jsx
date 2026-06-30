import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../lib/CartContext";
import { supabase, STALL_ID } from "../../lib/supabaseClient";
import { mockMyPosPay } from "../../lib/mockMyPos";

const STEP_DETAILS = "details";
const STEP_PAY = "pay";
const STEP_PROCESSING = "processing";
const STEP_FAILED = "failed";

export default function CheckoutPage() {
  const { lines, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP_DETAILS);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [payError, setPayError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  if (lines.length === 0) {
    navigate("/");
    return null;
  }

  async function placeOrderAndPay() {
    setStep(STEP_PROCESSING);
    setPayError(null);
    setSubmitError(null);

    // 1) Create the order + items first as "pending_payment"
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        stall_id: STALL_ID,
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        notes: notes.trim() || null,
        total_amount: total,
        status: "pending_payment",
        payment_status: "unpaid",
      })
      .select()
      .single();

    if (orderErr || !order) {
      setSubmitError("Couldn't create your order. Please try again.");
      setStep(STEP_PAY);
      return;
    }

    const itemRows = lines.map((l) => ({
      order_id: order.id,
      menu_item_id: l.item.id,
      name_snapshot: l.item.name,
      price_snapshot: l.item.price,
      quantity: l.quantity,
      line_total: Number(l.item.price) * l.quantity,
    }));
    await supabase.from("order_items").insert(itemRows);

    // 2) Run mock myPOS payment
    const result = await mockMyPosPay({ amount: total, cardNumber: card });

    if (!result.success) {
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);
      setPayError(result.error || "Payment failed. Please try a different card.");
      setStep(STEP_FAILED);
      return;
    }

    // 3) Mark paid + placed
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        payment_reference: result.reference,
        status: "placed",
      })
      .eq("id", order.id);

    clearCart();
    navigate(`/order/${order.id}`);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Checkout</h1>

      {step === STEP_DETAILS && (
        <form
          style={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            setStep(STEP_PAY);
          }}
        >
          <Field label="Your name" required>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="So we can call your order"
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              style={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="In case we need to reach you"
            />
          </Field>
          <Field label="Notes for the stall (optional)">
            <textarea
              style={{ ...styles.input, minHeight: 70, resize: "vertical" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="No onions, extra napkins, etc."
            />
          </Field>

          <OrderSummary lines={lines} total={total} />

          <button type="submit" style={styles.primaryBtn}>
            Continue to payment →
          </button>
        </form>
      )}

      {step === STEP_PAY && (
        <div>
          <MyPosCard
            card={card}
            setCard={setCard}
            expiry={expiry}
            setExpiry={setExpiry}
            cvc={cvc}
            setCvc={setCvc}
            total={total}
          />
          {submitError && <p style={styles.errorText}>{submitError}</p>}
          <button style={styles.primaryBtn} onClick={placeOrderAndPay}>
            Pay £{total.toFixed(2)}
          </button>
          <button style={styles.linkBtn} onClick={() => setStep(STEP_DETAILS)}>
            ← Back
          </button>
          <p style={styles.mockNote}>
            This is a mock payment screen for testing. Try a card ending in 0000 to simulate a decline.
          </p>
        </div>
      )}

      {step === STEP_PROCESSING && (
        <div style={styles.processing}>
          <div style={styles.spinner} />
          <p style={{ fontWeight: 700, marginTop: 14 }}>Processing payment…</p>
          <p style={styles.muted}>Talking to myPOS (mock)</p>
        </div>
      )}

      {step === STEP_FAILED && (
        <div style={styles.processing}>
          <p style={{ fontSize: 36 }}>✕</p>
          <p style={{ fontWeight: 700, fontSize: 17 }}>Payment didn't go through</p>
          <p style={styles.muted}>{payError}</p>
          <button style={styles.primaryBtn} onClick={() => setStep(STEP_PAY)}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label} {required && <span style={{ color: "var(--ember)" }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function OrderSummary({ lines, total }) {
  return (
    <div style={styles.summaryBox}>
      <p style={styles.summaryTitle}>Order summary</p>
      {lines.map((l) => (
        <div key={l.item.id} style={styles.summaryRow}>
          <span>
            {l.quantity}× {l.item.name}
          </span>
          <span style={{ fontFamily: "var(--font-mono)" }}>
            £{(l.item.price * l.quantity).toFixed(2)}
          </span>
        </div>
      ))}
      <div style={{ ...styles.summaryRow, fontWeight: 700, borderTop: "1px dashed var(--rust-line)", paddingTop: 8, marginTop: 4 }}>
        <span>Total</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>£{total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function MyPosCard({ card, setCard, expiry, setExpiry, cvc, setCvc, total }) {
  return (
    <div style={styles.posCard}>
      <div style={styles.posHeader}>
        <span style={styles.posLogo}>myPOS</span>
        <span style={styles.posBadge}>TEST MODE</span>
      </div>
      <p style={styles.posAmount}>£{total.toFixed(2)}</p>
      <Field label="Card number">
        <input
          style={styles.input}
          value={card}
          onChange={(e) => setCard(e.target.value)}
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
        />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Expiry">
          <input
            style={styles.input}
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="MM/YY"
          />
        </Field>
        <Field label="CVC">
          <input
            style={styles.input}
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            placeholder="123"
            inputMode="numeric"
          />
        </Field>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 560, margin: "0 auto", padding: "20px 16px 60px" },
  title: { fontFamily: "var(--font-display)", fontSize: 28, margin: "4px 0 18px" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 700, color: "#5a4d36" },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1.5px solid var(--rust-line)",
    background: "var(--paper)",
    fontSize: 15,
    fontFamily: "inherit",
    width: "100%",
  },
  summaryBox: {
    background: "var(--paper)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
    boxShadow: "var(--shadow-ticket)",
  },
  summaryTitle: { margin: "0 0 8px", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em", color: "#8a7c5e" },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "3px 0" },
  primaryBtn: {
    background: "var(--ember)",
    color: "white",
    border: "none",
    borderRadius: 999,
    padding: "14px 16px",
    fontWeight: 700,
    fontSize: 15.5,
    cursor: "pointer",
    width: "100%",
  },
  linkBtn: {
    display: "block",
    margin: "12px auto 0",
    background: "none",
    border: "none",
    color: "var(--ember)",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorText: { color: "var(--danger)", fontWeight: 600, fontSize: 14, textAlign: "center" },
  posCard: {
    background: "var(--ink)",
    color: "var(--cream)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 18px",
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  posHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  posLogo: { fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "-0.01em" },
  posBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    background: "var(--citrus)",
    color: "var(--ink)",
    padding: "3px 8px",
    borderRadius: 6,
    fontWeight: 700,
  },
  posAmount: { fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 700, margin: 0 },
  mockNote: { fontSize: 12.5, color: "#9b8b6a", textAlign: "center", marginTop: 14 },
  processing: { textAlign: "center", padding: "50px 16px" },
  spinner: {
    width: 36,
    height: 36,
    border: "4px solid var(--rust-line)",
    borderTopColor: "var(--ember)",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 0.8s linear infinite",
  },
  muted: { color: "#8a7c5e" },
};

// inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("spin-kf")) {
  const style = document.createElement("style");
  style.id = "spin-kf";
  style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
}
