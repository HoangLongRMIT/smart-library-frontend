import React, { useEffect, useMemo, useState } from "react";
import "/src/css/pages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

const LIMIT = 10;       
const THRESHOLD = 3;  

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function ReportsPage() {
  const [start, setStart] = useState(daysAgoISO(30));
  const [end, setEnd] = useState(todayISO());

  const [loading, setLoading] = useState(false);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [topReaders, setTopReaders] = useState([]);
  const [lowAvailability, setLowAvailability] = useState([]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    p.set("limit", String(LIMIT));
    return p.toString();
  }, [start, end]);

  const runReports = async () => {
    setLoading(true);
    try {
      const [mbRes, trRes, laRes] = await Promise.all([
        fetch(`${API_BASE}/reports/most-borrowed?${params}`),
        fetch(`${API_BASE}/reports/top-readers?${params}`),
        fetch(`${API_BASE}/reports/low-availability?threshold=${THRESHOLD}&limit=${LIMIT}`),
      ]);

      if (!mbRes.ok || !trRes.ok || !laRes.ok) {
        throw new Error("One of the report endpoints failed");
      }

      const [mb, tr, la] = await Promise.all([
        mbRes.json(),
        trRes.json(),
        laRes.json(),
      ]);

      setMostBorrowed(Array.isArray(mb) ? mb : []);
      setTopReaders(Array.isArray(tr) ? tr : []);
      setLowAvailability(Array.isArray(la) ? la : []);
    } catch (e) {
      console.error(e);
      setMostBorrowed([]);
      setTopReaders([]);
      setLowAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReports();
  }, []);

  return (
    <div className="reports-stack">
      <div className="date-filter-group">
        <Field label="Start date">
          <input
            className="date-input"
            type="date"
            value={start}
            max={end || undefined}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field label="End date">
          <input
            className="date-input"
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
        <div style={{ alignSelf: "end" }}>
          <button
            id="run-reports"
            onClick={runReports}
            disabled={loading}
            style={{
              background: loading ? "#93c5fd" : "#0ea5e9",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Running…" : "Run Reports"}
          </button>
        </div>
      </div>

      <ReportCard
        title="Most borrowed books"
        description={`Within ${start} to ${end}`}
        rows={mostBorrowed}
        emptyText="No borrow activity in this range."
        columns={[
          { key: "title", label: "Title" },
          { key: "authors", label: "Authors" },
          { key: "borrow_count", label: "Borrowed" },
        ]}
      />

      <ReportCard
        title="Top active readers"
        rows={topReaders}
        emptyText="No reader activity in this range."
        columns={[
          { key: "reader_name", label: "Reader" },
          { key: "checkouts_count", label: "Checkouts" },
        ]}
      />

      <ReportCard
        title="Books with low availability"
        rows={lowAvailability}
        emptyText="No low-availability books."
        columns={[
          { key: "title", label: "Title" },
          { key: "available_copies", label: "Available" },
          { key: "total_copies", label: "Total" },
        ]}
      />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="date-range-selector" style={{ display: "block" }}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function ReportCard({ title, description, rows, columns, emptyText }) {
  return (
    <div
      className="report-category"
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div className="title-container">
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
          {description ? (
            <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>{description}</p>
          ) : null}
        </div>
      </div>

      {!rows || rows.length === 0 ? (
        <div style={{ padding: 8, color: "#64748B" }}>{emptyText}</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {columns.map((c) => (
                  <th key={c.key} style={{ padding: 8 }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: 8 }}>
                      {r[c.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
