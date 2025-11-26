import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";
import {
  getDashboardOverviewApi,
  DashboardOverviewData,
} from "@/lib/dashboardApi";
import { getServiceCentersApi, ServiceCenter } from "@/lib/serviceCenterApi";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
  }>;
}

const AppointmentManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [centerId, setCenterId] = useState("all");
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);

  // Màu sắc theo theme của website (green-based)
  const COLORS = {
    pending: "hsl(45, 93%, 58%)", // warning - vàng
    assigned: "hsl(217, 91%, 60%)", // secondary - xanh dương
    check_in: "hsl(142, 76%, 50%)", // primary glow - xanh lá sáng
    in_progress: "hsl(35, 95%, 58%)", // charging-orange - cam
    completed: "hsl(142, 76%, 36%)", // success/primary - xanh lá
    delay: "hsl(0, 84%, 60%)", // destructive - đỏ
    canceled: "hsl(0, 84%, 60%)", // destructive - đỏ (đã đổi từ xám)
  };

  // Xác định màu cho tỷ lệ % dựa trên trạng thái (giống màu trong chart)
  const getRateColor = (statusName: string): string => {
    if (statusName === "Chờ xử lý") return COLORS.pending;
    if (statusName === "Đã phân công") return COLORS.assigned;
    if (statusName === "Đã check-in") return COLORS.check_in;
    if (statusName === "Đang thực hiện") return COLORS.in_progress;
    if (statusName === "Hoàn thành") return COLORS.completed;
    if (statusName === "Trễ hạn") return COLORS.delay;
    if (statusName === "Đã hủy") return COLORS.canceled;
    // Mặc định
    return COLORS.completed;
  };

  const loadServiceCenters = useCallback(async () => {
    try {
      const res = await getServiceCentersApi();
      if (res.ok && res.data?.data) {
        setServiceCenters(res.data.data);
      } else {
        console.error("Không thể tải danh sách trung tâm dịch vụ");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        date_from?: string;
        date_to?: string;
        center_id?: string;
      } = {};
      if (dateFrom) params.date_from = format(dateFrom, "yyyy-MM-dd");
      if (dateTo) params.date_to = format(dateTo, "yyyy-MM-dd");
      if (centerId && centerId !== "all") params.center_id = centerId;

      const res = await getDashboardOverviewApi(params);
      if (res.ok && res.data?.data) {
        setData(res.data.data);
      } else {
        toast.error(res.message || "Không thể tải dữ liệu dashboard");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, centerId]);

  useEffect(() => {
    loadServiceCenters();
  }, [loadServiceCenters]);

  useEffect(() => {
    // Chỉ load data khi component mount lần đầu
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    loadData();
  };

  const handleReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCenterId("all");
  };

  // Chuẩn bị dữ liệu cho Pie Chart
  const pieData = data?.appointmentRate.breakdown
    ? [
        {
          name: "Chờ xử lý",
          value: data.appointmentRate.breakdown.pending,
          color: COLORS.pending,
        },
        {
          name: "Đã phân công",
          value: data.appointmentRate.breakdown.assigned,
          color: COLORS.assigned,
        },
        {
          name: "Đã check-in",
          value: data.appointmentRate.breakdown.check_in,
          color: COLORS.check_in,
        },
        {
          name: "Đang thực hiện",
          value: data.appointmentRate.breakdown.in_progress,
          color: COLORS.in_progress,
        },
        {
          name: "Hoàn thành",
          value: data.appointmentRate.breakdown.completed,
          color: COLORS.completed,
        },
        {
          name: "Trễ hạn",
          value: data.appointmentRate.breakdown.delay,
          color: COLORS.delay,
        },
        {
          name: "Đã hủy",
          value: data.appointmentRate.breakdown.canceled,
          color: COLORS.canceled,
        },
      ].filter((item) => item.value > 0)
    : [];

  // Chuẩn bị dữ liệu cho Bar Chart (rates)
  const barData = data?.appointmentRate.breakdown.rates
    ? [
        {
          name: "Chờ xử lý",
          rate: data.appointmentRate.breakdown.rates.pending,
          count: data.appointmentRate.breakdown.pending,
        },
        {
          name: "Đã phân công",
          rate: data.appointmentRate.breakdown.rates.assigned,
          count: data.appointmentRate.breakdown.assigned,
        },
        {
          name: "Đã check-in",
          rate: data.appointmentRate.breakdown.rates.check_in,
          count: data.appointmentRate.breakdown.check_in,
        },
        {
          name: "Đang thực hiện",
          rate: data.appointmentRate.breakdown.rates.in_progress,
          count: data.appointmentRate.breakdown.in_progress,
        },
        {
          name: "Hoàn thành",
          rate: data.appointmentRate.breakdown.rates.completed,
          count: data.appointmentRate.breakdown.completed,
        },
        {
          name: "Trễ hạn",
          rate: data.appointmentRate.breakdown.rates.delay,
          count: data.appointmentRate.breakdown.delay,
        },
        {
          name: "Đã hủy",
          rate: data.appointmentRate.breakdown.rates.canceled,
          count: data.appointmentRate.breakdown.canceled,
        },
      ].filter((item) => item.count > 0)
    : [];

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value}{" "}
            {payload[0].dataKey === "rate"
              ? "%"
              : payload[0].dataKey === "count"
              ? "lịch hẹn"
              : "lịch hẹn"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Thống kê lịch hẹn</h1>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6 bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Từ ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dateFrom"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300",
                      !dateFrom && "text-muted-foreground"
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom
                      ? format(dateFrom, "PPP", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="dateTo">Đến ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dateTo"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300",
                      !dateTo && "text-muted-foreground"
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo
                      ? format(dateTo, "PPP", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    disabled={(date) => (dateFrom ? date < dateFrom : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="centerId">Trung tâm dịch vụ</Label>
              <Select
                value={centerId || "all"}
                onValueChange={(value) => setCenterId(value)}>
                <SelectTrigger id="centerId">
                  <SelectValue placeholder="Chọn trung tâm dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trung tâm</SelectItem>
                  {serviceCenters.map((center) => (
                    <SelectItem key={center._id} value={center._id}>
                      {center.center_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                Áp dụng
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Tổng số lịch hẹn
                </p>
                <p className="text-3xl font-bold text-primary">
                  {data.appointmentRate.total}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Đang chờ xử lý
                </p>
                <p className="text-3xl font-bold text-warning">
                  {data.appointmentRate.breakdown.pending}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Đã hoàn thành
                </p>
                <p className="text-3xl font-bold text-success">
                  {data.appointmentRate.breakdown.completed}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Phân bố tỷ lệ lịch hẹn</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry: { color?: string }) => (
                          <span style={{ color: entry.color }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Số lượng trạng thái lịch hẹn</CardTitle>
              </CardHeader>
              <CardContent>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={barData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name === "Hoàn thành"
                                ? COLORS.completed
                                : entry.name === "Chờ xử lý"
                                ? COLORS.pending
                                : entry.name === "Đang thực hiện"
                                ? COLORS.in_progress
                                : entry.name === "Đã hủy"
                                ? COLORS.canceled
                                : "hsl(var(--primary))"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown Table */}
          <Card className="mt-6 bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Chi tiết trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Trạng thái</th>
                      <th className="text-right p-3">Số lượng</th>
                      <th className="text-right p-3">Tỷ lệ (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barData.map((item) => (
                      <tr
                        key={item.name}
                        className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3 text-right">{item.count}</td>
                        <td className="p-3 text-right">
                          <span
                            className="font-semibold"
                            style={{ color: getRateColor(item.name) }}>
                            {item.rate.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">
            Không có dữ liệu để hiển thị
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AppointmentManagement;
