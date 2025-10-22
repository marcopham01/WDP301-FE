import { useEffect, useState } from "react";
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
import { toast } from "react-toastify";
import { VehicleModel, getVehicleModelsApi, createVehicleApi } from "@/lib/vehicleApi";

const vehicleSchema = z.object({
  model_id: z.string().min(1, "Vui lòng chọn model"),
  license_plate: z.string().min(3, "Biển số không hợp lệ"),
  color: z.string().min(1, "Vui lòng chọn màu xe"),
  purchase_date: z.string().optional(), // YYYY-MM-DD
  current_miliage: z
    .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().min(0).optional()),
  battery_health: z
    .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().min(0).max(100).optional()),
  last_service_mileage: z
    .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().min(0).optional()),
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
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  const form = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      model_id: "",
      license_plate: "",
      color: "",
      purchase_date: "",
      current_miliage: undefined,
      battery_health: undefined,
      last_service_mileage: undefined,
    },
  });

  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true);
      const res = await getVehicleModelsApi();
      if (res.ok && res.data?.data) {
        setModels(res.data.data);
      } else {
        toast.error("Không tải được danh sách model. " + (res.message || "Vui lòng thử lại"));
      }
      setLoadingModels(false);
    };
    loadModels();
  }, []);

  const onSubmit = async (values: VehicleForm) => {
    setLoading(true);
    const res = await createVehicleApi({
      license_plate: values.license_plate,
      color: values.color,
      purchase_date: values.purchase_date || undefined,
      current_miliage: values.current_miliage,
      battery_health: values.battery_health,
      last_service_mileage: values.last_service_mileage,
      model_id: values.model_id,
    });

    if (res.ok) {
  toast.success("Thêm xe thành công");
      navigate("/");
    } else {
  toast.error(res.message || "Không thể thêm xe");
    }
    setLoading(false);
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
            onClick={() => navigate("/")}
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
                    <Label htmlFor="model_id">Model *</Label>
                    <Select
                      value={form.watch("model_id")}
                      onValueChange={(value) => form.setValue("model_id", value, { shouldValidate: true })}
                      disabled={loadingModels}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingModels ? "Đang tải model..." : "Chọn model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m._id} value={m._id}>
                            {`${m.brand ?? ""} ${m.model_name ?? ""}`.trim()} {m.year ? `(${m.year})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.model_id && (
                      <p className="text-sm text-destructive">{form.formState.errors.model_id.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">Biển số *</Label>
                    <Input
                      id="license_plate"
                      placeholder="VD: 79A1-56789"
                      {...form.register("license_plate")}
                    />
                    {form.formState.errors.license_plate && (
                      <p className="text-sm text-destructive">{form.formState.errors.license_plate.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Màu xe *</Label>
                    <Select
                      value={form.watch("color")}
                      onValueChange={(value) => form.setValue("color", value, { shouldValidate: true })}
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
                      <p className="text-sm text-destructive">{form.formState.errors.color.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Ngày mua</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      {...form.register("purchase_date")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_miliage">Số km hiện tại</Label>
                    <Input
                      id="current_miliage"
                      type="number"
                      placeholder="0"
                      {...form.register("current_miliage")}
                    />
                    {form.formState.errors.current_miliage && (
                      <p className="text-sm text-destructive">{form.formState.errors.current_miliage.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="battery_health">Tình trạng pin (%)</Label>
                    <Input
                      id="battery_health"
                      type="number"
                      placeholder="100"
                      {...form.register("battery_health")}
                    />
                    {form.formState.errors.battery_health && (
                      <p className="text-sm text-destructive">{form.formState.errors.battery_health.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_service_mileage">Số km lần bảo dưỡng gần nhất</Label>
                    <Input
                      id="last_service_mileage"
                      type="number"
                      placeholder="0"
                      {...form.register("last_service_mileage")}
                    />
                    {form.formState.errors.last_service_mileage && (
                      <p className="text-sm text-destructive">{form.formState.errors.last_service_mileage.message}</p>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Lưu ý:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Biển số và model là bắt buộc</li>
                    <li>• Số km hiện tại sẽ được sử dụng để tính toán lịch bảo dưỡng</li>
                    <li>• Có thể bổ sung tình trạng pin và mốc bảo dưỡng gần nhất để gợi ý chính xác hơn</li>
                  </ul>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
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
