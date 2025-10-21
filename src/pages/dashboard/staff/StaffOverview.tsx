import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, Car, Users, Wrench } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AppointmentItem = {
  _id: string;
  status: string;
  appoinment_date?: string;
  appoinment_time?: string;
  user_id?: {
    _id?: string;
    username?: string;
    fullName?: string;
    email?: string;
  };
  vehicle_id?: {
    _id?: string;
    brand?: string;
    model?: string;
    license_plate?: string;
  };
  center_id?: {
    _id?: string;
    name?: string;
    center_name?: string;
    address?: string;
  };
};

export default function StaffOverview() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<AppointmentItem[]>([]);

  const load = async () => {
    // API appointment chưa sẵn sàng
    // const res = await getAppointmentsApi({ page: 1, limit: 10 });
    // if (res.ok && res.data?.data) setBookings(((res.data.data as unknown) as { appointments: AppointmentItem[] }).appointments || []);
    setBookings([]); // Empty bookings for now
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    return {
      totalBookings: total,
      pendingBookings: pending,
      totalCustomers: new Set(bookings.map((b) => b.user_id?._id)).size,
      totalVehicles: new Set(bookings.map((b) => b.vehicle_id?._id)).size,
    };
  }, [bookings]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      pending: { label: "Chờ xử lý", variant: "outline" },
      confirmed: { label: "Đã xác nhận", variant: "default" },
      completed: { label: "Hoàn thành", variant: "secondary" },
      cancelled: { label: "Đã hủy", variant: "destructive" },
    };

    const { label, variant } = statusMap[status] || {
      label: status,
      variant: "outline" as const,
    };

    return <Badge variant={variant}>{label}</Badge>;
  };

  const quickStatus = async () => {
    // API appointment chưa sẵn sàng
    // const res = await updateAppointmentStatusApi({ appointment_id: id, status });
    // if (res.ok) load();
    alert("Chức năng quản lý lịch hẹn đang được phát triển");
  };

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Quản lý lịch hẹn và khách hàng
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/staff/appointments")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Lịch Hẹn</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/staff/appointments")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ Xử Lý</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/staff/customers")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách Hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/staff/vehicles")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phương Tiện</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch Hẹn Gần Đây</CardTitle>
          <CardDescription>10 lịch hẹn mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách Hàng</TableHead>
                <TableHead>Phương Tiện</TableHead>
                <TableHead>Dịch Vụ</TableHead>
                <TableHead>Ngày Hẹn</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8">
                    Chức năng quản lý lịch hẹn đang được phát triển
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {booking.user_id?.fullName ||
                            booking.user_id?.username ||
                            "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.user_id?.email || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {booking.vehicle_id?.brand}{" "}
                        {booking.vehicle_id?.model || ""}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.vehicle_id?.license_plate || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.center_id?.name ||
                        booking.center_id?.center_name ||
                        "N/A"}
                    </TableCell>
                    <TableCell>
                      <div>
                        {booking.appoinment_date
                          ? format(
                              new Date(booking.appoinment_date),
                              "dd/MM/yyyy"
                            )
                          : "-"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.appoinment_time?.substring?.(0, 5) ||
                          booking.appoinment_time ||
                          "-"}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => quickStatus()}>
                          Nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => quickStatus()}>
                          Hoàn tất
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => quickStatus()}>
                          Hủy
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
