import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getProfileApi } from "@/lib/authApi";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Pencil, 
  Lock, 
  Shield, 
  Camera,
  Save,
  X,
  Settings
} from "lucide-react";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { toast } from "react-toastify";

interface UserProfile {
  id?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  phone_number?: string;
  createdAt?: string;
  created_at?: string;
  // add other fields as needed
}

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const res = await getProfileApi();
      if (res.ok && res.data?.user) {
        setUser(res.data.user);
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="mb-4 text-lg text-red-500">Không tìm thấy thông tin người dùng</p>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  const handleLogout = () => {
    // Handle logout logic here - clear user from context and token
    localStorage.removeItem('accessToken');
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-ev-green-light via-green-50/30 to-teal-50/20"
    >
      {/* Main Header */}
      <Header onLogout={handleLogout} />

      {/* Hero Section with Cover */}
      <div className="relative mt-16">
        {/* Cover Image */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-ev-green via-teal-500 to-emerald-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHptLTYgMGMwIDYuNjMtNS4zNyAxMi0xMiAxMnMtMTItNS4zNy0xMi0xMiA1LjM3LTEyIDEyLTEyIDEyIDUuMzcgMTIgMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Profile Card Overlay */}
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative -mt-20 md:-mt-24 max-w-6xl mx-auto">
            <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Avatar Section */}
                  <div className="relative group">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-ev-green to-teal-500 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white relative overflow-hidden">
                      <span className="text-white text-5xl md:text-6xl font-bold">
                        {(user.fullName || user.full_name || user.name || user.email || "U").charAt(0).toUpperCase()}
                      </span>
                      
                      {/* Hover overlay for changing avatar */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute -bottom-2 -right-2">
                      <Badge className="bg-green-500 text-white border-4 border-white shadow-lg px-3 py-1">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>

                  {/* User Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                          {user.fullName || user.full_name || user.name || "Người dùng"}
                        </h1>
                        <p className="text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          @{user.email?.split('@')[0] || 'username'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Cài đặt
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-ev-green to-teal-500 hover:from-green-700 hover:to-teal-600 text-white gap-2"
                          onClick={() => setEditMode(!editMode)}
                        >
                          {editMode ? (
                            <>
                              <X className="w-4 h-4" />
                              Hủy
                            </>
                          ) : (
                            <>
                              <Pencil className="w-4 h-4" />
                              Chỉnh sửa
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Stats Cards - Only showing relevant info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Tham gia</span>
                          </div>
                          <p className="text-sm font-bold text-blue-900">
                            {new Date(user.createdAt || user.created_at || Date.now()).toLocaleDateString('vi-VN')}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Vai trò</span>
                          </div>
                          <p className="text-sm font-bold text-green-900">Khách hàng</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5 text-ev-green" />
                  Thông tin liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.phoneNumber || user.phone_number || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>


                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-ev-green" />
                  Hành động nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-green-50 hover:text-ev-green hover:border-ev-green">
                  <Lock className="w-4 h-4" />
                  Đổi mật khẩu
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-green-50 hover:text-ev-green hover:border-ev-green">
                  <Shield className="w-4 h-4" />
                  Bảo mật tài khoản
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Edit Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-green-50/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-6 h-6 text-ev-green" />
                  Thông tin chi tiết
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Cập nhật thông tin cá nhân của bạn
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Thông tin cá nhân
                  </h3>
                  <Separator className="mb-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                        Tên đăng nhập
                        <Badge variant="secondary" className="text-xs">Không thể thay đổi</Badge>
                      </Label>
                      <Input
                        id="username"
                        value={user.email?.split('@')[0] || ''}
                        disabled
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Họ và tên <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        value={editMode ? (editData?.fullName || editData?.full_name || editData?.name || '') : (user.fullName || user.full_name || user.name || '')}
                        onChange={(e) => setEditData((prev: UserProfile | null) => ({ ...prev, fullName: e.target.value }))}
                        disabled={!editMode}
                        className={!editMode ? "bg-gray-50 border-gray-200" : "border-ev-green focus:ring-ev-green"}
                        placeholder="Nhập họ và tên đầy đủ"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Số điện thoại
                      </Label>
                      <Input
                        id="phone"
                        value={user.phoneNumber || user.phone_number || ''}
                        disabled={!editMode}
                        className={!editMode ? "bg-gray-50 border-gray-200" : "border-ev-green focus:ring-ev-green"}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>
                </div>



                {/* Action Buttons */}
                {editMode && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className="flex-1 gap-2"
                    >
                      <X className="w-4 h-4" />
                      Hủy bỏ
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-ev-green to-teal-500 hover:from-green-700 hover:to-teal-600 text-white gap-2 shadow-lg"
                      onClick={() => {
                        setUser(editData);
                        setEditMode(false);
                        toast.success("Cập nhật thông tin thành công!");
                      }}
                    >
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </Button>
                  </div>
                )}

                {!editMode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Thông tin của bạn được bảo mật
                        </p>
                        <p className="text-xs text-blue-700">
                          Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo chính sách bảo mật nghiêm ngặt.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </motion.div>
  );
};

export default ProfilePage;
