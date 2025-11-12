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

export interface PartInfo {
  _id: string;
  part_name?: string;
  name?: string; // Backend có thể dùng "name" thay vì "part_name"
  part_number?: string;
  description?: string;
}

export interface CenterInfo {
  _id: string;
  name?: string;
  center_name?: string; // Backend có thể dùng "center_name"
  address?: string;
  phone?: string;
}

export interface InventoryItem {
  _id: string;
  quantity_avaiable: number;
  minimum_stock?: number;
  last_restocked?: string;
  cost_per_unit?: number;
  center_id: string | CenterInfo;
  part_id: string | PartInfo;
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

export interface GetInventoryResponse {
  message: string;
  success: boolean;
  data: {
    items: InventoryItem[];
    pagination: PaginationData;
  };
}

export interface GetInventoryDetailResponse {
  message: string;
  success: boolean;
  data: InventoryItem;
}

export interface CreateInventoryPayload {
  quantity_avaiable: number;
  minimum_stock?: number;
  cost_per_unit?: number;
  center_id: string;
  part_id: string;
}

export interface UpdateInventoryPayload {
  quantity_avaiable?: number;
  minimum_stock?: number;
  cost_per_unit?: number;
  last_restocked?: string;
}

export async function getInventoryApi(params: {
  page?: number;
  limit?: number;
  center_id?: string;
  part_name?: string;
  low_stock?: boolean;
} = {}): Promise<ApiResult<GetInventoryResponse>> {
  const { page = 1, limit = 10, center_id, part_name, low_stock } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (center_id) qs.set("center_id", center_id);
  if (part_name && part_name.trim()) qs.set("part_name", part_name.trim());
  if (low_stock !== undefined) qs.set("low_stock", String(low_stock));

  const response = await fetch(`${BASE_URL}/api/inventory?${qs.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse<GetInventoryResponse>(response);
}

export async function getInventoryByIdApi(
  id: string
): Promise<ApiResult<GetInventoryDetailResponse>> {
  const response = await fetch(`${BASE_URL}/api/inventory/${id}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse<GetInventoryDetailResponse>(response);
}

export async function createInventoryApi(
  payload: CreateInventoryPayload
): Promise<ApiResult<GetInventoryDetailResponse>> {
  const response = await fetch(`${BASE_URL}/api/inventory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<GetInventoryDetailResponse>(response);
}

export async function updateInventoryApi(
  id: string,
  payload: UpdateInventoryPayload
): Promise<ApiResult<GetInventoryDetailResponse>> {
  const response = await fetch(`${BASE_URL}/api/inventory/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<GetInventoryDetailResponse>(response);
}

export async function deleteInventoryApi(
  id: string
): Promise<
  ApiResult<{
    message: string;
    success: boolean;
    data?: { inventory_id: string; appointment_id: string; center_id: string };
  }>
> {
  const response = await fetch(`${BASE_URL}/api/inventory/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}
