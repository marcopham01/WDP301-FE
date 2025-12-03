import React, { useEffect, useMemo, useState } from "react";
import { getServiceCentersApi, getNearestServiceCentersApi, ServiceCenter } from "@/lib/serviceCenterApi";
import { geocodeAddress, haversineKm, getUserLocation } from "@/lib/geo";

function getTodayHours(working_hours?: any): { open: string | null; close: string | null } | null {
  if (!working_hours || typeof working_hours !== 'object') return null;
  const dayOfWeek = new Date().getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayNames[dayOfWeek];
  const todayHours = working_hours[todayKey];
  if (!todayHours) return null;
  return todayHours;
}

function isWithinOperatingHours(todayHours: { open: string | null; close: string | null } | null): boolean {
  if (!todayHours || !todayHours.open || !todayHours.close) return false;
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  return currentTime >= openTime && currentTime < closeTime;
}

interface Props {
  selectedId?: string;
  onSelect: (center: ServiceCenter) => void;
}

export default function SelectCenterGrid({ selectedId, onSelect }: Props) {
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
  const [page, setPage] = useState(1);
  const pageSize = 4; // show 4 per page like screenshot
  const [userGeo, setUserGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [distances, setDistances] = useState<Record<string, number | null>>({});
  const [error, setError] = useState<string | null>(null);

  // Initial load: attempt nearest first, fallback to full list
  useEffect(() => {
    setLoading(true);
    getUserLocation().then((g) => {
      setUserGeo(g);
      if (g) {
        getNearestServiceCentersApi(g.lat, g.lng, 50).then((nearRes) => {
          if (nearRes.ok && nearRes.data?.success) {
            const nearest = nearRes.data.data || [];
            if (nearest.length === 0) {
              // Fallback to full list if empty
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
        // No location permission -> full list
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
  }, []);

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

  const filtered = useMemo(() => {
    const list = centers.filter((c) => {
      const matchQ = q
        ? (c.center_name?.toLowerCase().includes(q.toLowerCase()) || c.address?.toLowerCase().includes(q.toLowerCase()))
        : true;
      const matchStatus = status === "all" ? true : status === "active" ? !!c.is_active : !c.is_active;
      return matchQ && matchStatus;
    });
    return list;
  }, [centers, q, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-1">Chọn trung tâm dịch vụ</h2>
        <p className="text-sm text-gray-600">Tìm và chọn trung tâm dịch vụ gần bạn nhất</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm theo tên, địa chỉ..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="paused">Tạm dừng</option>
          </select>
          <button
            type="button"
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition"
          >
            Filters
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600 mb-4">Đang tải...</div>}
      {error && !loading && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {pageItems.map((center) => {
          const selected = center._id === selectedId;
          const distance = distances[center._id];
          const isActive = center.is_active;
          const todayHours = getTodayHours(center.working_hours);
          const isOpenNow = isActive && isWithinOperatingHours(todayHours);
          const canBook = isActive && isOpenNow; // Can only book if active AND open now
          
          return (
            <button
              key={center._id}
              type="button"
              onClick={() => canBook && onSelect(center)}
              disabled={!canBook}
              className={`group text-left rounded-xl border ${
                selected ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"
              } shadow-sm hover:shadow-md transition-all p-4 relative ${
                !canBook ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {/* Status badge */}
              <div className="absolute top-4 right-4">
                {isActive ? (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">Hoạt động</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">Tạm dừng</span>
                )}
              </div>

              <h4 className="font-semibold text-gray-800 mb-1 pr-20">{center.center_name}</h4>
              {center.address && (
                <p className="text-sm text-gray-600 leading-snug mb-2 line-clamp-2">{center.address}</p>
              )}
              {distance != null && (
                <div className="flex items-center gap-1 text-xs text-teal-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>{distance.toFixed(1)} km từ vị trí của bạn</span>
                </div>
              )}
              {center.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-700 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{center.phone}</span>
                </div>
              )}

              {/* Open / Closed indicator */}
              <div className="mb-3">
                {isOpenNow ? (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-600 font-medium">Open Now</span>
                    {todayHours && todayHours.open && todayHours.close && (
                      <span className="text-gray-500 text-xs">• {todayHours.open} - {todayHours.close}</span>
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
                    {center.working_hours && center.working_hours.monday && center.working_hours.monday.open && (
                      <div className="text-gray-500 text-xs ml-6">Opens Today at {center.working_hours.monday.open}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Services (static placeholders) */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">Kiểm tra & thay pin xe điện</span>
                  <span className="text-[11px] px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">Thay dầu hộp số xe điện</span>
                </div>
              </div>

              {!isActive && (
                <div className="text-center text-xs text-red-600 font-medium pt-2 border-t border-dashed border-gray-200">
                  Trung tâm đang đóng cửa
                </div>
              )}
              
              {isActive && !isOpenNow && (
                <div className="text-center text-xs text-orange-600 font-medium pt-2 border-t border-dashed border-gray-200">
                  Trung tâm đang đóng cửa
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={page === 1}
            className={`w-8 h-8 flex items-center justify-center rounded border text-sm ${page === 1 ? "bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50 text-gray-700"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium px-3 py-1 rounded border bg-blue-50 text-blue-700">{page}</span>
          <button
            type="button"
            onClick={goNext}
            disabled={page === totalPages}
            className={`w-8 h-8 flex items-center justify-center rounded border text-sm ${page === totalPages ? "bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50 text-gray-700"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
