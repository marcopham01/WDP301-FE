import { config } from "@/config/config";

const BASE_URL = config.API_BASE_URL;

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
    message:
      ((data as unknown as Record<string, unknown>)?.message as string) ||
      ((data as unknown as Record<string, unknown>)?.error as string) ||
      undefined,
  } as ApiResult<T>;
}

export interface PartItem {
  _id: string;
  part_number?: string;
  part_name: string;
  description?: string;
  supplier?: string;
  warranty_month?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationData {
  current_page: number;
  limit: number;
  skip?: number;
  total_items: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface GetPartsResponse {
  message: string;
  success: boolean;
  data: {
    items: PartItem[];
    pagination: PaginationData;
  };
}

export interface GetPartDetailResponse {
  message: string;
  success: boolean;
  data: PartItem;
}

export interface CreatePartPayload {
  part_number?: string;
  part_name: string;
  description?: string;
  supplier?: string;
  warranty_month?: number;
}

export interface UpdatePartPayload {
  part_number?: string;
  part_name?: string;
  description?: string;
  supplier?: string;
  warranty_month?: number;
}

export async function getPartsApi(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<ApiResult<GetPartsResponse>> {
  const { page = 1, limit = 10, search } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search && search.trim()) qs.set("search", search.trim());

  const response = await fetch(`${BASE_URL}/api/parts?${qs.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse<GetPartsResponse>(response);
}

export async function getPartByIdApi(id: string): Promise<ApiResult<GetPartDetailResponse>> {
  const response = await fetch(`${BASE_URL}/api/parts/${id}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse<GetPartDetailResponse>(response);
}

export async function createPartApi(payload: CreatePartPayload): Promise<ApiResult<GetPartDetailResponse>> {
  const response = await fetch(`${BASE_URL}/api/parts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<GetPartDetailResponse>(response);
}

export async function updatePartApi(id: string, payload: UpdatePartPayload): Promise<ApiResult<GetPartDetailResponse>> {
  const response = await fetch(`${BASE_URL}/api/parts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<GetPartDetailResponse>(response);
}

export async function deletePartApi(id: string): Promise<ApiResult<{ message: string; success: boolean; data?: { part_id: string; inventory_id: string; center_id: string } }>> {
  const response = await fetch(`${BASE_URL}/api/parts/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}
