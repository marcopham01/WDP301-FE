import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "../components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Checkbox } from "../components/ui/checkbox";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { FcAutomotive } from "react-icons/fc";


interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration logic
      console.log("Register data:", data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Redirect to login after successful registration
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
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
      {/* Nút back home */}
      <div className="absolute top-6 left-6 z-20">
        <Button
          variant="outline"
          className="flex items-center gap-2 shadow-lg px-4 py-2 rounded-full bg-white/90 hover:bg-white border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-xl backdrop-blur-sm"
          onClick={() => navigate("/")}
        >
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
          className="rounded-2xl bg-white/80 shadow-2xl backdrop-blur-lg border border-gray-100 px-8 py-10 space-y-6"
        >
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Create Account</h2>
          <p className="text-center text-gray-500 text-sm mb-4">Join us for professional EV care services</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  rules={{
                    required: "Tên là bắt buộc",
                    minLength: {
                      value: 2,
                      message: "Tên phải có ít nhất 2 ký tự",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tên"
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
                  name="lastName"
                  rules={{
                    required: "Họ là bắt buộc",
                    minLength: {
                      value: 2,
                      message: "Họ phải có ít nhất 2 ký tự",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập họ"
                          {...field}
                          className="transition-smooth"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email là bắt buộc",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
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
                name="phone"
                rules={{
                  required: "Số điện thoại là bắt buộc",
                    pattern: {
                      value: /^\d{10,11}$/,
                      message: "Số điện thoại không hợp lệ",
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
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số",
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
    </div>
  );
};

export default Register;
