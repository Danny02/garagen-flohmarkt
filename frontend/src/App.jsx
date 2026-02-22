import { useState, useEffect, useRef } from "react";
import { loadMyStands, saveMyStand, removeMyStand, loadCachedStands, saveCachedStands } from "./utils.js";
import { API_BASE, STANDS } from "./constants.js";
import { authenticateWithPasskey } from "./passkey.js";
import NavBar from "./components/ui/NavBar.jsx";
import HomeScreen from "./components/screens/HomeScreen.jsx";
import MapScreen from "./components/screens/MapScreen.jsx";
import RegisterScreen from "./components/screens/RegisterScreen.jsx";
import InfoScreen from "./components/screens/InfoScreen.jsx";

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
  const [screen, setScreen] = useState("home");
  const [isOnline, setIsOnline] = useState(typeof window === "undefined" ? true : navigator.onLine);
  const [dynamicStands, setDynamicStands] = useState(loadCachedStands);
  const [myStands, setMyStands] = useState(loadMyStands);
  const [editMode, setEditMode] = useState(null);
  const [passkeyLoginError, setPasskeyLoginError] = useState("");
  const scrollRef = useRef(null);

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
      setScreen("home");
      setPasskeyLoginError("Offline: Anmelden, Bearbeiten und Loeschen sind nur mit Internet moeglich.");
    }
  }, [isOnline, screen]);

  useEffect(function () {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    const editSecret = params.get("secret");
    if (editId && editSecret) {
      if (!isOnline) {
        setPasskeyLoginError("Offline: Bearbeiten ist nur mit Internet moeglich.");
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }

      fetch(`${API_BASE}/api/stands/${editId}`)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          saveMyStand({ id: editId, editSecret, address: data?.address || "", label: data?.label });
          setMyStands(loadMyStands());
          setEditMode({ id: editId, secret: editSecret, sessionToken: null, initialData: data || {} });
          setScreen("register");
          window.history.replaceState({}, "", window.location.pathname);
        })
        .catch(function () {
          const cachedStand = loadCachedStands().find(function (s) { return String(s.id) === String(editId); });
          setEditMode({ id: editId, secret: editSecret, sessionToken: null, initialData: cachedStand || {} });
          setScreen("register");
          window.history.replaceState({}, "", window.location.pathname);
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
      setPasskeyLoginError("Offline: Bearbeiten ist nur mit Internet moeglich.");
      return;
    }

    fetch(`${API_BASE}/api/stands/${localEntry.id}`)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        setEditMode({ id: localEntry.id, secret, sessionToken, initialData: data || localEntry });
        setScreen("register");
      })
      .catch(function () {
        const cachedStand = loadCachedStands().find(function (s) { return String(s.id) === String(localEntry.id); });
        setEditMode({ id: localEntry.id, secret, sessionToken, initialData: cachedStand || localEntry });
        setScreen("register");
      });
  }

  function normalizePasskeyError(error) {
    const msg = String(error?.message || "Passkey-Anmeldung fehlgeschlagen");
    if (/Credential not found/i.test(msg)) {
      return "Passkey nicht gefunden. Bitte nutze dieselbe App-URL wie bei der Einrichtung oder richte den Passkey ueber deinen Bearbeitungs-Link neu ein.";
    }
    if (/Verification failed/i.test(msg) || /signature verification failed/i.test(msg)) {
      return "Passkey konnte nicht verifiziert werden. Bitte erneut versuchen; falls es weiter fehlschlaegt, Passkey neu einrichten.";
    }
    if (/Challenge expired/i.test(msg)) {
      return "Anmeldung abgelaufen. Bitte nochmal auf 'Mit Passkey anmelden' tippen.";
    }
    return msg;
  }

  async function handlePasskeyLogin(localEntry) {
    setPasskeyLoginError("");
    if (!isOnline) {
      setPasskeyLoginError("Offline: Bearbeiten ist nur mit Internet moeglich.");
      return;
    }

    try {
      const { sessionToken } = await authenticateWithPasskey(localEntry.credentialId);
      handleEditMyStand(localEntry, null, sessionToken);
    } catch (e) {
      setPasskeyLoginError(normalizePasskeyError(e));
    }
  }

  async function handlePasskeyRecoveryLogin() {
    setPasskeyLoginError("");
    if (!isOnline) {
      setPasskeyLoginError("Offline: Bearbeiten ist nur mit Internet moeglich.");
      return;
    }

    try {
      const { sessionToken, credentialId } = await authenticateWithPasskey();
      const ownedRes = await fetch(`${API_BASE}/api/my/stands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      if (!ownedRes.ok) throw new Error("Eigene Staende konnten nicht geladen werden");
      const ownedStands = await ownedRes.json();
      if (!Array.isArray(ownedStands) || ownedStands.length === 0) {
        throw new Error("Keine Staende fuer diesen Passkey gefunden");
      }

      ownedStands.forEach(function (stand) {
        saveMyStand({
          id: stand.id,
          address: stand.address || "",
          label: stand.label,
          credentialId,
        });
      });
      setMyStands(loadMyStands());
      setEditMode(null);
      setScreen("home");
    } catch (e) {
      setPasskeyLoginError(normalizePasskeyError(e));
    }
  }

  async function handleDeleteMyStand(localEntry) {
    if (!isOnline) {
      setPasskeyLoginError("Offline: Loeschen ist nur mit Internet moeglich.");
      return;
    }

    const confirmed = window.confirm("Stand wirklich loeschen?");
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
        throw new Error("Kein gueltiger Zugriff fuer Loeschen vorhanden");
      }

      const res = await fetch(`${API_BASE}/api/stands/${localEntry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authField),
      });
      if (!res.ok && res.status !== 404) throw new Error("Loeschen fehlgeschlagen");

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
      setPasskeyLoginError("Offline: Anmelden ist nur mit Internet moeglich.");
      setScreen("home");
      return;
    }

    if (nextScreen !== "register") setEditMode(null);
    setPasskeyLoginError("");
    setScreen(nextScreen);
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

        {!isOnline && (
          <div style={{ position: "sticky", top: 0, zIndex: 150, background: "#5f6368", color: "#fff", padding: "8px 12px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
            Offline-Modus: Lesen verfuegbar, Anmelden/Bearbeiten/Loeschen deaktiviert.
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
