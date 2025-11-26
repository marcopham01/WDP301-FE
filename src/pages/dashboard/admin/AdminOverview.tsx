import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Bike, Calendar, DollarSign, Activity } from "lucide-react";
import {
  getDashboardOverviewApi,
  getTopTechniciansAppointmentsApi,
  getTopTechniciansRevenueApi,
  TechnicianAppointment,
  TechnicianRevenue,
} from "@/lib/dashboardApi";
import { getAllProfilesApi } from "@/lib/authApi";
import { format } from "date-fns";
import { toast } from "react-toastify";

const AdminOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [topAppointments, setTopAppointments] = useState<
    TechnicianAppointment[]
  >([]);
  const [topRevenue, setTopRevenue] = useState<TechnicianRevenue[]>([]);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load dashboard overview
      const overviewRes = await getDashboardOverviewApi();
      if (overviewRes.ok && overviewRes.data?.data) {
        setOverviewData(overviewRes.data.data);
      }

      // Load top technicians by appointments
      const appointmentsRes = await getTopTechniciansAppointmentsApi();
      if (appointmentsRes.ok && appointmentsRes.data?.data) {
        setTopAppointments(appointmentsRes.data.data.technicians || []);
      }

      // Load top technicians by revenue - filter theo năm hiện tại (từ 01/01 đến 31/12)
      const now = new Date();
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1); // Tháng 0 = tháng 1 (January)
      const lastDayOfYear = new Date(now.getFullYear(), 11, 31); // Tháng 11 = tháng 12 (December)
      const revenueParams = {
        date_from: format(firstDayOfYear, "yyyy-MM-dd"),
        date_to: format(lastDayOfYear, "yyyy-MM-dd"),
      };
      const revenueRes = await getTopTechniciansRevenueApi(revenueParams);
      if (revenueRes.ok && revenueRes.data?.data) {
        setTopRevenue(revenueRes.data.data.technicians || []);
      }

      // Load total customers count
      try {
        const pageSize = 50;
        let page = 1;
        let totalCount = 0;

        while (true) {
          const customersRes = await getAllProfilesApi({
            page,
            limit: pageSize,
            role: "customer",
          });

          if (!customersRes.ok) break;

          // Handle nested response structure
          type Paged = {
            items?: any[];
            users?: any[];
            pagination?: { total_pages?: number; current_page?: number };
          };
          const raw = customersRes.data as
            | { success?: boolean; data?: Paged }
            | null
            | undefined;
          const container: Paged | undefined =
            raw?.data ?? (raw as unknown as Paged);
          const items = (container?.items ??
            container?.users ??
            (Array.isArray(container)
              ? (container as unknown as any[])
              : undefined)) as any[] | undefined;
          const pagination = container?.pagination as
            | { total_pages?: number; current_page?: number }
            | undefined;

          if (Array.isArray(items)) {
            // Filter customers only
            const customersOnly = items.filter(
              (u) => (u.role || "").toLowerCase() === "customer"
            );
            totalCount += customersOnly.length;
          }

          const totalPages = pagination?.total_pages ?? 1;
          const currentPage = pagination?.current_page ?? page;
          if (currentPage >= totalPages) break;
          page += 1;
          if (page > 20) break; // safety cap
        }

        setTotalCustomers(totalCount);
      } catch (e) {
        console.error("Error loading customers count:", e);
        // Không hiển thị error toast vì đây là thông tin phụ
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format số tiền
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format số với dấu phẩy
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Tính toán stats từ overview data
  const overviewStats = overviewData
    ? [
        {
          title: "Tổng khách hàng",
          value: formatNumber(totalCustomers),
          change: "+12%",
          changeType: "increase" as const,
          icon: Users,
          color: "bg-primary",
        },
        {
          title: "Xe đang bảo dưỡng",
          value: String(
            overviewData.appointmentRate?.breakdown?.in_progress || 0
          ),
          change: "-5%",
          changeType: "decrease" as const,
          icon: Bike,
          color: "bg-warning",
        },
        {
          title: "Lịch hẹn hôm nay",
          value: formatNumber(overviewData.appointmentRate?.total || 0),
          change: "-3%",
          changeType: "decrease" as const,
          icon: Calendar,
          color: "bg-electric",
        },
        {
          title: "Doanh thu tháng",
          value: formatCurrency(overviewData.revenue?.totalRevenue || 0),
          change: "+18%",
          changeType: "increase" as const,
          icon: DollarSign,
          color: "bg-success",
        },
      ]
    : [];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Tổng quan hệ thống</h2>
        <p className="text-muted-foreground">
          Theo dõi hoạt động trung tâm dịch vụ EV
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {overviewStats.map((stat) => (
              <Card
                key={stat.title}
                className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${stat.color}/10`}>
                      <stat.icon
                        className={`h-5 w-5 ${stat.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                      />
                    </div>
                    <Badge
                      variant={
                        stat.changeType === "increase"
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs">
                      {stat.change} từ tháng trước
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Technicians by Appointments */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Top 5 Kỹ thuật viên (Lịch hẹn)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topAppointments.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {topAppointments.map((tech, index) => (
                        <div
                          key={tech.technician_id}
                          className="flex items-center gap-4 p-4 border rounded-lg bg-background/50">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                              #{index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {tech.technician_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {tech.technician_email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-success text-white">
                              {tech.appointment_count} lịch hẹn
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate("/dashboard/admin/appointments")}>
                      Xem tất cả lịch hẹn
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 5 Technicians by Revenue */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Top 5 Kỹ thuật viên (Doanh thu)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topRevenue.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {topRevenue.map((tech, index) => (
                        <div
                          key={tech.technician_id}
                          className="flex items-center gap-4 p-4 border rounded-lg bg-background/50">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                              #{index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {tech.technician_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {tech.technician_email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-success text-white text-xs">
                              {formatCurrency(tech.total_revenue)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() =>
                        navigate("/dashboard/admin/reports/revenue")
                      }>
                      Xem báo cáo chi tiết
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
};

export default AdminOverview;
