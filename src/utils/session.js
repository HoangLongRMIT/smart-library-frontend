export function getStoredUser() {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  }
  
  export function getToken() {
    return localStorage.getItem("authToken") || null;
  }
  
  export function authnpHeaders() {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
  