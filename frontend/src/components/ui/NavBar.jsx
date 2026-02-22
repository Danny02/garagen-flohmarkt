export default function NavBar({ active, setScreen, layout, canWrite }) {
  const items = [
    { id: "home", label: "Start", sym: "H" },
    { id: "map", label: "Karte", sym: "K" },
    { id: "register", label: "Anmelden", sym: "A" },
    { id: "info", label: "Info", sym: "i" },
  ];

  if (!layout.isMobile) {
    return (
      <nav
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "stretch",
          zIndex: 100,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        {items.map(function (item) {
          const isActive = active === item.id;
          const isDisabled = item.id === "register" && !canWrite;
          return (
            <button
              key={item.id}
              disabled={isDisabled}
              onClick={function () { setScreen(item.id); }}
              aria-current={isActive ? "page" : undefined}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "14px 10px",
                border: "none",
                borderBottom: isActive ? "3px solid var(--COLOR-1)" : "3px solid transparent",
                background: isActive ? "rgba(16,171,72,0.08)" : "transparent",
                cursor: isDisabled ? "not-allowed" : "pointer",
                color: isDisabled ? "#bbb" : isActive ? "var(--COLOR-1)" : "#888",
                fontSize: 15,
                fontWeight: 700,
                opacity: isDisabled ? 0.7 : 1,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: isDisabled ? "#eee" : isActive ? "var(--COLOR-1)" : "#eee",
                  color: isDisabled ? "#bbb" : isActive ? "#fff" : "#999",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {item.sym}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: "auto",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: layout.contentMaxWidth,
        background: "#fff",
        borderTop: "1px solid #e0e0e0",
        borderBottom: "none",
        display: "flex",
        zIndex: 100,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {items.map(function (item) {
        const isActive = active === item.id;
        const isDisabled = item.id === "register" && !canWrite;
        return (
          <button
            key={item.id}
            disabled={isDisabled}
            onClick={function () { setScreen(item.id); }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 0 12px",
              gap: 0,
              border: "none",
              background: "transparent",
              cursor: isDisabled ? "not-allowed" : "pointer",
              color: isDisabled ? "#bbb" : isActive ? "var(--COLOR-1)" : "#999",
              position: "relative",
              opacity: isDisabled ? 0.7 : 1,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: isDisabled ? "#eee" : isActive ? "var(--COLOR-1)" : "#eee",
                color: isDisabled ? "#bbb" : isActive ? "#fff" : "#999",
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
