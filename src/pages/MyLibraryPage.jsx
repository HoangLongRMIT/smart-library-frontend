import React, { useEffect, useState } from "react";
import BookGrid from "../component/BookGrid";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

const user = getStoredUser();
const CURRENT_USER_ID = user?.user_id ?? null;

function ReviewDialog({ book, open, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) {
      setRating(5);
      setComment("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          width: "min(480px, 90vw)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 700 }}>
          Review: {book?.title}
        </h3>

        <label style={{ display: "block", marginBottom: 10, fontSize: 14 }}>
          Rating (1–5)
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{
              display: "block",
              marginTop: 6,
              width: 80,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16, fontSize: 14 }}>
          Comment
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Short comment…"
            style={{
              display: "block",
              marginTop: 6,
              width: "90%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              resize: "vertical",
            }}
          />
        </label>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ rating, comment })}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #0ea5e9",
              background: "#0ea5e9",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyLibraryPage() {
  const [loading, setLoading] = useState(true);
  const [borrowed, setBorrowed] = useState([]);
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadBorrowed() {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const CURRENT_USER_ID = user?.user_id ?? null;
        if (!CURRENT_USER_ID) {
          if (!cancelled) { setBorrowed([]); }
          return;
        }
        const res = await fetch(`${API_BASE}/books/${CURRENT_USER_ID}/borrowed`);
        const data = await res.json();
        if (!cancelled) setBorrowed(data || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setBorrowed([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBorrowed();
    return () => { cancelled = true; };
  }, []);

  const handleReturn = async (book) => {
    const checkoutId = book.checkout_id ?? book.loan_id ?? book.id;

    try {
      const res = await fetch(`${API_BASE}/books/${checkoutId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Return failed");
      }
      setBorrowed((prev) =>
        prev.filter(
          (b) => (b.checkout_id ?? b.loan_id ?? b.id) !== checkoutId
        )
      );
      const payload = await res.json().catch(() => null);
      const late = payload?.late ?? isLate(book.due_date);
      alert(late ? "Returned (late)." : "Returned on time. Thank you!");
    } catch (e) {
      console.error(e);
      alert(e.message || "Return failed");
    }
  };

  const handleReview = (book) => setReviewTarget(book);

  const submitReview = async ({ rating, comment }) => {
    if (!reviewTarget) return;

    try {
      const payload = {
        user_id: CURRENT_USER_ID,
        book_id: reviewTarget.book_id ?? reviewTarget.id ?? reviewTarget.ISBN,
        rating: Number(rating),
        comment: (comment || "").trim(),
      };
      const res = await fetch(`${API_BASE}/books/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Review failed");
      }
      alert("Review submitted!");
      setReviewTarget(null);
    } catch (e) {
      console.error(e);
      alert(e.message || "Review failed");
    }
  };

  return (
    <>
      {loading ? (
        <div className="py-8 text-gray-500">Loading…</div>
      ) : borrowed.length === 0 ? (
        <div className="py-8 text-gray-500">No borrowed books.</div>
      ) : (
        <BookGrid
          books={borrowed}
          showActions
          onReturn={handleReturn}
          onReview={handleReview}
        />
      )}

      <ReviewDialog
        book={reviewTarget}
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={submitReview}
      />
    </>
  );
}

function isLate(dueISO) {
  if (!dueISO) return false;
  try {
    return new Date(dueISO).getTime() < Date.now();
  } catch {
    return false;
  }
}
