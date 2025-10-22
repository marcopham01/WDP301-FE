import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { getProfileApi } from "@/lib/authApi";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar, Pencil, Lock } from "lucide-react";
import Header from "@/components/MainLayout/Header";
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
    <div className="min-h-screen bg-gray-50">
      {/* Main Header */}
      <Header onLogout={handleLogout} />

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white mt-16">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold">Thông tin cá nhân</h1>
              <p className="text-blue-100 text-sm mt-1">Quản lý và cập nhật thông tin tài khoản của bạn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardContent className="p-3">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-lg font-bold">
                      {(user.fullName || user.full_name || user.name || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* User Info */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {user.fullName || user.full_name || user.name || "Người dùng"}
                  </h3>
                  <p className="text-gray-600 text-xs mb-2">@{user.email?.split('@')[0] || 'username'}</p>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full text-xs py-1.5">
                    Khách hàng
                  </Button>

                  {/* Contact Info */}
                  <div className="mt-3 space-y-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-700 text-xs">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-700 text-xs">{user.phoneNumber || user.phone_number || "Chưa cập nhật"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-700 text-xs">
                        Tham gia: {new Date(user.createdAt || user.created_at || Date.now()).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Forms */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    Thông tin chi tiết
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5">
                      <Lock className="w-3 h-3 mr-1" />
                      Đổi mật khẩu
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5"
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      {editMode ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* Username and Full Name in one row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="username" className="text-sm">Tên đăng nhập</Label>
                    <Input
                      id="username"
                      value={user.email?.split('@')[0] || ''}
                      disabled
                      className="bg-gray-50 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-sm">Họ và tên</Label>
                    <Input
                      id="fullName"
                      value={editMode ? (editData?.fullName || editData?.full_name || editData?.name || '') : (user.fullName || user.full_name || user.name || '')}
                      onChange={(e) => setEditData((prev: UserProfile | null) => ({ ...prev, fullName: e.target.value }))}
                      disabled={!editMode}
                      className={`h-9 text-sm ${!editMode ? "bg-gray-50" : ""}`}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-sm">Địa chỉ</Label>
                  <Textarea
                    id="address"
                    placeholder="Nhập địa chỉ của bạn..."
                    className="min-h-[80px] text-sm"
                    disabled={!editMode}
                  />
                </div>

                

                {/* Action Buttons */}
                {editMode && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                      onClick={() => {
                        setUser(editData);
                        setEditMode(false);
                      }}
                    >
                      Lưu thay đổi
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
