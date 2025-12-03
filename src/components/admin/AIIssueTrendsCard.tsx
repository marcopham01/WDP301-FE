// src/components/admin/AIIssueTrendsCard.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { analyzeIssueTrendsApi, IssueTrend } from "@/lib/aiApi";

interface AIIssueTrendsCardProps {
  centerId?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  battery: "Pin",
  motor: "Động cơ",
  charging: "Sạc điện",
  brake: "Phanh",
  cooling: "Làm mát",
  electrical: "Điện",
  software: "Phần mềm",
  mechanical: "Cơ khí",
  suspension: "Hệ thống treo",
  tire: "Lốp xe",
  other: "Khác",
};

const SEVERITY_LABELS: Record<string, string> = {
  minor: "Nhỏ",
  moderate: "Trung bình",
  major: "Lớn",
  critical: "Nghiêm trọng",
};

const AIIssueTrendsCard = ({ centerId }: AIIssueTrendsCardProps) => {
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<IssueTrend[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const res = await analyzeIssueTrendsApi({
        center_id: centerId,
        days: 90,
      });

      if (res.success && res.data?.data) {
        setTrends(res.data.data.trends || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải xu hướng sự cố");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTrends();
  }, [centerId]);

  const topTrends = trends.slice(0, 5);
  const highFrequencyCount = trends.filter(
    (t) => t.trend_indicator === "high"
  ).length;

  const getTrendColor = (indicator: string) => {
    switch (indicator) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-orange-600 bg-orange-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <>
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">AI Phân tích xu hướng sự cố</CardTitle>
            </div>
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-gray-500">Đang phân tích...</div>
          ) : trends.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Chưa có đủ dữ liệu để phân tích
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {trends.length}
                  </div>
                  <div className="text-xs text-gray-600">Loại sự cố</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">
                    {highFrequencyCount}
                  </div>
                  <div className="text-xs text-gray-600">Tần suất cao</div>
                </div>
              </div>

              {/* Top Trends */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">
                  Top 5 sự cố phổ biến (90 ngày):
                </h4>
                {topTrends.map((trend, idx) => (
                  <div
                    key={trend.issue_type_id}
                    className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-medium text-sm">
                          {CATEGORY_LABELS[trend.category] || trend.category}
                        </div>
                        <div className="text-xs text-gray-500">
                          {SEVERITY_LABELS[trend.severity] || trend.severity}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{trend.frequency}x</div>
                      <Badge
                        className={`text-xs ${getTrendColor(
                          trend.trend_indicator
                        )}`}
                        variant="outline"
                      >
                        {trend.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {highFrequencyCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-800">
                    <span className="font-semibold">Cảnh báo:</span> Có{" "}
                    {highFrequencyCount} loại sự cố xuất hiện với tần suất cao. Cân
                    nhắc tăng cường dự trữ phụ tùng liên quan.
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowDetails(true)}
              >
                Xem chi tiết phân tích
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Phân tích chi tiết xu hướng sự cố (90 ngày)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {trends.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Không có dữ liệu</p>
            ) : (
              trends.map((trend, idx) => (
                <Card key={trend.issue_type_id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-300">
                          #{idx + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold">
                            {CATEGORY_LABELS[trend.category] || trend.category}
                          </h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {SEVERITY_LABELS[trend.severity] || trend.severity}
                            </Badge>
                            <Badge
                              className={`text-xs ${getTrendColor(
                                trend.trend_indicator
                              )}`}
                              variant="outline"
                            >
                              {trend.trend_indicator === "high"
                                ? "Tần suất cao"
                                : trend.trend_indicator === "medium"
                                ? "Tần suất TB"
                                : "Tần suất thấp"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {trend.frequency}
                        </div>
                        <div className="text-sm text-gray-500">
                          ({trend.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">
                          Chi phí TB:
                        </span>{" "}
                        <span className="font-semibold">
                          {trend.avg_cost.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Tổng chi phí:
                        </span>{" "}
                        <span className="font-semibold">
                          {trend.total_cost.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                    </div>

                    {trend.affected_vehicle_models.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          Xe bị ảnh hưởng nhiều nhất:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {trend.affected_vehicle_models
                            .slice(0, 5)
                            .map((model, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                Model {model.model_id.slice(-4)}: {model.occurrence_count}x
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIIssueTrendsCard;
