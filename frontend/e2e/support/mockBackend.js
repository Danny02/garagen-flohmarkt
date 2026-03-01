import { expect } from "@playwright/test";

const defaultDynamicStands = [
  {
    id: 201,
    label: "Teststand Nord",
    address: "Teststraße 21",
    plz: "90513",
    district: "Kernstadt",
    categories: ["Bücher"],
    desc: "Romane und Kinderbücher",
    time_from: "10:00",
    time_to: "14:00",
    lat: 49.445,
    lng: 10.956,
    open: true,
  },
  {
    id: 202,
    label: "Teststand Süd",
    address: "Musterweg 8",
    plz: "90513",
    district: "Weiherhof",
    categories: ["Haushalt"],
    desc: "Geschirr und Küchenhelfer",
    time_from: "11:00",
    time_to: "16:00",
    lat: 49.438,
    lng: 10.948,
    open: true,
  },
];

function okJson(data) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(data),
  };
}

function parseJsonBody(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function getStandIdFromPath(pathname) {
  const match = pathname.match(/\/api\/stands\/([^/]+)$/);
  return match ? Number(match[1]) : null;
}

function getStandIdForPasskeyRegister(pathname) {
  const match = pathname.match(/\/api\/stands\/([^/]+)\/webauthn\/register$/);
  return match ? Number(match[1]) : null;
}

export function buildMockState(options = {}) {
  const dynamicStands = options.dynamicStands || defaultDynamicStands;
  const state = {
    nextId: options.startId || 1000,
    stands: dynamicStands.map(function (stand) {
      return { ...stand, editSecret: stand.editSecret || `secret-${stand.id}` };
    }),
  };
  return state;
}

export async function mockBackendRoutes(page, options = {}) {
  const state = buildMockState(options);
  const webauthnSessionToken = options.webauthnSessionToken || "valid-session-token";
  const webauthnCredentialId = options.webauthnCredentialId || "cred-e2e";
  const myStandsForRecovery = options.myStandsForRecovery || state.stands.slice(0, 1);
  const shouldFailPasskeyRegister = Boolean(options.failPasskeyRegister);
  const osrmMode = options.osrmMode || "success";

  await page.route("**/api/**", async function (route, request) {
    const url = new URL(request.url());
    const { pathname } = url;
    const method = request.method();
    const body = parseJsonBody(request.postData());

    if (pathname === "/api/stands" && method === "GET") {
      await route.fulfill(okJson(state.stands));
      return;
    }

    if (pathname === "/api/stands" && method === "POST") {
      const nextId = state.nextId++;
      const created = {
        id: nextId,
        label: body.label || "",
        address: body.address || "",
        plz: body.plz || "90513",
        district: body.district || "Kernstadt",
        categories: Array.isArray(body.categories) ? body.categories : [],
        desc: body.desc || "",
        time_from: body.time_from || "10:00",
        time_to: body.time_to || "16:00",
        lat: 49.442 + nextId / 100000,
        lng: 10.954 + nextId / 100000,
        open: true,
        editSecret: body.editSecret || `secret-${nextId}`,
      };
      state.stands.push(created);
      await route.fulfill(okJson(created));
      return;
    }

    const standId = getStandIdFromPath(pathname);

    if (pathname.startsWith("/api/stands/") && method === "GET") {
      const found = state.stands.find(function (stand) {
        return Number(stand.id) === standId;
      });
      if (!found) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not_found" }) });
        return;
      }
      await route.fulfill(okJson(found));
      return;
    }

    if (pathname.startsWith("/api/stands/") && method === "PUT") {
      const index = state.stands.findIndex(function (stand) {
        return Number(stand.id) === standId;
      });
      if (index < 0) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not_found" }) });
        return;
      }

      const current = state.stands[index];
      const hasAccess = body.editSecret === current.editSecret || body.sessionToken === "valid-session-token";
      if (!hasAccess) {
        await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "forbidden" }) });
        return;
      }

      const updated = {
        ...current,
        ...body,
      };
      state.stands[index] = updated;
      await route.fulfill(okJson(updated));
      return;
    }

    if (pathname.startsWith("/api/stands/") && method === "DELETE") {
      const index = state.stands.findIndex(function (stand) {
        return Number(stand.id) === standId;
      });
      if (index < 0) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not_found" }) });
        return;
      }

      const current = state.stands[index];
      const hasAccess = body.editSecret === current.editSecret || body.sessionToken === "valid-session-token";
      if (!hasAccess) {
        await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "forbidden" }) });
        return;
      }

      state.stands.splice(index, 1);
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (pathname === "/api/my/stands" && method === "POST") {
      if (body.sessionToken === webauthnSessionToken) {
        await route.fulfill(okJson(myStandsForRecovery));
        return;
      }
      await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "forbidden" }) });
      return;
    }

    if (pathname === "/api/webauthn/challenge" && method === "POST") {
      await route.fulfill(okJson({ challengeId: "challenge-e2e", challenge: "AQID" }));
      return;
    }

    if (pathname === "/api/webauthn/authenticate" && method === "POST") {
      if (options.failPasskeyAuthenticate) {
        await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "Verification failed" }) });
        return;
      }

      await route.fulfill(okJson({ sessionToken: webauthnSessionToken, credentialId: webauthnCredentialId }));
      return;
    }

    if (pathname.endsWith("/webauthn/register") && method === "POST") {
      const standId = getStandIdForPasskeyRegister(pathname);
      const standIndex = state.stands.findIndex(function (stand) {
        return Number(stand.id) === standId;
      });

      if (standIndex < 0) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not_found" }) });
        return;
      }

      const stand = state.stands[standIndex];
      if (body.editSecret !== stand.editSecret || shouldFailPasskeyRegister) {
        await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "Passkey registration failed" }) });
        return;
      }

      state.stands[standIndex] = {
        ...stand,
        credentialId: body.credentialId || webauthnCredentialId,
      };
      await route.fulfill(okJson({ ok: true }));
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "unmocked_route" }) });
  });

  await page.route("https://router.project-osrm.org/**", async function (route) {
    if (osrmMode === "none") {
      await route.fulfill(okJson({ routes: [] }));
      return;
    }

    if (osrmMode === "error") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "route_error" }) });
      return;
    }

    await route.fulfill(okJson({
      routes: [
        {
          geometry: {
            coordinates: [
              [10.954, 49.442],
              [10.955, 49.443],
            ],
          },
        },
      ],
    }));
  });

  return state;
}

export async function seedMyStandsInLocalStorage(page, stands) {
  await page.evaluate(function (entries) {
    localStorage.setItem("gf:myStands", JSON.stringify(entries));
  }, stands);
}

export async function forceInitialOnlineState(page, isOnline) {
  await page.addInitScript(function (onlineState) {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: function () {
        return onlineState;
      },
    });
  }, isOnline);
}

export async function setRuntimeOnlineState(page, isOnline) {
  await page.evaluate(function (onlineState) {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: function () {
        return onlineState;
      },
    });
    window.dispatchEvent(new Event(onlineState ? "online" : "offline"));
  }, isOnline);
}

export async function mockGeolocation(page, options = {}) {
  const mode = options.mode || "success";
  const coords = options.coords || { latitude: 49.442, longitude: 10.954, accuracy: 25 };
  const permissionState = options.permissionState || (mode === "success" ? "granted" : "prompt");

  await page.addInitScript(function (geoMode, geoCoords, geoPermission) {
    const geolocation = {
      getCurrentPosition: function (onSuccess, onError) {
        if (geoMode === "success") {
          onSuccess({ coords: geoCoords });
          return;
        }
        onError({ code: 1, message: "denied" });
      },
      watchPosition: function (onSuccess, onError) {
        if (geoMode === "success") {
          onSuccess({ coords: geoCoords });
          return 1;
        }
        onError({ code: 1, message: "denied" });
        return 1;
      },
      clearWatch: function () {},
    };

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: geolocation,
    });

    if (!navigator.permissions) {
      Object.defineProperty(navigator, "permissions", {
        configurable: true,
        value: {},
      });
    }

    navigator.permissions.query = async function () {
      return { state: geoPermission };
    };
  }, mode, coords, permissionState);
}

export async function mockPasskeyApis(page, options = {}) {
  const support = options.support !== false;
  const createMode = options.createMode || "success";
  const getMode = options.getMode || "success";
  const createError = options.createError || "Passkey create failed";
  const getError = options.getError || "Passkey get failed";

  await page.addInitScript(function (isSupported, createBehavior, getBehavior, createErrorMessage, getErrorMessage) {
    if (!isSupported) {
      Object.defineProperty(window, "PublicKeyCredential", {
        configurable: true,
        value: undefined,
      });
      return;
    }

    function toBuffer(values) {
      return new Uint8Array(values).buffer;
    }

    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: function PublicKeyCredential() {},
    });

    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: {
        create: async function () {
          if (createBehavior === "error") throw new Error(createErrorMessage);
          return {
            rawId: toBuffer([1, 2, 3]),
            response: {
              getPublicKey: function () { return toBuffer([4, 5, 6]); },
              getPublicKeyAlgorithm: function () { return -7; },
              clientDataJSON: toBuffer([7, 8, 9]),
            },
          };
        },
        get: async function () {
          if (getBehavior === "error") throw new Error(getErrorMessage);
          return {
            rawId: toBuffer([1, 2, 3]),
            response: {
              authenticatorData: toBuffer([4, 5, 6]),
              clientDataJSON: toBuffer([7, 8, 9]),
              signature: toBuffer([10, 11, 12]),
            },
          };
        },
      },
    });
  }, support, createMode, getMode, createError, getError);
}

export async function captureWindowOpen(page) {
  await page.addInitScript(function () {
    window.__openedUrls = [];
    window.open = function (url) {
      window.__openedUrls.push(url);
      return null;
    };
  });
}

export async function getOpenedUrls(page) {
  return page.evaluate(function () {
    return window.__openedUrls || [];
  });
}

export async function openApp(page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Zirndorf.*Flea Market|Zirndorfer Garagen-Flohmarkt/i })).toBeVisible();
}
