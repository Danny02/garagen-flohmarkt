// ── LocalStorage ──────────────────────────────────────────────────────────────

export const LS_KEY = "gf:myStands";

export function loadMyStands() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

export function saveMyStand(entry) {
  const list = loadMyStands().filter((s) => s.id !== entry.id);
  localStorage.setItem(LS_KEY, JSON.stringify([...list, entry]));
}

export function updateMyStand(id, patch) {
  const list = loadMyStands().map((s) => s.id === id ? { ...s, ...patch } : s);
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function removeMyStand(id) {
  const list = loadMyStands().filter((s) => s.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// ── Base64url (WebAuthn) ──────────────────────────────────────────────────────

export function b64url(buf) {
  const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function b64urlDec(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
