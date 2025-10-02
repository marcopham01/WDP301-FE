import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Plus, Calendar, Bell, Settings, LogOut} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProfileApi } from "@/lib/authApi";


const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ fullName?: string; email?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const res = await getProfileApi();
      if (res.ok && res.data?.user) {
        setUser({
          fullName: res.data.user.fullName || res.data.user.full_name || res.data.user.name,
          email: res.data.user.email,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]"
    >
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-ev-green to-ev-blue bg-clip-text text-transparent">
              EV Service
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user ? `Chào ${user.fullName || user.email}` : "Không tìm thấy thông tin người dùng"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login") /* giả lập sign out */}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard khách hàng
          </h1>
          <p className="text-muted-foreground">
            Quản lý xe và lịch bảo dưỡng của bạn
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="hero" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/customer/vehicles/add')}
          >
            <Plus className="h-6 w-6" />
            Thêm xe mới
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/customer/booking')}
          >
            <Calendar className="h-6 w-6" />
            Đặt lịch bảo dưỡng
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/reminders')}
          >
            <Bell className="h-6 w-6" />
            Nhắc nhở
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/customer/profile')}
          >
            <Settings className="h-6 w-6" />
            Cài đặt
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicles Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Xe của bạn (0)
              </CardTitle>
              <CardDescription>
                Quản lý thông tin và lịch bảo dưỡng xe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Chưa có xe nào được đăng ký
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/customer/vehicles/add')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm xe đầu tiên
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lịch bảo dưỡng gần đây
              </CardTitle>
              <CardDescription>
                Theo dõi trạng thái các lịch hẹn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Chưa có lịch bảo dưỡng nào
                </p>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/booking')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Đặt lịch đầu tiên
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  </motion.div>
  );
};

export default CustomerDashboard;
