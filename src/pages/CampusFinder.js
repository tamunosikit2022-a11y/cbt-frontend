import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import API from "../utils/api";

// ── 100% free stack: no API key, no billing account needed anywhere ──
// Map tiles:   OpenStreetMap (via Leaflet)
// Building search: Overpass API (queries real OpenStreetMap data)
// Directions:  OSRM public routing server (walking)

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OSRM_URL      = "https://router.project-osrm.org/route/v1/foot";

// Each category maps to real OSM tags (precise) or a name-regex fallback
// for things OSM doesn't have a standard tag for (faculties, hostels, gates).
const CATEGORIES = [
  { key: "library",   label: "📚 Library",    filters: ['["amenity"="library"]'] },
  { key: "faculty",   label: "🏛️ Faculty",    filters: ['["name"~"faculty",i]', '["building"="university"]'] },
  { key: "hostel",    label: "🛏️ Hostel",     filters: ['["name"~"hostel|hall of residence",i]'] },
  { key: "cafeteria", label: "🍽️ Cafeteria",  filters: ['["amenity"="cafe"]', '["amenity"="restaurant"]', '["name"~"cafeteria",i]'] },
  { key: "clinic",    label: "🏥 Clinic",     filters: ['["amenity"="clinic"]', '["amenity"="hospital"]', '["amenity"="pharmacy"]'] },
  { key: "bank",      label: "🏧 Bank/ATM",   filters: ['["amenity"="bank"]', '["amenity"="atm"]'] },
  { key: "sports",    label: "🏟️ Sports",     filters: ['["leisure"="sports_centre"]', '["leisure"="stadium"]', '["name"~"sport",i]'] },
  { key: "gate",      label: "🚪 Gate",       filters: ['["barrier"="gate"]', '["name"~"gate",i]'] },
];

let leafletLoadPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;
  leafletLoadPromise = new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Failed to load the map library."));
    document.head.appendChild(script);
  });
  return leafletLoadPromise;
}

function buildOverpassQuery(filters, lat, lng, radiusM) {
  const clauses = filters.map(f =>
    `node${f}(around:${radiusM},${lat},${lng});\nway${f}(around:${radiusM},${lat},${lng});`
  ).join("\n");
  return `[out:json][timeout:20];\n(\n${clauses}\n);\nout center 40;`;
}

async function runOverpassSearch(filters, lat, lng, radiusM = 2500) {
  const query = buildOverpassQuery(filters, lat, lng, radiusM);
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!res.ok) throw new Error("Search service is busy, try again in a moment.");
  const data = await res.json();
  const seen = new Set();
  const places = [];
  for (const el of data.elements || []) {
    const name = el.tags?.name;
    if (!name || seen.has(name)) continue; // skip unnamed/duplicate features
    const point = el.type === "node" ? el : el.center;
    if (!point) continue;
    seen.add(name);
    places.push({
      id: `${el.type}-${el.id}`,
      name,
      lat: point.lat,
      lng: point.lon,
      tags: el.tags,
    });
  }
  return places;
}

async function getWalkingRoute(from, to) {
  const url = `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Couldn't calculate a route.");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("No walking route found.");
  const route = data.routes[0];
  return {
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceM: route.distance,
    durationS: route.duration,
  };
}

function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}
function formatDuration(s) {
  const mins = Math.round(s / 60);
  return mins < 1 ? "<1 min" : `${mins} min`;
}

export default function CampusFinder() {
  const { id } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const back = useBackNav();

  const [school, setSchool] = useState(location.state?.school || null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [directionsInfo, setDirectionsInfo] = useState(null);
  const [directionsLoading, setDirectionsLoading] = useState(false);

  const mapDivRef    = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const routeLineRef = useRef(null);
  const userPosRef   = useRef(null);

  useEffect(() => {
    if (school) return;
    API.get(`/school-finder/schools/${id}`).then(r => setSchool(r.data.school)).catch(() => {});
  }, [id, school]);

  // Init map once
  useEffect(() => {
    if (!school) return;
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapDivRef.current || mapRef.current) return;
        const map = L.map(mapDivRef.current).setView([school.lat, school.lng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);

        L.circleMarker([school.lat, school.lng], {
          radius: 9, color: "#fff", weight: 2, fillColor: "#6c63ff", fillOpacity: 1,
        }).addTo(map).bindPopup(`<b>${school.name}</b> (campus centre)`);

        mapRef.current = map;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => { userPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
            () => {},
            { enableHighAccuracy: false, timeout: 6000 }
          );
        }
      })
      .catch((err) => setLoadError(err.message));

    return () => { cancelled = true; };
  }, [school]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];
    if (routeLineRef.current) { mapRef.current.removeLayer(routeLineRef.current); routeLineRef.current = null; }
  };

  const renderResults = useCallback((L, places) => {
    clearMarkers();
    places.forEach(p => {
      const marker = L.marker([p.lat, p.lng]).addTo(mapRef.current).bindPopup(p.name);
      marker.on("click", () => setSelectedPlace(p));
      markersRef.current.push(marker);
    });
  }, []);

  const search = async (filters, label) => {
    if (!school || !window.L) return;
    setLoading(true);
    setSearched(true);
    setDirectionsInfo(null);
    setSelectedPlace(null);
    try {
      let places;
      if (label) {
        // free-text search: OSM name contains the query, case-insensitive
        places = await runOverpassSearch([`["name"~"${label.replace(/"/g, "")}",i]`], school.lat, school.lng);
      } else {
        places = await runOverpassSearch(filters, school.lat, school.lng);
      }
      setResults(places);
      renderResults(window.L, places);
    } catch (err) {
      setResults([]);
    }
    setLoading(false);
  };

  const searchByCategory = (cat) => {
    setActiveCategory(cat.key);
    setQuery("");
    search(cat.filters);
  };

  const searchByText = () => {
    if (!query.trim()) return;
    setActiveCategory(null);
    search(null, query.trim());
  };

  const getDirections = async (place) => {
    if (!mapRef.current || !window.L) return;
    const from = userPosRef.current || { lat: school.lat, lng: school.lng };
    setDirectionsLoading(true);
    setDirectionsInfo(null);
    try {
      const route = await getWalkingRoute(from, { lat: place.lat, lng: place.lng });
      if (routeLineRef.current) mapRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = window.L.polyline(route.coords, { color: "#6c63ff", weight: 5 }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [30, 30] });
      setDirectionsInfo({
        distance: formatDistance(route.distanceM),
        duration: formatDuration(route.durationS),
        fromMe: !!userPosRef.current,
      });
    } catch (err) {
      setDirectionsInfo({ error: err.message || "Couldn't calculate directions for this route." });
    }
    setDirectionsLoading(false);
  };

  if (!school) {
    return (
      <div style={s.page}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#636e72" }}>Loading campus...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => back()} style={s.backBtn}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f0f4ff", textAlign: "center", flex: 1, padding: "0 8px" }}>
          🗺️ {school.name} — Campus
        </h1>
        <span style={{ width: 50 }} />
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 12px 40px" }}>
        {loadError ? (
          <div style={s.errorBox}>Couldn't load the map: {loadError}. Check your connection and try refreshing.</div>
        ) : (
          <>
            <div style={s.searchRow}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchByText()}
                placeholder="Search a building on campus (e.g. 'Engineering')"
                style={{ ...s.input, flex: 1 }}
              />
              <button onClick={searchByText} style={s.searchBtn}>Search</button>
            </div>

            <div style={s.chipRow}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => searchByCategory(cat)}
                  style={{
                    ...s.chip,
                    background: activeCategory === cat.key ? "#6c63ff" : "var(--surface,#1a1a2e)",
                    color: activeCategory === cat.key ? "#fff" : "#a29bfe",
                  }}>
                  {cat.label}
                </button>
              ))}
            </div>

            <div ref={mapDivRef} style={s.map} />
            <p style={{ fontSize: 10, color: "#636e72", marginTop: 4, textAlign: "right" }}>Map data © OpenStreetMap contributors</p>

            {directionsLoading && <div style={s.dirBanner}>📍 Calculating walking route...</div>}
            {directionsInfo && !directionsInfo.error && (
              <div style={s.dirBanner}>
                🚶 {directionsInfo.distance} · {directionsInfo.duration} walk
                {directionsInfo.fromMe ? " from your current location" : " from campus centre (location not shared)"}
              </div>
            )}
            {directionsInfo?.error && (
              <div style={{ ...s.dirBanner, color: "#e17055" }}>{directionsInfo.error}</div>
            )}

            <div style={{ marginTop: 14 }}>
              {loading && <p style={{ textAlign: "center", color: "#636e72", padding: 20 }}>Searching campus...</p>}
              {!loading && searched && results.length === 0 && (
                <p style={{ textAlign: "center", color: "#636e72", padding: 20, fontSize: 13 }}>
                  Nothing found — this campus may not be fully mapped on OpenStreetMap yet. Try a different search term.
                </p>
              )}
              {!loading && !searched && (
                <p style={{ textAlign: "center", color: "#636e72", padding: 20, fontSize: 13 }}>
                  Pick a category above or search to find a specific place on campus.
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {results.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlace(p)}
                    style={{
                      ...s.resultCard,
                      border: selectedPlace?.id === p.id ? "1px solid #6c63ff" : "1px solid rgba(255,255,255,0.07)",
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f4ff" }}>{p.name}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); getDirections(p); }}
                      style={s.dirBtn}>
                      Directions →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: "100vh", background: "var(--bg, #0f0f1e)", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f0f4ff" },
  header:     { background: "var(--surface, #1a1a2e)", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 100 },
  backBtn:    { background: "none", border: "none", color: "#a29bfe", fontWeight: 700, cursor: "pointer", fontSize: 13, width: 50 },
  searchRow:  { display: "flex", gap: 8, marginBottom: 10 },
  input:      { padding: "10px 14px", background: "var(--surface,#1a1a2e)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f4ff", fontSize: 13, outline: "none" },
  searchBtn:  { padding: "10px 16px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  chipRow:    { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  chip:       { padding: "6px 12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, fontWeight: 600, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" },
  map:        { width: "100%", height: 320, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" },
  dirBanner:  { marginTop: 10, padding: "10px 14px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.25)", borderRadius: 10, fontSize: 13, color: "#a29bfe", fontWeight: 600 },
  resultCard: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--surface,#1a1a2e)", borderRadius: 12, cursor: "pointer" },
  dirBtn:     { flexShrink: 0, padding: "8px 12px", background: "rgba(108,99,255,0.15)", color: "#a29bfe", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12 },
  errorBox:   { background: "rgba(225,112,85,0.1)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 12, padding: 16, color: "#e17055", fontSize: 13, lineHeight: 1.6 },
};
