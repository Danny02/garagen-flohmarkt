import { useState } from "react";
import { API_BASE, DISTRICTS, STAND_CATEGORIES, CAT_COLORS, EVENT_DATE, REGISTER_DEFAULTS, REGISTER_TIME_OPTIONS_FROM, REGISTER_TIME_OPTIONS_TO, REGISTER_RULES_HINT, REGISTER_AGREEMENT_LABEL } from "../../constants.js";
import Header from "../ui/Header.jsx";
import Badge from "../ui/Badge.jsx";
import SuccessScreen from "./SuccessScreen.jsx";

export default function RegisterScreen({ onRegistered, editMode, createEditSecret, layout }) {
  const isEditing = editMode !== null;
  const [hadExistingEditSecret] = useState(function () {
    return Boolean(createEditSecret);
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(
    isEditing && editMode.initialData
      ? {
          label:     editMode.initialData.label     || "",
          address:   editMode.initialData.address   || "",
          plz:       editMode.initialData.plz       || REGISTER_DEFAULTS.plz,
          district:  editMode.initialData.district  || REGISTER_DEFAULTS.district,
          desc:      editMode.initialData.desc      || "",
          categories: editMode.initialData.categories || [],
          time_from: editMode.initialData.time_from || REGISTER_DEFAULTS.timeFrom,
          time_to:   editMode.initialData.time_to   || REGISTER_DEFAULTS.timeTo,
        }
      : { label: "", address: "", plz: REGISTER_DEFAULTS.plz, district: REGISTER_DEFAULTS.district, desc: "", categories: [], time_from: REGISTER_DEFAULTS.timeFrom, time_to: REGISTER_DEFAULTS.timeTo }
  );

  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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
      let res;
      if (isEditing) {
        const authField = editMode.secret
          ? { editSecret: editMode.secret }
          : { sessionToken: editMode.sessionToken };
        res = await fetch(`${API_BASE}/api/stands/${editMode.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, ...authField }),
        });
      } else {
        const createAuth = createEditSecret ? { editSecret: createEditSecret } : {};
        res = await fetch(`${API_BASE}/api/stands`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, ...createAuth }),
        });
      }
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        onRegistered(data);
      } else {
        setResult({ error: true });
      }
    } catch (e) {
      console.error("Submit error:", e);
      setResult({ error: true });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    if (result.error) {
      return (
        <div>
          <Header title="Fehler" subtitle="" layout={layout} />
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ color: "#c0392b", fontSize: 15 }}>
              Etwas ist schiefgelaufen. Bitte versuche es erneut oder kontaktiere das Orga-Team.
            </p>
            <button onClick={function () { setResult(null); }} style={{ marginTop: 20, padding: "12px 24px", background: "var(--COLOR-1)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Zurueck
            </button>
          </div>
        </div>
      );
    }

    if (isEditing) {
      return (
        <div>
          <Header title="Aenderungen gespeichert" subtitle="" layout={layout} />
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", color: "#2E7D32", fontWeight: 800 }}>OK</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--COLOR-1)", margin: "0 0 10px" }}>Stand aktualisiert!</h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
              Deine Aenderungen wurden gespeichert und erscheinen in Kuerze auf der Karte.
            </p>
          </div>
        </div>
      );
    }

    const editLink = window.location.origin + "/?edit=" + result.id + "&secret=" + result.editSecret;
    return (
      <SuccessScreen
        result={result}
        editLink={editLink}
        showRecoveryOptions={!hadExistingEditSecret}
        copied={copied}
        setCopied={setCopied}
        layout={layout}
      />
    );
  }

  return (
    <div>
      <Header
        title={isEditing ? "Stand bearbeiten" : "Stand anmelden"}
        subtitle={"Schritt " + (step + 1) + " von 3"}
        layout={layout}
      />

      <div style={{ display: "flex", gap: 4, padding: "16px 16px 0", maxWidth: layout.isDesktop ? 920 : layout.isTablet ? 760 : "100%", margin: "0 auto" }}>
        {[0, 1, 2].map(function (i) {
          return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "var(--COLOR-1)" : "#e0e0e0", transition: "background 0.3s" }} />;
        })}
      </div>

      <div style={{ padding: layout.isMobile ? "20px 16px 100px" : "24px 16px 38px", maxWidth: layout.isDesktop ? 920 : layout.isTablet ? 760 : "100%", margin: "0 auto" }}>
        {step === 0 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "#333" }}>Standort</h3>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 18px" }}>Nur die Adresse – kein Name, keine E-Mail.</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Strasse & Hausnummer *</label>
              <input
                type="text"
                placeholder="z.B. Bahnhofstr. 12"
                value={form.address}
                onChange={function (e) { updateField("address", e.target.value); }}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: "0 0 100px" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>PLZ</label>
                <input
                  type="text"
                  placeholder="90513"
                  value={form.plz}
                  onChange={function (e) { updateField("plz", e.target.value); }}
                  style={{ width: "100%", padding: "12px 10px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Stadtteil</label>
                <select
                  value={form.district}
                  onChange={function (e) { updateField("district", e.target.value); }}
                  style={{ width: "100%", padding: "12px 10px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, background: "#fff" }}
                >
                  {DISTRICTS.slice(1).map(function (d) { return <option key={d} value={d}>{d}</option>; })}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 4 }}>
                Bezeichnung <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span>
              </label>
              <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 6px" }}>z.B. "Gartenflohmarkt" – kein Klarname noetig</p>
              <input
                type="text"
                placeholder="z.B. Gartenflohmarkt, Keller-Troedel…"
                value={form.label}
                onChange={function (e) { updateField("label", e.target.value); }}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#333" }}>Was bietest du an?</h3>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>Waehle passende Kategorien (Mehrfachauswahl)</p>
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 20 }}>
              {STAND_CATEGORIES.map(function (c) {
                return <Badge key={c} color={CAT_COLORS[c] || "var(--COLOR-1)"} active={form.categories.indexOf(c) >= 0} onClick={function () { toggleCat(c); }}>{c}</Badge>;
              })}
            </div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Kurze Beschreibung <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
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
                  {REGISTER_TIME_OPTIONS_FROM.map(function (time) {
                    return <option key={time} value={time}>{time + " Uhr"}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Bis</label>
                <select value={form.time_to} onChange={function (e) { updateField("time_to", e.target.value); }} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, background: "#fff" }}>
                  {REGISTER_TIME_OPTIONS_TO.map(function (time) {
                    return <option key={time} value={time}>{time + " Uhr"}</option>;
                  })}
                </select>
              </div>
            </div>
            <div style={{ background: "#FFF8E1", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: "#FFD54F", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>!</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>
                <strong>Wichtig:</strong> {REGISTER_RULES_HINT}
              </div>
            </div>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#555", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ marginTop: 2 }} />
              <span>{REGISTER_AGREEMENT_LABEL}</span>
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
            disabled={submitting || (step === 0 && !form.address.trim())}
            onClick={function () {
              if (step < 2) { setStep(step + 1); } else { handleSubmit(); }
            }}
            style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: (submitting || (step === 0 && !form.address.trim())) ? "#aaa" : "var(--COLOR-1)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: (submitting || (step === 0 && !form.address.trim())) ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(16,171,72,0.25)" }}
          >
            {submitting ? "Wird gesendet…" : step < 2 ? "Weiter" : isEditing ? "Aenderungen speichern" : "Jetzt anmelden"}
          </button>
        </div>
      </div>
    </div>
  );
}
