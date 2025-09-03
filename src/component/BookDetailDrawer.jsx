import React, { useEffect, useState, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function BookDetailDrawer({ book, onClose, currentUserId, onBorrowed }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const user = getStoredUser();
  const CURRENT_USER_ID = user?.user_id ?? currentUserId ?? null;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!book) return null;

  const BLUE = "#062A5C";
  const ACCENT = "#0096FF";

  const available = Number(book?.available_copies ?? 0);
  const isDisabled = busy || available <= 0 || !CURRENT_USER_ID;

  const avgRating = useMemo(() => {
    const n = Number(book?.average_rating);
    return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : null;
  }, [book?.average_rating]);

  const reviewCount = typeof book?.review_count === "number" ? book.review_count : null;

  async function handleBorrow() {
    if (!book) return;
    setErr("");
    setBusy(true);
    try {
      const bookId = Number(book.book_id ?? book.id ?? book.ISBN);
      if (!bookId || !CURRENT_USER_ID) throw new Error("Missing book id or user id");

      const res = await fetch(`${API_BASE}/books/${bookId}/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(CURRENT_USER_ID) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Borrow failed");

      if (typeof book.available_copies === "number") {
        book.available_copies = Math.max(0, book.available_copies - 1);
      }

      onBorrowed?.(book, data);

      alert(
        `Borrowed! Due ${
          data?.due_date ? new Date(data.due_date).toLocaleDateString() : "in ~1 month"
        }.`
      );
      onClose?.();
    } catch (e) {
      setErr(e.message || "Borrow failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
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
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
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
                e.currentTarget.src = "https://placehold.co/300x400?text=No+Cover";
              }}
            />
          </div>

          <h2 style={{ margin: "6px 0 2px", fontSize: 20, fontWeight: 800 }}>{book.title}</h2>
          <div style={{ opacity: 0.85, marginBottom: 12 }}>
            {book.author ?? book.authors ?? "—"}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <RatingStars value={avgRating ?? 0} />
            <span style={{ opacity: 0.7, fontSize: 13 }}>
              {reviewCount != null ? `(${reviewCount} review${reviewCount === 1 ? "" : "s"})` : ""}
            </span>
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
            <Stat label="Genre" value={book.genre ?? "—"} />
            <Stat label="Rating" value={avgRating != null ? `${avgRating.toFixed(1)}/5` : "—"} />
            <Stat label="Reviews" value={reviewCount != null ? reviewCount : "—"} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              opacity: 0.9,
            }}
          >
            <span>{book.publisher ?? "—"}</span>
            <span>{available} left</span>
          </div>

          {err && <div style={{ color: "#fecaca", fontSize: 13, marginBottom: 8 }}>{err}</div>}

          <button
            onClick={handleBorrow}
            disabled={isDisabled}
            style={{
              marginTop: 12,
              width: "100%",
              background: isDisabled ? "rgba(0,150,255,0.5)" : ACCENT,
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              cursor: isDisabled ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {busy
              ? "Borrowing…"
              : !CURRENT_USER_ID
                ? "Sign in to Borrow"
                : available > 0
                  ? "Borrow Now"
                  : "Out of Stock"}
          </button>
        </div>
      </aside>
    </>
  );
}

function RatingStars({
  value = 0,
  size = 18,
  showText = true,
  maxStars = 5,
  fillColor = "#FFD166",
  emptyColor = "#E5E7EB",
  textColor = "#6B7280",
}) {
  const clampedValue = Math.max(0, Math.min(maxStars, value));

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontSize: size,
          lineHeight: 1,
        }}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const fillPercentage = Math.max(0, Math.min(1, clampedValue - i)) * 100;

          return (
            <span
              key={i}
              style={{
                position: "relative",
                color: emptyColor,
                textShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              ★
              {fillPercentage > 0 && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${fillPercentage}%`,
                    overflow: "hidden",
                    color: fillColor,
                  }}
                >
                  ★
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showText && (
        <span
          style={{
            fontSize: size * 0.75,
            color: textColor,
            fontWeight: 500,
          }}
        >
          {clampedValue.toFixed(1)} / {maxStars}
        </span>
      )}
    </div>
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
