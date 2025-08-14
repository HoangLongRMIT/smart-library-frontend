import React, { useEffect } from "react";

export default function BookDetailDrawer({ book, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!book) return null;

  const BLUE = "#062A5C";
  const ACCENT = "#0096FF";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1000,
        }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${book.title} details`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(420px, 92vw)",
          background: BLUE,
          color: "#fff",
          zIndex: 1001,
          display: "grid",
          gridTemplateRows: "auto 1fr",
          boxShadow: "0 0 30px rgba(0,0,0,0.35)",
          transform: "translateX(0)",
          transition: "transform 220ms ease",
          borderTopLeftRadius: 18,
          borderBottomLeftRadius: 18,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {book.title}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: 20 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 16,
              display: "grid",
              placeItems: "center",
              marginBottom: 18,
            }}
          >
            <img
              src={book.image_url}
              alt={book.title}
              style={{
                width: "80%",
                maxHeight: 320,
                objectFit: "contain",
                borderRadius: 8,
              }}
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/300x400?text=No+Cover";
              }}
            />
          </div>

          <h2 style={{ margin: "6px 0 2px", fontSize: 20, fontWeight: 800 }}>
            {book.title}
          </h2>
          <div style={{ opacity: 0.85, marginBottom: 12 }}>{book.author}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span aria-hidden>⭐️⭐️⭐️⭐️☆</span>
            <span style={{ opacity: 0.9 }}>4.8</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              padding: "12px 0",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 16,
            }}
          >
            <Stat label="Pages" value="320" />
            <Stat label="Ratings" value="643" />
            <Stat label="Reviews" value="110" />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, opacity: 0.9 }}>
            <span>{book.genre ?? "—"}</span>
            <span>{book.available_copies ?? 0} left</span>
          </div>

          <p style={{ lineHeight: 1.6, opacity: 0.95 }}>
            {book.description ??
              "No description available for this title yet."}
          </p>

          <button
            style={{
              marginTop: 18,
              width: "100%",
              background: ACCENT,
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Borrow Now
          </button>
        </div>
      </aside>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
    </div>
  );
}
