import { useState } from "react";
import { registerPasskey } from "../../passkey.js";
import { updateMyStand } from "../../utils.js";
import { copyText } from "../../clipboard.js";
import Header from "../ui/Header.jsx";

export default function SuccessScreen({ result, editLink, showRecoveryOptions = true, copied, setCopied, layout }) {
  const [passkeyState, setPasskeyState] = useState("idle");
  const [passkeyError, setPasskeyError] = useState("");

  const supportsPasskeys = !!window.PublicKeyCredential;

  async function handleRegisterPasskey() {
    setPasskeyState("loading");
    try {
      const credentialId = await registerPasskey(result.id, result.editSecret);
      updateMyStand(result.id, { credentialId });
      setPasskeyState("done");
    } catch (e) {
      setPasskeyError(e.message || "Fehler beim Einrichten des Passkeys");
      setPasskeyState("error");
    }
  }

  return (
    <div>
      <Header title="Anmeldung erfolgreich!" subtitle="" layout={layout} />
      <div style={{ padding: "28px 20px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 14px", color: "#2E7D32", fontWeight: 800 }}>OK</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--COLOR-1)", margin: "0 0 8px" }}>Du bist dabei!</h2>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>
            Dein Stand erscheint nach kurzer Pruefung auf der Karte.
          </p>
        </div>

        {showRecoveryOptions && (
          <div style={{ background: "#FFF8E1", border: "1.5px solid #FFD54F", borderRadius: 14, padding: "18px 18px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: "#FFD54F", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>!</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#5D4037" }}>Bearbeitungs-Link sichern</div>
                <div style={{ fontSize: 13, color: "#795548", marginTop: 3, lineHeight: 1.4 }}>
                  Dein Browser hat diesen Stand bereits gespeichert. Der Link ist dein Backup – z.B. fuer andere Geraete.
                </div>
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #FFD54F", borderRadius: 10, padding: "10px 12px", fontSize: 12, wordBreak: "break-all", color: "#333", marginBottom: 10, lineHeight: 1.5 }}>
              {editLink}
            </div>
            <button
              onClick={function () { copyText(editLink); setCopied(true); setTimeout(function () { setCopied(false); }, 2500); }}
              style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: copied ? "#2E7D32" : "#F9A825", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              {copied ? "Link kopiert!" : "Link kopieren"}
            </button>
          </div>
        )}

        {showRecoveryOptions && supportsPasskeys && (
          <div style={{ background: "#f0f7fa", border: "1.5px solid #b3d4e8", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--COLOR-1)", marginBottom: 6 }}>
              Passkey einrichten (empfohlen)
            </div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 12, lineHeight: 1.4 }}>
              Mit einem Passkey kannst du deinen Stand auch auf anderen Geraeten bearbeiten – ohne den Link.
            </div>
            {passkeyState === "idle" && (
              <button onClick={handleRegisterPasskey} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "var(--COLOR-1)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Passkey jetzt einrichten
              </button>
            )}
            {passkeyState === "loading" && (
              <div style={{ textAlign: "center", fontSize: 13, color: "#777", padding: "8px 0" }}>Warte auf Geraet…</div>
            )}
            {passkeyState === "done" && (
              <div style={{ textAlign: "center", fontSize: 13, color: "#2E7D32", fontWeight: 600, padding: "8px 0" }}>
                Passkey eingerichtet!
              </div>
            )}
            {passkeyState === "error" && (
              <div style={{ fontSize: 12, color: "#c0392b", padding: "4px 0" }}>{passkeyError}</div>
            )}
          </div>
        )}

        <div style={{ background: "#f5f9fb", borderRadius: 14, padding: "16px 18px", border: "1px solid #e0edf2" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Deine Anmeldung</div>
          <div style={{ fontSize: 14, color: "#333", lineHeight: 1.8 }}>
            {(result.label ? result.label + " · " : "") + result.address + ", " + result.plz}
            <br />
            {"Uhrzeit: " + result.time_from + " – " + result.time_to + " Uhr"}
            <br />
            {result.categories.length > 0 ? "Kategorien: " + result.categories.join(", ") : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
