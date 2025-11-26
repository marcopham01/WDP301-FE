import {
  Users,
  Bike,
  Home,
  MapPin,
  Package,
  Calendar,
  TrendingUp,
} from "lucide-react";

export const adminMenuItems = [
  {
    title: "Tổng quan",
    icon: Home,
    href: "/dashboard/admin",
  },
  {
    title: "Quản lý cơ sở",
    icon: MapPin,
    items: [
      {
        title: "Trung tâm dịch vụ",
        href: "/dashboard/admin/service-centers",
      },
      {
        title: "Dịch vụ",
        href: "/dashboard/admin/services",
      },
    ],
  },
  {
    title: "Quản lý người dùng",
    icon: Users,
    items: [
      {
        title: "Khách hàng",
        href: "/dashboard/admin/customers",
      },
      {
        title: "Nhân viên",
        href: "/dashboard/admin/staff",
      },
      {
        title: "Kỹ thuật viên",
        href: "/dashboard/admin/technicians",
      },
    ],
  },
  {
    title: "Quản lý phương tiện",
    icon: Bike,
    items: [
      {
        title: "Mẫu xe",
        href: "/dashboard/admin/vehicle-models",
      },
      // {
      //   title: "Danh sách phương tiện",
      //   href: "/dashboard/admin/vehicles",
      // },
    ],
  },
  {
    title: "Quản lý lịch hẹn",
    icon: Calendar,
    items: [
      {
        title: "Thống kê lịch hẹn",
        href: "/dashboard/admin/appointments",
      },
      {
        title: "Tổng quan lịch hẹn",
        href: "/dashboard/admin/appointments/overview",
      },
      {
        title: "Quản lý lịch làm việc",
        href: "/dashboard/admin/technician-schedules",
      },
    ],
  },
  {
    title: "Quản lý kho",
    icon: Package,
    items: [
      {
        title: "Phụ tùng",
        href: "/dashboard/admin/parts",
      },
      {
        title: "Kho phụ tùng",
        href: "/dashboard/admin/inventory",
      },
      {
        title: "Loại sự cố",
        href: "/dashboard/admin/issue-types",
      },
    ],
  },
  {
    title: "Báo cáo & Thống kê",
    icon: TrendingUp,
    items: [
      {
        title: "Tổng quan doanh thu",
        href: "/dashboard/admin/reports/revenue",
      },
    ],
  },
];
