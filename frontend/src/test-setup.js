import "@testing-library/jest-dom";
import { vi, beforeEach, afterEach } from "vitest";

const storage = new Map();
const localStorageMock = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(String(key), String(value));
  },
  removeItem(key) {
    storage.delete(String(key));
  },
  clear() {
    storage.clear();
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });
}

// ── Fetch mock ────────────────────────────────────────────────────────────────
// Default: return an empty stands list for all GET /api/stands calls.
// Individual tests override with mockResolvedValueOnce / mockImplementationOnce.

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => [],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// ── window.PublicKeyCredential ────────────────────────────────────────────────
// jsdom doesn't implement WebAuthn; mark it as undefined so components that
// check `!!window.PublicKeyCredential` don't render passkey UI in tests.
Object.defineProperty(window, "PublicKeyCredential", {
  value: undefined,
  configurable: true,
  writable: true,
});
