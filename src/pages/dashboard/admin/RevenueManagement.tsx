import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, DollarSign, TrendingUp } from "lucide-react";
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

const RevenueManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [centerId, setCenterId] = useState("all");
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);

  // Màu sắc theo theme của website (green-based)
  const PAYMENT_COLORS = {
    PAID: "hsl(142, 76%, 36%)", // success/primary - xanh lá
    PENDING: "hsl(45, 93%, 58%)", // warning - vàng
    FAILED: "hsl(0, 84%, 60%)", // destructive - đỏ
    CANCELLED: "hsl(0, 84%, 60%)", // destructive - đỏ
    EXPIRED: "hsl(0, 62%, 50%)", // destructive dark - đỏ đậm
    TIMEOUT: "hsl(35, 95%, 58%)", // charging-orange - cam
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
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setDateFrom("");
    setDateTo("");
    setCenterId("all");
    setTimeout(() => {
      loadData();
    }, 100);
  };

  // Format số tiền
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Xác định màu cho tỷ lệ % dựa trên trạng thái (giống màu trong chart)
  const getRateColor = (statusName: string): string => {
    if (statusName === "Đã thanh toán") return PAYMENT_COLORS.PAID;
    if (statusName === "Chờ thanh toán") return PAYMENT_COLORS.PENDING;
    if (statusName === "Thất bại") return PAYMENT_COLORS.FAILED;
    if (statusName === "Đã hủy") return PAYMENT_COLORS.CANCELLED;
    if (statusName === "Hết hạn") return PAYMENT_COLORS.EXPIRED;
    if (statusName === "Hết thời gian") return PAYMENT_COLORS.TIMEOUT;
    // Mặc định
    return PAYMENT_COLORS.PAID;
  };

  // Chuẩn bị dữ liệu cho Pie Chart - Payment Status
  const paymentPieData = data?.paymentRate.breakdown
    ? [
        {
          name: "Đã thanh toán",
          value: data.paymentRate.breakdown.PAID,
          color: PAYMENT_COLORS.PAID,
        },
        {
          name: "Chờ thanh toán",
          value: data.paymentRate.breakdown.PENDING,
          color: PAYMENT_COLORS.PENDING,
        },
        {
          name: "Thất bại",
          value: data.paymentRate.breakdown.FAILED,
          color: PAYMENT_COLORS.FAILED,
        },
        {
          name: "Đã hủy",
          value: data.paymentRate.breakdown.CANCELLED,
          color: PAYMENT_COLORS.CANCELLED,
        },
        {
          name: "Hết hạn",
          value: data.paymentRate.breakdown.EXPIRED,
          color: PAYMENT_COLORS.EXPIRED,
        },
        {
          name: "Hết thời gian",
          value: data.paymentRate.breakdown.TIMEOUT,
          color: PAYMENT_COLORS.TIMEOUT,
        },
      ].filter((item) => item.value > 0)
    : [];

  // Chuẩn bị dữ liệu cho Bar Chart - Payment Rates
  const paymentBarData = data?.paymentRate.breakdown.rates
    ? [
        {
          name: "Đã thanh toán",
          rate: data.paymentRate.breakdown.rates.PAID,
          count: data.paymentRate.breakdown.PAID,
        },
        {
          name: "Chờ thanh toán",
          rate: data.paymentRate.breakdown.rates.PENDING,
          count: data.paymentRate.breakdown.PENDING,
        },
        {
          name: "Thất bại",
          rate: data.paymentRate.breakdown.rates.FAILED,
          count: data.paymentRate.breakdown.FAILED,
        },
        {
          name: "Đã hủy",
          rate: data.paymentRate.breakdown.rates.CANCELLED,
          count: data.paymentRate.breakdown.CANCELLED,
        },
        {
          name: "Hết hạn",
          rate: data.paymentRate.breakdown.rates.EXPIRED,
          count: data.paymentRate.breakdown.EXPIRED,
        },
        {
          name: "Hết thời gian",
          rate: data.paymentRate.breakdown.rates.TIMEOUT,
          count: data.paymentRate.breakdown.TIMEOUT,
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
            {payload[0].dataKey === "rate" ? "%" : "giao dịch"}
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
          <h1 className="text-2xl font-bold">Tổng quan doanh thu</h1>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6 bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Từ ngày</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Đến ngày</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
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
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tổng doanh thu
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(data.revenue.totalRevenue)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tổng giao dịch
                </p>
                <p className="text-3xl font-bold text-success">
                  {data.revenue.totalTransactions}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Đã thanh toán
                </p>
                <p className="text-3xl font-bold text-warning">
                  {data.paymentRate.breakdown.PAID}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Status Pie Chart */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Phân bố trạng thái thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={paymentPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value">
                        {paymentPieData.map((entry, index) => (
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

            {/* Payment Rates Bar Chart */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Tỷ lệ trạng thái thanh toán (%)</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={paymentBarData}>
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
                        dataKey="rate"
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}>
                        {paymentBarData.map((entry, index) => {
                          let color = PAYMENT_COLORS.PAID;
                          if (entry.name === "Đã thanh toán")
                            color = PAYMENT_COLORS.PAID;
                          else if (entry.name === "Chờ thanh toán")
                            color = PAYMENT_COLORS.PENDING;
                          else if (entry.name === "Thất bại")
                            color = PAYMENT_COLORS.FAILED;
                          else if (entry.name === "Đã hủy")
                            color = PAYMENT_COLORS.CANCELLED;
                          else if (entry.name === "Hết hạn")
                            color = PAYMENT_COLORS.EXPIRED;
                          else if (entry.name === "Hết thời gian")
                            color = PAYMENT_COLORS.TIMEOUT;

                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
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
              <CardTitle>Chi tiết trạng thái thanh toán</CardTitle>
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
                    {paymentBarData.map((item) => (
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

          {/* Revenue Summary */}
          <Card className="mt-6 bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Tổng quan doanh thu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Tổng doanh thu
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(data.revenue.totalRevenue)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Tổng số giao dịch
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {data.revenue.totalTransactions}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Tổng số thanh toán
                  </p>
                  <p className="text-2xl font-bold">{data.paymentRate.total}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Tỷ lệ thanh toán thành công
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {data.paymentRate.breakdown.rates.PAID.toFixed(2)}%
                  </p>
                </div>
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

export default RevenueManagement;
