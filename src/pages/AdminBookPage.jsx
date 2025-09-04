import React, { useEffect, useMemo, useState } from "react";
import "/src/css/pages.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getCurrentAdminId() {
  const u = getStoredUser();
  const idNum = Number(u?.user_id);
  return Number.isInteger(idNum) && idNum > 0 ? idNum : null;
}

function authHeaders(extra = {}) {
  const adminId = getCurrentAdminId();
  return adminId
    ? { "x-admin-user-id": String(adminId), ...extra }
    : { ...extra };
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
        const res = await fetch(`${API_BASE}/admin/books?limit=500`);
        const data = await res.json();
        if (!cancelled) setBooks(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setBooks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/books?limit=500`);
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
          <button
            className="tab"
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
      {tab === "inventory" && <InventoryPanel loading={loading} books={books} onChange={refresh} />}
      {tab === "retire" && <RetirePanel loading={loading} books={books} onChange={refresh} />}
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

  const canSubmit = form.title.trim() && form.authors.trim() && Number(form.initial_copies) >= 0;

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/books`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
        title: form.title,
        authors: form.authors,
        publisher: form.publisher || "",
        genre: form.genre || "",
        image_url: form.image_url || "",
        admin_user_id: getCurrentAdminId(),
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();

      const count = Number(form.initial_copies || 0);
      if (count > 0) {
        const invRes = await fetch(
          `${API_BASE}/admin/books/${created.id ?? created.book_id}/inventory/update`,
          {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ count, admin_user_id: getCurrentAdminId() }),
          }
        );
        if (!invRes.ok) throw new Error("Inventory seed failed");
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
    <div
      className="add-book-form"
      style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <TextField
          label="Title"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          required
        />
        <TextField
          label="Authors (comma separated)"
          value={form.authors}
          onChange={(v) => setForm({ ...form, authors: v })}
          required
        />
        <TextField
          label="Publisher"
          value={form.publisher}
          onChange={(v) => setForm({ ...form, publisher: v })}
        />
        <TextField
          label="Genre"
          value={form.genre}
          onChange={(v) => setForm({ ...form, genre: v })}
        />
        <TextField
          label="Image URL"
          value={form.image_url}
          onChange={(v) => setForm({ ...form, image_url: v })}
        />
        <NumberField
          label="Initial copies"
          min={0}
          value={form.initial_copies}
          onChange={(v) => setForm({ ...form, initial_copies: v })}
        />
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
  const [edits, setEdits] = useState({});

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return books.filter(
      (b) =>
        String(b.title || "")
          .toLowerCase()
          .includes(q) ||
        String(b.authors || b.author || "")
          .toLowerCase()
          .includes(q) ||
        String(b.ISBN || "")
          .toLowerCase()
          .includes(q)
    );
  }, [books, filter]);

  const setValue = (bookId, val) =>
    setEdits((m) => ({ ...m, [bookId]: val }));

    const save = async (b) => {
      const bookId = b.id ?? b.book_id ?? b.ISBN;
      const current = Number(b.available_copies ?? 0);
      const nextRaw = edits[bookId] ?? current;
      const next = Number(nextRaw);
    
      if (!Number.isFinite(next) || next < 0) {
        alert("Please enter a non-negative number.");
        return;
      }
      if (next === current) return;
    
      setBusyId(bookId);
      try {
        const res = await fetch(
          `${API_BASE}/admin/books/${bookId}/inventory/update`,
          {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ count: next, admin_user_id: getCurrentAdminId() }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Inventory update failed");
        }
    
        await onChange?.();
    
        setEdits((m) => {
          const { [bookId]: _x, ...rest } = m;
          return rest;
        });
      } catch (e) {
        console.error(e);
        alert(e.message || "Inventory update failed");
      } finally {
        setBusyId(null);
      }
    };    

  const unretire = async (b) => {
    const bookId = b.id ?? b.book_id ?? b.ISBN;
    setBusyId(bookId);
    try {
      const res = await fetch(`${API_BASE}/admin/books/${bookId}/unretire`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ admin_user_id: getCurrentAdminId() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Unretire failed");
      }
      
      await onChange?.();

      setEdits((m) => {
        const { [bookId]: _x, ...rest } = m;
        return rest;
      });
    } catch (e) {
      console.error(e);
      alert(e.message || "Unretire failed");
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
              <th style={{ padding: 8 }}>Available</th>
              <th style={{ padding: 8 }}>Set available</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: "#64748B" }}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: "#64748B" }}>
                  No books.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const bookId = b.id ?? b.book_id ?? b.ISBN;
                const available = Number(b.available_copies ?? 0);
                const edited = edits[bookId];
                const value = edited ?? available;
                const changed = Number(value) !== available;
                const isRetired = Boolean(
                  b.is_retired ?? b.retired ?? b.retired_reason
                );

                const disabled = busyId === bookId;

                return (
                  <tr key={bookId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 8 }}>{b.title}</td>
                    <td style={{ padding: 8 }}>{b.authors ?? b.author ?? "—"}</td>
                    <td style={{ padding: 8 }}>{available}</td>

                    <td style={{ padding: 8 }}>
                      <input
                        type="number"
                        min={0}
                        className="input-field"
                        style={{ width: 110 }}
                        value={value}
                        onChange={(e) => setValue(bookId, Math.max(0, Number(e.target.value)))}
                        disabled={disabled}
                      />
                      {changed && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: "#64748B" }}>
                          was {available}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: 8 }}>
                      {isRetired ? (
                        <span style={badgeDanger}>Retired</span>
                      ) : (
                        <span style={badgeOk}>Active</span>
                      )}
                    </td>

                    <td style={{ padding: 8 }}>
                      <button
                        onClick={() => save(b)}
                        disabled={disabled || !changed}
                        style={btnPrimary(disabled || !changed)}
                        title="Save available copies"
                      >
                        Save
                      </button>

                      {isRetired && (
                        <button
                          onClick={() => unretire(b)}
                          disabled={disabled}
                          style={btnSecondary(disabled)}
                          title="Unretire this book"
                        >
                          Unretire
                        </button>
                      )}
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

const badgeOk = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  background: "#ecfeff",
  color: "#0e7490",
  fontWeight: 700,
  fontSize: 12,
  border: "1px solid #a5f3fc",
};

const badgeDanger = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
  fontSize: 12,
  border: "1px solid #fecaca",
};

function RetirePanel({ loading, books, onChange }) {
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const retire = async () => {
    if (!selectedId || !reason.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/admin/books/${selectedId}/retire`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reason: reason.trim(), admin_user_id: getCurrentAdminId() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Retire failed");
      }
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

  const disabled = !selectedId || !reason.trim() || busy;

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
      <div id="retire-form">
        <div className="book-picker-field">
          <label>Select book</label>
          <BookPicker
            books={books}
            value={selectedId}
            onChange={setSelectedId}
            disabled={loading}
          />
        </div>
        <div className="reason-field">
          <TextField
          label="Reason (required)"
          value={reason}
          onChange={(v) => setReason(v)}
          required
          />
        </div>
        <div>
          <button
          id="retire-btn"
            onClick={retire}
            disabled={disabled}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid transparent",
              background: disabled ? "#cbd5e1" : "#000054", // 👈 changes color
              color: "white",
              fontWeight: 700,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Retiring…" : "Retire"}
          </button>
        </div>
      </div>

      <p style={{ color: "#64748B", fontSize: 13, marginTop: 10 }}>
        Retired books are hidden from search and cannot be borrowed. The action and reason are
        logged.
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
      <input className="input-field" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function BookPicker({ books, value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Show the selected label in the input
  useEffect(() => {
    const b = books.find(
      (x) => String(x.id ?? x.book_id ?? x.ISBN) === String(value || "")
    );
    if (b) {
      setQuery(`${b.title}${b.ISBN ? ` (${b.ISBN})` : ""}`);
    } else if (!open) {
      setQuery("");
    }
  }, [value, books]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const toRow = (b) => ({
      id: String(b.id ?? b.book_id ?? b.ISBN),
      title: String(b.title || ""),
      authors: String(b.authors ?? b.author ?? ""),
      isbn: String(b.ISBN ?? ""),
      label: `${b.title}${b.ISBN ? ` (${b.ISBN})` : ""}`,
    });
    const rows = books.map(toRow);
    return rows
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.authors.toLowerCase().includes(q) ||
          r.isbn.toLowerCase().includes(q)
      );
  }, [books, query]);

  const pick = (row) => {
    onChange?.(row.id);
    setQuery(row.label);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        className="input-field"
        placeholder="Search title / author / ISBN"
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 100)} // allow click
      />
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 30,
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginTop: 6,
            maxHeight: 260,
            overflowY: "auto",
            boxShadow:
              "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)",
          }}
          role="listbox"
        >
          {results.map((r, i) => (
            <div
              key={r.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(r)}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                background: i === active ? "#eff6ff" : "white",
                borderBottom: "1px solid #f1f5f9",
              }}
              title={`${r.title}${r.authors ? ` — ${r.authors}` : ""}`}
            >
              <div style={{ fontWeight: 600 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                {r.authors || "Unknown"} {r.isbn ? ` • ${r.isbn}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, max }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="input-field"
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
