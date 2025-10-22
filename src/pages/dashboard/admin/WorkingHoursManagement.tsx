import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ServiceCenter, 
  WorkingHour,
  getServiceCentersApi,
  createServiceCenterScheduleApi
} from "@/lib/serviceCenterApi";

const DAYS_OF_WEEK = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật"
];

const DAY_KEYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const WorkingHoursManagement = () => {
  const { centerId } = useParams<{ centerId: string }>();
  const [serviceCenter, setServiceCenter] = useState<ServiceCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  
  // Đã chuyển sang dùng toast của sonner
  const navigate = useNavigate();

  useEffect(() => {
    if (centerId) {
      loadServiceCenter(centerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerId]);

  const loadServiceCenter = async (id: string) => {
    setLoading(true);
    try {
      // Get all service centers and find the one we need
      const response = await getServiceCentersApi();
      if (response.ok && response.data?.data) {
        const center = response.data.data.find(c => c._id === id);
        if (center) {
          setServiceCenter(center);
          
          // Initialize working hours if not available
          if (center.working_hours && center.working_hours.length > 0) {
            setWorkingHours(center.working_hours);
          } else {
            // Create default working hours for all days
            const defaultHours = DAY_KEYS.map((day, index) => ({
              day_of_week: day,
              open_time: "08:00",
              close_time: "17:00",
              is_close: index >= 5 // Weekend days are closed by default
            }));
            setWorkingHours(defaultHours);
          }
        } else {
          toast.error("Không tìm thấy trung tâm dịch vụ");
          navigate("/dashboard/admin/service-centers");
        }
      } else {
        toast.error("Không thể tải thông tin trung tâm dịch vụ. " + (response.message || ""));
        navigate("/dashboard/admin/service-centers");
      }
    } catch (error) {
      console.error("Error loading service center:", error);
      toast.error("Đã xảy ra lỗi khi tải thông tin trung tâm dịch vụ.");
      navigate("/dashboard/admin/service-centers");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (index: number, field: 'open_time' | 'close_time', value: string) => {
    const updatedHours = [...workingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value
    };
    setWorkingHours(updatedHours);
  };

  const handleIsClosedChange = (index: number, value: boolean) => {
    const updatedHours = [...workingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      is_close: value
    };
    setWorkingHours(updatedHours);
  };

  const handleSaveWorkingHours = async () => {
    if (!centerId || !serviceCenter) return;
    
    setSaving(true);
    try {
      // Backend chỉ có API tạo schedule, nên tạo từng ngày
      let successCount = 0;
      const errorMessages: string[] = [];
      
      for (const hours of workingHours) {
        if (!hours.is_close && hours.open_time && hours.close_time) {
          const response = await createServiceCenterScheduleApi(centerId, {
            day_of_week: hours.day_of_week,
            open_time: hours.open_time,
            close_time: hours.close_time,
            is_close: false
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorMessages.push(`${hours.day_of_week}: ${response.message || 'Lỗi không xác định'}`);
          }
        }
      }
      
      if (successCount > 0) {
        toast.success(`Đã tạo lịch làm việc cho ${successCount} ngày`);
        // Reload to get updated data
        loadServiceCenter(centerId);
      }
      
      if (errorMessages.length > 0) {
        toast.error("Một số lỗi xảy ra: " + errorMessages.join(', '));
      }
    } catch (error) {
      console.error("Error saving working hours:", error);
      toast.error("Đã xảy ra lỗi khi lưu giờ làm việc.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Giờ làm việc</h1>
          <p className="text-muted-foreground">
            {serviceCenter?.center_name} - {serviceCenter?.address}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/admin/service-centers")}>
            Quay lại
          </Button>
          <Button onClick={handleSaveWorkingHours} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch làm việc trong tuần</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workingHours.map((hours, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                  <Label>{DAYS_OF_WEEK[index]}</Label>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    value={hours.open_time || ""}
                    onChange={(e) => handleTimeChange(index, 'open_time', e.target.value)}
                    disabled={hours.is_close}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    value={hours.close_time || ""}
                    onChange={(e) => handleTimeChange(index, 'close_time', e.target.value)}
                    disabled={hours.is_close}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`is_closed_${index}`}
                    checked={hours.is_close === true}
                    onChange={(e) => handleIsClosedChange(index, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={`is_closed_${index}`}>Đóng cửa</Label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingHoursManagement;
