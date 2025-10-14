import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProfileApi } from "@/lib/authApi";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar, ArrowLeft, Pencil } from "lucide-react";
import { motion } from "framer-motion";

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] px-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <Button variant="ghost" className="mb-8 self-start flex items-center gap-2 text-base" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
          <span>Quay lại</span>
        </Button>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="w-full"
        >
          <Card className="w-full max-w-xl shadow-2xl border-0 bg-white/90 rounded-2xl p-0">
            <CardHeader className="flex flex-col items-center gap-2 bg-gradient-to-r from-ev-green/80 to-ev-blue/80 rounded-t-2xl pb-8 pt-8 relative">
              <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center mb-2 border-4 border-ev-green/60">
                <User className="w-14 h-14 text-ev-green" />
              </div>
              {!editMode && (
                <Button size="icon" variant="outline" className="absolute top-4 right-4 rounded-full border-ev-green/40 shadow hover:bg-ev-green/10 transition" title="Chỉnh sửa thông tin" onClick={() => { setEditMode(true); setEditData({ ...user }); }}>
                  <Pencil className="w-5 h-5 text-ev-green" />
                </Button>
              )}
              <CardTitle className="text-2xl font-bold text-gray-900 text-center">
                {editMode ? (
                  <input
                    className="bg-white/80 border border-gray-200 rounded px-3 py-1 text-center font-bold text-lg focus:outline-ev-green"
                    value={editData?.fullName || editData?.full_name || editData?.name || ''}
                    onChange={e => setEditData((prev: UserProfile | null) => ({ ...prev, fullName: e.target.value }))}
                  />
                ) : (
                  user.fullName || user.full_name || user.name || "-"
                )}
              </CardTitle>
              <CardDescription className="text-base text-gray-700 text-center">
                Khách hàng EV Service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 py-8">
              <div className="flex items-center gap-3 text-lg">
                <Mail className="h-5 w-5 text-ev-blue" />
                <span className="font-medium min-w-[120px]">Email:</span>
                {editMode ? (
                  <input
                    className="bg-white/80 border border-gray-200 rounded px-3 py-1 text-gray-800 w-full max-w-xs focus:outline-ev-green"
                    value={editData?.email || ''}
                    onChange={e => setEditData((prev: UserProfile | null) => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <span className="text-gray-800">{user.email || "-"}</span>
                )}
              </div>
              {(user.phoneNumber || user.phone_number || editMode) && (
                <div className="flex items-center gap-3 text-lg">
                  <Phone className="h-5 w-5 text-ev-blue" />
                  <span className="font-medium min-w-[120px]">Số điện thoại:</span>
                  {editMode ? (
                    <input
                      className="bg-white/80 border border-gray-200 rounded px-3 py-1 text-gray-800 w-full max-w-xs focus:outline-ev-green"
                      value={editData?.phoneNumber || editData?.phone_number || ''}
                      onChange={e => setEditData((prev: UserProfile | null) => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  ) : (
                    <span className="text-gray-800">{user.phoneNumber || user.phone_number}</span>
                  )}
                </div>
              )}
              {(user.createdAt || user.created_at) && (
                <div className="flex items-center gap-3 text-lg">
                  <Calendar className="h-5 w-5 text-ev-blue" />
                  <span className="font-medium min-w-[120px]">Ngày tạo tài khoản:</span>
                  <span className="text-gray-800">{new Date(user.createdAt || user.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              {editMode && (
                <div className="flex gap-4 pt-4 justify-end">
                  <Button variant="outline" onClick={() => setEditMode(false)}>Hủy</Button>
                  <Button variant="ev-primary" onClick={() => { setUser(editData); setEditMode(false); }}>Lưu</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
