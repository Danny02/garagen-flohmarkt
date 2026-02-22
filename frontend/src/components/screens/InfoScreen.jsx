import { useState } from "react";
import { EVENT_DATE, EVENT_TIME, EVENT_AREA, EVENT_BADGE_LABEL, INFO_DOS, INFO_DONTS, INFO_FAQ, INFO_CONTACT } from "../../constants.js";
import Header from "../ui/Header.jsx";
import { t } from "../../i18n.js";

export default function InfoScreen({ layout }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div>
      <Header title={t("info.title", null, "Infos und FAQ")} subtitle={t("info.subtitle", null, "Alles was du wissen musst")} layout={layout} />

      <div style={{ maxWidth: layout.isDesktop ? 1080 : layout.isTablet ? 820 : "100%", margin: "0 auto" }}>
        <div style={{ padding: "16px 16px 4px" }}>
          <div style={{ background: "linear-gradient(135deg, #E8F5E9, #C8E6C9)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2E7D32" }}>{EVENT_BADGE_LABEL}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1B5623" }}>{EVENT_DATE}</div>
              <div style={{ fontSize: 13, color: "#388E3C" }}>{EVENT_TIME + " | " + EVENT_AREA}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 16px 4px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--COLOR-1)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{t("info.dos", null, "Dos")}</h3>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
            {INFO_DOS.map(function (item, i) {
              return (
                <div key={i} style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: i < INFO_DOS.length - 1 ? "1px solid #f5f5f5" : "none", fontSize: 14, color: "#444" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, background: "#E8F5E9", color: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                    +
                  </div>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "16px 16px 4px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--COLOR-1)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{t("info.donts", null, "Donts")}</h3>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
            {INFO_DONTS.map(function (item, i) {
              return (
                <div key={i} style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: i < INFO_DONTS.length - 1 ? "1px solid #f5f5f5" : "none", fontSize: 14, color: "#444" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, background: "#FFEBEE", color: "#C62828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                    -
                  </div>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "20px 16px 4px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--COLOR-1)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{t("info.faq", null, "Häufige Fragen")}</h3>
          {INFO_FAQ.map(function (faq, i) {
            const isOpen = openFaq === i;
            return (
              <div key={i} style={{ marginBottom: 8, background: "#fff", borderRadius: 12, border: isOpen ? "1.5px solid var(--COLOR-1)" : "1px solid #eee", overflow: "hidden" }}>
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
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--COLOR-1)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{t("info.contact", null, "Kontakt")}</h3>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #eee" }}>
            <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
              <strong>{INFO_CONTACT.orgName}</strong>
              <br />
              {t("info.mail", null, "E-Mail") + ": " + INFO_CONTACT.email}
              <br />
              {"Web: " + INFO_CONTACT.web}
              <br /><br />
              <span style={{ fontSize: 12, color: "#999" }}>{INFO_CONTACT.footer}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
