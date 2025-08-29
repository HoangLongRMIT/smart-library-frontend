import React from "react";
import { useState, useEffect } from "react";
import BookCard from "./BookCard";
import BookDetailDrawer from "./BookDetailDrawer";

export default function BookGrid({
  books = [],
  showActions = false,
  onReturn,
  onReview,
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
      <div className="bp-book-grid"
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          alignItems: "stretch",
        }}
      >
        {books.map((b) => {
          const clickable = !showActions;
          const Wrapper = ({ children }) =>
            clickable ? (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedBook(b)}
              >
                {children}
              </div>
            ) : (
              <div>{children}</div>
            );
            
          return (
            <Wrapper key={b.book_id ?? b.id ?? b.ISBN}>
              <BookCard
                book={b}
                showActions={showActions}
                onReturn={onReturn}
                onReview={onReview}
              />
            </Wrapper>
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
