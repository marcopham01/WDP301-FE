import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "././pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AdminDashboard } from "./pages/dashboard/admin/AdminDashboard";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ProfilePage from "./pages/customer/ProfilePage";
import AddVehiclePage from "./pages/customer/AddVehiclePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BookingPage from "./pages/BookingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
                onLogout={() => {}}
              />
            }
          />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/profile" element={<ProfilePage />} />
          <Route path="/customer/vehicles/add" element={<AddVehiclePage />} />
          <Route path="/customer/booking" element={<BookingPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
