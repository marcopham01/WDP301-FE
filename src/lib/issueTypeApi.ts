// lib/issueTypeApi.ts
import config from "@/config/config";

const API_BASE_URL = config.API_BASE_URL;

export type IssueCategory =
  | "battery"
  | "motor"
  | "charging"
  | "brake"
  | "cooling"
  | "electrical"
  | "software"
  | "mechanical"
  | "suspension"
  | "tire"
  | "other";

export type IssueSeverity = "minor" | "moderate" | "major" | "critical";

export interface IssueType {
  _id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  createdAt: string;
  updatedAt: string;
}

export interface IssueTypePagination {
  page: number;
  limit: number;
  total_pages: number;
  total_items: number;
  skip: number;
}

export interface GetIssueTypesParams {
  page?: number;
  limit?: number;
  category?: IssueCategory;
  severity?: IssueSeverity;
}

export interface CreateIssueTypePayload {
  category: IssueCategory;
  severity: IssueSeverity;
}

export interface UpdateIssueTypePayload {
  category?: IssueCategory;
  severity?: IssueSeverity;
}

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data?: T | null;
  message?: string;
}

function getAuthHeader() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
  let data: T | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return {
    ok: response.ok,
    status: response.status,
    data,
    message: (data as { message?: string })?.message,
  };
}

export const getIssueTypesApi = async (
  params: GetIssueTypesParams = {}
): Promise<ApiResult<{ data: { items: IssueType[]; pagination: IssueTypePagination } }>> => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.category) query.append("category", params.category);
    if (params.severity) query.append("severity", params.severity);

    const response = await fetch(
      `${API_BASE_URL}/api/issue-types?${query.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    return parseResponse(response);
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Lỗi khi lấy danh sách Kho phụ tùng",
    };
  }
};

export const getIssueTypeByIdApi = async (
  issueTypeId: string
): Promise<ApiResult<{ data: IssueType }>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/issue-types/${issueTypeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    return parseResponse(response);
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Lỗi khi lấy thông tin issue type",
    };
  }
};

export const createIssueTypeApi = async (
  payload: CreateIssueTypePayload
): Promise<ApiResult<{ data: IssueType }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/issue-types`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    return parseResponse(response);
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Lỗi khi tạo issue type",
    };
  }
};

export const updateIssueTypeApi = async (
  issueTypeId: string,
  payload: UpdateIssueTypePayload
): Promise<ApiResult<{ data: IssueType }>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/issue-types/${issueTypeId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      }
    );

    return parseResponse(response);
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Lỗi khi cập nhật issue type",
    };
  }
};

export const deleteIssueTypeApi = async (
  issueTypeId: string
): Promise<ApiResult<null>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/issue-types/${issueTypeId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    return parseResponse(response);
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Lỗi khi xóa issue type",
    };
  }
};
