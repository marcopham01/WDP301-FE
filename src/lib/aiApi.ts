// src/lib/aiApi.ts
import { config } from "@/config/config";

const BASE_URL = config.API_BASE_URL;

function getAuthHeader() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============= Types =============

export interface PartUsageStatistics {
  total_used_in_period: number;
  usage_frequency: number;
  avg_usage_per_day: number;
  confidence_score: number;
  related_issue_categories: string[];
}

export interface CenterRecommendation {
  center_id: string;
  center_name: string;
  current_stock: number;
  minimum_stock: number;
  predicted_usage: number;
  recommended_order: number;
  needs_restock: boolean;
  urgency: "high" | "medium" | "low";
}

export interface InventoryForecast {
  part_id: string;
  part_name: string;
  part_number: string;
  description: string;
  cost_price?: number;
  sell_price?: number;
  statistics: PartUsageStatistics;
  prediction: {
    forecast_period_days: number;
    predicted_usage: number;
  };
  recommendations: CenterRecommendation[];
}

export interface ForecastSummary {
  total_appointments_analyzed: number;
  total_checklists_analyzed: number;
  total_parts_tracked: number;
  historical_period_days: number;
  forecast_period_days: number;
  high_priority_items: number;
}

export interface ForecastInventoryDemandResponse {
  forecasts: InventoryForecast[];
  summary: ForecastSummary;
}

export interface PartRecommendation {
  part_id: string;
  part_name: string;
  part_number: string;
  description: string;
  cost_price?: number;
  sell_price?: number;
  warranty_months?: number;
  recommended_quantity: number;
  confidence_score: number;
  usage_frequency: number;
  total_cases_analyzed: number;
  availability?: {
    center_name: string;
    quantity_available: number;
    minimum_stock: number;
    is_available: boolean;
  } | null;
}

export interface RecommendPartsResponse {
  issue_type: {
    _id: string;
    category: string;
    severity: string;
  };
  vehicle_info?: {
    model: string;
    year: number;
    current_mileage: number;
  } | null;
  recommendations: PartRecommendation[];
  summary: {
    total_similar_cases: number;
    total_parts_recommended: number;
  };
}

export interface IssueTrend {
  issue_type_id: string;
  category: string;
  severity: string;
  frequency: number;
  percentage: number;
  avg_cost: number;
  total_cost: number;
  affected_vehicle_models: {
    model_id: string;
    occurrence_count: number;
  }[];
  trend_indicator: "high" | "medium" | "low";
}

export interface IssueTrendsResponse {
  trends: IssueTrend[];
  summary: {
    total_appointments_analyzed: number;
    total_checklists_analyzed: number;
    analysis_period_days: number;
    unique_issue_types: number;
    high_frequency_issues: number;
  };
}

export interface InventoryOptimizationSuggestion {
  inventory_id: string;
  part_id: string;
  part_name: string;
  part_number: string;
  center_name: string;
  current_stock: number;
  minimum_stock: number;
  avg_monthly_usage: number;
  total_used_60days: number;
  suggestion_type:
    | "critical_low"
    | "low_stock"
    | "overstock"
    | "no_usage"
    | "optimal";
  message: string;
  recommended_action: string;
  priority: "high" | "medium" | "low";
  estimated_cost_impact?: number | null;
}

export interface OptimizationSummary {
  total_items_analyzed: number;
  total_suggestions: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}

export interface InventoryOptimizationResponse {
  suggestions: InventoryOptimizationSuggestion[];
  summary: OptimizationSummary;
}

export interface ApiResponse<T> {
  message: string;
  success: boolean;
  data?: {
    data: T;
  };
  error?: string;
}

// ============= API Functions =============

/**
 * Dự đoán nhu cầu phụ tùng trong tương lai
 */
export const forecastInventoryDemandApi = async (params: {
  center_id?: string;
  days_ahead?: number;
}): Promise<ApiResponse<ForecastInventoryDemandResponse>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.center_id) queryParams.append("center_id", params.center_id);
    if (params.days_ahead) queryParams.append("days_ahead", params.days_ahead.toString());

    const response = await fetch(
      `${BASE_URL}/api/ai/inventory/forecast${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    const data = await response.json();
    return {
      message: data.message || "Success",
      success: data.success || true,
      data: {
        data: data.data,
      },
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      message: err.response?.data?.message || "Lỗi khi dự đoán nhu cầu phụ tùng",
      success: false,
      error: err.message,
    };
  }
};

/**
 * Gợi ý phụ tùng cho issue type
 */
export const recommendPartsForIssueApi = async (params: {
  issue_type_id: string;
  vehicle_id?: string;
  center_id?: string;
}): Promise<ApiResponse<RecommendPartsResponse>> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("issue_type_id", params.issue_type_id);
    if (params.vehicle_id) queryParams.append("vehicle_id", params.vehicle_id);
    if (params.center_id) queryParams.append("center_id", params.center_id);

    const response = await fetch(
      `${BASE_URL}/api/ai/parts/recommend?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    const data = await response.json();
    return {
      message: data.message || "Success",
      success: data.success || true,
      data: {
        data: data.data,
      },
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      message: err.response?.data?.message || "Lỗi khi gợi ý phụ tùng",
      success: false,
      error: err.message,
    };
  }
};

/**
 * Phân tích xu hướng sự cố
 */
export const analyzeIssueTrendsApi = async (params: {
  center_id?: string;
  days?: number;
  vehicle_model_id?: string;
}): Promise<ApiResponse<IssueTrendsResponse>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.center_id) queryParams.append("center_id", params.center_id);
    if (params.days) queryParams.append("days", params.days.toString());
    if (params.vehicle_model_id) queryParams.append("vehicle_model_id", params.vehicle_model_id);

    const response = await fetch(
      `${BASE_URL}/api/ai/issues/trends${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    const data = await response.json();
    return {
      message: data.message || "Success",
      success: data.success || true,
      data: {
        data: data.data,
      },
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      message:
        err.response?.data?.message || "Lỗi khi phân tích xu hướng sự cố",
      success: false,
      error: err.message,
    };
  }
};

/**
 * Lấy đề xuất tối ưu hóa inventory
 */
export const getInventoryOptimizationSuggestionsApi = async (params: {
  center_id?: string;
}): Promise<ApiResponse<InventoryOptimizationResponse>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.center_id) queryParams.append("center_id", params.center_id);

    const response = await fetch(
      `${BASE_URL}/api/ai/inventory/optimize${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    const data = await response.json();
    return {
      message: data.message || "Success",
      success: data.success || true,
      data: {
        data: data.data,
      },
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      message:
        err.response?.data?.message || "Lỗi khi lấy đề xuất tối ưu hóa",
      success: false,
      error: err.message,
    };
  }
};

/**
 * Get AI suggestions for checklist creation (solutions, descriptions, parts)
 */
export interface ChecklistSuggestionsParams {
  issue_type_id: string;
  vehicle_id?: string;
  center_id?: string;
}

export interface SolutionSuggestion {
  solution: string;
  frequency: number;
  confidence: number;
}

export interface DescriptionSuggestion {
  description: string;
  frequency: number;
  confidence: number;
}

export interface PartRecommendationForChecklist {
  part_id: string;
  part_name: string;
  part_number?: string;
  description?: string;
  cost_price?: number;
  sell_price?: number;
  warranty_months?: number;
  recommended_quantity: number;
  confidence_score: number;
  usage_frequency: number;
  availability?: {
    center_name: string;
    quantity_available: number;
    minimum_stock: number;
    is_available: boolean;
  } | null;
}

export interface ChecklistSuggestionsResponse {
  data: {
    issue_type: {
      _id: string;
      category: string;
      severity?: string;
    };
    vehicle_info?: {
      model?: string;
      brand?: string;
      year?: number;
      current_mileage?: number;
    } | null;
    solution_suggestions: SolutionSuggestion[];
    description_suggestions: DescriptionSuggestion[];
    part_recommendations: PartRecommendationForChecklist[];
    most_recent_success?: {
      solution?: string;
      description?: string;
      parts?: Array<{ part_name?: string; quantity?: number }>;
      total_cost?: number;
      created_at?: string;
    } | null;
    summary: {
      total_similar_cases: number;
      solution_variations: number;
      description_variations: number;
      parts_recommended: number;
    };
  };
}

export const getChecklistSuggestionsApi = async (
  params: ChecklistSuggestionsParams
): Promise<ApiResponse<ChecklistSuggestionsResponse>> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("issue_type_id", params.issue_type_id);
    if (params.vehicle_id) queryParams.append("vehicle_id", params.vehicle_id);
    if (params.center_id) queryParams.append("center_id", params.center_id);

    const response = await fetch(
      `${BASE_URL}/api/ai/checklist/suggestions?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    const data = await response.json();
    return {
      message: data.message || "Success",
      success: data.success || true,
      data: {
        data: data.data,
      },
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      message:
        err.response?.data?.message || "Lỗi khi lấy gợi ý checklist AI",
      success: false,
      error: err.message,
    };
  }
};

