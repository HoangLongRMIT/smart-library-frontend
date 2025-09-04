// src/pages/LoginPage.jsx
import React, { useState } from "react";
import LogoWhite from "../component/LogoWhite";
import "../css/pages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export default function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess?.(data.user); // notify parent
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="logo-container"><LogoWhite /></div>
      <div className="cover-img" />
      <div className="welcome-text">
        <h1>Welcome to RMIT Library</h1>
        <p>Read, browse and expand your knowledge</p>
      </div>

      <div className="content-container">
        <div className="login-form">
          <h2 className="Title">Sign In</h2>
          <form className="form" onSubmit={handleSubmit}>
            <div>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {err && <div className="error" role="alert">{err}</div>}

            <button type="submit" id="login-btn" disabled={busy}>
              {busy ? "Logging in…" : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}