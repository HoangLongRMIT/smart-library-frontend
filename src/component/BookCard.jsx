import React from "react";

export default function BookCard({ book, showActions = false, onReturn, onReview, mode = "book" }) {
  const IMAGE_H = 280;
  const TITLE_MIN_H = 44;
  const AUTHOR_MIN_H = 20;

  const handleReturn = (e) => {
    e.stopPropagation();
    onReturn?.(book);
  };

  const handleReview = (e) => {
    e.stopPropagation();
    onReview?.(book);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const isLate =
    book.is_late === 1 || (book.due_date && new Date(book.due_date).getTime() < Date.now());

  return (
    <article
      style={{
        height: "100%",
        display: "grid",
        gridTemplateRows: `${IMAGE_H}px 1fr`,
        background: "#fff",
        borderRadius: 12,
        boxShadow:
          isLate && mode === "borrowed"
            ? "0 4px 20px rgba(220, 38, 38, 0.2), 0 0 0 2px #fecaca"
            : "0 4px 20px rgba(0,0,0,0.08)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {isLate && mode === "borrowed" && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#dc2626",
            color: "white",
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            zIndex: 10,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          LATE
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <img
          src={book.image_url}
          alt={book.title}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/220x280?text=No+Cover";
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateRows: showActions ? "auto auto 1fr auto auto" : "auto auto 1fr auto",
          rowGap: 6,
          padding: "14px 16px 16px",
        }}
      >
        <h3
          title={book.title}
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: TITLE_MIN_H,
            margin: 0,
          }}
        >
          {book.title}
        </h3>

        <p
          title={book.author}
          style={{
            fontSize: 14,
            color: "#475569",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: AUTHOR_MIN_H,
            margin: 0,
          }}
        >
          {book.author}
        </p>

        <div />

        {mode === "book" ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#64748B",
            }}
          >
            <span>{book.genre ?? "—"}</span>
            <span>{book.available_copies ?? 0} left</span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 13,
              color: "#64748B",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Borrowed</span>
              <span style={{ fontWeight: 500, color: "#374151" }}>
                {formatDate(book.borrow_date)}
              </span>
            </div>

            {book.due_date && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Due</span>
                <span
                  style={{
                    fontWeight: 500,
                    color: isLate ? "#dc2626" : "#374151",
                  }}
                >
                  {formatDate(book.due_date)}
                </span>
              </div>
            )}
          </div>
        )}

        {showActions && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={handleReturn}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Return this book"
            >
              Return
            </button>
            <button
              type="button"
              onClick={handleReview}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: "#000054",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Leave a review"
            >
              Review
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
