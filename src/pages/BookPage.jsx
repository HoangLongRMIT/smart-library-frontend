import React, { useEffect, useState } from "react";
import BookGrid from "../component/BookGrid";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export default function BookPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "",
    publisher: "",
  });

  useEffect(() => {
    fetch(`${API_BASE}/books`)
      .then((r) => r.json())
      .then((data) => setBooks(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runSearch = async () => {
    const params = new URLSearchParams();
    if (form.title.trim()) params.set("title", form.title.trim());
    if (form.author.trim()) params.set("author", form.author.trim());
    if (form.genre.trim()) params.set("genre", form.genre.trim());
    if (form.publisher.trim()) params.set("publisher", form.publisher.trim());

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/books${params.toString() ? `?${params}` : ""}`
      );
      const data = await res.json();
      setBooks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    setForm({ title: "", author: "", genre: "", publisher: "" });
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/books`);
      const data = await res.json();
      setBooks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  return (
    <>
      <style>{`
        .bp-search-bar {
          position: sticky; top: 0; z-index: 10;
          margin-bottom: 16px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: saturate(120%) blur(6px);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,.04);
        }
        .bp-grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
        @media (min-width: 768px) {
          .bp-grid { grid-template-columns: repeat(12, 1fr); }
          .bp-col-3 { grid-column: span 3; }
          .bp-col-12 { grid-column: span 12; }
        }
        .bp-label { display:block; font-size:13px; color:#475569; margin-bottom:6px; }
        .bp-inputWrap {
          display:flex; align-items:center; gap:8px;
          border:1px solid #e2e8f0; background:#f8fafc;
          padding:10px 12px; border-radius:10px;
          transition: background .2s, border-color .2s, box-shadow .2s;
        }
        .bp-inputWrap:hover { background:#fff; }
        .bp-inputWrap:focus-within {
          background:#fff; border-color:#0ea5e9; box-shadow:0 0 0 2px rgba(14,165,233,.2);
        }
        .bp-input {
          width:100%; border:none; outline:none; background:transparent; color:#0f172a;
        }
        .bp-input::placeholder { color:#94a3b8; }
        .bp-icon { width:18px; height:18px; color:#64748b; flex:0 0 auto; }
        .bp-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding-top:4px; }
        .bp-btn {
          display:inline-flex; align-items:center; gap:8px;
          font-weight:700; border-radius:10px; padding:10px 14px;
          cursor:pointer; transition: transform .02s ease, background .2s, border-color .2s, color .2s;
          user-select:none;
        }
        .bp-btn:active { transform: translateY(1px); }
        .bp-btn--primary { background:#0ea5e9; border:1px solid #0ea5e9; color:#fff; }
        .bp-btn--primary:hover { background:#0284c7; }
        .bp-btn--primary[disabled] { opacity:.6; cursor:not-allowed; }
        .bp-btn--secondary { background:#fff; border:1px solid #cbd5e1; color:#334155; }
        .bp-btn--secondary:hover { background:#f1f5f9; }
        .bp-btn--secondary[disabled] { opacity:.6; cursor:not-allowed; }
        .bp-results {
          margin-left:auto; display:inline-flex; align-items:center;
          padding:6px 10px; border-radius:999px; font-size:13px;
          background:#f1f5f9; color:#334155;
        }
        .bp-chips { margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; }
        .bp-chip {
          display:inline-flex; align-items:center; gap:6px;
          font-size:12px; padding:6px 10px; border-radius:999px;
          background:#f1f5f9; color:#334155;
        }
        .bp-chip__x {
          width:18px; height:18px; display:grid; place-items:center;
          border:none; background:transparent; border-radius:999px; color:#475569; cursor:pointer;
        }
        .bp-chip__x:hover { background:#e2e8f0; }
      `}</style>

      <form className="bp-search-bar" onKeyDown={onKeyDown}>
        <div className="bp-grid">
          <div className="bp-col-3">
            <label className="bp-label">Title</label>
            <div className="bp-inputWrap">
              <svg className="bp-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19z"/>
              </svg>
              <input
                aria-label="Title"
                className="bp-input"
                placeholder="Search by title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>

          <div className="bp-col-3">
            <label className="bp-label">Author</label>
            <div className="bp-inputWrap">
              <svg className="bp-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              <input
                aria-label="Author"
                className="bp-input"
                placeholder="e.g. Rowling"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
          </div>

          <div className="bp-col-3">
            <label className="bp-label">Genre</label>
            <div className="bp-inputWrap">
              <svg className="bp-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/>
              </svg>
              <input
                aria-label="Genre"
                className="bp-input"
                placeholder="e.g. Fantasy"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              />
            </div>
          </div>

          <div className="bp-col-3">
            <label className="bp-label">Publisher</label>
            <div className="bp-inputWrap">
              <svg className="bp-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 2L3 7v13h6v-6h6v6h6V7z"/>
              </svg>
              <input
                aria-label="Publisher"
                className="bp-input"
                placeholder="e.g. Penguin"
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
              />
            </div>
          </div>

          <div className="bp-col-12 bp-actions">
            <button
              type="button"
              onClick={runSearch}
              disabled={loading}
              className="bp-btn bp-btn--primary"
              title="Search books"
            >
              <svg className="bp-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19z"/>
              </svg>
              Search
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={loading}
              className="bp-btn bp-btn--secondary"
              title="Clear filters"
            >
              Clear
            </button>

            <span className="bp-results">
              {loading ? "Loading…" : `${books.length} result${books.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {/* Active filter chips */}
        {(form.title || form.author || form.genre || form.publisher) && (
          <div className="bp-chips">
            {form.title && (
              <Chip label={`Title: ${form.title}`} onClear={() => setForm({ ...form, title: "" })} />
            )}
            {form.author && (
              <Chip label={`Author: ${form.author}`} onClear={() => setForm({ ...form, author: "" })} />
            )}
            {form.genre && (
              <Chip label={`Genre: ${form.genre}`} onClear={() => setForm({ ...form, genre: "" })} />
            )}
            {form.publisher && (
              <Chip label={`Publisher: ${form.publisher}`} onClear={() => setForm({ ...form, publisher: "" })} />
            )}
          </div>
        )}
      </form>

      {loading ? (
        <div style={{ padding: "32px 0", color: "#64748B" }}>Loading…</div>
      ) : (
        <BookGrid books={books} />
      )}
    </>
  );
}

function Chip({ label, onClear }) {
  return (
    <span className="bp-chip">
      {label}
      <button type="button" className="bp-chip__x" onClick={onClear} aria-label={`Remove ${label}`}>
        ×
      </button>
    </span>
  );
}
