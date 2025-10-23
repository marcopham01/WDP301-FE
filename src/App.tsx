import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AdminDashboard } from "./pages/dashboard/admin/AdminDashboard";
import ProfilePage from "./pages/customer/ProfilePage";
import AddVehiclePage from "./pages/customer/AddVehiclePage";
import VehiclesPage from "./pages/customer/VehiclesPage";
import VehicleDetailPage from "./pages/customer/VehicleDetailPage";
import EditVehiclePage from "./pages/customer/EditVehiclePage";
import ChatPage from "./pages/customer/ChatPage";
import BookingHistoryPage from "./pages/customer/BookingHistoryPage";
import PaymentHistoryPage from "./pages/customer/PaymentHistoryPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BookingPage from "./pages/customer/BookingPage";
import StaffDashboard from "./pages/dashboard/staff/StaffDashboard";
import StaffOverview from "./pages/dashboard/staff/StaffOverview";
import ServiceManagement from "./pages/dashboard/admin/ServiceManagement";
import ServiceCenterManagement from "./pages/dashboard/admin/ServiceCenterManagement";
import AdminOverview from "./pages/dashboard/admin/AdminOverview";
import WorkingHoursManagement from "./pages/dashboard/admin/WorkingHoursManagement";
import VehicleModelManagement from "./pages/dashboard/admin/VehicleModelManagement";
import { TechnicianDashboard } from "./pages/dashboard/tech/TechnicianDashboard";
import { TechnicianOverview } from "./pages/dashboard/tech/TechnicianOverview";
import { TaskDetail } from "./pages/dashboard/tech/TaskDetail";
import PaymentSuccessPage from "@/pages/customer/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/customer/PaymentCancelPage";
import AppointmentManagement from "./pages/dashboard/staff/appointments/AppointmentManagement";
import AppointmentDetail from "./pages/dashboard/staff/appointments/AppointmentDetail";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard
              user={{ name: "Admin", role: "admin" }}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }>
        <Route index element={<AdminOverview />} />
        <Route path="services" element={<ServiceManagement />} />
        <Route path="service-centers" element={<ServiceCenterManagement />} />
        <Route path="vehicle-models" element={<VehicleModelManagement />} />
        <Route
          path="/dashboard/admin/service-center/:centerId/working-hours"
          element={<WorkingHoursManagement />}
        />
      </Route>
      <Route
        path="/dashboard/staff"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffDashboard
              user={{ name: "Staff", role: "staff" }}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }>
        <Route index element={<StaffOverview />} />
        <Route path="appointments" element={<AppointmentManagement />} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
      </Route>
      {/* Các route con của admin đã được lồng bên trong /dashboard/admin */}

      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/vehicles/add"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <AddVehiclePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/vehicles"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <VehiclesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <VehicleDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/vehicles/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <EditVehiclePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/chat"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/booking-history"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <BookingHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/payment-history"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <PaymentHistoryPage />
          </ProtectedRoute>
        }
      />
      {/* Payment result routes (public) */}
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cancel" element={<PaymentCancelPage />} />
      <Route
        path="/dashboard/technician"
        element={
          <ProtectedRoute allowedRoles={["technician"]}>
            <TechnicianDashboard
              user={{ name: "Technician", role: "technician" }}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }>
        <Route index element={<TechnicianOverview />} />
        <Route path="task/:appointmentId" element={<TaskDetail />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
