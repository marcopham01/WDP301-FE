// src/components/admin/AIInventoryInsights.tsx
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Fragment } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Package,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  forecastInventoryDemandApi,
  getInventoryOptimizationSuggestionsApi,
  InventoryForecast,
  InventoryOptimizationSuggestion,
} from "@/lib/aiApi";

interface AIInventoryInsightsProps {
  centerId?: string;
}

const AIInventoryInsights = ({ centerId }: AIInventoryInsightsProps) => {
  const [loading, setLoading] = useState(false);
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  const [suggestions, setSuggestions] = useState<InventoryOptimizationSuggestion[]>([]);
  const [showForecasts, setShowForecasts] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedForecast, setExpandedForecast] = useState<string | null>(null);
  const [daysAhead, setDaysAhead] = useState(30);

  const loadAIInsights = useCallback(async () => {
    setLoading(true);
    try {
      const [forecastRes, optimizeRes] = await Promise.all([
        forecastInventoryDemandApi({ center_id: centerId, days_ahead: daysAhead }),
        getInventoryOptimizationSuggestionsApi({ center_id: centerId }),
      ]);

      if (forecastRes.success && forecastRes.data?.data) {
        setForecasts(forecastRes.data.data.forecasts || []);
      }

      if (optimizeRes.success && optimizeRes.data?.data) {
        setSuggestions(optimizeRes.data.data.suggestions || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải AI insights");
    } finally {
      setLoading(false);
    }
  }, [centerId, daysAhead]);

  useEffect(() => {
    void loadAIInsights();
  }, [loadAIInsights]);

  const highPriorityForecasts = forecasts.filter((f) =>
    f.recommendations.some((r) => r.urgency === "high")
  );

  const highPrioritySuggestions = suggestions.filter((s) => s.priority === "high");

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case "critical_low":
        return "Tồn kho nguy kịch";
      case "low_stock":
        return "Tồn kho thấp";
      case "overstock":
        return "Tồn kho dư thừa";
      case "no_usage":
        return "Không sử dụng";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">AI Insights & Predictions</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAIInsights}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Đang tải..." : "Làm mới"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* High Priority Forecasts */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Ưu tiên cao
                  </span>
                </div>
                <Badge className="bg-red-100 text-red-800">
                  {highPriorityForecasts.length}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Phụ tùng cần đặt hàng ngay
              </p>
            </div>

            {/* Total Tracked Parts */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Phụ tùng theo dõi
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {forecasts.length}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Dự đoán cho {daysAhead} ngày tới
              </p>
            </div>

            {/* Optimization Suggestions */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Đề xuất tối ưu
                  </span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">
                  {highPrioritySuggestions.length}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Cần xử lý ưu tiên cao
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForecasts(true)}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Xem dự đoán chi tiết
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestions(true)}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Xem đề xuất tối ưu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forecasts Dialog */}
      <Dialog open={showForecasts} onOpenChange={setShowForecasts}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Dự đoán nhu cầu phụ tùng ({daysAhead} ngày)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex gap-2 mb-4">
              <Button
                variant={daysAhead === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setDaysAhead(7)}
              >
                7 ngày
              </Button>
              <Button
                variant={daysAhead === 14 ? "default" : "outline"}
                size="sm"
                onClick={() => setDaysAhead(14)}
              >
                14 ngày
              </Button>
              <Button
                variant={daysAhead === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setDaysAhead(30)}
              >
                30 ngày
              </Button>
              <Button
                variant={daysAhead === 60 ? "default" : "outline"}
                size="sm"
                onClick={() => setDaysAhead(60)}
              >
                60 ngày
              </Button>
            </div>

            {forecasts.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                Chưa có dữ liệu dự đoán
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phụ tùng</TableHead>
                    <TableHead>Mã PT</TableHead>
                    <TableHead className="text-right">Dự đoán sử dụng</TableHead>
                    <TableHead className="text-right">Độ tin cậy</TableHead>
                    <TableHead className="text-center">Mức độ</TableHead>
                    <TableHead className="text-center">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecasts.map((forecast) => {
                    const maxUrgency = forecast.recommendations.reduce(
                      (max, r) =>
                        r.urgency === "high"
                          ? "high"
                          : r.urgency === "medium" && max !== "high"
                          ? "medium"
                          : max,
                      "low" as "high" | "medium" | "low"
                    );

                    const isExpanded = expandedForecast === forecast.part_id;

                    return (
                      <Fragment key={forecast.part_id}>
                        <TableRow>
                          <TableCell className="font-medium">
                            {forecast.part_name}
                          </TableCell>
                          <TableCell>{forecast.part_number || "-"}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {forecast.prediction.predicted_usage}
                          </TableCell>
                          <TableCell className="text-right">
                            {forecast.statistics.confidence_score}%
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getUrgencyColor(maxUrgency)}>
                              {maxUrgency === "high"
                                ? "Cao"
                                : maxUrgency === "medium"
                                ? "Trung bình"
                                : "Thấp"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedForecast(
                                  isExpanded ? null : forecast.part_id
                                )
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-gray-50">
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-semibold">
                                      TB sử dụng/ngày:
                                    </span>{" "}
                                    {forecast.statistics.avg_usage_per_day}
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Tần suất:
                                    </span>{" "}
                                    {forecast.statistics.usage_frequency} lần
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Giá bán:
                                    </span>{" "}
                                    {forecast.sell_price?.toLocaleString("vi-VN")} VNĐ
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Liên quan:
                                    </span>{" "}
                                    {forecast.statistics.related_issue_categories.join(
                                      ", "
                                    )}
                                  </div>
                                </div>

                                <div className="border-t pt-3">
                                  <h4 className="font-semibold mb-2">
                                    Khuyến nghị cho từng trung tâm:
                                  </h4>
                                  <div className="space-y-2">
                                    {forecast.recommendations.map((rec) => (
                                      <div
                                        key={`${rec.center_id}-${forecast.part_id}`}
                                        className="flex items-center justify-between bg-white p-3 rounded border"
                                      >
                                        <div>
                                          <div className="font-medium">
                                            {rec.center_name}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            Tồn kho: {rec.current_stock} | Tối thiểu:{" "}
                                            {rec.minimum_stock}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {rec.needs_restock ? (
                                            <div className="text-sm">
                                              <Badge
                                                className={getUrgencyColor(
                                                  rec.urgency
                                                )}
                                              >
                                                Cần đặt: {rec.recommended_order}
                                              </Badge>
                                            </div>
                                          ) : (
                                            <Badge className="bg-green-100 text-green-800">
                                              Đủ tồn kho
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              Đề xuất tối ưu hóa Inventory
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                Không có đề xuất nào. Inventory đang hoạt động tốt! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <Card
                    key={suggestion.inventory_id}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        suggestion.priority === "high"
                          ? "#ef4444"
                          : suggestion.priority === "medium"
                          ? "#f97316"
                          : "#3b82f6",
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {suggestion.part_name}
                            </h3>
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority === "high"
                                ? "Ưu tiên cao"
                                : suggestion.priority === "medium"
                                ? "Trung bình"
                                : "Thấp"}
                            </Badge>
                            <Badge variant="outline">
                              {getSuggestionTypeLabel(suggestion.suggestion_type)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <span className="font-medium">Trung tâm:</span>{" "}
                              {suggestion.center_name}
                            </p>
                            <p>
                              <span className="font-medium">Mã PT:</span>{" "}
                              {suggestion.part_number}
                            </p>
                            <p className="text-orange-600 font-medium mt-2">
                              {suggestion.message}
                            </p>
                            <p className="text-green-700 mt-1">
                              💡 <span className="font-medium">Khuyến nghị:</span>{" "}
                              {suggestion.recommended_action}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="font-medium">Tồn hiện tại:</span>{" "}
                              <span className="text-lg font-bold">
                                {suggestion.current_stock}
                              </span>
                            </p>
                            <p>
                              <span className="font-medium">Tối thiểu:</span>{" "}
                              {suggestion.minimum_stock}
                            </p>
                            <p>
                              <span className="font-medium">TB/tháng:</span>{" "}
                              {suggestion.avg_monthly_usage}
                            </p>
                            {suggestion.estimated_cost_impact && (
                              <p className="text-xs text-gray-500 mt-2">
                                Ảnh hưởng:{" "}
                                {suggestion.estimated_cost_impact.toLocaleString(
                                  "vi-VN"
                                )}{" "}
                                VNĐ
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogClose asChild>
            <Button className="mt-4">Đóng</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIInventoryInsights;
