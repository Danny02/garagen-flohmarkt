import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { STANDS, CATEGORIES, DISTRICTS, CAT_COLORS, FILTER_ALL_LABEL, MAP_CENTER, MAP_LEGEND_ITEMS } from "../../constants.js";
import { getCatIcon } from "../../category.js";
import Header from "../ui/Header.jsx";
import Badge from "../ui/Badge.jsx";

export default function MapScreen({ dynamicStands, layout }) {
  const [filter, setFilter] = useState(FILTER_ALL_LABEL);
  const [districtFilter, setDistrictFilter] = useState(FILTER_ALL_LABEL);
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [routePath, setRoutePath] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [now, setNow] = useState(function () { return new Date(); });
  const geoWatchIdRef = useRef(null);

  useEffect(function () {
    setRoutePath([]);
    setRouteError("");
  }, [selected]);

  const allStands = STANDS.concat(dynamicStands);

  function standTitle(stand) {
    return stand.name || stand.label || stand.address || "Stand";
  }

  function standTime(stand) {
    if (stand.time) return stand.time;
    if (stand.time_from && stand.time_to) return `${stand.time_from}-${stand.time_to}`;
    return "Zeit folgt";
  }

  function standCategories(stand) {
    return Array.isArray(stand.categories) ? stand.categories : [];
  }

  function standPrimaryCategory(stand) {
    return standCategories(stand)[0];
  }

  function parseTimeToMinutes(value) {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  function extractStandTimeWindow(stand) {
    const fromDirect = parseTimeToMinutes(stand.time_from);
    const toDirect = parseTimeToMinutes(stand.time_to);
    if (fromDirect !== null && toDirect !== null) {
      return { from: fromDirect, to: toDirect };
    }

    if (typeof stand.time === "string") {
      const parts = stand.time.split("-");
      if (parts.length === 2) {
        const fromFallback = parseTimeToMinutes(parts[0]);
        const toFallback = parseTimeToMinutes(parts[1]);
        if (fromFallback !== null && toFallback !== null) {
          return { from: fromFallback, to: toFallback };
        }
      }
    }

    return null;
  }

  function getStandActivity(stand) {
    if (stand.open === false) {
      return {
        color: "#F44336",
        label: "Stand geschlossen (Flag)",
      };
    }

    const window = extractStandTimeWindow(stand);
    if (!window) {
      return {
        color: "#4CAF50",
        label: "Stand offen",
      };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isWithinWindow = currentMinutes >= window.from && currentMinutes <= window.to;

    return isWithinWindow
      ? { color: "#4CAF50", label: "Stand offen (im Zeitfenster)" }
      : { color: "#FF9800", label: "Stand ausserhalb Zeitfenster" };
  }

  const filtered = allStands.filter(function (s) {
    const categories = standCategories(s);
    const catMatch = filter === FILTER_ALL_LABEL || categories.indexOf(filter) >= 0;
    const distMatch = districtFilter === FILTER_ALL_LABEL || s.district === districtFilter;
    return catMatch && distMatch;
  });

  const MAP_H = layout.isDesktop ? 520 : layout.isTablet ? 420 : 340;
  const mappable = filtered.filter(function (s) { return s.lat && s.lng; });
  const mapCenter = [MAP_CENTER.lat, MAP_CENTER.lng];
  const isTestEnv = import.meta.env.MODE === "test";

  useEffect(function () {
    return function () {
      if (typeof navigator !== "undefined" && navigator.geolocation && geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  useEffect(function () {
    const intervalId = setInterval(function () {
      setNow(new Date());
    }, 60000);

    return function () {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(function () {
    let cancelled = false;

    async function loadCurrentLocationIfAlreadyAllowed() {
      if (typeof navigator === "undefined" || !navigator.geolocation || !navigator.permissions) {
        return;
      }

      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state !== "granted" || cancelled) return;

        const location = await requestCurrentLocation();
        if (cancelled) return;

        setGeoError("");
        setMyLocation(location);
      } catch {
      }
    }

    loadCurrentLocationIfAlreadyAllowed();

    return function () {
      cancelled = true;
    };
  }, []);

  function FocusSelectedStand({ stand }) {
    const map = useMap();

    useEffect(function () {
      if (!stand || !stand.lat || !stand.lng) return;
      map.flyTo([stand.lat, stand.lng], Math.max(map.getZoom(), 15), { duration: 0.5 });
    }, [stand, map]);

    return null;
  }

  function FocusRoute({ path }) {
    const map = useMap();

    useEffect(function () {
      if (!path || path.length < 2) return;
      map.fitBounds(path, { padding: [28, 28] });
    }, [path, map]);

    return null;
  }

  function startLocationWatch() {
    if (geoWatchIdRef.current !== null) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      function (position) {
        setGeoError("");
        setMyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      function (error) {
        setGeoError("Standortzugriff blockiert");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }

  function requestCurrentLocation() {
    return new Promise(function (resolve, reject) {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("geo_unavailable"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        function (position) {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        function (error) {
          reject(new Error("geo_denied"));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );
    });
  }

  async function ensureLocationForRouting() {
    if (myLocation) return myLocation;

    if (hasRequestedLocation) {
      setRouteError(geoError || "Aktiviere zuerst deinen Standort.");
      return null;
    }

    setHasRequestedLocation(true);

    try {
      const location = await requestCurrentLocation();
      setGeoError("");
      setMyLocation(location);
      startLocationWatch();
      return location;
    } catch (error) {
      if (error && error.message === "geo_unavailable") {
        setGeoError("Standort nicht verfuegbar");
        setRouteError("Standort nicht verfuegbar");
      } else {
        setGeoError("Standortzugriff blockiert");
        setRouteError("Standortzugriff blockiert");
      }
      return null;
    }
  }

  async function showWalkingRouteToSelected() {
    if (!selected || !selected.lat || !selected.lng) return;
    setRouteLoading(true);
    setRouteError("");

    const location = await ensureLocationForRouting();
    if (!location) {
      setRouteLoading(false);
      return;
    }

    const fromLng = location.lng;
    const fromLat = location.lat;
    const toLng = selected.lng;
    const toLat = selected.lat;

    try {
      const url = "https://router.project-osrm.org/route/v1/foot/" +
        fromLng + "," + fromLat + ";" + toLng + "," + toLat +
        "?overview=full&geometries=geojson";
      const response = await fetch(url);
      if (!response.ok) throw new Error("request_failed");
      const data = await response.json();
      const geometry = data && data.routes && data.routes[0] && data.routes[0].geometry;
      const coordinates = geometry && geometry.coordinates;
      if (!coordinates || coordinates.length < 2) throw new Error("no_route");

      const leafletPath = coordinates.map(function (coord) {
        return [coord[1], coord[0]];
      });
      setRoutePath(leafletPath);
    } catch {
      setRoutePath([]);
      setRouteError("Keine Gehroute gefunden.");
    } finally {
      setRouteLoading(false);
    }
  }

  function openInNavigationTool(stand) {
    if (typeof window === "undefined" || !stand) return;

    const hasCoordinates = Number.isFinite(stand.lat) && Number.isFinite(stand.lng);
    const url = hasCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${stand.lat},${stand.lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stand.address || standTitle(stand))}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  const standsList = (
    <div style={{ padding: layout.isDesktop ? "0 0 12px" : "4px 16px 100px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
        {"Alle Staende (" + filtered.length + ")"}
      </div>
      {filtered.map(function (s) {
        const isSel = selected !== null && selected.id === s.id;
        const primaryCategory = standPrimaryCategory(s);
        const col = CAT_COLORS[primaryCategory] || "var(--COLOR-1)";
        const activity = getStandActivity(s);
        return (
          <button key={s.id} onClick={function () { setSelected(s); }} style={{ display: "flex", gap: 12, padding: "12px 14px", marginBottom: 8, background: isSel ? "#f0f7fa" : "#fff", borderRadius: 12, border: isSel ? "1.5px solid var(--COLOR-1)" : "1px solid #eee", cursor: "pointer", width: "100%", textAlign: "left" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: col + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: col }}>
              {getCatIcon(primaryCategory)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{standTitle(s)}</div>
              <div style={{ fontSize: 12, color: "#999" }}>{s.address + " | " + standTime(s)}</div>
            </div>
            <div
              title={activity.label}
              aria-label={activity.label}
              style={{ width: 35, height: 35, borderRadius: 17.5, flexShrink: 0, alignSelf: "flex-start", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 4, background: activity.color }} />
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <Header title="Interaktive Karte" subtitle={filtered.length + " Staende gefunden"} layout={layout} />

      <div style={{ padding: layout.isDesktop ? "14px 22px 0" : "10px 16px 0" }}>
        <button
          onClick={function () { setShowFilters(!showFilters); }}
          style={{ background: showFilters ? "var(--COLOR-1)" : "#f5f5f5", color: showFilters ? "#fff" : "#555", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {"Filter " + (showFilters ? "ausblenden" : "anzeigen") + ((filter !== FILTER_ALL_LABEL || districtFilter !== FILTER_ALL_LABEL) ? " (aktiv)" : "")}
        </button>
      </div>

      {showFilters && (
        <div style={{ padding: layout.isDesktop ? "10px 22px 0" : "10px 16px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Kategorie</div>
          <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
            {CATEGORIES.map(function (c) {
              return <Badge key={c} color={CAT_COLORS[c] || "var(--COLOR-1)"} active={filter === c} onClick={function () { setFilter(c); }}>{c}</Badge>;
            })}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Stadtteil</div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {DISTRICTS.map(function (d) {
              return <Badge key={d} color="#607D8B" active={districtFilter === d} onClick={function () { setDistrictFilter(d); }}>{d}</Badge>;
            })}
          </div>
        </div>
      )}

      <div style={{ display: layout.isDesktop ? "grid" : "block", gridTemplateColumns: layout.isDesktop ? "minmax(0, 1.35fr) minmax(320px, 1fr)" : "1fr", gap: layout.isDesktop ? 16 : 0, padding: layout.isDesktop ? "12px 22px 18px" : 0 }}>
        <div>
          <div style={{ margin: layout.isDesktop ? "0" : "12px 16px", borderRadius: 16, overflow: "hidden", border: "1px solid #dde8ed", position: "relative", background: "#e8f0e4", height: MAP_H }}>
            {isTestEnv ? (
              <div style={{ height: "100%", width: "100%", background: "#eaf2e3" }} />
            ) : (
              <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                />
                <FocusSelectedStand stand={selected} />
                <FocusRoute path={routePath} />
                {mappable.map(function (s) {
                  const color = CAT_COLORS[standPrimaryCategory(s)] || "var(--COLOR-1)";
                  const isSel = selected !== null && selected.id === s.id;
                  return (
                    <CircleMarker
                      key={s.id}
                      center={[s.lat, s.lng]}
                      radius={isSel ? 10 : 7}
                      pathOptions={{
                        color: color,
                        weight: isSel ? 3 : 2,
                        fillColor: color,
                        fillOpacity: isSel ? 0.95 : 0.75,
                      }}
                      eventHandlers={{
                        click: function () { setSelected(isSel ? null : s); },
                      }}
                    >
                      <Popup>
                        <strong>{standTitle(s)}</strong>
                        <br />
                        {s.address}
                      </Popup>
                    </CircleMarker>
                  );
                })}
                {myLocation && (
                  <>
                    <Circle
                      center={[myLocation.lat, myLocation.lng]}
                      radius={Math.max(myLocation.accuracy || 0, 10)}
                      pathOptions={{
                        color: "#1E88E5",
                        weight: 1,
                        fillColor: "#1E88E5",
                        fillOpacity: 0.12,
                      }}
                    />
                    <CircleMarker
                      center={[myLocation.lat, myLocation.lng]}
                      radius={7}
                      pathOptions={{
                        color: "#fff",
                        weight: 2,
                        fillColor: "#1E88E5",
                        fillOpacity: 1,
                      }}
                    >
                      <Popup>Du bist hier</Popup>
                    </CircleMarker>
                  </>
                )}
                {routePath.length > 1 && (
                  <Polyline
                    positions={routePath}
                    pathOptions={{
                      color: "#1E88E5",
                      weight: 4,
                      opacity: 0.85,
                    }}
                  />
                )}
              </MapContainer>
            )}

            <div style={{ position: "absolute", left: 10, bottom: 10, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "6px 10px", fontSize: 10, lineHeight: 1.8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Legende:</div>
              <div>
                {MAP_LEGEND_ITEMS.map(function (item) {
                  return <span key={item.label} style={{ marginRight: 10 }}><span style={{ color: item.color }}>{"o "}</span>{item.label}</span>;
                })}
              </div>
              <div><span style={{ color: "#1E88E5" }}>{"o "}</span>{"Mein Standort"}</div>
              <div><span style={{ color: "#1E88E5" }}>{"--- "}</span>{"Gehroute"}</div>
            </div>

            {geoError && (
              <div style={{ position: "absolute", right: 10, top: 10, background: "rgba(255,255,255,0.95)", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, color: "#555", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                {geoError}
              </div>
            )}
          </div>

          {selected && (
            <div style={{ margin: layout.isDesktop ? "12px 0" : "0 16px 12px", background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#333" }}>{standTitle(selected)}</h3>
                  <div style={{ fontSize: 13, color: "#777" }}>{"Standort: " + selected.address}</div>
                </div>
                <div style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: selected.open ? "#E8F5E9" : "#FFF3E0", color: selected.open ? "#2E7D32" : "#E65100" }}>
                  {selected.open ? "Geoeffnet" : "Geschlossen"}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 10, lineHeight: 1.5 }}>{selected.desc}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {standCategories(selected).map(function (c) {
                  const col = CAT_COLORS[c] || "var(--COLOR-1)";
                  return <span key={c} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: col + "20", color: col }}>{c}</span>;
                })}
              </div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 10 }}>{"Uhrzeit: " + standTime(selected) + " | " + selected.district}</div>
              <button
                onClick={showWalkingRouteToSelected}
                disabled={routeLoading}
                style={{ width: "100%", marginTop: 12, padding: "10px", border: "1.5px solid var(--COLOR-1)", borderRadius: 10, background: "transparent", color: "var(--COLOR-1)", fontSize: 13, fontWeight: 700, cursor: routeLoading ? "not-allowed" : "pointer", opacity: routeLoading ? 0.6 : 1 }}
              >
                {routeLoading ? "Route wird berechnet..." : "Route hierhin"}
              </button>
              <button
                onClick={function () { openInNavigationTool(selected); }}
                style={{ width: "100%", marginTop: 8, padding: "10px", border: "1px solid #e0e0e0", borderRadius: 10, background: "#fff", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Navigation oeffnen
              </button>
              {routeError && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>{routeError}</div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: layout.isDesktop ? "0" : undefined }}>
          {standsList}
        </div>
      </div>
    </div>
  );
}
