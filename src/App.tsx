import React from "react";
import { Toaster as ToasterUI } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
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
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ProfilePage from "./pages/customer/ProfilePage";
import AddVehiclePage from "./pages/customer/AddVehiclePage";
import VehiclesPage from "./pages/customer/VehiclesPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BookingPage from "./pages/customer/BookingPage";
import StaffDashboard from "./pages/dashboard/staff/StaffDashboard";
import ServiceManagement from "./pages/dashboard/admin/ServiceManagement";
import ServiceCenterManagement from "./pages/dashboard/admin/ServiceCenterManagement";
import AdminOverview from "./pages/dashboard/admin/AdminOverview";
import WorkingHoursManagement from "./pages/dashboard/admin/WorkingHoursManagement";
import { TechnicianDashboard } from "./pages/dashboard/tech/TechnicianDashboard";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
        <Route path="/dashboard/admin/service-center/:centerId/working-hours"   element={<WorkingHoursManagement /> }  />
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
        }
      />
      {/* Các route con của admin đã được lồng bên trong /dashboard/admin */}
    
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
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
        path="/customer/booking"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/technician"
        element={
          <TechnicianDashboard
            user={{ name: "Technician", role: "technician" }}
            onLogout={() => {}}
          />
        }
      />
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
