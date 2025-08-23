// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import Sidebar from "./component/SideBar";
import BookPage from "./pages/BookPage";
import MyLibraryPage from "./pages/MyLibraryPage";
import AdminBookPage from "./pages/AdminBookPage";
import ReportsPage from "./pages/ReportPage";
import LoginPage from "./pages/LoginPage";
import ReadingAnalyticPage from "./pages/ReadingAnalyticsPage";

const sidebarWidth = "230px";

export default function App() {
  const [tab, setTab] = useState("discover");
  const [authedUser, setAuthedUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });
  const isAuthed = !!localStorage.getItem("authToken");
  const role = authedUser?.role || "user";

  const PAGES = useMemo(() => ({
    discover: <BookPage />,
    books: role === "admin" ? <AdminBookPage /> : <p>Not authorized</p>,
    library: <MyLibraryPage />,
    reports: role === "admin" ? <ReportsPage /> : <p>Not authorized</p>,
    analytics: <ReadingAnalyticPage />,
  }), [role]);

  const TITLES = {
    discover: "Discover",
    books: "Admin · Books",
    library: "My Library",
    reports: "Reports",
    analytics: "Reading Analytics",
  };

  function handleLogout() {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    } finally {
      setAuthedUser(null);
      setTab("discover");
      // no hard redirect needed; we render LoginPage when !isAuthed
      // window.location.href = "/login";
    }
  }

  // If not authenticated, show LoginPage only
  if (!isAuthed) {
    return <LoginPage onSuccess={(u) => setAuthedUser(u)} />;
  }

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#F8FAFC",
      overflow: "hidden",
      ["--sidebar-width"]: sidebarWidth,
    }}>
      <Sidebar active={tab} onChange={setTab} role={role} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <header className="header">
          <h2 style={{ margin: 0, fontWeight: 700, color: "#0F172A" }}>
            {TITLES[tab] ?? "Not found"}
          </h2>
          <button type="button" onClick={handleLogout} id="logout-btn" title="Log out">
            Log out
          </button>
        </header>

        <section>
          {PAGES[tab] ?? <div>Not found</div>}
        </section>
      </main>
    </div>
  );
}
