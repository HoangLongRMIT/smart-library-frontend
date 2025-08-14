import { useState } from "react";
import Sidebar from "./component/SideBar";
import BookPage from "./pages/BookPage";
import BookDetailDrawer from "./component/BookDetailDrawer";

const sidebarWidth = "230px";

const PAGES = {
  discover: <BookPage />,
  category: <p>Categories coming soon.</p>,
  library:  <p>My Library coming soon.</p>,
  download: <p>Downloads coming soon.</p>,
  audio:    <p>Audio Books coming soon.</p>,
  fav:      <p>Favourites coming soon.</p>,
  settings: <p>Settings coming soon.</p>,
  support:  <p>Support coming soon.</p>,
  logout:   <p>Logout…</p>,
};

export default function App({ role = "user" }) {
  const [tab, setTab] = useState("discover");
  const [selectedBook, setSelectedBook] = useState(null);

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
        <header style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #E5E7EB" }}>
          <h2 style={{ margin: 0, fontWeight: 700, color: "#0F172A" }}>{PAGES[tab] ? tab : "Not found"}</h2>
        </header>
        <section style={{ padding: 24, maxWidth: 1120, width: "100%", margin: "0 auto", flex: 1 }}>
          {PAGES[tab] ?? <div>Not found</div>}
        </section>
      </main>
    </div>
  );
}
