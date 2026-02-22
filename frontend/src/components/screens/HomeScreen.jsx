import { EVENT_DATE, EVENT_TIME, EVENT_AREA, EVENT_BADGE_LABEL, HOME_TITLE, HOME_SUBTITLE, HOME_STEPS, HOME_DISTRICT_COUNT } from "../../constants.js";
import MyStandsSection from "../ui/MyStandsSection.jsx";
import { t } from "../../i18n.js";

export default function HomeScreen({ setScreen, totalStands, myStands, onEditMyStand, onPasskeyLogin, onPasskeyRecoveryLogin, onDeleteMyStand, canWrite, layout }) {
  const steps = HOME_STEPS;
  const heroLogoSize = layout.isDesktop ? 136 : 112;
  const heroLogoPadding = layout.isDesktop ? 8 : 6;
  const heroLogoTop = layout.isDesktop ? 24 : 18;
  const heroLogoOuterSize = heroLogoSize + heroLogoPadding * 2;
  const heroMinHeight = heroLogoTop + heroLogoOuterSize + (layout.isDesktop ? 12 : 8);

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg, var(--COLOR-1) 0%, var(--COLOR-2) 50%, var(--COLOR-3) 100%)",
          padding: layout.isDesktop ? "48px 44px 40px" : "36px 24px 32px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          minHeight: heroMinHeight,
        }}
      >
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <img
          src="/assets/branding/logo-192.png"
          alt="Zirndorfer Garagen-Flohmarkt Logo"
          style={{ position: "absolute", top: heroLogoTop, right: layout.isDesktop ? 32 : 20, width: heroLogoSize, height: heroLogoSize, padding: heroLogoPadding, borderRadius: 14, background: "rgba(255,255,255,0.14)", objectFit: "cover", boxSizing: "content-box" }}
        />
        <h1 style={{ fontSize: layout.isDesktop ? 36 : 28, fontWeight: 800, margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}>
          {HOME_TITLE}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.85, margin: "10px 0 0", lineHeight: 1.5 }}>
          {HOME_SUBTITLE}
        </p>
      </div>

      <div style={{ maxWidth: layout.isDesktop ? 1080 : layout.isTablet ? 760 : "100%", margin: "0 auto" }}>
        <div style={{ margin: layout.isDesktop ? "0 24px" : "0 16px", marginTop: -14, background: "#fff", borderRadius: 14, padding: layout.isDesktop ? "22px 24px" : "18px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #e8f4f8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2E7D32" }}>
              {EVENT_BADGE_LABEL}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--COLOR-1)" }}>{EVENT_DATE}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{EVENT_TIME + " - " + EVENT_AREA}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "#f5f9fb", borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--COLOR-1)" }}>{totalStands}</div>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{t("home.metric.stands", null, "Stände")}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "#f5f9fb", borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--COLOR-1)" }}>{HOME_DISTRICT_COUNT}</div>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{t("home.metric.districts", null, "Stadtteile")}</div>
            </div>
          </div>
        </div>

        <div style={{ display: layout.isTablet ? "grid" : "block", gridTemplateColumns: layout.isDesktop ? "1fr 1fr" : "1fr", gap: 12, padding: "20px 16px 8px" }}>
          <button
            onClick={function () { setScreen("map"); }}
            style={{ width: "100%", padding: "16px", background: "var(--COLOR-1)", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(16,171,72,0.3)" }}
          >
            {t("home.cta.map", null, "Stände auf der Karte entdecken")}
          </button>

          <button
            disabled={!canWrite}
            onClick={function () { setScreen("register"); }}
            style={{ width: "100%", padding: "16px", background: "#fff", color: canWrite ? "var(--COLOR-1)" : "#999", border: "2px solid " + (canWrite ? "var(--COLOR-1)" : "#ccc"), borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: canWrite ? "pointer" : "not-allowed", opacity: canWrite ? 1 : 0.8 }}
          >
            {t("home.cta.register", null, "Eigenen Stand anmelden")}
          </button>

        </div>

        {!canWrite && (
          <div style={{ padding: "0 16px", marginTop: 6, color: "#888", fontSize: 12, fontWeight: 600 }}>
            {t("home.offlineHint", null, "Offline: Anmeldung, Bearbeitung und Löschen sind nur mit Internet möglich.")}
          </div>
        )}

        <div style={{ padding: "8px 16px 0" }}>
          <MyStandsSection myStands={myStands} onEdit={onEditMyStand} onPasskeyLogin={onPasskeyLogin} onPasskeyRecoveryLogin={onPasskeyRecoveryLogin} onDelete={onDeleteMyStand} canWrite={canWrite} />
        </div>

        <div style={{ padding: layout.isMobile ? "20px 16px 100px" : "24px 16px 36px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--COLOR-1)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            {t("home.howItWorks", null, "So funktioniert es")}
          </h3>
          <div style={{ display: layout.isDesktop ? "grid" : "block", gridTemplateColumns: layout.isDesktop ? "1fr 1fr" : "1fr", columnGap: 24 }}>
            {steps.map(function (s, i) {
              return (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 21, flexShrink: 0, background: "var(--COLOR-1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>
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
      </div>
    </div>
  );
}
