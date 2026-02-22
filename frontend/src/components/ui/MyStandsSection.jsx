import { FiTrash2 } from "react-icons/fi";
import { t } from "../../i18n.js";

export default function MyStandsSection({ myStands, onEdit, onPasskeyLogin, onPasskeyRecoveryLogin, onDelete, canWrite }) {
  const hasStands = myStands.length > 0;

  return (
    <div style={{ margin: "0 16px 0", padding: "16px 18px", background: hasStands ? "#f0f7fa" : "#eceff1", borderRadius: 14, border: "1.5px solid " + (hasStands ? "#b3d4e8" : "#c5cdd3"), position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: hasStands ? "var(--COLOR-1)" : "#7d8790", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        {t("mystands.title", null, "Mein angemeldeter Stand")}
      </div>
      <div style={{ opacity: hasStands ? 1 : 0.62, filter: hasStands ? "none" : "grayscale(1) blur(1.2px)", pointerEvents: hasStands ? "auto" : "none" }}>
        {hasStands ? myStands.map(function (s) {
          const hasSessionToken = typeof s.sessionToken === "string" && s.sessionToken.length > 0;

          return (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 2 }}>
                {s.label ? s.label + " · " : ""}{s.address}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {s.editSecret ? (
                  <button
                    disabled={!canWrite}
                    onClick={function () { onEdit(s, s.editSecret, null); }}
                    style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: canWrite ? "var(--COLOR-1)" : "#bbb", color: "#fff", fontSize: 13, fontWeight: 700, cursor: canWrite ? "pointer" : "not-allowed" }}
                  >
                    {t("mystands.edit", null, "Bearbeiten")}
                  </button>
                ) : hasSessionToken ? (
                  <button
                    disabled={!canWrite}
                    onClick={function () { onEdit(s, null, s.sessionToken); }}
                    style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: canWrite ? "var(--COLOR-1)" : "#bbb", color: "#fff", fontSize: 13, fontWeight: 700, cursor: canWrite ? "pointer" : "not-allowed" }}
                  >
                    {t("mystands.edit", null, "Bearbeiten")}
                  </button>
                ) : s.credentialId ? (
                  <button
                    disabled={!canWrite}
                    onClick={function () { onPasskeyLogin(s); }}
                    style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: canWrite ? "var(--COLOR-1)" : "#bbb", color: "#fff", fontSize: 13, fontWeight: 700, cursor: canWrite ? "pointer" : "not-allowed" }}
                  >
                    {t("mystands.passkeyLogin", null, "Mit Passkey anmelden")}
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: "#888" }}>{t("mystands.editLinkHint", null, "Bearbeitungs-Link öffnen um zu bearbeiten")}</span>
                )}
                {(s.editSecret || s.credentialId || hasSessionToken) && (
                  <button
                    disabled={!canWrite}
                    onClick={function () { onDelete(s); }}
                    aria-label={t("mystands.delete", null, "Stand löschen")}
                    title={t("mystands.delete", null, "Stand löschen")}
                    style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid " + (canWrite ? "#d66" : "#ccc"), background: "#fff", color: canWrite ? "#c0392b" : "#999", fontSize: 17, fontWeight: 700, cursor: canWrite ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <FiTrash2 size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <div style={{ minHeight: 92, borderRadius: 10, border: "1px dashed #b8cad8", background: "#e8eff4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#7f8b95", fontWeight: 600 }}>
            {t("mystands.none", null, "Noch kein Stand auf diesem Gerät gespeichert")}
          </div>
        )}
      </div>

      {!hasStands && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <button
            disabled={!canWrite}
            onClick={function () { onPasskeyRecoveryLogin(); }}
            style={{ pointerEvents: "auto", padding: "10px 18px", borderRadius: 10, border: "none", background: canWrite ? "var(--COLOR-1)" : "#bbb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: canWrite ? "pointer" : "not-allowed", boxShadow: "0 4px 12px rgba(16,171,72,0.25)" }}
          >
            {t("mystands.passkeyLogin", null, "Mit Passkey anmelden")}
          </button>
        </div>
      )}

      {hasStands && !canWrite && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
          {t("mystands.offlineHint", null, "Offline: Bearbeiten und Löschen sind derzeit deaktiviert.")}
        </div>
      )}
    </div>
  );
}
