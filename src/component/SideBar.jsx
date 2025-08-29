import React from "react";
import Logo from "./logo";
import "../css/Sidebar.css";

const BLUE = "#000054";
const TEXT = "#334155";
const MUTED = "#94A3B8";
const HOVER = "lightgray";

const NAVS = {
  user: [
    { key: "discover", label: "Discover", icon: "home" },
    { key: "library", label: "My Library", icon: "library" },
  ],
  admin: [
    { key: "discover", label: "Discover", icon: "home" },
    { key: "books", label: "Books", icon: "book" },
    { key: "reports", label: "Reports", icon: "reports" },
    { key: "analytics", label: "Reading Analytics", icon: "analytics" },
  ],
};

function Icon({ name, color }) {
  const common = { width: 20, height: 20, fill: "none", stroke: color, strokeWidth: 2 };
  switch (name) {
    case "home":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"/>
        </svg>
      );
    case "library":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 19V5a2 2 0 0 1 2-2h3v18H6a2 2 0 0 1-2-2z"/>
          <path d="M10 3h4v18h-4z"/>
          <path d="M18 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2V3z"/>
        </svg>
      );
    case "book":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20"/>
          <path d="M6.5 17V7"/>
          <path d="M20 17V7"/>
        </svg>
      );
    case "reports":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 3v18h18"/>
          <path d="M7 13h2v5H7zM11 9h2v9h-2zM15 5h2v13h-2z"/>
        </svg>
      );
    case "analytics":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 19h16"/>
          <path d="M4 15l4-4 4 4 6-6 2 2"/>
        </svg>
      );
    case "logout":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <path d="M16 17l5-5-5-5"/>
          <path d="M21 12H9"/>
        </svg>
      );
    default:
      return null;
  }
}

function NavButton({ item, active, onClick }) {
  const isActive = active === item.key;
  const base = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    border: "1px solid transparent",
    borderRadius: 12,
    background: isActive ? "#E5E7EB" : "transparent",
    color: isActive ? BLUE : TEXT,
    cursor: "pointer",
    transition: "background 200ms ease, color 200ms ease, border-color 200ms ease",
  };
  return (
    <button
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = HOVER;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon name={item.icon} color={isActive ? BLUE : MUTED} />
      <span
        style={{
          fontSize: 14,
          fontWeight: isActive ? 700 : 600,
          color: isActive ? BLUE : TEXT,
        }}
      >
        {item.label}
      </span>
    </button>
  );
}

export default function Sidebar({ active, onChange, role = "user" }) {
  const navItems = NAVS[role] || NAVS.user;

  return (
    <aside className="sidebar">
      <Logo />
      <nav>
        {navItems.map((it) => (
          <NavButton
            key={it.key}
            item={it}
            active={active}
            onClick={() => onChange(it.key)}
          />
        ))}
      </nav>
    </aside>
  );
}
