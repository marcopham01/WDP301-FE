import React from "react";
import { Toaster as ToasterUI } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext/useAuth";
import Index from "./pages/index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AdminDashboard } from "./pages/dashboard/admin/AdminDashboard";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ProfilePage from "./pages/customer/ProfilePage";
import AddVehiclePage from "./pages/customer/AddVehiclePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BookingPage from "./pages/customer/BookingPage";
import StaffDashboard from "./pages/dashboard/staff/StaffDashboard";
import ServiceManagement from "./pages/dashboard/staff/ServiceManagement";
import ServiceCenterManagement from "./pages/dashboard/staff/ServiceCenterManagement";
import WorkingHoursManagement from "./pages/dashboard/staff/WorkingHoursManagement";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    navigate("/login");
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
          <AdminDashboard
            user={{ name: "Admin", role: "admin" }}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/dashboard/staff"
        element={
          <StaffDashboard
            user={{ name: "Staff", role: "staff" }}
            onLogout={handleLogout}
          />
        }
      />
      {/* Thêm routes mới cho quản lý dịch vụ và trung tâm dịch vụ */}
      <Route 
        path="/dashboard/staff/services" 
        element={<ServiceManagement />} 
      />
      <Route 
        path="/dashboard/staff/service-centers" 
        element={<ServiceCenterManagement />} 
      />
      <Route 
        path="/dashboard/staff/service-center/:centerId/working-hours" 
        element={<WorkingHoursManagement />} 
      />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/customer/profile" element={<ProfilePage />} />
      <Route path="/customer/vehicles/add" element={<AddVehiclePage />} />
      <Route path="/customer/booking" element={<BookingPage />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToasterUI />
      <SonnerToaster />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
