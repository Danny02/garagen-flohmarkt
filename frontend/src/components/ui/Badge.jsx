export default function Badge({ children, color, onClick, active }) {
  const c = color || "var(--COLOR-1)";
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
