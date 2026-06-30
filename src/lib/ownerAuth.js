import { FUNCTIONS_URL, supabase } from "./supabaseClient";

const SESSION_KEY = "smartstall_owner_session";

export function getOwnerSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setOwnerSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearOwnerSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function ownerLogin(email, password) {
  const res = await fetch(`${FUNCTIONS_URL}/owner-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed.");
  setOwnerSession(data);
  return data;
}

export function ownerLogout() {
  clearOwnerSession();
}

// Authenticated call to the owner-action edge function
export async function ownerAction(action, payload = {}) {
  const session = getOwnerSession();
  if (!session?.token) throw new Error("Not logged in.");

  const res = await fetch(`${FUNCTIONS_URL}/owner-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) clearOwnerSession();
    throw new Error(data.error || "Request failed.");
  }
  return data;
}
