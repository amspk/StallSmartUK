import { Link } from "react-router-dom";

export default function CustomerTopBar() {
  return (
    <div style={styles.bar}>
      <Link to="/" style={styles.brand}>
        Smart Stall
      </Link>
      <Link to="/owner/login" style={styles.ownerLink}>
        Stall owner?
      </Link>
    </div>
  );
}

const styles = {
  bar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    maxWidth: 720,
    margin: "0 auto",
  },
  brand: {
    fontFamily: "var(--font-display)",
    fontSize: 16,
    color: "var(--ink)",
    textDecoration: "none",
  },
  ownerLink: {
    fontSize: 12.5,
    color: "#8a7c5e",
    textDecoration: "none",
    fontWeight: 600,
  },
};
