import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Car, Loader2 } from "lucide-react";

const vehicleSchema = z.object({
  model: z.string().min(2, "Tên xe phải có ít nhất 2 ký tự"),
  vin: z.string().min(17, "VIN phải có đúng 17 ký tự").max(17, "VIN phải có đúng 17 ký tự"),
  year: z.number().min(2015, "Năm sản xuất từ 2015 trở lên").max(new Date().getFullYear() + 1),
  color: z.string().min(1, "Vui lòng chọn màu xe"),
  odometer: z.number().min(0, "Số km phải lớn hơn 0"),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

const colors = [
  { value: "white", label: "Trắng" },
  { value: "black", label: "Đen" },
  { value: "silver", label: "Bạc" },
  { value: "red", label: "Đỏ" },
  { value: "blue", label: "Xanh dương" },
  { value: "green", label: "Xanh lá" },
  { value: "gray", label: "Xám" },
  { value: "other", label: "Khác" },
];

const AddVehiclePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      model: "",
      vin: "",
      year: new Date().getFullYear(),
      color: "",
      odometer: 0,
    },
  });

  const onSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/customer");
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]"
    >
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/customer')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Thêm xe mới</span>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Thông tin xe điện
              </CardTitle>
              <CardDescription>
                Nhập thông tin chi tiết về xe điện của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Tên xe/Model *</Label>
                    <Input
                      id="model"
                      placeholder="VD: Tesla Model 3, BYD Tang"
                      {...form.register("model")}
                    />
                    {form.formState.errors.model && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.model.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Năm sản xuất *</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="2024"
                      {...form.register("year", { valueAsNumber: true })}
                    />
                    {form.formState.errors.year && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.year.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (Vehicle Identification Number) *</Label>
                  <Input
                    id="vin"
                    placeholder="17 ký tự VIN"
                    maxLength={17}
                    className="font-mono"
                    {...form.register("vin")}
                    onChange={(e) => {
                      form.setValue("vin", e.target.value.toUpperCase());
                    }}
                  />
                  {form.formState.errors.vin && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.vin.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    VIN có thể tìm thấy trên đăng ký xe hoặc trên khung xe
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Màu xe *</Label>
                    <Select
                      value={form.watch("color")}
                      onValueChange={(value) => form.setValue("color", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn màu xe" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            {color.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.color && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.color.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odometer">Số km hiện tại *</Label>
                    <Input
                      id="odometer"
                      type="number"
                      placeholder="0"
                      {...form.register("odometer", { valueAsNumber: true })}
                    />
                    {form.formState.errors.odometer && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.odometer.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Lưu ý:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• VIN là mã định danh duy nhất của xe, không thể thay đổi sau khi lưu</li>
                    <li>• Số km hiện tại sẽ được sử dụng để tính toán lịch bảo dưỡng</li>
                    <li>• Thông tin này sẽ giúp chúng tôi đưa ra khuyến nghị bảo dưỡng phù hợp</li>
                  </ul>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/customer')}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Thêm xe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
  </motion.div>
  );
};

export default AddVehiclePage;