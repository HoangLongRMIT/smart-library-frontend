import React, { useEffect, useMemo, useState } from "react";
import "/src/css/pages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
const DEFAULT_LIMIT = 5;

const fmtMinutes = (m) => {
  const h = Math.floor(m / 60);
  const mm = Math.max(0, Math.round(m % 60));
  if (h && mm) return `${h}h ${mm}m`;
  if (h) return `${h}h`;
  return `${mm}m`;
};

const adaptAvgSessions = (rows) =>
  (rows || []).map((r) => {
    const avgMin = Math.round(Number(r.avgSessionMinutes ?? 0));
    return {
      user_id: r.user_id,
      avg_minutes: avgMin,
      avg_pretty: fmtMinutes(avgMin),
    };
  });

const adaptMostHighlighted = (rows) =>
  (rows || []).map((r) => ({
    book_id: r.book_id ?? r._id ?? r.id,
    // server returns totalHighlights
    highlights: Number(r.totalHighlights ?? 0),
  }));

const adaptTopBooksTime = (rows) =>
  (rows || []).map((r) => {
    const total = Math.round(Number(r.totalReadingMinutes ?? 0));
    return {
      book_id: r.book_id,
      total_minutes: total,
      total_pretty: fmtMinutes(total),
    };
  });

export default function ReadingAnalyticPage() {
  const limit = DEFAULT_LIMIT;
  const [loading, setLoading] = useState(false);
  const [avgSessionPerUser, setAvgSessionPerUser] = useState([]);
  const [mostHighlightedBooks, setMostHighlightedBooks] = useState([]);
  const [topBooksByTime, setTopBooksByTime] = useState([]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", String(limit)); // used by top-books endpoint
    return p.toString();
  }, [limit]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [u, h, t] = await Promise.all([
          fetch(`${API_BASE}/analytics/avg-session-minutes`).then((r) => r.json()),
          fetch(`${API_BASE}/analytics/most-highlighted-books`).then((r) => r.json()),
          fetch(`${API_BASE}/analytics/top-books-by-reading-time?${params}`).then((r) => r.json()),
        ]);

        setAvgSessionPerUser(adaptAvgSessions(u));
        setMostHighlightedBooks(adaptMostHighlighted(h));
        setTopBooksByTime(adaptTopBooksTime(t));
      } catch (e) {
        console.error("analytics API failed:", e);
        // server-only mode: if it fails, just clear
        setAvgSessionPerUser([]);
        setMostHighlightedBooks([]);
        setTopBooksByTime([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params]);

  return (
    <div style={{ margin: "0 auto" }}>
      <p style={{ marginTop: 0, color: "#64748B", fontSize: 16, paddingLeft: 16 }}>
        All time · Top {DEFAULT_LIMIT}
      </p>

      {loading ? (
        <div style={{ padding: 12, color: "#64748B" }}>Loading analytics…</div>
      ) : null}

      <ReportCard
        title="Average session time per user"
        rows={avgSessionPerUser}
        emptyText="No sessions recorded."
        columns={[
          { key: "user_id", label: "User" },
          { key: "avg_pretty", label: "Avg session time" },
        ]}
      />

      <ReportCard
        title="Most highlighted books"
        rows={mostHighlightedBooks}
        emptyText="No highlights recorded."
        columns={[
          { key: "book_id", label: "Book" },
          { key: "highlights", label: "Highlights" },
        ]}
      />

      <ReportCard
        title="Top books by total reading time"
        rows={topBooksByTime}
        emptyText="No reading time recorded."
        columns={[
          { key: "book_id", label: "Book" },
          { key: "total_pretty", label: "Total reading time" },
        ]}
      />
    </div>
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
