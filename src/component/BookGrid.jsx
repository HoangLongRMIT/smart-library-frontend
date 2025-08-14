import { useState, useEffect } from "react";
import BookCard from "./BookCard";
import BookDetailDrawer from "./BookDetailDrawer";

export default function BookGrid({ books = [] }) {
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
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          alignItems: "stretch",
        }}
      >
        {books.map((b) => (
          <div
            key={b.book_id ?? b.id ?? b.ISBN}
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedBook(b)}
          >
            <BookCard book={b} />
          </div>
        ))}
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
