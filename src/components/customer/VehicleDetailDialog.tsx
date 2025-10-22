import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@/lib/vehicleApi";
import { Car, Calendar, Palette, Zap, Battery, Gauge, Edit } from "lucide-react";

interface VehicleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onEdit: () => void;
}

export function VehicleDetailDialog({ open, onOpenChange, vehicle, onEdit }: VehicleDetailDialogProps) {
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
  const modelData = model && typeof model === "object" && model !== null
    ? (model as { brand?: string; model_name?: string; battery_type?: string; year?: number })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Car className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {getModelLabel(vehicle)}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-sm font-semibold">
                    {vehicle.license_plate}
                  </Badge>
                  {modelData?.year && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900">
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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Năm sản xuất</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {modelData?.year || (vehicle.purchase_date ? new Date(vehicle.purchase_date).getFullYear() : '2025')}
              </div>
            </div>

            {/* Color */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="w-5 h-5 text-purple-600" />
                <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Màu xe</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 capitalize">
                {vehicle.color || 'Chưa cập nhật'}
              </div>
            </div>

            {/* Battery Type */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-green-600" />
                <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Loại pin</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {modelData?.battery_type || 'Lithium-ion'}
              </div>
            </div>

            {/* Battery Health */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-5 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <Battery className="w-5 h-5 text-orange-600" />
                <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Pin (kWh)</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {vehicle.battery_health || '92'}
              </div>
            </div>

            {/* Current Mileage */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-5 rounded-xl border border-cyan-100">
              <div className="flex items-center gap-3 mb-3">
                <Gauge className="w-5 h-5 text-cyan-600" />
                <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Số km hiện tại</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {vehicle.current_miliage ? `${vehicle.current_miliage.toLocaleString()} km` : 'Chưa cập nhật'}
              </div>
            </div>

            {/* Last Service */}
            <div className="bg-gradient-to-br from-rose-50 to-red-50 p-5 rounded-xl border border-rose-100">
              <div className="flex items-center gap-3 mb-3">
                <Gauge className="w-5 h-5 text-rose-600" />
                <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Km bảo dưỡng cuối</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {vehicle.last_service_mileage ? `${vehicle.last_service_mileage.toLocaleString()} km` : 'Chưa cập nhật'}
              </div>
            </div>
          </div>

          {/* Purchase Date */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Ngày mua</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {vehicle.purchase_date ? new Date(vehicle.purchase_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-bold shadow-md"
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
