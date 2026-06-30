import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMenu } from "../../lib/useMenu";
import { ownerAction } from "../../lib/ownerAuth";

const COMMON_ALLERGIES = ["gluten", "dairy", "eggs", "nuts", "peanuts", "soy", "shellfish", "fish", "sesame"];

const BLANK_ITEM = {
  id: null,
  name: "",
  description: "",
  price: "",
  image_url: "",
  allergies: [],
  quantity_available: 0,
  is_out_of_stock: false,
  is_active: true,
};

export default function OwnerMenuPage() {
  const { items, loading, refetch } = useMenu({ includeInactive: true });
  const [editing, setEditing] = useState(null); // item object or null
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function startNew() {
    setError(null);
    setEditing({ ...BLANK_ITEM });
  }

  function startEdit(item) {
    setError(null);
    setEditing({ ...item, price: String(item.price) });
  }

  async function handleSave(form) {
    setSaving(true);
    setError(null);
    try {
      const price = parseFloat(form.price);
      if (!form.name.trim()) throw new Error("Item needs a name.");
      if (isNaN(price) || price < 0) throw new Error("Enter a valid price.");

      const payload = {
        item: {
          id: form.id || undefined,
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          image_url: form.image_url.trim() || null,
          allergies: form.allergies,
          quantity_available: Number(form.quantity_available) || 0,
          is_out_of_stock: form.is_out_of_stock,
          is_active: form.is_active,
        },
      };
      await ownerAction("upsert_menu_item", payload);
      setEditing(null);
      refetch();
    } catch (e) {
      setError(e.message || "Couldn't save item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Remove "${item.name}" from the menu?`)) return;
    try {
      await ownerAction("delete_menu_item", { item_id: item.id });
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  async function toggleStock(item) {
    try {
      await ownerAction("set_stock", {
        item_id: item.id,
        is_out_of_stock: !item.is_out_of_stock,
        quantity_available: item.quantity_available,
      });
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>STALL COUNTER</p>
          <h1 style={styles.title}>Menu</h1>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.navBtn} onClick={() => navigate("/owner")}>
            Orders
          </button>
          <button style={styles.addBtn} onClick={startNew}>
            + Add item
          </button>
        </div>
      </header>

      {loading && <p style={styles.muted}>Loading menu…</p>}

      <div style={styles.list}>
        {items.map((item) => (
          <div key={item.id} style={styles.row}>
            <div style={styles.thumbWrap}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} style={styles.thumb} />
              ) : (
                <div style={styles.thumbPlaceholder}>no photo</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.rowTop}>
                <p style={styles.itemName}>{item.name}</p>
                <span style={styles.price}>£{Number(item.price).toFixed(2)}</span>
              </div>
              <p style={styles.itemDesc}>{item.description || <em style={{ color: "#b5a586" }}>No description</em>}</p>
              {item.allergies?.length > 0 && (
                <p style={styles.allergyText}>⚠ {item.allergies.join(", ")}</p>
              )}
              <p style={styles.qtyText}>Stock: {item.quantity_available}</p>
            </div>
            <div style={styles.rowActions}>
              <button
                style={{ ...styles.stockBtn, ...(item.is_out_of_stock ? styles.stockBtnOff : styles.stockBtnOn) }}
                onClick={() => toggleStock(item)}
              >
                {item.is_out_of_stock ? "Out of stock" : "In stock"}
              </button>
              <button style={styles.editBtn} onClick={() => startEdit(item)}>
                Edit
              </button>
              <button style={styles.deleteBtn} onClick={() => handleDelete(item)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditModal
          item={editing}
          saving={saving}
          error={error}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={() => handleSave(editing)}
        />
      )}
    </div>
  );
}

function EditModal({ item, saving, error, onChange, onCancel, onSave }) {
  function update(field, value) {
    onChange({ ...item, [field]: value });
  }

  function toggleAllergy(a) {
    const has = item.allergies.includes(a);
    update("allergies", has ? item.allergies.filter((x) => x !== a) : [...item.allergies, a]);
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>{item.id ? "Edit item" : "New item"}</h2>

        <label style={styles.field}>
          <span style={styles.label}>Name</span>
          <input style={styles.input} value={item.name} onChange={(e) => update("name", e.target.value)} />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Description</span>
          <textarea
            style={{ ...styles.input, minHeight: 60, resize: "vertical" }}
            value={item.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ ...styles.field, flex: 1 }}>
            <span style={styles.label}>Price (£)</span>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              min="0"
              value={item.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label style={{ ...styles.field, flex: 1 }}>
            <span style={styles.label}>Stock quantity</span>
            <input
              style={styles.input}
              type="number"
              min="0"
              value={item.quantity_available}
              onChange={(e) => update("quantity_available", e.target.value)}
            />
          </label>
        </div>

        <label style={styles.field}>
          <span style={styles.label}>Image URL</span>
          <input
            style={styles.input}
            value={item.image_url || ""}
            onChange={(e) => update("image_url", e.target.value)}
            placeholder="https://…"
          />
        </label>

        <div style={styles.field}>
          <span style={styles.label}>Allergies</span>
          <div style={styles.allergyGrid}>
            {COMMON_ALLERGIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAllergy(a)}
                style={{
                  ...styles.allergyChip,
                  ...(item.allergies.includes(a) ? styles.allergyChipActive : {}),
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={item.is_out_of_stock}
            onChange={(e) => update("is_out_of_stock", e.target.checked)}
          />
          <span>Mark as out of stock</span>
        </label>

        {error && <p style={styles.errorText}>{error}</p>}

        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={styles.saveBtn} onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save item"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 760, margin: "0 auto", padding: "20px 16px 60px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 },
  eyebrow: { margin: 0, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", color: "var(--ember)", fontWeight: 700 },
  title: { fontFamily: "var(--font-display)", fontSize: 28, margin: "4px 0 0" },
  headerRight: { display: "flex", gap: 8 },
  navBtn: { background: "var(--ink)", color: "var(--cream)", border: "none", borderRadius: 999, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  addBtn: { background: "var(--ember)", color: "white", border: "none", borderRadius: 999, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  muted: { color: "#8a7c5e" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  row: {
    display: "flex",
    gap: 12,
    background: "var(--paper)",
    borderRadius: "var(--radius-md)",
    padding: 12,
    boxShadow: "var(--shadow-ticket)",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  thumbWrap: { width: 70, height: 70, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "var(--cream-dim)" },
  thumb: { width: "100%", height: "100%", objectFit: "cover" },
  thumbPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#b5a586" },
  rowTop: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" },
  itemName: { margin: 0, fontWeight: 700, fontSize: 15.5 },
  price: { fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ember-dark)" },
  itemDesc: { margin: "4px 0 0", fontSize: 13, color: "#6b5d42" },
  allergyText: { margin: "4px 0 0", fontSize: 12, color: "var(--danger)" },
  qtyText: { margin: "4px 0 0", fontSize: 12, color: "#8a7c5e", fontFamily: "var(--font-mono)" },
  rowActions: { display: "flex", flexDirection: "column", gap: 6, marginLeft: "auto" },
  stockBtn: { border: "none", borderRadius: 999, padding: "7px 12px", fontWeight: 700, fontSize: 11.5, cursor: "pointer" },
  stockBtnOn: { background: "#dff0e6", color: "var(--basil-dark)" },
  stockBtnOff: { background: "var(--danger-bg)", color: "var(--danger)" },
  editBtn: { background: "var(--cream-dim)", border: "none", borderRadius: 999, padding: "7px 12px", fontWeight: 700, fontSize: 11.5, cursor: "pointer" },
  deleteBtn: { background: "none", border: "1px solid var(--rust-line)", borderRadius: 999, padding: "7px 12px", fontWeight: 700, fontSize: 11.5, cursor: "pointer", color: "#8a7c5e" },

  overlay: { position: "fixed", inset: 0, background: "rgba(36,25,2,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 },
  modal: {
    background: "var(--cream)",
    width: "100%",
    maxWidth: 520,
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: "22px 22px 0 0",
    padding: "24px 22px 30px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  modalTitle: { fontFamily: "var(--font-display)", fontSize: 22, margin: "0 0 4px" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 700, color: "#5a4d36" },
  input: { padding: "11px 13px", borderRadius: 10, border: "1.5px solid var(--rust-line)", background: "white", fontSize: 15, fontFamily: "inherit" },
  allergyGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  allergyChip: { border: "1.5px solid var(--rust-line)", background: "white", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", color: "#6b5d42" },
  allergyChipActive: { background: "var(--danger)", borderColor: "var(--danger)", color: "white" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 },
  errorText: { color: "var(--danger)", fontWeight: 600, fontSize: 13.5, margin: 0 },
  modalActions: { display: "flex", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, background: "none", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "12px 16px", fontWeight: 700, cursor: "pointer" },
  saveBtn: { flex: 1.4, background: "var(--ember)", color: "white", border: "none", borderRadius: 999, padding: "12px 16px", fontWeight: 700, fontSize: 14.5, cursor: "pointer" },
};
