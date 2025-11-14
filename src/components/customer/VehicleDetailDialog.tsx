import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@/lib/vehicleApi";
import {
  Calendar,
  Palette,
  Zap,
  Battery,
  Gauge,
  Edit,
} from "lucide-react";
import logo from "@/assets/logo.png";

interface VehicleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onEdit: () => void;
}

export function VehicleDetailDialog({
  open,
  onOpenChange,
  vehicle,
  onEdit,
}: VehicleDetailDialogProps) {
  if (!vehicle) return null;

  const getModelLabel = (v: Vehicle) => {
    const m = v.model_id as unknown;
    if (m && typeof m === "object" && m !== null) {
      const model = m as { brand?: string; model_name?: string };
      const label = `${model.brand ?? ""} ${model.model_name ?? ""}`.trim();
      return label || "Model";
    }
    return "Model";
  };

  const model = vehicle.model_id as unknown;
  const modelData =
    model && typeof model === "object" && model !== null
      ? (model as {
          brand?: string;
          model_name?: string;
          battery_type?: string;
          year?: number;
        })
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        {" "}
        {/* Trắng, border xám, shadow nhẹ */}
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border-2 border-ev-green">
                {" "}
                {/* ev-green, bo góc vừa */}
                <img src={logo} alt="Logo" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {getModelLabel(vehicle)}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-sm border-gray-300 rounded-md px-2 py-1"
                  >
                    {" "}
                    {/* Xám nhạt */}
                    {vehicle.license_plate}
                  </Badge>
                  {modelData?.year && (
                    <Badge className="bg-ev-green text-white rounded-md px-2 py-1">
                      {" "}
                      {/* ev-green */}
                      {modelData.year}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 mt-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              {" "}
              {/* Xám nhạt */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-ev-green" />
                <div className="text-xs text-gray-600 uppercase font-semibold">
                  Năm sản xuất
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {modelData?.year ||
                  (vehicle.purchase_date
                    ? new Date(vehicle.purchase_date).getFullYear()
                    : "2025")}
              </div>
            </div>

            {/* Color */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-ev-green" />
                <div className="text-xs text-gray-600 uppercase font-semibold">
                  Màu xe
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900 capitalize">
                {vehicle.color || "Chưa cập nhật"}
              </div>
            </div>

            {/* Battery Type */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-ev-green" />
                <div className="text-xs text-gray-600 uppercase font-semibold">
                  Loại pin
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {modelData?.battery_type || "Lithium-ion"}
              </div>
            </div>

            {/* Battery Health */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="w-4 h-4 text-ev-green" />
                <div className="text-xs text-gray-600 uppercase font-semibold">
                  Pin (kWh)
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {vehicle.battery_health || "92"}
              </div>
            </div>

            {/* Current Mileage */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-ev-green" />
                <div className="text-xs text-gray-600 uppercase font-semibold">
                  Số km hiện tại
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {vehicle.current_miliage
                  ? `${vehicle.current_miliage.toLocaleString()} km`
                  : "Chưa cập nhật"}
              </div>
            </div>

            {/* Last Service */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-ev-green" />
                <div className="text-xs text-gray-600 uppercase font-semibold">
                  Km bảo dưỡng cuối
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {vehicle.last_service_mileage
                  ? `${vehicle.last_service_mileage.toLocaleString()} km`
                  : "Chưa cập nhật"}
              </div>
            </div>
          </div>

          {/* Purchase Date */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-ev-green" />
              <div className="text-xs text-gray-600 uppercase font-semibold">
                Ngày mua
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {vehicle.purchase_date
                ? new Date(vehicle.purchase_date).toLocaleDateString("vi-VN")
                : "Chưa cập nhật"}
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            className="flex-1 bg-ev-green hover:bg-ev-green/90 text-white font-semibold rounded-md shadow-md hover:shadow-lg transition-shadow" // ev-green
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
