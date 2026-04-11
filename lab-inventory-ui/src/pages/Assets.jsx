import { useEffect, useState, memo, useRef, useCallback } from "react";
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
    <div className="auto-input-wrapper">
      <div className="auto-input-inner">
        <input
          ref={inputRef}
          placeholder={label}
          value={value}
          onChange={(e) =>
            setFilters({ ...filters, [field]: e.target.value })
          }
          onClick={() => setOpenDropdown(field)}
          onKeyDown={handleKeyDown}
        />

        {value && (
          <span
            className="auto-input-clear"
            onClick={() => {
              setFilters({ ...filters, [field]: "" });
              setOpenDropdown(null);
              inputRef.current?.focus();
            }}
          >
            ×
          </span>
        )}
      </div>

      {openDropdown === field && options.length > 0 && (
        <div className="auto-dropdown">
          {options.map((opt) => (
            <div
              key={opt}
              className="auto-dropdown-item"
              onClick={() => {
                setFilters({ ...filters, [field]: opt });
                setOpenDropdown(null);
              }}
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

  const loadAssets = useCallback(() => {
    // fetch("http://10.19.148.12:8000/assets/")
    fetch("http://localhost:8000/assets/")
      .then((res) => res.json())
      .then((data) => setAssets(data));
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    // const ws = new WebSocket("ws://10.19.148.12:8000/ws/assets");
    const ws = new WebSocket("ws://localhost:8000/ws/assets");

    ws.onmessage = (event) => {
      if (event.data === "assets_updated") {
        loadAssets();
      }
    };

    return () => ws.close();
  }, [loadAssets]);

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
    <div className="page">
      <h1>Assety</h1>

      <input
        type="text"
        placeholder="Szukaj globalnie..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      {/* FILTRY */}
      <div className="filters">
        <h3>Filtry</h3>

        <div className="filters-row">
          <AutoInput field="tag" label="TAG" {...autoProps} />
          <AutoInput field="item_name" label="NAZWA" {...autoProps} />
          <AutoInput field="oem" label="OEM" {...autoProps} />
          <AutoInput field="chipset" label="MODEL" {...autoProps} />
          <AutoInput field="platform" label="PLATFORMA" {...autoProps} />
        </div>

        <div className="filters-row">
          <AutoInput field="type" label="TYP" {...autoProps} />
          <AutoInput field="socket" label="SOCKET" {...autoProps} />
          <AutoInput field="generation" label="GEN" {...autoProps} />
          <AutoInput field="memory_size" label="RAM SIZE" {...autoProps} />
          <AutoInput field="memory_type" label="RAM TYPE" {...autoProps} />
        </div>

        <div className="filters-row">
          <AutoInput field="location" label="LOKALIZACJA" {...autoProps} />
          <AutoInput field="container" label="KONTENER" {...autoProps} />
        </div>

        <button
          className="btn-clear-filters"
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
        >
          Wyczyść filtry
        </button>

        {/* STATUS FILTER */}
        <div className="status-filter">
          <button
            onClick={() => setStatusFilter("all")}
            className={`status-btn ${statusFilter === "all" ? "active active-all" : ""}`}
            title="Wszystkie"
          >
            ⭐
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "none" ? "all" : "none")
            }
            className={`status-btn ${statusFilter === "none" ? "active active-none" : ""}`}
            title="Brak statusu"
          >
            ◻️?
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "available" ? "all" : "available")
            }
            className={`status-btn ${statusFilter === "available" ? "active active-available" : ""}`}
            title="Dostępny"
          >
            ✅
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "borrowed" ? "all" : "borrowed")
            }
            className={`status-btn ${statusFilter === "borrowed" ? "active active-borrowed" : ""}`}
            title="Wypożyczony"
          >
            🔄
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "broken" ? "all" : "broken")
            }
            className={`status-btn ${statusFilter === "broken" ? "active active-broken" : ""}`}
            title="Uszkodzony"
          >
            🗑️
          </button>

          <button
            onClick={() =>
              setStatusFilter(statusFilter === "lost" ? "all" : "lost")
            }
            className={`status-btn ${statusFilter === "lost" ? "active active-lost" : ""}`}
            title="Zagubiony"
          >
            ❓
          </button>
        </div>

        {/* 🔥 LICZNIK ASSETÓW */}
        <div className="result-counter">
          Wyniki: {filtered.length} / {assets.length}
        </div>
      </div>

      {/* TABELA */}
      <table>
        <thead>
          <tr>
            <th className="col-status">S</th>
            <th className="col-tag">Tag</th>
            <th className="col-name">Nazwa</th>
            <th className="col-type">Typ</th>
            <th className="col-model">Model</th>
            <th className="col-oem">OEM</th>
            <th className="col-location">Lokalizacja</th>
            <th className="col-container">Kontener</th>
            <th className="col-comment">Komentarz</th>
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
                <td className="status-icon-cell">
                  {statusIcon}
                </td>

                <td className="col-tag td-ellipsis">
                  <Link to={`/assets/${a.id}`}>{a.tag}</Link>
                </td>

                <td className="col-name">{a.name}</td>

                <td className="col-type td-ellipsis">
                  {typeNormalized}
                </td>

                <td className="col-model">{a.model}</td>

                <td className="col-oem td-ellipsis">
                  {a.manufacturer || a.producer || a.oem || "-"}
                </td>

                <td className="col-location">{a.location?.code || "-"}</td>

                <td className="col-container">{a.container?.code || "-"}</td>

                <td className="col-comment">
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
