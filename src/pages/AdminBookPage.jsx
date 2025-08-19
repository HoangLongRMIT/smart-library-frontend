import React, { useEffect, useMemo, useState } from "react";
import "/src/css/pages.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

async function logAdminAction(action, targetId, details = {}) {
  try {
    await fetch(`${API_BASE}/admin/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        target_type: "book",
        target_id: String(targetId),
        details,
      }),
    });
  } catch (e) {
    console.error("Audit log failed", e);
  }
}

export default function AdminBookPage() {
  const [tab, setTab] = useState("add");
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/books?limit=500`);
        const data = await res.json();
        if (!cancelled) setBooks(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setBooks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/books?limit=500`);
      setBooks(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="maincontent">
      {/* Tabs */}
      <div className="tabs-container">
        {["add", "inventory", "retire"].map((t) => (
          <button className="tab"
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: tab === t ? "#000054" : "#f8fafc",
              color: tab === t ? "white" : "#0f172a",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t === "add" ? "Add Book" : t === "inventory" ? "Update Inventory" : "Retire Book"}
          </button>
        ))}
      </div>

      {tab === "add" && <AddBookPanel onCreated={refresh} />}
      {tab === "inventory" && (
        <InventoryPanel
          loading={loading}
          books={books}
          onChange={refresh}
        />
      )}
      {tab === "retire" && (
        <RetirePanel
          loading={loading}
          books={books}
          onChange={refresh}
        />
      )}
    </div>
  );
}

function AddBookPanel({ onCreated }) {
  const [form, setForm] = useState({
    title: "",
    authors: "",
    publisher: "",
    genre: "",
    ISBN: "",
    image_url: "",
    initial_copies: 1,
  });
  const [saving, setSaving] = useState(false);

  const canSubmit =
    form.title.trim() &&
    form.authors.trim() &&
    Number(form.initial_copies) >= 0;

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();

      await logAdminAction("book.create", created.id ?? created.book_id, {
        snapshot: created,
      });

      const count = Number(form.initial_copies || 0);
      if (count > 0) {
        const invRes = await fetch(
          `${API_BASE}/admin/books/${created.id ?? created.book_id}/inventory/add`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ count }),
          }
        );
        if (!invRes.ok) throw new Error("Inventory seed failed");
        await logAdminAction("inventory.add", created.id ?? created.book_id, {
          count,
        });
      }

      alert("Book created successfully.");
      setForm({
        title: "",
        authors: "",
        publisher: "",
        genre: "",
        ISBN: "",
        image_url: "",
        initial_copies: 1,
      });
      onCreated?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to add book");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-book-form" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12}}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <TextField label="Authors (comma separated)" value={form.authors} onChange={(v) => setForm({ ...form, authors: v })} required />
        <TextField label="Publisher" value={form.publisher} onChange={(v) => setForm({ ...form, publisher: v })} />
        <TextField label="Genre" value={form.genre} onChange={(v) => setForm({ ...form, genre: v })} />
        <TextField label="ISBN" value={form.ISBN} onChange={(v) => setForm({ ...form, ISBN: v })} />
        <TextField label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
        <NumberField label="Initial copies" min={0} value={form.initial_copies} onChange={(v) => setForm({ ...form, initial_copies: v })} />
      </div>

      <div id="submit-btn">
        <button
          onClick={submit}
          disabled={!canSubmit || saving}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid transparent",
            background: canSubmit && !saving ? "#000054" : "#cbd5e1",
            color: "white",
            fontWeight: 700,
            cursor: canSubmit && !saving ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Saving..." : "Create Book"}
        </button>
      </div>
    </div>
  );
}

function InventoryPanel({ loading, books, onChange }) {
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return books.filter(
      (b) =>
        String(b.title || "").toLowerCase().includes(q) ||
        String(b.authors || b.author || "").toLowerCase().includes(q) ||
        String(b.ISBN || "").toLowerCase().includes(q)
    );
  }, [books, filter]);

  const adjust = async (book, delta) => {
    if (!delta) return;
    const bookId = book.id ?? book.book_id ?? book.ISBN;
    const endpoint = delta > 0 ? "add" : "remove";
    setBusyId(bookId);
    try {
      const res = await fetch(`${API_BASE}/admin/books/${bookId}/inventory/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: Math.abs(delta) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Inventory update failed");
      }
      await logAdminAction(`inventory.${endpoint}`, bookId, { count: Math.abs(delta) });
      await onChange?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "Inventory update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
        <input 
          className="input-field"
          id="search-input"
          placeholder="Search by title/author/ISBN"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <FontAwesomeIcon className="search-icon" icon={faMagnifyingGlass} />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: 8 }}>Title</th>
              <th style={{ padding: 8 }}>Authors</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Available</th>
              <th style={{ padding: 8 }}>Borrowed</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 12, color: "#64748B" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 12, color: "#64748B" }}>No books.</td></tr>
            ) : (
              filtered.map((b) => {
                const total = Number(b.total_copies ?? (b.available_copies ?? 0));
                const available = Number(b.available_copies ?? 0);
                const borrowed = Math.max(0, total - available);
                const bookId = b.id ?? b.book_id ?? b.ISBN;
                const disabled = busyId === bookId;

                return (
                  <tr key={bookId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 8 }}>{b.title}</td>
                    <td style={{ padding: 8 }}>{b.authors ?? b.author ?? "—"}</td>
                    <td style={{ padding: 8 }}>{total}</td>
                    <td style={{ padding: 8 }}>{available}</td>
                    <td style={{ padding: 8 }}>{borrowed}</td>
                    <td style={{ padding: 8 }}>
                      <button
                        onClick={() => adjust(b, -1)}
                        disabled={disabled || available <= 0}
                        title="Remove 1 copy"
                        style={btnSecondary(disabled || available <= 0)}
                      >
                        –1
                      </button>
                      <button
                        onClick={() => adjust(b, +1)}
                        disabled={disabled}
                        title="Add 1 copy"
                        style={btnPrimary(disabled)}
                      >
                        +1
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RetirePanel({ loading, books, onChange }) {
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const options = useMemo(
    () =>
      books.map((b) => ({
        id: b.id ?? b.book_id ?? b.ISBN,
        label: `${b.title} ${b.ISBN ? `(${b.ISBN})` : ""}`,
      })),
    [books]
  );

  const retire = async () => {
    if (!selectedId || !reason.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/admin/books/${selectedId}/retire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Retire failed");
      }
      await logAdminAction("book.retire", selectedId, { reason: reason.trim() });
      alert("Book retired.");
      setSelectedId("");
      setReason("");
      await onChange?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "Retire failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr auto", gap: 12 }}>
        <div>
          <label>Select book</label>
          <select
            className="input-field"
            id="select-input"
            disabled={loading}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— Choose —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <TextField
          label="Reason (required)"
          value={reason}
          onChange={(v) => setReason(v)}
          required
        />
      </div>
      <div style={{ alignSelf: "end", marginBottom: 8 }}>
          <button
            onClick={retire}
            disabled={!selectedId || !reason.trim() || busy}
            style={btnDanger(!selectedId || !reason.trim() || busy)}
          >
            {busy ? "Retiring…" : "Retire"}
          </button>
        </div>
      <p style={{ color: "#64748B", fontSize: 13, marginTop: 10 }}>
        Retired books are hidden from search and cannot be borrowed. The action and reason are logged.
      </p>
    </div>
  );
}

function TextField({ label, value, onChange, required }) {
  return (
    <label>
      <span className="label">
        {label} {required ? <span style={{ color: "#ef4444" }}>*</span> : null}
      </span>
      <input className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function NumberField({ label, value, onChange, min = 0, max }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="input-field"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

const btnPrimary = (disabled) => ({
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #0ea5e9",
  background: disabled ? "#bae6fd" : "#0ea5e9",
  color: "white",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  marginRight: 6,
});

const btnSecondary = (disabled) => ({
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: disabled ? "#e2e8f0" : "#f8fafc",
  color: "#0f172a",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  marginRight: 6,
});

const btnDanger = (disabled) => ({
  padding: "4px 8px",
  margin: "8px 0 4px 0",
  borderRadius: 10,
  border: "1px solid transparent",
  background: disabled ? "#fecaca" : "#e60028",
  color: "white",
  fontWeight: 800,
  cursor: disabled ? "not-allowed" : "pointer",
});
