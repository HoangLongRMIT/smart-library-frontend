import React, { useCallback, useEffect, useRef, useState } from "react";
import BookGrid from "../component/BookGrid";
import "/src/css/Typo.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export default function BookPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", author: "", genre: "", publisher: "" });
  const lastAbort = useRef(null);

  const fetchBooks = useCallback(async (filters = form) => {
    if (lastAbort.current) lastAbort.current.abort();
    const ctrl = new AbortController();
    lastAbort.current = ctrl;

    const p = new URLSearchParams();
    const t = (s) => String(s || "").trim();
    if (t(filters.title)) p.set("title", t(filters.title));
    if (t(filters.author)) p.set("author", t(filters.author));
    if (t(filters.genre)) p.set("genre", t(filters.genre));
    if (t(filters.publisher)) p.set("publisher", t(filters.publisher));

    p.set("_", Date.now().toString());

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/books${p.toString() ? `?${p}` : ""}`,
        { cache: "no-store", signal: ctrl.signal }
      );
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => { fetchBooks(); }, []);
  useEffect(() => {
    const onFocus = () => fetchBooks();
    const onVisibility = () => { if (!document.hidden) fetchBooks(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchBooks]);

  const runSearch = () => fetchBooks(form);

  const clearAll = () => {
    const cleared = { title: "", author: "", genre: "", publisher: "" };
    setForm(cleared);
    fetchBooks(cleared);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  return (
    <div className="bp-page">
      <form className="bp-search-bar" onKeyDown={onKeyDown}>
        <div className="bp-grid">
          <div className="bp-col-3">
            <div className="bp-label">Title</div>
            <div className="bp-inputWrap">
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
            <div className="bp-label">Author</div>
            <div className="bp-inputWrap">
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
            <div className="bp-label">Genre</div>
            <div className="bp-inputWrap">
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
            <div className="bp-label">Publisher</div>
            <div className="bp-inputWrap">
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
              id="search-btn"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={loading}
              className="bp-btn bp-btn--secondary"
              id="clear-btn"
            >
              Clear
            </button>

            <span className="bp-results">
              {loading ? "Loading…" : `${books.length} result${books.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {(form.title || form.author || form.genre || form.publisher) && (
          <div className="bp-chips">
            {form.title && <Chip label={`Title: ${form.title}`} onClear={() => setForm({ ...form, title: "" })} />}
            {form.author && <Chip label={`Author: ${form.author}`} onClear={() => setForm({ ...form, author: "" })} />}
            {form.genre && <Chip label={`Genre: ${form.genre}`} onClear={() => setForm({ ...form, genre: "" })} />}
            {form.publisher && <Chip label={`Publisher: ${form.publisher}`} onClear={() => setForm({ ...form, publisher: "" })} />}
          </div>
        )}
      </form>

      <BookGrid books={books} />
    </div>
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
