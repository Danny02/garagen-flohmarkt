export default function Header({ title, subtitle, layout }) {
  const logoSize = layout.isDesktop ? 136 : 112;
  const logoPadding = layout.isDesktop ? 8 : 6;
  const logoTop = layout.isDesktop ? 18 : 12;
  const logoOuterSize = logoSize + logoPadding * 2;
  const headerMinHeight = logoTop + logoOuterSize + (layout.isDesktop ? 8 : 6);

  return (
    <div style={{ padding: layout.isDesktop ? "26px 28px 18px" : "20px 20px 14px", background: "linear-gradient(135deg, var(--COLOR-1) 0%, var(--COLOR-2) 100%)", color: "#fff", position: "relative", minHeight: headerMinHeight }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, opacity: 0.7, textTransform: "uppercase" }}>
          Garagenflohmarkt Zirndorf
        </div>
      </div>
      <img
        src="/assets/branding/logo-192.png"
        alt="Garagenflohmarkt Zirndorf Logo"
        style={{ position: "absolute", top: logoTop, right: layout.isDesktop ? 22 : 16, width: logoSize, height: logoSize, padding: logoPadding, borderRadius: 14, background: "rgba(255,255,255,0.14)", objectFit: "cover", boxSizing: "content-box" }}
      />
      <h1 style={{ fontSize: layout.isDesktop ? 26 : 22, fontWeight: 800, margin: "6px 0 2px", fontFamily: "'DM Sans', sans-serif" }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>{subtitle}</p>}
    </div>
  );
}
