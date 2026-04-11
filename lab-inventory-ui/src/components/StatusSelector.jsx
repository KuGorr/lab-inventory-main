const STATUS_OPTIONS = [
  { key: "none",      icon: "◻️?", label: "Brak statusu" },
  { key: "available", icon: "✅",  label: "Dostępny"     },
  { key: "borrowed",  icon: "🔄",  label: "Pożyczony"    },
  { key: "broken",    icon: "🗑️",  label: "Zepsuty"      },
  { key: "lost",      icon: "❓",  label: "Zaginiony"    },
];

export default function StatusSelector({ value, onChange, disabled }) {
  const normalized =
    value === null || value === "null" || value === undefined || value === ""
      ? "none"
      : value;

  return (
    <div className="status-selector">
      {STATUS_OPTIONS.map((o) => {
        const active = normalized === o.key;
        const classes = [
          active ? "active" : "",
          active ? `active-${o.key}` : "",
          disabled ? "disabled" : "",
        ].filter(Boolean).join(" ");

        return (
          <button
            key={o.key}
            onClick={() => !disabled && onChange(o.key)}
            className={classes}
            title={o.label}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
