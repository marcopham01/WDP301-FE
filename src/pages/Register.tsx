import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "../components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Checkbox } from "../components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

import { toast } from "react-toastify";
import { registerApi } from "@/lib/authApi";


interface RegisterFormData {
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await registerApi({
        username: data.username,
        password: data.password,
        email: data.email,
        phoneNumber: data.phoneNumber,
        fullName: data.fullName,
      });
      if (response.ok) {
        toast.success("Đăng ký thành công! Bạn có thể đăng nhập ngay để sử dụng dịch vụ.");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        // Nếu API trả về lỗi từng trường (fieldErrors dạng [{ field: 'username', message: '...' }])
        if (Array.isArray(response.data?.fieldErrors)) {
          response.data.fieldErrors.forEach((err: { field: string; message: string }) => {
            form.setError(err.field as keyof RegisterFormData, { type: "server", message: err.message });
          });
        }
        // Nếu có lỗi tổng quát thì vẫn hiện toast
        const errorMsg = response.message || response.data?.message || "Vui lòng kiểm tra lại thông tin hoặc thử lại sau.";
        toast.error("Đăng ký thất bại. " + errorMsg);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Đăng ký thất bại. " + (error instanceof Error ? error.message : "Có lỗi xảy ra khi đăng ký"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 relative overflow-hidden">
      {/* Hiệu ứng nền mây */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute w-full h-full bg-gradient-to-br from-blue-100 via-white to-blue-200 opacity-80" />
        <div className="absolute inset-0 bg-[url('/src/assets/bg-register.jpg')] bg-cover bg-center opacity-30" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Create Account</h2>
        <p className="text-center text-gray-500 text-sm mb-4">Join us for professional EV care services</p>
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
                  message: "Username chỉ chứa chữ cái và số, không có ký tự đặc biệt hoặc khoảng trắng",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập username"
                      {...field}
                      className="transition-smooth"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              rules={{
                required: "Họ và tên là bắt buộc",
                minLength: {
                  value: 4,
                  message: "Họ và tên phải có ít nhất 4 ký tự",
                },
                pattern: {
                  value: /^[a-zA-ZÀ-ỹ\s]+$/,
                  message: "Họ và tên chỉ chứa chữ cái và khoảng trắng",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập họ và tên"
                      {...field}
                      className="transition-smooth"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              rules={{
                required: "Email là bắt buộc",
                pattern: {
                  value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                  message: "Email không hợp lệ",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Nhập email của bạn"
                      {...field}
                      className="transition-smooth"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              rules={{
                required: "Số điện thoại là bắt buộc",
                pattern: {
                  value: /^0\d{9,10}$/,
                  message: "Số điện thoại phải bắt đầu bằng 0 và có 10-11 số",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      {...field}
                      className="transition-smooth"
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
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
                  message: "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
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
                        onClick={() => setShowPassword(!showPassword)}
                      >
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
            <FormField
              control={form.control}
              name="confirmPassword"
              rules={{
                required: "Xác nhận mật khẩu là bắt buộc",
                validate: (value) =>
                  value === form.getValues("password") || "Mật khẩu xác nhận không khớp",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        {...field}
                        className="transition-smooth pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
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
            <FormField
              control={form.control}
              name="agreeToTerms"
              rules={{
                required: "Bạn phải đồng ý với điều khoản sử dụng",
              }}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Tôi đồng ý với{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Điều khoản sử dụng
                      </Link>{" "}
                      và{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Chính sách bảo mật
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full gradient-primary shadow-glow transition-smooth"
              disabled={isLoading}
            >
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>
        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>&copy; 2024 EV Care Connect. Tất cả quyền được bảo lưu.</p>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
