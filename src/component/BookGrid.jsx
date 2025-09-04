import React, { useEffect, useState } from "react";
import BookCard from "./BookCard";
import BookDetailDrawer from "./BookDetailDrawer";

export default function BookGrid({
  books = [],
  showActions = false,
  onReturn,
  onReview,
  mode = "book",
}) {
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedBook(null);
    };
    if (selectedBook) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBook]);

  return (
    <>
      <div
        className="bp-book-grid"
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          alignItems: "stretch",
        }}
      >
        {books.map((b, i) => {
          const key = b.book_id ?? b.id ?? b.ISBN ?? i;
          const clickable = !showActions;
          const wrapperProps = clickable
            ? { style: { cursor: "pointer" }, onClick: () => setSelectedBook(b) }
            : {};

          return (
            <div key={key} {...wrapperProps}>
              <BookCard
                book={b}
                showActions={showActions}
                onReturn={onReturn}
                onReview={onReview}
                mode={mode}
              />
            </div>
          );
        })}
      </div>

      {selectedBook && (
        <BookDetailDrawer
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </>
  );
}