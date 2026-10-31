import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "/api";
let token = localStorage.getItem("token");
export const getToken = () => token;
export const setToken = (t) => { token = t; t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); };

export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running on port 8000? / सर्व्हर उपलब्ध नाही");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) { setToken(null); window.dispatchEvent(new Event("logout")); }
    const d = data.detail;
    throw new Error(Array.isArray(d) ? d.map((e) => `${e.loc.slice(1).join(".")}: ${e.msg}`).join("; ") : d || "Request failed");
  }
  return data;
}

// Loads a GET endpoint with loading / error state
export function useLoad(path) {
  const [s, set] = useState({ data: null, loading: !!path, error: "" });
  const load = useCallback(() => {
    if (!path) return;
    set((x) => ({ ...x, loading: true, error: "" }));
    api(path).then((data) => set({ data, loading: false, error: "" })).catch((e) => set({ data: null, loading: false, error: e.message }));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { ...s, reload: load };
}
