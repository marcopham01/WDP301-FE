// src/components/admin/AIPartsRecommendation.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, XCircle, Package } from "lucide-react";
import { toast } from "react-toastify";
import { recommendPartsForIssueApi, PartRecommendation } from "@/lib/aiApi";

interface AIPartsRecommendationProps {
  issueTypeId: string;
  vehicleId?: string;
  centerId?: string;
  onSelectPart?: (part: PartRecommendation) => void;
  className?: string;
}

const AIPartsRecommendation = ({
  issueTypeId,
  vehicleId,
  centerId,
  onSelectPart,
  className = "",
}: AIPartsRecommendationProps) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PartRecommendation[]>([]);
  const [totalCases, setTotalCases] = useState(0);

  const loadRecommendations = async () => {
    if (!issueTypeId) return;

    setLoading(true);
    try {
      const res = await recommendPartsForIssueApi({
        issue_type_id: issueTypeId,
        vehicle_id: vehicleId,
        center_id: centerId,
      });

      if (res.success && res.data?.data) {
        setRecommendations(res.data.data.recommendations || []);
        setTotalCases(res.data.data.summary.total_similar_cases);
      } else {
        setRecommendations([]);
        setTotalCases(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải gợi ý phụ tùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecommendations();
  }, [issueTypeId, vehicleId, centerId]);

  if (loading) {
    return (
      <Card className={`border-2 border-purple-200 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center py-4 text-gray-500">
            <Sparkles className="h-6 w-6 animate-pulse mx-auto mb-2 text-purple-600" />
            AI đang phân tích...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className={`border-2 border-gray-200 ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gray-400" />
            <CardTitle className="text-sm">AI Gợi ý phụ tùng</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-sm">
            Chưa có đủ dữ liệu lịch sử để gợi ý
          </div>
        </CardContent>
      </Card>
    );
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-orange-600 bg-orange-50";
  };

  return (
    <Card className={`border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-sm">AI Gợi ý phụ tùng</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalCases} trường hợp tương tự
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recommendations.map((rec) => (
            <div
              key={rec.part_id}
              className="bg-white rounded-lg p-3 shadow-sm border border-purple-100 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{rec.part_name}</h4>
                    <Badge
                      className={`text-xs ${getConfidenceColor(
                        rec.confidence_score
                      )}`}
                      variant="outline"
                    >
                      {rec.confidence_score.toFixed(0)}% tin cậy
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Mã:</span> {rec.part_number || "N/A"}
                  </div>
                  {rec.description && (
                    <div className="text-xs text-gray-600 mt-1">
                      {rec.description}
                    </div>
                  )}
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-bold text-purple-600">
                    x{rec.recommended_quantity}
                  </div>
                  <div className="text-xs text-gray-500">đề xuất</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>
                    <span className="font-medium">Giá:</span>{" "}
                    {rec.sell_price?.toLocaleString("vi-VN") || "N/A"} VNĐ
                  </span>
                  <span>•</span>
                  <span>
                    <span className="font-medium">Sử dụng:</span> {rec.usage_frequency}x
                  </span>
                </div>

                {rec.availability && (
                  <div className="flex items-center gap-1">
                    {rec.availability.is_available ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">
                          Có sẵn ({rec.availability.quantity_available})
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-red-600 font-medium">
                          Hết hàng
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {onSelectPart && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => onSelectPart(rec)}
                >
                  <Package className="h-3 w-3 mr-1" />
                  Thêm vào checklist
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="text-xs text-gray-500 text-center">
            💡 Gợi ý dựa trên {totalCases} trường hợp tương tự trong quá khứ
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIPartsRecommendation;
