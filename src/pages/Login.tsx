import { motion } from "framer-motion";
import { useState } from "react";
import { auth } from "@/firebase/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "../components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { FcAutomotive } from "react-icons/fc";
import { toast } from "react-toastify";
import { loginApi } from "@/lib/authApi";

interface LoginFormData {
  username: string;
  password: string;
}

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const form = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleToken = await result.user.getIdToken();
      // Gọi API và nhận luôn data
      const response = await fetch("/api/users/loginfirebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: googleToken }),
      });
      if (response.ok) {
        const data = await response.json();
        const accessToken = data.accessToken;
        localStorage.setItem("accessToken", accessToken);
        // Lấy profile user ngay sau khi login
        const profileRes = await fetch("/api/users/getprofile", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const userRole = profileData.user.role;
          setUser({
            id: profileData.user._id || profileData.user.id,
            username: profileData.user.username,
            email: profileData.user.email,
            fullName: profileData.user.fullName,
            role: userRole,
          });
          toast.success("Đăng nhập thành công! Chào mừng bạn quay trở lại.");
          if (userRole === "staff") {
            navigate("/dashboard/staff");
          } else if (userRole === "admin") {
            navigate("/dashboard/admin");
          } else if (userRole === "technician") {
            navigate("/dashboard/technician");
          } else {
            navigate("/");
          }
        } else {
          toast.error("Không thể lấy thông tin người dùng.");
        }
      } else {
        toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await loginApi({
        username: data.username,
        password: data.password,
      });
      if (response.ok) {
        const resData = await response.json();
        localStorage.setItem("accessToken", resData.accessToken); // Lưu token vào localStorage
        // Lấy profile user ngay sau khi login
        const profileRes = await fetch("/api/users/getprofile", {
          headers: { Authorization: `Bearer ${resData.accessToken}` },
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          const userRole = data.user.role;
          setUser({
            id: data.user._id || data.user.id,
            username: data.user.username,
            email: data.user.email,
            fullName: data.user.fullName,
            role: userRole,
          });
          toast.success("Đăng nhập thành công! Chào mừng bạn quay trở lại.");
          setTimeout(() => {
            if (userRole === "staff") {
              navigate("/dashboard/staff");
            } else if (userRole === "admin") {
              navigate("/dashboard/admin");
            } else if (userRole === "technician") {
              navigate("/dashboard/technician");
            } else {
              navigate("/");
            }
          }, 500);
        } else {
          toast.error("Không thể lấy thông tin người dùng.");
        }
      } else {
        toast.error("Đăng nhập thất bại. Sai username hoặc password.");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 relative overflow-hidden">
      {/* Hiệu ứng nền mây */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute w-full h-full bg-gradient-to-br from-blue-100 via-white to-blue-200 opacity-80" />
        <div className="absolute inset-0 bg-[url('/src/assets/bg-login.jpg')] bg-cover bg-center opacity-30" />
      </div>
      {/* Nút back home */}
      <div className="absolute top-6 left-6 z-20">
        <Button
          variant="outline"
          className="flex items-center gap-2 shadow-lg px-4 py-2 rounded-full bg-white/90 hover:bg-white border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-xl backdrop-blur-sm"
          onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Trang chủ</span>
        </Button>
      </div>
      <div className="w-full max-w-md mx-auto z-10">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center mb-4 mt-2 transition-all duration-500 hover:scale-110 hover:rotate-12">
            <FcAutomotive className="w-8 h-8 transition-all duration-500 hover:scale-125 hover:rotate-[360deg]" />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl bg-white/80 shadow-2xl backdrop-blur-lg border border-gray-100 px-8 py-10 space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Sign in with email
          </h2>
          <p className="text-center text-gray-500 text-sm mb-4">
            Delivering professional EV care with the trust and reliability you
            deserve.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                rules={{
                  required: "Username là bắt buộc",
                  minLength: {
                    value: 4,
                    message: "Username phải có ít nhất 4 ký tự",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9]+$/,
                    message:
                      "Username chỉ chứa chữ cái và số, không có ký tự đặc biệt hoặc khoảng trắng",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Username"
                        {...field}
                        className="rounded-lg bg-gray-100/80 border border-gray-200 px-4 py-3 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: "Mật khẩu là bắt buộc",
                  minLength: {
                    value: 8,
                    message: "Mật khẩu phải có ít nhất 8 ký tự",
                  },
                  pattern: {
                    value:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
                    message:
                      "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          {...field}
                          className="transition-smooth pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary shadow-glow transition-smooth"
                disabled={isLoading}>
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 flex items-center justify-center gap-2"
              disabled={isLoading}
              onClick={handleGoogleLogin}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="h-5 w-5"
              />
              <span>
                {isLoading ? "Đang xử lý..." : "Đăng nhập với Google"}
              </span>
            </Button>
            <p className="text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium">
                Đăng ký ngay
              </Link>
            </p>
          </div>
          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>&copy; 2024 EV Care Connect. Tất cả quyền được bảo lưu.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
