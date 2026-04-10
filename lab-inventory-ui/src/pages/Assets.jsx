import { useEffect, useState, memo, useRef } from "react";
import { Link } from "react-router-dom";

// ---------------------------
// STABILNY, MEMOIZOWANY AutoInput
// ---------------------------
const AutoInput = memo(function AutoInput({
  field,
  label,
  filters,
  setFilters,
  uniqueValues,
  openDropdown,
  setOpenDropdown,
}) {
  const value = filters[field];
  const inputRef = useRef(null);

  const normalize = (v) => (v === "Motherboard" ? "MOBO" : v);

  const options = uniqueValues(field)
    .map(normalize)
    .filter((v) => v.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    if (openDropdown === field && options.length === 0) {
      setOpenDropdown(null);
    }
  }, [options.length, openDropdown, field, setOpenDropdown]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpenDropdown(null);
      return;
    }

    if (e.key === "Enter") {
      if (options.length > 0) {
        setFilters({ ...filters, [field]: options[0] });
        setOpenDropdown(null);
      }
    }
  };

  return (
    <div
      className="auto-input-wrapper"
      style={{
        display: "inline-block",
        marginRight: "10px",
        marginBottom: "10px",
        position: "relative",
      }}
    >
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          placeholder={label}
          value={value}
          onChange={(e) =>
            setFilters({ ...filters, [field]: e.target.value })
          }
          onClick={() => setOpenDropdown(field)}
          onKeyDown={handleKeyDown}
          style={{
            width: "160px",
            height: "32px",
            paddingRight: "24px",
          }}
        />

        {value && (
          <span
            onClick={() => {
              setFilters({ ...filters, [field]: "" });
              setOpenDropdown(null);
              inputRef.current?.focus();
            }}
            style={{
              position: "absolute",
              right: "6px",
              top: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#666",
            }}
          >
            ×
          </span>
        )}
      </div>

      {openDropdown === field && options.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "38px",
            left: 0,
            width: "160px",
            maxHeight: "220px",
            overflowY: "auto",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                setFilters({ ...filters, [field]: opt });
                setOpenDropdown(null);
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f5f5f5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "white")
              }
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ---------------------------
// GŁÓWNY KOMPONENT
// ---------------------------
export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);

  const [filters, setFilters] = useState({
    tag: "",
    item_name: "",
    oem: "",
    chipset: "",
    type: "",
    platform: "",
    socket: "",
    generation: "",
    memory_size: "",
    memory_type: "",
    location: "",
    container: "",
  });

  const [statusFilter, setStatusFilter] = useState("all");

  const loadAssets = () => {
    fetch("http://10.19.148.12:8000/assets/")
      .then((res) => res.json())
      .then((data) => setAssets(data));
  };

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://10.19.148.12:8000/ws/assets");

    ws.onmessage = (event) => {
      if (event.data === "assets_updated") {
        loadAssets();
      }
    };

    return () => ws.close();
  }, []);

  const uniqueValues = (field) => {
    const values = assets
      .map((a) => {
        if (field === "item_name") return a.name;
        if (field === "chipset") return a.model;
        if (field === "location") return a.location?.code;
        if (field === "container") return a.container?.code;
        if (field === "oem") return a.manufacturer || a.producer || a.oem;
        return a[field];
      })
      .filter(Boolean)
      .map((v) => (v === "Motherboard" ? "MOBO" : v));

    return [...new Set(values)].sort();
  };

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".auto-input-wrapper")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = assets.filter((a) => {
    const text = search.toLowerCase();
    const typeNormalized = a.type === "Motherboard" ? "MOBO" : a.type;

    const matchesSearch =
      a.tag?.toLowerCase().includes(text) ||
      a.name?.toLowerCase().includes(text) ||
      typeNormalized.toLowerCase().includes(text) ||
      a.model?.toLowerCase().includes(text) ||
      (a.manufacturer || a.producer || a.oem)?.toLowerCase().includes(text) ||
      a.platform?.toLowerCase().includes(text) ||
      a.socket?.toLowerCase().includes(text) ||
      a.memory_type?.toLowerCase().includes(text) ||
      a.location?.code?.toLowerCase().includes(text) ||
      a.container?.code?.toLowerCase().includes(text) ||
      a.comment?.toLowerCase().includes(text);

    const matchesFilters = Object.keys(filters).every((key) => {
      if (!filters[key]) return true;

      const val =
        key === "item_name"
          ? a.name
          : key === "chipset"
          ? a.model
          : key === "location"
          ? a.location?.code
          : key === "container"
          ? a.container?.code
          : key === "oem"
          ? (a.manufacturer || a.producer || a.oem)
          : key === "type"
          ? typeNormalized
          : a[key];

      return val?.toLowerCase().includes(filters[key].toLowerCase());
    });

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "none"
        ? !a.status
        : a.status === statusFilter;

    return matchesSearch && matchesFilters && matchesStatus;
  });

  const autoProps = {
    filters,
    setFilters,
    uniqueValues,
    openDropdown,
    setOpenDropdown,
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Assety</h1>

      <input
        type="text"
        placeholder="Szukaj globalnie..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "400px",
          padding: "8px",
          marginBottom: "20px",
          fontSize: "16px",
        }}
      />

      {/* FILTRY */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Filtry</h3>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <AutoInput field="tag" label="TAG" {...autoProps} />
          <AutoInput field="item_name" label="NAZWA" {...autoProps} />
          <AutoInput field="oem" label="OEM" {...autoProps} />
          <AutoInput field="chipset" label="MODEL" {...autoProps} />
          <AutoInput field="platform" label="PLATFORMA" {...autoProps} />
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <AutoInput field="type" label="TYP" {...autoProps} />
          <AutoInput field="socket" label="SOCKET" {...autoProps} />
          <AutoInput field="generation" label="GEN" {...autoProps} />
          <AutoInput field="memory_size" label="RAM SIZE" {...autoProps} />
          <AutoInput field="memory_type" label="RAM TYPE" {...autoProps} />
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <AutoInput field="location" label="LOKALIZACJA" {...autoProps} />
          <AutoInput field="container" label="KONTENER" {...autoProps} />
        </div>

        <button
          onClick={() => {
            setFilters({
              tag: "",
              item_name: "",
              oem: "",
              chipset: "",
              type: "",
              platform: "",
              socket: "",
              generation: "",
              memory_size: "",
              memory_type: "",
              location: "",
              container: "",
            });
            setOpenDropdown(null);
          }}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Wyczyść filtry
        </button>

        {/* STATUS FILTER */}
        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <button
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "6px 10px",
              fontSize: "22px",
              border: statusFilter === "all" ? "3px solid gold" : "1px solid #ccc",
              background: statusFilter === "all" ? "#fff8d1" : "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ⭐
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "none" ? "all" : "none")
            }
            style={{
              padding: "6px 10px",
              fontSize: "22px",
              border: statusFilter === "none" ? "3px solid #999" : "1px solid #ccc",
              background: statusFilter === "none" ? "#eaeaea" : "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            title="Brak statusu"
          >
            ◻️?
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "available" ? "all" : "available")
            }
            style={{
              padding: "6px 10px",
              fontSize: "22px",
              border: statusFilter === "available" ? "3px solid #4CAF50" : "1px solid #ccc",
              background: statusFilter === "available" ? "#4CAF5022" : "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ✅
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "borrowed" ? "all" : "borrowed")
            }
            style={{
              padding: "6px 10px",
              fontSize: "22px",
              border: statusFilter === "borrowed" ? "3px solid #2196F3" : "1px solid #ccc",
              background: statusFilter === "borrowed" ? "#2196F322" : "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🔄
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "broken" ? "all" : "broken")
            }
            style={{
              padding: "6px 10px",
              fontSize: "22px",
              border: statusFilter === "broken" ? "3px solid #F44336" : "1px solid #ccc",
              background: statusFilter === "broken" ? "#F4433622" : "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🗑️
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "lost" ? "all" : "lost")
            }
            style={{
              padding: "6px 10px",
              fontSize: "22px",
              border: statusFilter === "lost" ? "3px solid #9C27B0" : "1px solid #ccc",
              background: statusFilter === "lost" ? "#9C27B022" : "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ❓
          </button>
        </div>

        {/* 🔥 LICZNIK ASSETÓW */}
        <div
          style={{
            marginTop: "15px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#333",
          }}
        >
          Wyniki: {filtered.length} / {assets.length}
        </div>
      </div>

      {/* TABELA */}
      <table
        border="1"
        cellPadding="6"
        style={{
          width: "auto",
          tableLayout: "fixed",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={{ width: "40px" }}>S</th>
            <th style={{ maxWidth: "150px" }}>Tag</th>
            <th style={{ minWidth: "200px" }}>Nazwa</th>
            <th style={{ maxWidth: "70px" }}>Typ</th>
            <th style={{ minWidth: "200px" }}>Model</th>
            <th style={{ maxWidth: "100px" }}>OEM</th>
            <th style={{ maxWidth: "110px" }}>Lokalizacja</th>
            <th style={{ maxWidth: "80px" }}>Kontener</th>
            <th style={{ minWidth: "200px" }}>Komentarz</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((a) => {
            const typeNormalized = a.type === "Motherboard" ? "MOBO" : a.type;

            const statusIcon =
              a.status === "available" ? "✅" :
              a.status === "borrowed" ? "🔄" :
              a.status === "broken" ? "🗑️" :
              a.status === "lost" ? "❓" :
              "◻️?";

            return (
              <tr key={a.id}>
                <td style={{ fontSize: "22px", textAlign: "center" }}>
                  {statusIcon}
                </td>

                <td
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <Link to={`/assets/${a.id}`}>{a.tag}</Link>
                </td>

                <td style={{ minWidth: "200px" }}>{a.name}</td>

                <td
                  style={{
                    maxWidth: "70px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {typeNormalized}
                </td>

                <td style={{ minWidth: "200px" }}>{a.model}</td>

                <td
                  style={{
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {a.manufacturer || a.producer || a.oem || "-"}
                </td>

                <td style={{ maxWidth: "110px" }}>{a.location?.code || "-"}</td>

                <td style={{ maxWidth: "80px" }}>{a.container?.code || "-"}</td>

                <td style={{ minWidth: "200px" }}>
                  {a.comment?.trim() || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filtered.length === 0 && <p>Brak wyników.</p>}
    </div>
  );
}
