import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Thêm import Popover
import { Calendar } from "@/components/ui/calendar"; // Thêm import Calendar
import { Car, Loader2, Plus, CalendarIcon } from "lucide-react"; // Thêm CalendarIcon
import { toast } from "react-toastify";
import {
  VehicleModel,
  getVehicleModelsApi,
  createVehicleApi,
} from "@/lib/vehicleApi";
import { format } from "date-fns"; // Thêm import format từ date-fns

const vehicleSchema = z.object({
  model_id: z.string().min(1, "Vui lòng chọn model"),
  license_plate: z.string().min(3, "Biển số không hợp lệ"),
  color: z.string().min(1, "Vui lòng chọn màu xe"),
  purchase_date: z.string().optional(),
  current_miliage: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(0).optional()
  ),
  battery_health: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(0).max(100).optional()
  ),
  last_service_mileage: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(0).optional()
  ),
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

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddVehicleDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddVehicleDialogProps) {
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
    if (open) {
      loadModels();
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadModels = async () => {
    setLoadingModels(true);
    const res = await getVehicleModelsApi();
    if (res.ok && res.data?.data) {
      setModels(res.data.data);
    } else {
      toast.error(
        "Không tải được danh sách model. " + (res.message || "Vui lòng thử lại")
      );
    }
    setLoadingModels(false);
  };

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
      toast.success(
        "Thêm xe thành công. Xe đã được thêm vào danh sách của bạn"
      );
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(res.message || "Không thể thêm xe");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        {" "}
        {/* Trắng, border xám, shadow nhẹ */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-ev-green rounded-lg flex items-center justify-center shadow-sm">
              {" "}
              {/* ev-green, bo góc vừa */}
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Thêm xe mới
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Nhập thông tin chi tiết về xe điện của bạn
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="model_id"
                className="text-sm font-semibold text-gray-700"
              >
                Model *
              </Label>
              <Select
                value={form.watch("model_id")}
                onValueChange={(value) =>
                  form.setValue("model_id", value, { shouldValidate: true })
                }
                disabled={loadingModels}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue
                    placeholder={
                      loadingModels ? "Đang tải model..." : "Chọn model"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {`${m.brand ?? ""} ${m.model_name ?? ""}`.trim()}{" "}
                      {m.year ? `(${m.year})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.model_id && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.model_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="license_plate"
                className="text-sm font-semibold text-gray-700"
              >
                Biển số *
              </Label>
              <Input
                id="license_plate"
                placeholder="VD: 51G-123.45"
                className="border-gray-300"
                {...form.register("license_plate")}
              />
              {form.formState.errors.license_plate && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.license_plate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="color"
                className="text-sm font-semibold text-gray-700"
              >
                Màu xe *
              </Label>
              <Select
                value={form.watch("color")}
                onValueChange={(value) =>
                  form.setValue("color", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="border-gray-300">
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
                <p className="text-sm text-red-600">
                  {form.formState.errors.color.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="purchase_date"
                className="text-sm font-semibold text-gray-700"
              >
                Ngày mua
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("purchase_date")
                      ? format(
                          new Date(form.watch("purchase_date")),
                          "dd/MM/yyyy"
                        )
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      form.watch("purchase_date")
                        ? new Date(form.watch("purchase_date"))
                        : undefined
                    }
                    onSelect={(date) =>
                      form.setValue(
                        "purchase_date",
                        date ? format(date, "yyyy-MM-dd") : "" // Fix timezone
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="current_miliage"
                className="text-sm font-semibold text-gray-700"
              >
                Số km hiện tại
              </Label>
              <Input
                id="current_miliage"
                type="number"
                placeholder="0"
                className="border-gray-300"
                {...form.register("current_miliage")}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="battery_health"
                className="text-sm font-semibold text-gray-700"
              >
                Pin (%)
              </Label>
              <Input
                id="battery_health"
                type="number"
                placeholder="100"
                min="0"
                max="100"
                className="border-gray-300"
                {...form.register("battery_health")}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="last_service_mileage"
                className="text-sm font-semibold text-gray-700"
              >
                Km bảo dưỡng cuối
              </Label>
              <Input
                id="last_service_mileage"
                type="number"
                placeholder="0"
                className="border-gray-300"
                {...form.register("last_service_mileage")}
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
            {" "}
            {/* Xám nhạt */}
            <h3 className="font-semibold text-gray-900 mb-2">💡 Lưu ý:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Biển số và model là bắt buộc</li>
              <li>
                • Số km hiện tại sẽ được sử dụng để tính toán lịch bảo dưỡng
              </li>
              <li>• Có thể bổ sung tình trạng pin để gợi ý chính xác hơn</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-300 hover:bg-gray-50 transition-colors rounded-md"
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-ev-green hover:bg-ev-green/90 text-white font-semibold rounded-md shadow-md hover:shadow-lg transition-shadow" // ev-green
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm xe
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
