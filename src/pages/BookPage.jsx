import React, { useEffect, useState } from "react";
import BookGrid from "../component/BookGrid";

export default function BookPage() {
  const [books, setBooks] = React.useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8080/api"}/books`)
      .then((r) => r.json())
      .then(setBooks)
      .catch(console.error);
  }, []);


  return (
    <>
      <BookGrid books={books} />
    </>
  );
}
