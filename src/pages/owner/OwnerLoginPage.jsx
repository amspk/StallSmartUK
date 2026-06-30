import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ownerLogin } from "../../lib/ownerAuth";

export default function OwnerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ownerLogin(email.trim(), password);
      navigate("/owner");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>STALL OWNER</p>
        <h1 style={styles.title}>Sign in to your counter</h1>
        <p style={styles.sub}>Manage orders and the menu from here.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Email</span>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Password</span>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.submitBtn} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "var(--ink)",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "var(--paper)",
    borderRadius: "var(--radius-lg)",
    padding: "32px 26px",
    boxShadow: "var(--shadow-pop)",
  },
  eyebrow: { margin: 0, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--ember)", fontWeight: 700 },
  title: { fontFamily: "var(--font-display)", fontSize: 24, margin: "6px 0 4px" },
  sub: { margin: "0 0 22px", color: "#6b5d42", fontSize: 14 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 700, color: "#5a4d36" },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1.5px solid var(--rust-line)",
    background: "white",
    fontSize: 15,
    fontFamily: "inherit",
  },
  error: { color: "var(--danger)", fontWeight: 600, fontSize: 13.5, margin: 0 },
  submitBtn: {
    background: "var(--ember)",
    color: "white",
    border: "none",
    borderRadius: 999,
    padding: "13px 16px",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 4,
  },
};
