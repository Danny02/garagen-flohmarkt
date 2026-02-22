import { useState, useEffect, useRef } from "react";
import { loadMyStands, saveMyStand, removeMyStand, loadCachedStands, saveCachedStands } from "./utils.js";
import { API_BASE, STANDS } from "./constants.js";
import { authenticateWithPasskey } from "./passkey.js";
import NavBar from "./components/ui/NavBar.jsx";
import HomeScreen from "./components/screens/HomeScreen.jsx";
import MapScreen from "./components/screens/MapScreen.jsx";
import RegisterScreen from "./components/screens/RegisterScreen.jsx";
import InfoScreen from "./components/screens/InfoScreen.jsx";
import { t } from "./i18n.js";

const SCREEN_PATHS = {
  home: "/",
  map: "/map",
  register: "/register",
  info: "/info",
};

function getScreenFromPath(pathname) {
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const matched = Object.entries(SCREEN_PATHS).find(function ([, path]) {
    return path === normalizedPath;
  });
  return matched ? matched[0] : "home";
}

function getPathFromScreen(screen) {
  return SCREEN_PATHS[screen] || SCREEN_PATHS.home;
}

function getPrimaryEditSecret(entries) {
  const match = entries.find(function (entry) {
    return typeof entry.editSecret === "string" && entry.editSecret.length > 0;
  });
  return match ? match.editSecret : null;
}

function useViewport() {
  const getWidth = function () {
    if (typeof window === "undefined") return 390;
    return window.innerWidth;
  };

  const [width, setWidth] = useState(getWidth);

  useEffect(function () {
    function onResize() {
      setWidth(getWidth());
    }

    window.addEventListener("resize", onResize);
    return function () {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const isTablet = width >= 768;
  const isDesktop = width >= 1100;

  return {
    width,
    isTablet,
    isDesktop,
    isMobile: !isTablet,
    contentMaxWidth: isDesktop ? 1200 : isTablet ? 900 : 430,
  };
}

export default function App() {
  const layout = useViewport();
  const [screen, setScreen] = useState(function () {
    if (typeof window === "undefined") return "home";
    return getScreenFromPath(window.location.pathname);
  });
  const [isOnline, setIsOnline] = useState(typeof window === "undefined" ? true : navigator.onLine);
  const [dynamicStands, setDynamicStands] = useState(loadCachedStands);
  const [myStands, setMyStands] = useState(loadMyStands);
  const [editMode, setEditMode] = useState(null);
  const [passkeyLoginError, setPasskeyLoginError] = useState("");
  const scrollRef = useRef(null);
  const hasTrackedInitialPageViewRef = useRef(false);

  function navigateToScreen(nextScreen, options = {}) {
    const replace = Boolean(options.replace);
    const path = getPathFromScreen(nextScreen);

    setScreen(nextScreen);

    if (typeof window === "undefined") return;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl === path) return;

    if (replace) {
      window.history.replaceState({}, "", path);
      return;
    }

    window.history.pushState({}, "", path);
  }

  function clearExpiredSessionForStand(standId) {
    const current = loadMyStands();
    const entry = current.find(function (s) { return String(s.id) === String(standId); });
    if (!entry || !entry.sessionToken) return;

    const patched = { ...entry };
    delete patched.sessionToken;
    saveMyStand(patched);
    setMyStands(loadMyStands());
  }

  function handleSessionExpired(standId) {
    clearExpiredSessionForStand(standId);
    setEditMode(null);
    navigateToScreen("home", { replace: true });
    setPasskeyLoginError(t("app.error.sessionExpired", null, "Passkey-Sitzung abgelaufen. Bitte erneut mit Passkey anmelden."));
  }

  useEffect(function () {
    function handlePopState() {
      const nextScreen = getScreenFromPath(window.location.pathname);
      setScreen(nextScreen);
      if (nextScreen !== "register") setEditMode(null);
      setPasskeyLoginError("");
    }

    window.addEventListener("popstate", handlePopState);
    return function () {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(function () {
    function handleOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return function () {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  useEffect(function () {
    if (!isOnline && screen === "register") {
      setEditMode(null);
      navigateToScreen("home", { replace: true });
      setPasskeyLoginError(t("app.error.offline.editDelete", null, "Offline: Anmelden, Bearbeiten und Löschen sind nur mit Internet möglich."));
    }
  }, [isOnline, screen]);

  useEffect(function () {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    const editSecret = params.get("secret");
    if (editId && editSecret) {
      if (!isOnline) {
        setPasskeyLoginError(t("app.error.offline.edit", null, "Offline: Bearbeiten ist nur mit Internet möglich."));
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }

      fetch(`${API_BASE}/api/stands/${editId}`)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          saveMyStand({ id: editId, editSecret, address: data?.address || "", label: data?.label });
          setMyStands(loadMyStands());
          setEditMode({ id: editId, secret: editSecret, sessionToken: null, initialData: data || {} });
          navigateToScreen("register", { replace: true });
        })
        .catch(function () {
          const cachedStand = loadCachedStands().find(function (s) { return String(s.id) === String(editId); });
          setEditMode({ id: editId, secret: editSecret, sessionToken: null, initialData: cachedStand || {} });
          navigateToScreen("register", { replace: true });
        });
    }
  }, [isOnline]);

  useEffect(function () {
    fetch(`${API_BASE}/api/stands`)
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to load stands");
        return r.json();
      })
      .then(function (data) {
        const stands = Array.isArray(data) ? data : [];
        setDynamicStands(stands);
        saveCachedStands(stands);

        const liveIds = new Set(stands.map(function (s) { return String(s.id); }));
        const currentMyStands = loadMyStands();
        currentMyStands.forEach(function (entry) {
          if (!liveIds.has(String(entry.id))) removeMyStand(entry.id);
        });
        setMyStands(loadMyStands());
      })
      .catch(function () {
        setDynamicStands(loadCachedStands());
      });
  }, []);

  useEffect(function () {
    if (scrollRef.current) { scrollRef.current.scrollTop = 0; }
  }, [screen]);

  useEffect(function () {
    if (typeof window === "undefined") return;

    if (!hasTrackedInitialPageViewRef.current) {
      hasTrackedInitialPageViewRef.current = true;
      return;
    }

    if (window.goatcounter && typeof window.goatcounter.count === "function") {
      window.goatcounter.count({
        path: window.location.pathname + window.location.search + window.location.hash,
      });
    }
  }, [screen]);

  function handleRegistered(stand) {
    const existingMyStand = loadMyStands().find(function (s) { return String(s.id) === String(stand.id); });
    if (stand.editSecret || existingMyStand) {
      saveMyStand({
        ...(existingMyStand || {}),
        id: stand.id,
        address: stand.address,
        label: stand.label,
        ...(stand.editSecret ? { editSecret: stand.editSecret } : {}),
      });
      setMyStands(loadMyStands());
    }

    setDynamicStands(function (prev) {
      const idx = prev.findIndex(function (s) { return s.id === stand.id; });
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = stand;
        saveCachedStands(next);
        return next;
      }
      const next = prev.concat([stand]);
      saveCachedStands(next);
      return next;
    });
  }

  function handleEditMyStand(localEntry, secret, sessionToken) {
    if (!isOnline) {
      setPasskeyLoginError(t("app.error.offline.edit", null, "Offline: Bearbeiten ist nur mit Internet möglich."));
      return;
    }

    if (!secret && sessionToken) {
      fetch(`${API_BASE}/api/my/stands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      })
        .then(function (r) {
          if (r.ok) return true;
          if (r.status === 403) {
            clearExpiredSessionForStand(localEntry.id);
            setPasskeyLoginError(t("app.error.sessionExpired", null, "Passkey-Sitzung abgelaufen. Bitte erneut mit Passkey anmelden."));
            return false;
          }
          throw new Error("Session validation failed");
        })
        .then(function (isValidSession) {
          if (!isValidSession) return;

          fetch(`${API_BASE}/api/stands/${localEntry.id}`)
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
              setEditMode({ id: localEntry.id, secret, sessionToken, initialData: data || localEntry });
              navigateToScreen("register");
            })
            .catch(function () {
              const cachedStand = loadCachedStands().find(function (s) { return String(s.id) === String(localEntry.id); });
              setEditMode({ id: localEntry.id, secret, sessionToken, initialData: cachedStand || localEntry });
              navigateToScreen("register");
            });
        })
        .catch(function () {
          setPasskeyLoginError(t("app.error.passkeyCheck", null, "Passkey-Sitzung konnte nicht geprüft werden. Bitte erneut versuchen."));
        });
      return;
    }

    fetch(`${API_BASE}/api/stands/${localEntry.id}`)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        setEditMode({ id: localEntry.id, secret, sessionToken, initialData: data || localEntry });
          navigateToScreen("register");
      })
      .catch(function () {
        const cachedStand = loadCachedStands().find(function (s) { return String(s.id) === String(localEntry.id); });
        setEditMode({ id: localEntry.id, secret, sessionToken, initialData: cachedStand || localEntry });
          navigateToScreen("register");
      });
  }

  function normalizePasskeyError(error) {
    const msg = String(error?.message || "Passkey-Anmeldung fehlgeschlagen");
    if (/Credential not found/i.test(msg)) {
      return t("app.error.passkeyNotFound", null, "Passkey nicht gefunden. Bitte nutze dieselbe App-URL wie bei der Einrichtung oder richte den Passkey über deinen Bearbeitungs-Link neu ein.");
    }
    if (/Verification failed/i.test(msg) || /signature verification failed/i.test(msg)) {
      return t("app.error.passkeyVerify", null, "Passkey konnte nicht verifiziert werden. Bitte erneut versuchen; falls es weiter fehlschlägt, Passkey neu einrichten.");
    }
    if (/Challenge expired/i.test(msg)) {
      return t("app.error.challengeExpired", null, "Anmeldung abgelaufen. Bitte nochmal auf 'Mit Passkey anmelden' tippen.");
    }
    return msg;
  }

  async function handlePasskeyLogin(localEntry) {
    setPasskeyLoginError("");
    if (!isOnline) {
      setPasskeyLoginError(t("app.error.offline.edit", null, "Offline: Bearbeiten ist nur mit Internet möglich."));
      return;
    }

    try {
      const { sessionToken } = await authenticateWithPasskey(localEntry.credentialId);
      saveMyStand({
        ...localEntry,
        sessionToken,
      });
      setMyStands(loadMyStands());
      handleEditMyStand(localEntry, null, sessionToken);
    } catch (e) {
      setPasskeyLoginError(normalizePasskeyError(e));
    }
  }

  async function handlePasskeyRecoveryLogin() {
    setPasskeyLoginError("");
    if (!isOnline) {
      setPasskeyLoginError(t("app.error.offline.edit", null, "Offline: Bearbeiten ist nur mit Internet möglich."));
      return;
    }

    try {
      const { sessionToken, credentialId } = await authenticateWithPasskey();
      const ownedRes = await fetch(`${API_BASE}/api/my/stands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      if (!ownedRes.ok) throw new Error(t("app.error.ownStandsLoad", null, "Eigene Stände konnten nicht geladen werden"));
      const ownedStands = await ownedRes.json();
      if (!Array.isArray(ownedStands) || ownedStands.length === 0) {
        throw new Error(t("app.error.noStandsForPasskey", null, "Keine Stände für diesen Passkey gefunden"));
      }

      const existingEntries = loadMyStands();
      ownedStands.forEach(function (stand) {
        const existingEntry = existingEntries.find(function (entry) {
          return String(entry.id) === String(stand.id);
        });
        saveMyStand({
          ...(existingEntry || {}),
          id: stand.id,
          address: stand.address || "",
          label: stand.label,
          credentialId,
          sessionToken,
        });
      });
      setMyStands(loadMyStands());
      setEditMode(null);
      navigateToScreen("home", { replace: true });
    } catch (e) {
      setPasskeyLoginError(normalizePasskeyError(e));
    }
  }

  async function handleDeleteMyStand(localEntry) {
    if (!isOnline) {
      setPasskeyLoginError(t("app.error.offline.delete", null, "Offline: Löschen ist nur mit Internet möglich."));
      return;
    }

    const confirmed = window.confirm(t("app.confirm.delete", null, "Stand wirklich löschen?"));
    if (!confirmed) return;

    setPasskeyLoginError("");

    try {
      let authField;
      if (localEntry.editSecret) {
        authField = { editSecret: localEntry.editSecret };
      } else if (localEntry.credentialId) {
        const { sessionToken } = await authenticateWithPasskey(localEntry.credentialId);
        authField = { sessionToken };
      } else {
        throw new Error(t("app.error.noValidAccessDelete", null, "Kein gültiger Zugriff für Löschen vorhanden"));
      }

      const res = await fetch(`${API_BASE}/api/stands/${localEntry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authField),
      });
      if (!res.ok && res.status !== 404) {
        if (!localEntry.editSecret && localEntry.sessionToken && res.status === 403) {
          clearExpiredSessionForStand(localEntry.id);
          throw new Error(t("app.error.sessionExpired", null, "Passkey-Sitzung abgelaufen. Bitte erneut mit Passkey anmelden."));
        }
        throw new Error(t("app.error.deleteFailed", null, "Löschen fehlgeschlagen"));
      }

      removeMyStand(localEntry.id);
      setMyStands(loadMyStands());

      setDynamicStands(function (prev) {
        const next = prev.filter(function (s) { return String(s.id) !== String(localEntry.id); });
        saveCachedStands(next);
        return next;
      });
    } catch (e) {
      setPasskeyLoginError(normalizePasskeyError(e));
    }
  }

  function handleSetScreen(nextScreen) {
    if (nextScreen === "register" && !isOnline) {
      setEditMode(null);
      setPasskeyLoginError(t("app.error.offline.register", null, "Offline: Anmelden ist nur mit Internet möglich."));
      navigateToScreen("home", { replace: true });
      return;
    }

    if (nextScreen !== "register") setEditMode(null);
    setPasskeyLoginError("");
    navigateToScreen(nextScreen);
  }

  const totalStands = STANDS.length + dynamicStands.length;
  const primaryEditSecret = getPrimaryEditSecret(myStands);

  return (
    <div style={{ minHeight: "100vh", background: "#e8ecef", position: "relative", fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: layout.isMobile ? 0 : "0 16px" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); :root { --COLOR-1: #10AB48; --COLOR-2: #009DA9; --COLOR-3: #0093FC; --COLOR-4: #CA61D1; --COLOR-5: #ED5160; } * { box-sizing: border-box; margin: 0; } body { background: #e8ecef; margin: 0; } input, select, textarea, button { font-family: inherit; }"}</style>
      <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", minHeight: "100vh", background: "#fafbfc", position: "relative", boxShadow: layout.isMobile ? "none" : "0 0 0 1px rgba(16,171,72,0.1), 0 10px 36px rgba(0,0,0,0.06)" }}>
        {passkeyLoginError && (
          <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: layout.contentMaxWidth, background: "#c0392b", color: "#fff", padding: "12px 16px", fontSize: 13, fontWeight: 600, zIndex: 200, textAlign: "center" }}>
            {passkeyLoginError}
            <button onClick={function () { setPasskeyLoginError(""); }} style={{ marginLeft: 12, background: "transparent", border: "none", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        )}

        <div style={{ position: "sticky", top: passkeyLoginError ? 48 : 0, zIndex: 160, background: "#FFF8E1", color: "#5D4037", padding: "7px 12px", fontSize: 12, fontWeight: 700, textAlign: "center", borderBottom: "1px solid #F0E0A0" }}>
          {t("app.preview", null, "Experimenteller Prototyp — keine offizielle Seite der Stadt Zirndorf und nicht die offizielle Seite zur Veranstaltung „Zirndorfer Garagen-Flohmarkt“.")}
        </div>

        {!isOnline && (
          <div style={{ position: "sticky", top: 0, zIndex: 150, background: "#5f6368", color: "#fff", padding: "8px 12px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
            {t("app.offlineBanner", null, "Offline-Modus: Lesen verfügbar, Anmelden/Bearbeiten/Löschen deaktiviert.")}
          </div>
        )}

        {!layout.isMobile && <NavBar active={screen} setScreen={handleSetScreen} layout={layout} canWrite={isOnline} />}

        <div ref={scrollRef} style={{ paddingBottom: layout.isMobile ? 68 : 28, minHeight: "100vh", paddingTop: layout.isMobile ? 0 : 0 }}>
          {screen === "home" && (
            <HomeScreen
              setScreen={handleSetScreen}
              totalStands={totalStands}
              myStands={myStands}
              onEditMyStand={handleEditMyStand}
              onPasskeyLogin={handlePasskeyLogin}
              onPasskeyRecoveryLogin={handlePasskeyRecoveryLogin}
              onDeleteMyStand={handleDeleteMyStand}
              canWrite={isOnline}
              layout={layout}
            />
          )}
          {screen === "map" && <MapScreen dynamicStands={dynamicStands} layout={layout} />}
          {screen === "register" && (
            <RegisterScreen
              onRegistered={handleRegistered}
              editMode={editMode}
              createEditSecret={primaryEditSecret}
              onSessionExpired={handleSessionExpired}
              layout={layout}
            />
          )}
          {screen === "info" && <InfoScreen layout={layout} />}
        </div>

        {layout.isMobile && <NavBar active={screen} setScreen={handleSetScreen} layout={layout} canWrite={isOnline} />}
      </div>
    </div>
  );
}
