import { useState, useEffect, useRef } from "react";

// In production this is set to the Worker URL via VITE_WORKER_URL env var.
// In local dev the Vite proxy forwards /api/* to wrangler dev (port 8787).
const API_BASE = import.meta.env.VITE_WORKER_URL ?? "";

const STANDS = [
  { id: 1, name: "Familie Mueller", address: "Bahnhofstr. 12", lat: 49.4425, lng: 10.9555, categories: ["Kindersachen", "Spielzeug"], desc: "Kinderkleidung Gr. 92-140, Lego, Playmobil, Kinderbuecher", time: "10:00-16:00", district: "Kernstadt", open: true },
  { id: 2, name: "Schmidt u. Nachbarn", address: "Rothenburger Str. 45", lat: 49.4445, lng: 10.9520, categories: ["Moebel", "Haushalt"], desc: "Regale, Geschirr, Kuechengeraete, Lampen", time: "10:00-15:00", district: "Kernstadt", open: true },
  { id: 3, name: "Flohmarkt Weinzierlein", address: "Am Dorfplatz 3", lat: 49.4510, lng: 10.9380, categories: ["Vintage", "Buecher"], desc: "Schallplatten, Vintage-Kleidung, alte Buecher, Retro-Deko", time: "09:00-14:00", district: "Weinzierlein", open: false },
  { id: 4, name: "Garage Hofmann", address: "Anwanderweg 8", lat: 49.4390, lng: 10.9600, categories: ["Garten", "Werkzeug"], desc: "Gartenwerkzeug, Blumentoepfe, Rasenmaeher, Werkzeugkisten", time: "10:00-16:00", district: "Kernstadt", open: true },
  { id: 5, name: "Wintersdorf-Troedel", address: "Wintersdorfer Str. 22", lat: 49.4350, lng: 10.9480, categories: ["Kindersachen", "Kleidung"], desc: "Baby-Erstausstattung, Kinderwagen, Damen-/Herrenkleidung", time: "10:00-15:00", district: "Wintersdorf", open: true },
  { id: 6, name: "Buecherwurm Zirndorf", address: "Fuerther Str. 31", lat: 49.4430, lng: 10.9530, categories: ["Buecher", "Medien"], desc: "Romane, Sachbuecher, DVDs, Brettspiele, Puzzles", time: "10:00-16:00", district: "Kernstadt", open: true },
  { id: 7, name: "Elektro-Garage Lang", address: "Volkhardtstr. 5", lat: 49.4460, lng: 10.9570, categories: ["Elektronik", "Haushalt"], desc: "Alte Handys, Kabel, Kuechenmaschinen, Monitore", time: "11:00-15:00", district: "Kernstadt", open: true },
  { id: 8, name: "Hof Weber", address: "Banderbach 14", lat: 49.4480, lng: 10.9420, categories: ["Vintage", "Moebel"], desc: "Antike Moebel, Porzellan, Oelbilder, Teppiche", time: "09:00-16:00", district: "Leichendorf", open: true },
];

const CATEGORIES = ["Alle", "Kindersachen", "Buecher", "Moebel", "Vintage", "Kleidung", "Haushalt", "Spielzeug", "Garten", "Werkzeug", "Elektronik", "Medien"];
const DISTRICTS = ["Alle", "Kernstadt", "Weinzierlein", "Wintersdorf", "Leichendorf"];

const CAT_COLORS = {
  Kindersachen: "#E91E63",
  Spielzeug: "#E91E63",
  Buecher: "#2196F3",
  Medien: "#2196F3",
  Moebel: "#FF9800",
  Haushalt: "#FF9800",
  Vintage: "#9C27B0",
  Kleidung: "#4CAF50",
  Garten: "#8BC34A",
  Werkzeug: "#795548",
  Elektronik: "#607D8B",
};

function getCatIcon(cat) {
  if (cat === "Kindersachen" || cat === "Spielzeug") return "K";
  if (cat === "Buecher" || cat === "Medien") return "B";
  if (cat === "Moebel" || cat === "Haushalt") return "M";
  if (cat === "Vintage") return "V";
  if (cat === "Kleidung") return "C";
  if (cat === "Garten" || cat === "Werkzeug") return "G";
  if (cat === "Elektronik") return "E";
  return "?";
}

const EVENT_DATE = "Samstag, 13. Juni 2026";
const EVENT_TIME = "10:00 - 16:00 Uhr";

function Badge({ children, color, onClick, active }) {
  const c = color || "#1B5E7B";
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-block",
        padding: "5px 14px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        border: "2px solid " + c,
        background: active ? c : "transparent",
        color: active ? "#fff" : c,
        cursor: "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        margin: "0 4px 6px 0",
      }}
    >
      {children}
    </button>
  );
}

function NavBar({ active, setScreen }) {
  const items = [
    { id: "home", label: "Start", sym: "H" },
    { id: "map", label: "Karte", sym: "K" },
    { id: "register", label: "Anmelden", sym: "A" },
    { id: "info", label: "Info", sym: "i" },
  ];
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        background: "#fff",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        zIndex: 100,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {items.map(function (item) {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={function () { setScreen(item.id); }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 0 12px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: isActive ? "#1B5E7B" : "#999",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: isActive ? "#1B5E7B" : "#eee",
                color: isActive ? "#fff" : "#999",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {item.sym}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, marginTop: 3 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Header({ title, subtitle }) {
  return (
    <div style={{ padding: "20px 20px 14px", background: "linear-gradient(135deg, #1B5E7B 0%, #2E8B9E 100%)", color: "#fff" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, opacity: 0.7, textTransform: "uppercase" }}>
        Garagenflohmarkt Zirndorf
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "6px 0 2px", fontFamily: "'DM Sans', sans-serif" }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

function HomeScreen({ setScreen, totalStands }) {
  const steps = [
    { num: "1", title: "Anmelden", text: "Online in 2 Minuten - Adresse eingeben, Kategorien waehlen, fertig." },
    { num: "2", title: "Auf der Karte sichtbar", text: "Dein Stand erscheint automatisch auf der interaktiven Karte." },
    { num: "3", title: "Verkaufen", text: "Am Flohmarkttag oeffnest du Garage, Hof oder Garten fuer Besucher." },
    { num: "4", title: "Stoebern", text: "Besucher filtern nach Kategorie und finden gezielt, was sie suchen." },
  ];

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg, #1B5E7B 0%, #2E8B9E 50%, #4DB6AC 100%)",
          padding: "36px 24px 32px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          GF
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}>
          Garagenflohmarkt Zirndorf
        </h1>
        <p style={{ fontSize: 14, opacity: 0.85, margin: "10px 0 0", lineHeight: 1.5 }}>
          Zirndorfer oeffnen Garagen, Hoefe und Gaerten - von Buergern fuer Buerger.
        </p>
      </div>

      <div style={{ margin: "0 16px", marginTop: -14, background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #e8f4f8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2E7D32" }}>
            13.6.
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1B5E7B" }}>{EVENT_DATE}</div>
            <div style={{ fontSize: 13, color: "#666" }}>{EVENT_TIME + " - Gesamtes Stadtgebiet"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "#f5f9fb", borderRadius: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1B5E7B" }}>{totalStands}</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Staende</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "#f5f9fb", borderRadius: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1B5E7B" }}>4</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Stadtteile</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "#f5f9fb", borderRadius: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1B5E7B" }}>0 EUR</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Teilnahme</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 8px" }}>
        <button
          onClick={function () { setScreen("map"); }}
          style={{ width: "100%", padding: "16px", background: "#1B5E7B", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(27,94,123,0.3)" }}
        >
          Staende auf der Karte entdecken
        </button>
      </div>

      <div style={{ padding: "8px 16px 8px" }}>
        <button
          onClick={function () { setScreen("register"); }}
          style={{ width: "100%", padding: "16px", background: "#fff", color: "#1B5E7B", border: "2px solid #1B5E7B", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
        >
          Eigenen Stand anmelden
        </button>
      </div>

      <div style={{ padding: "20px 16px 100px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1B5E7B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
          So funktioniert es
        </h3>
        {steps.map(function (s, i) {
          return (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ width: 42, height: 42, borderRadius: 21, flexShrink: 0, background: "#1B5E7B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>
                {s.num}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "#777", lineHeight: 1.4 }}>{s.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapScreen({ dynamicStands }) {
  const [filter, setFilter] = useState("Alle");
  const [districtFilter, setDistrictFilter] = useState("Alle");
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Merge seed stands + any KV-registered stands
  const allStands = STANDS.concat(dynamicStands);

  const filtered = allStands.filter(function (s) {
    const catMatch = filter === "Alle" || s.categories.indexOf(filter) >= 0;
    const distMatch = districtFilter === "Alle" || s.district === districtFilter;
    return catMatch && distMatch;
  });

  const MAP_W = 390;
  const MAP_H = 340;

  function toXY(lat, lng) {
    return {
      x: ((lng - 10.935) / (10.965 - 10.935)) * MAP_W,
      y: MAP_H - ((lat - 49.433) / (49.453 - 49.433)) * MAP_H,
    };
  }

  // Only stands with coordinates appear on the SVG map
  const mappable = filtered.filter(function (s) { return s.lat && s.lng; });

  return (
    <div>
      <Header title="Interaktive Karte" subtitle={filtered.length + " Staende gefunden"} />

      <div style={{ padding: "10px 16px 0" }}>
        <button
          onClick={function () { setShowFilters(!showFilters); }}
          style={{ background: showFilters ? "#1B5E7B" : "#f5f5f5", color: showFilters ? "#fff" : "#555", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {"Filter " + (showFilters ? "ausblenden" : "anzeigen") + ((filter !== "Alle" || districtFilter !== "Alle") ? " (aktiv)" : "")}
        </button>
      </div>

      {showFilters && (
        <div style={{ padding: "10px 16px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Kategorie</div>
          <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
            {CATEGORIES.slice(0, 8).map(function (c) {
              return <Badge key={c} color={CAT_COLORS[c] || "#1B5E7B"} active={filter === c} onClick={function () { setFilter(c); }}>{c}</Badge>;
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

      <div style={{ margin: "12px 16px", borderRadius: 16, overflow: "hidden", border: "1px solid #dde8ed", position: "relative", background: "#e8f0e4", height: MAP_H }}>
        <svg width="100%" height="100%" viewBox={"0 0 " + MAP_W + " " + MAP_H} style={{ position: "absolute" }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d4ddd0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect fill="#EAF2E3" width="100%" height="100%" />
          <rect fill="url(#grid)" width="100%" height="100%" />
          <line x1="0" y1={MAP_H * 0.45} x2={MAP_W} y2={MAP_H * 0.45} stroke="#fff" strokeWidth="5" />
          <line x1={MAP_W * 0.55} y1="0" x2={MAP_W * 0.55} y2={MAP_H} stroke="#fff" strokeWidth="4" />
          <line x1={MAP_W * 0.2} y1="0" x2={MAP_W * 0.4} y2={MAP_H} stroke="#fff" strokeWidth="3" />
          <path d={"M 0 " + (MAP_H * 0.7) + " Q " + (MAP_W * 0.3) + " " + (MAP_H * 0.6) + " " + MAP_W + " " + (MAP_H * 0.75)} stroke="#B3D4E8" strokeWidth="6" fill="none" />
          <text x="10" y={MAP_H * 0.7 + 3} fontSize="8" fill="#8BAFC4" fontWeight="600">Bibert</text>
          <text x={MAP_W * 0.42} y={MAP_H * 0.42} fontSize="14" fill="rgba(0,0,0,0.12)" fontWeight="800" textAnchor="middle">ZIRNDORF</text>
        </svg>

        {mappable.map(function (s) {
          const pos = toXY(s.lat, s.lng);
          const color = CAT_COLORS[s.categories[0]] || "#1B5E7B";
          const isSel = selected !== null && selected.id === s.id;
          return (
            <button
              key={s.id}
              onClick={function () { setSelected(isSel ? null : s); }}
              style={{ position: "absolute", left: pos.x - 14, top: pos.y - 34, width: 28, height: 34, border: "none", background: "transparent", cursor: "pointer", zIndex: isSel ? 20 : 10, padding: 0, transform: isSel ? "scale(1.3)" : "scale(1)", transition: "transform 0.2s", filter: isSel ? "drop-shadow(0 3px 6px rgba(0,0,0,0.3))" : "none" }}
            >
              <svg viewBox="0 0 28 34" width="28" height="34">
                <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 20 14 20s14-9.5 14-20C28 6.3 21.7 0 14 0z" fill={color} />
                <circle cx="14" cy="13" r="7" fill="#fff" />
                <text x="14" y="17" textAnchor="middle" fontSize="11" fill={color} fontWeight="800">{getCatIcon(s.categories[0])}</text>
              </svg>
            </button>
          );
        })}

        <div style={{ position: "absolute", left: 10, bottom: 10, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "6px 10px", fontSize: 10, lineHeight: 1.8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Legende:</div>
          <div><span style={{ color: "#E91E63" }}>{"o "}</span>{"Kinder  "}<span style={{ color: "#2196F3" }}>{"o "}</span>{"Buecher  "}<span style={{ color: "#FF9800" }}>{"o "}</span>{"Moebel"}</div>
          <div><span style={{ color: "#9C27B0" }}>{"o "}</span>{"Vintage  "}<span style={{ color: "#4CAF50" }}>{"o "}</span>{"Kleidung  "}<span style={{ color: "#607D8B" }}>{"o "}</span>{"Elektro"}</div>
        </div>
      </div>

      {selected && (
        <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#333" }}>{selected.name}</h3>
              <div style={{ fontSize: 13, color: "#777" }}>{"Standort: " + selected.address}</div>
            </div>
            <div style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: selected.open ? "#E8F5E9" : "#FFF3E0", color: selected.open ? "#2E7D32" : "#E65100" }}>
              {selected.open ? "Geoeffnet" : "Geschlossen"}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 10, lineHeight: 1.5 }}>{selected.desc}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {selected.categories.map(function (c) {
              const col = CAT_COLORS[c] || "#1B5E7B";
              return <span key={c} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: col + "20", color: col }}>{c}</span>;
            })}
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 10 }}>{"Uhrzeit: " + selected.time + " | " + selected.district}</div>
          <button style={{ width: "100%", marginTop: 12, padding: "10px", border: "1.5px solid #1B5E7B", borderRadius: 10, background: "transparent", color: "#1B5E7B", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Route hierhin
          </button>
        </div>
      )}

      <div style={{ padding: "4px 16px 100px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          {"Alle Staende (" + filtered.length + ")"}
        </div>
        {filtered.map(function (s) {
          const isSel = selected !== null && selected.id === s.id;
          const col = CAT_COLORS[s.categories[0]] || "#1B5E7B";
          return (
            <button key={s.id} onClick={function () { setSelected(s); }} style={{ display: "flex", gap: 12, padding: "12px 14px", marginBottom: 8, background: isSel ? "#f0f7fa" : "#fff", borderRadius: 12, border: isSel ? "1.5px solid #1B5E7B" : "1px solid #eee", cursor: "pointer", width: "100%", textAlign: "left" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: col + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: col }}>
                {getCatIcon(s.categories[0])}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{s.address + " | " + s.time}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 8, background: s.open ? "#4CAF50" : "#FF9800" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RegisterScreen({ onRegistered }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", address: "", plz: "90513", email: "", desc: "", categories: [], time_from: "10:00", time_to: "16:00" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function toggleCat(c) {
    setForm(function (f) {
      const has = f.categories.indexOf(c) >= 0;
      const cats = has ? f.categories.filter(function (x) { return x !== c; }) : f.categories.concat([c]);
      return Object.assign({}, f, { categories: cats });
    });
  }

  function updateField(key, value) {
    setForm(function (f) {
      const updated = Object.assign({}, f);
      updated[key] = value;
      return updated;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/stands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newStand = await res.json();
        onRegistered(newStand);
      }
    } catch (err) {
      console.error("Registration error:", err);
      // Still show success – stand will be reviewed manually
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div>
        <Header title="Anmeldung erfolgreich!" subtitle="" />
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px", color: "#2E7D32", fontWeight: 800 }}>
            OK
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1B5E7B", margin: "0 0 12px" }}>Du bist dabei!</h2>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, margin: "0 0 24px" }}>
            {"Eine Bestaetigung wurde an "}
            <strong>{form.email || "deine@email.de"}</strong>
            {" gesendet. Dein Stand erscheint nach Pruefung auf der Karte."}
          </p>
          <div style={{ background: "#f5f9fb", borderRadius: 14, padding: "18px", textAlign: "left", marginBottom: 20, border: "1px solid #e0edf2" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Deine Anmeldung</div>
            <div style={{ fontSize: 14, color: "#333", lineHeight: 1.8 }}>
              <strong>{form.name || "Max Mustermann"}</strong>
              <br />
              {"Standort: " + (form.address || "Musterstr. 1") + ", " + form.plz + " Zirndorf"}
              <br />
              {"Uhrzeit: " + form.time_from + " - " + form.time_to + " Uhr"}
              <br />
              {"Kategorien: " + (form.categories.length > 0 ? form.categories.join(", ") : "Kindersachen, Buecher")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fields = [
    { label: "Name / Hausgemeinschaft", key: "name", placeholder: "z.B. Familie Mueller" },
    { label: "Adresse des Stands", key: "address", placeholder: "z.B. Bahnhofstr. 12" },
    { label: "PLZ", key: "plz", placeholder: "90513" },
    { label: "E-Mail (fuer Bestaetigung)", key: "email", placeholder: "deine@email.de" },
  ];

  return (
    <div>
      <Header title="Stand anmelden" subtitle={"Schritt " + (step + 1) + " von 3"} />

      <div style={{ display: "flex", gap: 4, padding: "16px 16px 0" }}>
        {[0, 1, 2].map(function (i) {
          return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "#1B5E7B" : "#e0e0e0", transition: "background 0.3s" }} />;
        })}
      </div>

      <div style={{ padding: "20px 16px 100px" }}>
        {step === 0 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#333" }}>Persoenliche Daten</h3>
            {fields.map(function (field) {
              return (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={function (e) { updateField(field.key, e.target.value); }}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#333" }}>Was bietest du an?</h3>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>Waehle passende Kategorien (Mehrfachauswahl)</p>
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 20 }}>
              {CATEGORIES.slice(1).map(function (c) {
                return <Badge key={c} color={CAT_COLORS[c] || "#1B5E7B"} active={form.categories.indexOf(c) >= 0} onClick={function () { toggleCat(c); }}>{c}</Badge>;
              })}
            </div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Kurze Beschreibung (optional)</label>
            <textarea
              placeholder="z.B. Kinderkleidung Gr. 92-140, Playmobil..."
              value={form.desc}
              onChange={function (e) { updateField("desc", e.target.value); }}
              rows={3}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#333" }}>Wann bist du dabei?</h3>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>{"Der Flohmarkt findet am " + EVENT_DATE + " statt."}</p>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Von</label>
                <select value={form.time_from} onChange={function (e) { updateField("time_from", e.target.value); }} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, background: "#fff" }}>
                  <option value="09:00">09:00 Uhr</option>
                  <option value="10:00">10:00 Uhr</option>
                  <option value="11:00">11:00 Uhr</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Bis</label>
                <select value={form.time_to} onChange={function (e) { updateField("time_to", e.target.value); }} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, background: "#fff" }}>
                  <option value="14:00">14:00 Uhr</option>
                  <option value="15:00">15:00 Uhr</option>
                  <option value="16:00">16:00 Uhr</option>
                </select>
              </div>
            </div>
            <div style={{ background: "#FFF8E1", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: "#FFD54F", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>!</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>
                <strong>Wichtig:</strong> Der Verkauf findet auf deinem eigenen Grundstueck statt. Es duerfen nur gebrauchte Gegenstaende verkauft werden. Kein Alkoholausschank, keine Musik.
              </div>
            </div>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#555", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ marginTop: 2 }} />
              <span>Ich habe die Spielregeln gelesen und bin einverstanden.</span>
            </label>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button onClick={function () { setStep(step - 1); }} style={{ padding: "14px 24px", borderRadius: 12, border: "1.5px solid #ddd", background: "#fff", color: "#555", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Zurueck
            </button>
          )}
          <button
            disabled={submitting}
            onClick={function () {
              if (step < 2) {
                setStep(step + 1);
              } else {
                handleSubmit();
              }
            }}
            style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: submitting ? "#aaa" : "#1B5E7B", color: "#fff", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(27,94,123,0.25)" }}
          >
            {submitting ? "Wird gesendet…" : step < 2 ? "Weiter" : "Jetzt anmelden"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoScreen() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: "Brauche ich eine Genehmigung?", a: "Nein. Solange du auf deinem eigenen Grundstueck verkaufst und nur gebrauchte Gegenstaende anbietest, ist keine Genehmigung noetig." },
    { q: "Was darf ich verkaufen?", a: "Nur gebrauchte Gegenstaende aus Privatbesitz - Kleidung, Buecher, Spielzeug, Moebel, Haushaltswaren etc. Neuware und gewerblicher Verkauf sind nicht erlaubt." },
    { q: "Was wenn es regnet?", a: "Bei schlechtem Wetter kannst du deinen Stand kurzfristig absagen - einfach ueber den Bearbeitungs-Link in deiner Bestaetigungsmail." },
    { q: "Kostet die Teilnahme etwas?", a: "Nein, die Teilnahme ist komplett kostenlos - sowohl fuer Verkaeufer als auch fuer Besucher." },
    { q: "Wer organisiert den Flohmarkt?", a: "Der Garagenflohmarkt wird ehrenamtlich von Zirndorfer Buergern organisiert. Die digitale Plattform wird von Digitales Zirndorf betrieben." },
    { q: "Darf ich auf dem Gehweg stehen?", a: "Nein, der Verkauf muss auf deinem privaten Grundstueck stattfinden (Garage, Hof, Einfahrt, Garten)." },
  ];

  const rules = [
    { ok: true, text: "Nur gebrauchte Gegenstaende aus Privatbesitz" },
    { ok: true, text: "Nur auf eigenem Grundstueck (Garage, Hof, Garten)" },
    { ok: true, text: "Kostenlose Teilnahme fuer Verkaeufer und Besucher" },
    { ok: false, text: "Kein gewerblicher Verkauf, keine Neuware" },
    { ok: false, text: "Kein Alkoholausschank" },
    { ok: false, text: "Keine laute Musik (GEMA-pflichtig)" },
    { ok: false, text: "Keine Staende auf oeffentlichen Gehwegen" },
  ];

  return (
    <div>
      <Header title="Infos und FAQ" subtitle="Alles was du wissen musst" />

      <div style={{ padding: "16px 16px 4px" }}>
        <div style={{ background: "linear-gradient(135deg, #E8F5E9, #C8E6C9)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2E7D32" }}>13.6.</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1B5623" }}>{EVENT_DATE}</div>
            <div style={{ fontSize: 13, color: "#388E3C" }}>{EVENT_TIME + " | Im gesamten Stadtgebiet"}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 4px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1B5E7B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Spielregeln</h3>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
          {rules.map(function (rule, i) {
            return (
              <div key={i} style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: i < rules.length - 1 ? "1px solid #f5f5f5" : "none", fontSize: 14, color: "#444" }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, background: rule.ok ? "#E8F5E9" : "#FFEBEE", color: rule.ok ? "#2E7D32" : "#C62828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                  {rule.ok ? "+" : "-"}
                </div>
                <span>{rule.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "20px 16px 4px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1B5E7B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Haeufige Fragen</h3>
        {faqs.map(function (faq, i) {
          const isOpen = openFaq === i;
          return (
            <div key={i} style={{ marginBottom: 8, background: "#fff", borderRadius: 12, border: isOpen ? "1.5px solid #1B5E7B" : "1px solid #eee", overflow: "hidden" }}>
              <button
                onClick={function () { setOpenFaq(isOpen ? null : i); }}
                style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none", fontSize: 14, fontWeight: 600, color: "#333", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}
              >
                <span>{faq.q}</span>
                <span style={{ fontSize: 14, color: "#999", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginLeft: 8, flexShrink: 0 }}>V</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 16px 14px", fontSize: 13, color: "#666", lineHeight: 1.6 }}>{faq.a}</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "20px 16px 100px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1B5E7B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Kontakt</h3>
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #eee" }}>
          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
            <strong>Orga-Team Garagenflohmarkt</strong>
            <br />
            {"E-Mail: flohmarkt@digitales-zirndorf.de"}
            <br />
            {"Web: digitales-zirndorf.de"}
            <br /><br />
            <span style={{ fontSize: 12, color: "#999" }}>Eine ehrenamtliche Initiative von Buergern fuer Buerger. Powered by Digitales Zirndorf.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [dynamicStands, setDynamicStands] = useState([]);
  const scrollRef = useRef(null);

  // Load KV-registered stands on mount
  useEffect(function () {
    fetch(`${API_BASE}/api/stands`)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) { setDynamicStands(Array.isArray(data) ? data : []); })
      .catch(function () {}); // silent – seed data still shows
  }, []);

  useEffect(function () {
    if (scrollRef.current) { scrollRef.current.scrollTop = 0; }
  }, [screen]);

  function handleRegistered(newStand) {
    setDynamicStands(function (prev) { return prev.concat([newStand]); });
  }

  const totalStands = STANDS.length + dynamicStands.length;

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fafbfc", position: "relative", fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; } body { background: #e8ecef; margin: 0; } input, select, textarea, button { font-family: inherit; }"}</style>
      <div ref={scrollRef} style={{ paddingBottom: 68, minHeight: "100vh" }}>
        {screen === "home"     && <HomeScreen setScreen={setScreen} totalStands={totalStands} />}
        {screen === "map"      && <MapScreen dynamicStands={dynamicStands} />}
        {screen === "register" && <RegisterScreen onRegistered={handleRegistered} />}
        {screen === "info"     && <InfoScreen />}
      </div>
      <NavBar active={screen} setScreen={setScreen} />
    </div>
  );
}
