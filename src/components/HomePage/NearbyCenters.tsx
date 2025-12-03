import React, { useEffect, useMemo, useState } from "react";
import { getServiceCentersApi, getNearestServiceCentersApi, ServiceCenter } from "@/lib/serviceCenterApi";
import { useNavigate } from "react-router-dom";
import { geocodeAddress, haversineKm, getUserLocation } from "@/lib/geo";

type BrowserGeo = { lat: number; lng: number };

function googleDirectionsLink(center: ServiceCenter) {
  const query = encodeURIComponent(center.address || center.center_name);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

function isOpenNow(hours?: any): { isOpen: boolean; todayHours?: { open: string | null; close: string | null } } {
  if (!hours || typeof hours !== 'object') return { isOpen: false };
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayNames[dayOfWeek];
  const todayHours = hours[todayKey];
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return { isOpen: false, todayHours };
  }
  
  // Check if current time is within operating hours
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  const isOpen = currentTime >= openTime && currentTime < closeTime;
  return { isOpen, todayHours };
}

const radiusOptions = [20, 50, 100, 200];

interface Props {
  className?: string;
}

export default function NearbyCenters({ className }: Props) {
  const navigate = useNavigate();
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(20); // Default to smallest radius
  const [userGeo, setUserGeo] = useState<BrowserGeo | null>(null);
  const [distances, setDistances] = useState<Record<string, number | null>>({});

  useEffect(() => {
    setLoading(true);
    // Get user location first
    getUserLocation().then((geo) => {
      console.log('[NearbyCenters] User geo:', geo);
      setUserGeo(geo);
      // If we have geo, try nearest endpoint; fallback to full list
      if (geo) {
        getNearestServiceCentersApi(geo.lat, geo.lng, radiusKm).then((nearRes) => {
          console.log('[NearbyCenters] Nearest response:', nearRes);
          if (nearRes.ok && nearRes.data?.success) {
            const nearest = nearRes.data.data || [];
            console.log('[NearbyCenters] Centers with distance:', nearest);
            if (nearest.length === 0) {
              // No centers within radius or coordinates missing -> fallback
              getServiceCentersApi().then((res) => {
                if (res.ok && res.data?.success) {
                  setCenters(res.data.data || []);
                } else {
                  setError(res.message || "Không thể tải trung tâm dịch vụ");
                }
                setLoading(false);
              });
            } else {
              setCenters(nearest);
              setLoading(false);
            }
          } else {
            // Fallback to all centers
            getServiceCentersApi().then((res) => {
              if (res.ok && res.data?.success) {
                setCenters(res.data.data || []);
              } else {
                setError(res.message || "Không thể tải trung tâm dịch vụ");
              }
              setLoading(false);
            });
          }
        }).catch(() => {
          // Hard fallback
          getServiceCentersApi().then((res) => {
            if (res.ok && res.data?.success) {
              setCenters(res.data.data || []);
            } else {
              setError(res.message || "Không thể tải trung tâm dịch vụ");
            }
            setLoading(false);
          });
        });
      } else {
        // No geo permission -> load all
        getServiceCentersApi().then((res) => {
          if (res.ok && res.data?.success) {
            setCenters(res.data.data || []);
          } else {
            setError(res.message || "Không thể tải trung tâm dịch vụ");
          }
          setLoading(false);
        });
      }
    });
  }, [radiusKm]);

  // Compute distances only if server didn't provide distanceKm
  useEffect(() => {
    const run = async () => {
      if (!userGeo || centers.length === 0) {
        setDistances({});
        return;
      }
      const map: Record<string, number | null> = {};
      await Promise.all(
        centers.map(async (c) => {
          if (typeof c.distanceKm === 'number') {
            map[c._id] = c.distanceKm;
            return;
          }
          const g = (typeof c.lat === 'number' && typeof c.lng === 'number')
            ? { lat: c.lat, lng: c.lng }
            : await geocodeAddress(c.address, c.center_name);
          map[c._id] = g ? haversineKm(userGeo, g) : null;
        })
      );
      setDistances(map);
    };
    run();
  }, [centers, userGeo]);

  const withDistance = useMemo(() => {
    return centers.map((c) => ({ center: c, distanceKm: distances[c._id] ?? null }));
  }, [centers, distances]);

  const filtered = useMemo(() => {
    if (!userGeo) return withDistance; // show all when no geolocation
    // Only filter by radius if we have distance data
    const hasDistances = withDistance.some(it => it.distanceKm !== null);
    if (!hasDistances) return withDistance; // show all if no distances computed
    return withDistance.filter((it) => it.distanceKm == null || it.distanceKm <= radiusKm);
  }, [withDistance, radiusKm, userGeo]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [filtered]);

  // Show all centers within radius (no limit for better UX)
  const displayedCenters = sorted;

  return (
    <div className={className}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Trung tâm dịch vụ gần bạn</h2>
        <p className="text-gray-600">Khám phá các trung tâm dịch vụ EV gần bạn với công nghệ tiên tiến</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-sm text-gray-600">Tìm kiếm trong phạm vi:</span>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            {radiusOptions.map((r) => (
              <option key={r} value={r}>{r} km</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-sm text-center text-gray-600">Đang tải trung tâm...</div>}
      {error && <div className="text-sm text-center text-red-600">{error}</div>}

      {displayedCenters.length === 0 && !loading && (
        <div className="text-center text-gray-600 py-8">
          Không tìm thấy trung tâm dịch vụ trong phạm vi {radiusKm}km
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-8">
        {displayedCenters.map(({ center, distanceKm }) => {
          const { isOpen, todayHours } = isOpenNow(center.working_hours);
          return (
            <div key={center._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Image placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-blue-500 to-blue-600">
                <img 
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500" 
                  alt={center.center_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-white px-2 py-1 rounded-full">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-semibold">5.0</span>
                </div>
                <div className="absolute top-3 right-3">
                  {center.is_active ? (
                    <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">Active</span>
                  ) : (
                    <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">Inactive</span>
                  )}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-xl text-gray-800 mb-2">{center.center_name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{center.address}</span>
                  </div>
                  {distanceKm != null && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>~ {distanceKm.toFixed(1)} km từ vị trí của bạn</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{center.phone || "N/A"}</span>
                  </div>
                  {center.is_active && isOpen ? (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-600 font-medium">Open Now</span>
                      {todayHours && todayHours.open && todayHours.close && (
                        <span className="text-gray-500">• {todayHours.open} - {todayHours.close}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-600 font-medium">Closed</span>
                      </div>
                      {todayHours && todayHours.open && (
                        <div className="text-gray-500 text-xs ml-6">Opens Today at {todayHours.open}</div>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">(0 reviews)</div>
                </div>

                <a
                  href={googleDirectionsLink(center)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Get Directions
                  </span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate("/service-centers")}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-lg hover:shadow-xl"
        >
          Xem tất cả các trung tâm dịch vụ
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
