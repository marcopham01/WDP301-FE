export type Geo = { lat: number; lng: number };

const GEO_CACHE_KEY = "geo-cache-v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCache(): Record<string, { lat: number; lng: number; ts: number }> {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, { lat: number; lng: number; ts: number }>;
  } catch {
    return {};
  }
}

function setCache(cache: Record<string, { lat: number; lng: number; ts: number }>) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export async function geocodeAddress(address?: string, nameHint?: string): Promise<Geo | null> {
  if (!address && !nameHint) return null;
  const baseKey = `${(address || "").trim().toLowerCase()}|${(nameHint || "").trim().toLowerCase()}`;
  const key = baseKey;
  const cache = getCache();
  const hit = cache[key];
  const now = Date.now();
  if (hit && now - hit.ts < CACHE_TTL_MS) {
    return { lat: hit.lat, lng: hit.lng };
  }
  
  // Use a more reliable geocoding service with better CORS support
  const queries = [
    `${address || ""}`,
    `${address || ""}, Vietnam`,
    `${nameHint || ""} ${address || ""}`,
  ].filter(Boolean);

  for (const q of queries) {
    try {
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=${encodeURIComponent(q)}`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'EVCareApp/1.0',
        }
      });
      
      if (!resp.ok) continue;
      
      const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          cache[key] = { lat, lng, ts: now };
          setCache(cache);
          return { lat, lng };
        }
      }
    } catch (e) {
      console.warn('Geocoding attempt failed:', e);
      // try next variant
    }
  }
  return null;
}

export function haversineKm(a: Geo, b: Geo): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
  return R * c;
}

/**
 * Try to get precise browser location; if denied/unavailable, fallback to IP-based geolocation.
 */
export async function getUserLocation(): Promise<Geo | null> {
  // 1) Try browser geolocation (with a timeout)
  const geoPromise = new Promise<Geo | null>((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timeout = setTimeout(() => resolve(null), 6000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  });

  const browserLoc = await geoPromise;
  if (browserLoc) return browserLoc;

  // 2) Fallback to IP-based geolocation (approximate)
  try {
    const res = await fetch("https://ipapi.co/json");
    if (!res.ok) return null;
    const data = await res.json();
    const lat = Number(data?.latitude);
    const lng = Number(data?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  } catch {
    // ignore
  }
  return null;
}
