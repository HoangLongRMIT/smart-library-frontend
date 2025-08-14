import React from "react";

export default function BookCard({ book }) {
  const IMAGE_H = 280;
  const TITLE_MIN_H = 44;
  const AUTHOR_MIN_H = 20; 

  return (
    <article
      style={{
        height: "100%",
        display: "grid",
        gridTemplateRows: `${IMAGE_H}px 1fr`,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Row 1: image (fixed height) */}
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
            e.currentTarget.src =
              "https://via.placeholder.com/220x280?text=No+Cover";
          }}
        />
      </div>

      {/* Row 2: content (fills remaining space) */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto",
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
      </div>
    </article>
  );
}