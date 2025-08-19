import { useState } from "react";
import Sidebar from "./component/SideBar";
import BookPage from "./pages/BookPage";
import MyLibraryPage from "./pages/MyLibraryPage";
import AdminBookPage from "./pages/AdminBookPage";
import ReportsPage from "./pages/ReportPage";
import LoginPage from "./pages/LoginPage";
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
    login: <LoginPage />,
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
      }}>
        <header className="header">
          <h2 style={{ margin: 0, fontWeight: 700, color: "#0F172A" }}>
            {TITLES[tab] ?? "Not found"}
          </h2>

          <button
            type="button"
            onClick={handleLogout}
            id="logout-btn"
            title="Log out"
          >
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
