import React, { useEffect, useMemo, useState } from "react";
import { getServiceCentersApi, getNearestServiceCentersApi, ServiceCenter } from "@/lib/serviceCenterApi";
import { geocodeAddress, haversineKm, getUserLocation } from "@/lib/geo";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { useAuth } from "@/context/AuthContext/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ChatWidget from "@/components/ChatWidget";

type StatusFilter = "all" | "active" | "maintenance" | "paused";

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

export default function ServiceCentersPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    setTimeout(() => {
      navigate("/login");
    }, 1000);
    toast.success("Đăng xuất thành công!");
  };
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(false);
  const [userGeo, setUserGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [distances, setDistances] = useState<Record<string, number | null>>({});
  const [error, setError] = useState<string | null>(null);

  // Initial load: get user location, then prefer nearest endpoint
  useEffect(() => {
    setLoading(true);
    getUserLocation().then((geo) => {
      setUserGeo(geo);
      if (geo) {
        getNearestServiceCentersApi(geo.lat, geo.lng, 50).then((nearRes) => {
          if (nearRes.ok && nearRes.data?.success) {
            const nearest = nearRes.data.data || [];
            if (nearest.length === 0) {
              // Fallback if no centers in radius or missing coordinates
              getServiceCentersApi().then((res) => {
                if (res.ok && res.data?.success) {
                  setCenters(res.data.data || []);
                } else {
                  setError(res.message || "Không thể tải danh sách trung tâm");
                }
                setLoading(false);
              });
            } else {
              setCenters(nearest);
              setLoading(false);
            }
          } else {
            // Fallback to full list
            getServiceCentersApi().then((res) => {
              if (res.ok && res.data?.success) {
                setCenters(res.data.data || []);
              } else {
                setError(res.message || "Không thể tải danh sách trung tâm");
              }
              setLoading(false);
            });
          }
        }).catch(() => {
          getServiceCentersApi().then((res) => {
            if (res.ok && res.data?.success) {
              setCenters(res.data.data || []);
            } else {
              setError(res.message || "Không thể tải danh sách trung tâm");
            }
            setLoading(false);
          });
        });
      } else {
        // No location permission -> load all
        getServiceCentersApi().then((res) => {
          if (res.ok && res.data?.success) {
            setCenters(res.data.data || []);
          } else {
            setError(res.message || "Không thể tải danh sách trung tâm");
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
          // Prefer server-provided distanceKm if present
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
    return centers.filter((c) => {
      const matchQ = q
        ? (c.center_name?.toLowerCase().includes(q.toLowerCase()) || c.address?.toLowerCase().includes(q.toLowerCase()))
        : true;
      const matchStatus =
        status === "all"
          ? true
          : status === "active"
          ? !!c.is_active
          : status === "paused"
          ? !c.is_active
          : true;
      return matchQ && matchStatus;
    });
  }, [centers, q, status]);

  return (
    <div className="min-h-screen">
      <Header onLogout={handleLogout} />
      {user && <ChatWidget />}
      
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pt-16">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-ev-green to-green-600 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Tất cả trung tâm dịch vụ</h1>
            <p className="text-lg text-green-50">Tìm kiếm và khám phá trung tâm dịch vụ xe điện gần bạn</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="max-w-6xl mx-auto px-4 -mt-8 mb-8">
          <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ev-green focus:border-transparent"
                placeholder="Tìm trung tâm dịch vụ..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Trạng thái:</label>
              <select
                className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ev-green focus:border-transparent"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="paused">Tạm dừng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          {loading && <div className="text-center text-gray-600">Đang tải...</div>}
          {error && !loading && <div className="text-center text-red-600 mb-4 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {filtered.map((center) => {
              const { isOpen, todayHours } = isOpenNow(center.working_hours);
              const distance = distances[center._id];
              return (
                <div key={center._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-ev-green to-green-600">
                    <img 
                      src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500" 
                      alt={center.center_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-md">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="text-sm font-semibold">5.0</span>
                    </div>
                    <div className="absolute top-3 right-3">
                      {center.is_active ? (
                        <span className="bg-ev-green text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">Active</span>
                      ) : (
                        <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">Inactive</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">{center.center_name}</h3>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="line-clamp-2">{center.address}</span>
                      </div>
                      
                      {distance != null && (
                        <div className="flex items-center gap-2 text-sm text-ev-green font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>{distance.toFixed(1)} km từ vị trí của bạn</span>
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
                          <svg className="w-4 h-4 text-ev-green" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-ev-green font-medium text-xs">Open Now</span>
                          {todayHours && todayHours.open && todayHours.close && (
                            <span className="text-gray-500 text-xs">{todayHours.open} - {todayHours.close}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-600 font-medium text-xs">Closed</span>
                          </div>
                          {todayHours && todayHours.open && (
                            <div className="text-gray-500 text-xs ml-6">Opens Today at {todayHours.open}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Services badges */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Services:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs bg-green-50 text-ev-green px-2 py-0.5 rounded border border-green-200">Kiểm tra & Thay pin xe điện</span>
                        <span className="text-xs bg-green-50 text-ev-green px-2 py-0.5 rounded border border-green-200">Thay dầu Hộp số xe điện</span>
                      </div>
                    </div>

                    {/* Payment badges */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Payment:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">Cash</span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">Bank</span>
                        <span className="text-xs text-gray-500">+2</span>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(center.address || center.center_name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-ev-green hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300"
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

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Không tìm thấy trung tâm nào</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
