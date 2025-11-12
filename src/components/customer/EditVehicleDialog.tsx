import { useState, useEffect } from "react";
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
import { Car, Save, Loader2, X, CalendarIcon } from "lucide-react"; // Thêm CalendarIcon
import { toast } from "react-toastify";
import {
  Vehicle,
  updateVehicleApi,
  UpdateVehiclePayload,
} from "@/lib/vehicleApi";
import { format } from "date-fns"; // Thêm import format từ date-fns để format date

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

interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onSuccess: () => void;
}

export function EditVehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
}: EditVehicleDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateVehiclePayload>({
    color: "",
    current_miliage: 0,
    battery_health: 0,
    last_service_mileage: 0,
    purchase_date: "",
  });

  useEffect(() => {
    if (vehicle && open) {
      setFormData({
        color: vehicle.color || "",
        current_miliage: vehicle.current_miliage || 0,
        battery_health: vehicle.battery_health || 0,
        last_service_mileage: vehicle.last_service_mileage || 0,
        purchase_date: vehicle.purchase_date
          ? new Date(vehicle.purchase_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [vehicle, open]);

  const getModelLabel = (v: Vehicle) => {
    const m = v.model_id as unknown;
    if (m && typeof m === "object" && m !== null) {
      const model = m as { brand?: string; model_name?: string };
      const label = `${model.brand ?? ""} ${model.model_name ?? ""}`.trim();
      return label || "Model";
    }
    return "Model";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    setSaving(true);
    const res = await updateVehicleApi(vehicle._id, formData);

    if (res.ok) {
      toast.success("Cập nhật thành công. Thông tin xe đã được cập nhật.");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(res.message || "Không thể cập nhật xe");
    }
    setSaving(false);
  };

  const handleInputChange = (
    field: keyof UpdateVehiclePayload,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-ev-green rounded-lg flex items-center justify-center shadow-sm">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Chỉnh sửa xe
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Cập nhật thông tin xe {vehicle.license_plate} -{" "}
                {getModelLabel(vehicle)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="license_plate"
                className="text-sm font-semibold text-gray-700"
              >
                Biển số xe
              </Label>
              <Input
                id="license_plate"
                value={vehicle.license_plate}
                disabled
                className="bg-gray-100 cursor-not-allowed border-gray-300"
              />
              <p className="text-xs text-gray-500">
                Không thể chỉnh sửa biển số xe
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="color"
                className="text-sm font-semibold text-gray-700"
              >
                Màu sắc
              </Label>
              <Select
                value={formData.color || ""}
                onValueChange={(value) => handleInputChange("color", value)}
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
            </div>

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
                value={formData.current_miliage || ""}
                onChange={(e) =>
                  handleInputChange("current_miliage", Number(e.target.value))
                }
                placeholder="Nhập số km hiện tại"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="battery_health"
                className="text-sm font-semibold text-gray-700"
              >
                Tình trạng pin (%)
              </Label>
              <Input
                id="battery_health"
                type="number"
                min="0"
                max="100"
                value={formData.battery_health || ""}
                onChange={(e) =>
                  handleInputChange("battery_health", Number(e.target.value))
                }
                placeholder="Nhập % pin"
                className="border-gray-300"
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
                value={formData.last_service_mileage || ""}
                onChange={(e) =>
                  handleInputChange(
                    "last_service_mileage",
                    Number(e.target.value)
                  )
                }
                placeholder="Nhập km bảo dưỡng cuối"
                className="border-gray-300"
              />
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
                    {formData.purchase_date
                      ? format(new Date(formData.purchase_date), "dd/MM/yyyy")
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.purchase_date
                        ? new Date(formData.purchase_date)
                        : undefined
                    }
                    onSelect={(date) =>
                      handleInputChange(
                        "purchase_date",
                        date ? format(date, "yyyy-MM-dd") : "" // Fix: Dùng format để giữ ngày local
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
            <h3 className="font-semibold text-gray-900 mb-2">💡 Mẹo:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • Cập nhật số km thường xuyên để hệ thống gợi ý bảo dưỡng chính
                xác
              </li>
              <li>• Tình trạng pin giúp theo dõi sức khỏe xe tốt hơn</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="flex-1 border-gray-300 hover:bg-gray-50 transition-colors rounded-md"
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-ev-green hover:bg-ev-green/90 text-white font-semibold rounded-md shadow-md hover:shadow-lg transition-shadow"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
