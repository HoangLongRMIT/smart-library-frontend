import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
const USE_MOCK = true;

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

function downloadCSV(filename, rows, columns) {
  const header = columns.map((c) => c.label).join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const v = r[c.key] ?? "";
          const s = String(v).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const MOCK_MOST_BORROWED = [
  { book_id: "bk_001", title: "Clean Code", authors: "Robert C. Martin", borrow_count: 42 },
  { book_id: "bk_002", title: "The Pragmatic Programmer", authors: "A. Hunt, D. Thomas", borrow_count: 37 },
  { book_id: "bk_003", title: "Atomic Habits", authors: "James Clear", borrow_count: 31 },
];
const MOCK_TOP_READERS = [
  { user_id: "u_100", reader_name: "Alice Nguyen", checkouts_count: 18 },
  { user_id: "u_101", reader_name: "Bao Tran", checkouts_count: 15 },
  { user_id: "u_102", reader_name: "Minh Le", checkouts_count: 12 },
];
const MOCK_LOW_AVAIL = [
  { book_id: "bk_004", title: "Deep Work", available_copies: 0, total_copies: 6 },
  { book_id: "bk_005", title: "Refactoring", available_copies: 1, total_copies: 5 },
  { book_id: "bk_006", title: "Design Patterns", available_copies: 2, total_copies: 8 },
];

export default function ReportsPage() {
  const [start, setStart] = useState(daysAgoISO(30));
  const [end, setEnd] = useState(todayISO());
  const [limit, setLimit] = useState(10);
  const [threshold, setThreshold] = useState(3);

  const [loading, setLoading] = useState(false);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [topReaders, setTopReaders] = useState([]);
  const [lowAvailability, setLowAvailability] = useState([]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    if (limit) p.set("limit", String(limit));
    return p.toString();
  }, [start, end, limit]);

  const runReports = async () => {
    setLoading(true);
    try {
      if (USE_MOCK) {
        // Simulate network calls
        await new Promise((r) => setTimeout(r, 250));
        setMostBorrowed(MOCK_MOST_BORROWED.slice(0, limit));
        setTopReaders(MOCK_TOP_READERS.slice(0, limit));
        setLowAvailability(MOCK_LOW_AVAIL.filter((b) => b.available_copies <= threshold));
      } else {
        const [mbRes, trRes, laRes] = await Promise.all([
          fetch(`${API_BASE}/reports/most-borrowed?${params}`),
          fetch(`${API_BASE}/reports/top-readers?${params}`),
          fetch(`${API_BASE}/reports/low-availability?threshold=${threshold}&limit=${limit}`),
        ]);
        const [mb, tr, la] = await Promise.all([mbRes.json(), trRes.json(), laRes.json()]);
        setMostBorrowed(Array.isArray(mb) ? mb : []);
        setTopReaders(Array.isArray(tr) ? tr : []);
        setLowAvailability(Array.isArray(la) ? la : []);
      }
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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 100,
        }}
      >
        <Field label="Start date">
          <input
            type="date"
            value={start}
            max={end || undefined}
            onChange={(e) => setStart(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <div style={{ alignSelf: "end" }}>
          <button
            onClick={runReports}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #0ea5e9",
              background: loading ? "#93c5fd" : "#0ea5e9",
              color: "white",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%",
            }}
          >
            {loading ? "Running…" : "Run Reports"}
          </button>
        </div>
      </div>

      {/* Most Borrowed Books */}
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
        onExport={() =>
          downloadCSV(
            `most_borrowed_${start}_${end}.csv`,
            mostBorrowed,
            [
              { key: "title", label: "Title" },
              { key: "authors", label: "Authors" },
              { key: "borrow_count", label: "Borrowed" },
            ]
          )
        }
      />

      <ReportCard
        title="Top active readers"
        rows={topReaders}
        emptyText="No reader activity in this range."
        columns={[
          { key: "reader_name", label: "Reader" },
          { key: "checkouts_count", label: "Checkouts" },
        ]}
        onExport={() =>
          downloadCSV(
            `top_readers_${start}_${end}.csv`,
            topReaders,
            [
              { key: "reader_name", label: "Reader" },
              { key: "checkouts_count", label: "Checkouts" },
            ]
          )
        }
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
        onExport={() =>
          downloadCSV(
            `low_availability_th${threshold}.csv`,
            lowAvailability,
            [
              { key: "title", label: "Title" },
              { key: "available_copies", label: "Available" },
              { key: "total_copies", label: "Total" },
            ]
          )
        }
      />
    </div>
  );
}

// ---- Reusable bits
function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ReportCard({ title, description, rows, columns, emptyText, onExport }) {
  return (
    <div
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
        <div>
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
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

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#fff",
};
