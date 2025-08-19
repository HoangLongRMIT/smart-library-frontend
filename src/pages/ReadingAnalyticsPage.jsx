import React, { useEffect, useMemo, useState } from "react";
import "/src/css/pages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
const USE_MOCK = true;      // flip to false when backend is ready
const DEFAULT_LIMIT = 5;

const msToMinutes = (ms) => Math.max(0, Math.round(ms / 60000));
const fmtMinutes = (m) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h && mm) return `${h}h ${mm}m`;
  if (h) return `${h}h`;
  return `${mm}m`;
};
function downloadCSV(filename, rows, columns) {
  const header = columns.map((c) => c.label).join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`)
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

// ---------- MOCK SESSIONS (Mongo-like) ----------
const MOCK_SESSIONS = [
  { _id: "s1", user_id: "u_100", book_id: "bk_001", start_time: "2025-08-15T10:00:00Z", end_time: "2025-08-15T11:12:00Z", device: "iOS",     pages_read: 34, highlights: [{}, {}, {}] },
  { _id: "s2", user_id: "u_100", book_id: "bk_002", start_time: "2025-08-10T08:05:00Z", end_time: "2025-08-10T08:35:00Z", device: "Web",     pages_read: 15, highlights: [] },
  { _id: "s3", user_id: "u_101", book_id: "bk_001", start_time: "2025-08-12T20:00:00Z", end_time: "2025-08-12T21:40:00Z", device: "Android", pages_read: 28, highlights: [{}, {}, {}, {}] },
  { _id: "s4", user_id: "u_102", book_id: "bk_003", start_time: "2025-08-16T12:00:00Z", end_time: "2025-08-16T12:25:00Z", device: "iOS",     pages_read: 10, highlights: [{}] },
  { _id: "s5", user_id: "u_102", book_id: "bk_003", start_time: "2025-08-17T09:00:00Z", end_time: "2025-08-17T10:30:00Z", device: "Web",     pages_read: 22, highlights: [{}, {}] },
  { _id: "s6", user_id: "u_103", book_id: "bk_002", start_time: "2025-08-13T14:00:00Z", end_time: "2025-08-13T14:50:00Z", device: "Android", pages_read: 18, highlights: [{}, {}, {}, {}, {}] },
];

export default function ReadingAnalyticPage() {
  const limit = DEFAULT_LIMIT;

  const [loading, setLoading] = useState(false);
  const [avgSessionPerUser, setAvgSessionPerUser] = useState([]);
  const [mostHighlightedBooks, setMostHighlightedBooks] = useState([]);
  const [topBooksByTime, setTopBooksByTime] = useState([]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", String(limit));
    return p.toString();
  }, [limit]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (USE_MOCK) {
          const sessions = MOCK_SESSIONS;

          const perUser = new Map();
          for (const s of sessions) {
            const dur = msToMinutes(new Date(s.end_time) - new Date(s.start_time));
            const u = s.user_id;
            const cur = perUser.get(u) || { user_id: u, total: 0, count: 0 };
            cur.total += dur; cur.count += 1; perUser.set(u, cur);
          }
          const avgRows = Array.from(perUser.values())
            .map((x) => ({
              user_id: x.user_id,
              sessions: x.count,
              avg_minutes: Math.round(x.total / (x.count || 1)),
              avg_pretty: fmtMinutes(Math.round(x.total / (x.count || 1))),
            }))
            .sort((a, b) => b.avg_minutes - a.avg_minutes)
            .slice(0, limit);

          const byBookHL = new Map();
          for (const s of sessions) {
            const hlCount = Array.isArray(s.highlights) ? s.highlights.length : Number(s.highlights || 0);
            const b = s.book_id;
            const cur = byBookHL.get(b) || { book_id: b, highlights: 0 };
            cur.highlights += hlCount; byBookHL.set(b, cur);
          }
          const highlightRows = Array.from(byBookHL.values())
            .sort((a, b) => b.highlights - a.highlights)
            .slice(0, limit);

          const byBookTime = new Map();
          for (const s of sessions) {
            const dur = msToMinutes(new Date(s.end_time) - new Date(s.start_time));
            const b = s.book_id;
            const cur = byBookTime.get(b) || { book_id: b, total_minutes: 0, total_pretty: "" };
            cur.total_minutes += dur; byBookTime.set(b, cur);
          }
          const timeRows = Array.from(byBookTime.values())
            .map((r) => ({ ...r, total_pretty: fmtMinutes(r.total_minutes) }))
            .sort((a, b) => b.total_minutes - a.total_minutes)
            .slice(0, limit);

          setAvgSessionPerUser(avgRows);
          setMostHighlightedBooks(highlightRows);
          setTopBooksByTime(timeRows);
        } else {
          const [u, h, t] = await Promise.all([
            fetch(`${API_BASE}/analytics/avg-session-time?${params}`).then((r) => r.json()),
            fetch(`${API_BASE}/analytics/most-highlighted-books?${params}`).then((r) => r.json()),
            fetch(`${API_BASE}/analytics/top-books-by-time?${params}`).then((r) => r.json()),
          ]);
          setAvgSessionPerUser(Array.isArray(u) ? u : []);
          setMostHighlightedBooks(Array.isArray(h) ? h : []);
          setTopBooksByTime(Array.isArray(t) ? t : []);
        }
      } catch (e) {
        console.error(e);
        setAvgSessionPerUser([]); setMostHighlightedBooks([]); setTopBooksByTime([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params]);

  return (
    <div style={{ margin: "0 auto"}}>
      <p style={{ marginTop: 0, color: "#64748B", fontSize: 16, paddingLeft: 16}}>
        All time · Top {DEFAULT_LIMIT} 
      </p>

      {loading ? (
        <div style={{ padding: 12, color: "#64748B" }}>Loading analytics…</div>
      ) : null}

      <ReportCard
        title="Average session time per user"
        // description="All time" - (repettive with header)
        rows={avgSessionPerUser}
        emptyText="No sessions recorded."
        columns={[
          { key: "user_id", label: "User" },
          { key: "sessions", label: "Sessions" },
          { key: "avg_pretty", label: "Avg session time" },
        ]}
        onExport={() =>
          downloadCSV(`avg_session_per_user_all_time.csv`, avgSessionPerUser, [
            { key: "user_id", label: "User" },
            { key: "sessions", label: "Sessions" },
            { key: "avg_minutes", label: "Avg minutes" },
          ])
        }
      />

      <ReportCard
        title="Most highlighted books"
        //description="All time"
        rows={mostHighlightedBooks}
        emptyText="No highlights recorded."
        columns={[
          { key: "book_id", label: "Book" },
          { key: "highlights", label: "Highlights" },
        ]}
        onExport={() =>
          downloadCSV(`most_highlighted_books_all_time.csv`, mostHighlightedBooks, [
            { key: "book_id", label: "Book" },
            { key: "highlights", label: "Highlights" },
          ])
        }
      />

      <ReportCard
        title="Top books by total reading time"
        //description={`Top ${DEFAULT_LIMIT} · All time`}
        rows={topBooksByTime}
        emptyText="No reading time recorded."
        columns={[
          { key: "book_id", label: "Book" },
          { key: "total_pretty", label: "Total reading time" },
        ]}
        onExport={() =>
          downloadCSV(`top_books_by_time_all_time.csv`, topBooksByTime, [
            { key: "book_id", label: "Book" },
            { key: "total_minutes", label: "Total minutes" },
          ])
        }
      />
    </div>
  );
}

function ReportCard({ title, description, rows, columns, emptyText, onExport }) {
  return (
    <div className="report-categrory"
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
          <table style={{borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left"}}>
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
