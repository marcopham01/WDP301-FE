import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown, ChevronUp, Package, FileText, Wrench, Loader2, AlertCircle } from "lucide-react";
import { getChecklistSuggestionsApi, ChecklistSuggestionsResponse } from "@/lib/aiApi";
import { toast } from "react-toastify";

interface AIChecklistSuggestionsProps {
  issueTypeId: string;
  vehicleId?: string;
  centerId?: string;
  onApplySolution?: (solution: string) => void;
  onApplyDescription?: (description: string) => void;
  onApplyParts?: (parts: Array<{ part_id: string; quantity: number }>) => void;
}

export function AIChecklistSuggestions({
  issueTypeId,
  vehicleId,
  centerId,
  onApplySolution,
  onApplyDescription,
  onApplyParts,
}: AIChecklistSuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [suggestions, setSuggestions] = useState<ChecklistSuggestionsResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!issueTypeId) {
      setSuggestions(null);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getChecklistSuggestionsApi({
          issue_type_id: issueTypeId,
          vehicle_id: vehicleId,
          center_id: centerId,
        });

        if (res.success && res.data?.data) {
          setSuggestions(res.data.data);
          if (res.data.data.summary.total_similar_cases > 0) {
            toast.success(`Tìm thấy ${res.data.data.summary.total_similar_cases} trường hợp tương tự để tham khảo`);
          } else {
            toast.info("Chưa có dữ liệu lịch sử cho loại vấn đề này");
          }
        } else {
          setError(res.message || "Không thể tải gợi ý AI");
        }
      } catch (e) {
        console.error("Fetch AI suggestions error", e);
        setError("Lỗi khi tải gợi ý AI");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [issueTypeId, vehicleId, centerId]);

  if (!issueTypeId) return null;

  if (loading) {
    return (
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Đang tải gợi ý AI từ lịch sử sửa chữa...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.summary.total_similar_cases === 0) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4" />
            <span>Chưa có dữ liệu lịch sử cho loại vấn đề này. Vui lòng điền thông tin thủ công.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-blue-50/50 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-sm">Gợi ý AI dựa trên {suggestions.summary.total_similar_cases} trường hợp tương tự</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="space-y-3">
            {/* Solution Suggestions */}
            {suggestions.solution_suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Wrench className="h-3 w-3" />
                  Giải pháp phổ biến:
                </div>
                <div className="space-y-2">
                  {suggestions.solution_suggestions.map((sol, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-white rounded border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm">{sol.solution}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {sol.frequency} lần
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {sol.confidence.toFixed(0)}% tin cậy
                          </Badge>
                        </div>
                      </div>
                      {onApplySolution && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApplySolution(sol.solution)}
                          className="h-7 text-xs"
                        >
                          Áp dụng
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description Suggestions */}
            {suggestions.description_suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Mô tả thường dùng:
                </div>
                <div className="space-y-2">
                  {suggestions.description_suggestions.map((desc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-white rounded border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm line-clamp-2">{desc.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {desc.frequency} lần
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {desc.confidence.toFixed(0)}% tin cậy
                          </Badge>
                        </div>
                      </div>
                      {onApplyDescription && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApplyDescription(desc.description)}
                          className="h-7 text-xs"
                        >
                          Áp dụng
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parts Recommendations */}
            {suggestions.part_recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Package className="h-3 w-3" />
                  Phụ tùng khuyến nghị:
                </div>
                <div className="space-y-2">
                  {suggestions.part_recommendations.slice(0, 5).map((part, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-white rounded border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{part.part_name}</p>
                        {part.part_number && (
                          <p className="text-xs text-muted-foreground">Mã: {part.part_number}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            SL: {part.recommended_quantity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {part.confidence_score.toFixed(0)}% tin cậy
                          </Badge>
                          {part.availability && (
                            <Badge
                              className={`text-xs ${
                                part.availability.is_available
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {part.availability.is_available ? "Còn hàng" : "Hết hàng"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {onApplyParts && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onApplyParts([
                              { part_id: part.part_id, quantity: part.recommended_quantity },
                            ])
                          }
                          className="h-7 text-xs"
                        >
                          Thêm
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most recent success reference */}
            {suggestions.most_recent_success && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-medium text-blue-900 mb-1">📋 Lần sửa gần nhất (tham khảo):</p>
                <p className="text-xs text-blue-800">
                  <strong>Giải pháp:</strong> {suggestions.most_recent_success.solution || "N/A"}
                </p>
                {suggestions.most_recent_success.parts && suggestions.most_recent_success.parts.length > 0 && (
                  <p className="text-xs text-blue-800 mt-1">
                    <strong>Phụ tùng:</strong>{" "}
                    {suggestions.most_recent_success.parts
                      .map((p) => `${p.part_name} (${p.quantity})`)
                      .join(", ")}
                  </p>
                )}
                {suggestions.most_recent_success.total_cost && (
                  <p className="text-xs text-blue-800 mt-1">
                    <strong>Chi phí:</strong> {suggestions.most_recent_success.total_cost.toLocaleString("vi-VN")} VNĐ
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
