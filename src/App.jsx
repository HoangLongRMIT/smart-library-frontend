import { useState } from "react";
import Sidebar from "./component/SideBar";
import BookPage from "./pages/BookPage";
import MyLibraryPage from "./pages/MyLibraryPage";
import AdminBookPage from "./pages/AdminBookPage";
import ReportsPage from "./pages/ReportPage";
import ReadingAnalyticPage from "./pages/ReadingAnalyticsPage";

const sidebarWidth = "230px";

export default function App({ role = "admin" }) {
  const [tab, setTab] = useState("discover");

  const PAGES = {
    discover: <BookPage />,
    books: role === "admin" ? <AdminBookPage /> : <p>Not authorized</p>,
    library: <MyLibraryPage />,
    reports: role === "admin" ? <ReportsPage /> : <p>Not authorized</p>,
    analytics: <ReadingAnalyticPage />,
  };

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
      window.location.href = "/login";
    }
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
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        marginLeft: "var(--sidebar-width)",
      }}>
        <header style={{
          padding: "16px 20px",
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <h2 style={{ margin: 0, fontWeight: 700, color: "#0F172A" }}>
            {TITLES[tab] ?? "Not found"}
          </h2>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ef4444",
              background: "#ef4444",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="Log out"
          >
            Log out
          </button>
        </header>

        <section style={{ padding: 24, maxWidth: 1120, width: "100%", margin: "0 auto", flex: 1 }}>
          {PAGES[tab] ?? <div>Not found</div>}
        </section>
      </main>
    </div>
  );
}
