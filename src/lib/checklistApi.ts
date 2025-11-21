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
      (data as Record<string, unknown>)?.message as string ||
      (data as Record<string, unknown>)?.error as string ||
      undefined,
  } as ApiResult<T>;
}

// Kho phụ tùng
export interface IssueType {
  _id: string;
  category: string;
  severity: string;
}

export interface GetIssueTypesResponse {
  success: boolean;
  data: {
    items: IssueType[];
  };
}

export async function getIssueTypesApi(): Promise<ApiResult<GetIssueTypesResponse>> {
  const response = await fetch(`${BASE_URL}/api/issue-types`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export async function getIssueTypeByIdApi(issueTypeId: string): Promise<ApiResult<{ success: boolean; data: IssueType }>> {
  const response = await fetch(`${BASE_URL}/api/issue-types/${encodeURIComponent(issueTypeId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

// Parts
export interface PartItem {
  _id: string;
  part_number?: string;
  part_name?: string;
  description?: string;
  unit_price?: number;
}

export interface GetPartsResponse {
  success: boolean;
  data: {
    items: PartItem[];
    pagination?: unknown;
  };
}

export async function getPartsApi(params: { page?: number; limit?: number; search?: string } = {}): Promise<ApiResult<GetPartsResponse>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  const url = q.toString() ? `${BASE_URL}/api/parts?${q.toString()}` : `${BASE_URL}/api/parts`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export async function getPartByIdApi(partId: string): Promise<ApiResult<{ success: boolean; data: PartItem }>> {
  const response = await fetch(`${BASE_URL}/api/parts/${encodeURIComponent(partId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

// Inventory (for parts availability and pricing)
export interface InventoryItem {
  _id: string;
  quantity_available: number;
  minimum_stock?: number;
  last_restocked?: string;
  cost_per_unit?: number;
  center_id?: {
    _id: string;
    center_name?: string;
    address?: string;
    phone?: string;
  };
  part_id?: {
    _id: string;
    part_number?: string;
    part_name?: string;
    description?: string;
    warranty_month?: number;
  };
}

export interface GetInventoryResponse {
  success: boolean;
  data: {
    items: InventoryItem[];
  };
}

export async function getInventoryApi(params: { page?: number; limit?: number; center_id?: string; part_name?: string; low_stock?: string } = {}): Promise<ApiResult<GetInventoryResponse>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.center_id) q.set("center_id", params.center_id);
  if (params.part_name) q.set("part_name", params.part_name);
  if (params.low_stock) q.set("low_stock", params.low_stock);
  const url = q.toString() ? `${BASE_URL}/api/inventory?${q.toString()}` : `${BASE_URL}/api/inventory`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export interface UpdateInventoryPayload {
  quantity_avaiable?: number;
  minimum_stock?: number;
  cost_per_unit?: number;
  last_restocked?: string;
}

export async function updateInventoryApi(
  inventoryId: string,
  payload: UpdateInventoryPayload
): Promise<ApiResult<{ success: boolean; message?: string }>> {
  const response = await fetch(`${BASE_URL}/api/inventory/${encodeURIComponent(inventoryId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

// Checklists
export interface ChecklistPart {
  part_id: string;
  quantity: number;
}

export interface Checklist {
  _id: string;
  appointment_id: string;
  issue_type_id: string;
  issue_description?: string;
  solution_applied?: string;
  parts: ChecklistPart[];
  status?: string; // pending | accepted | canceled | completed
  createdAt?: string;
}

export interface GetChecklistsResponse {
  success: boolean;
  data: {
    items: Checklist[];
    pagination?: unknown;
  };
}

export async function getChecklistsApi(params: { page?: number; limit?: number; status?: string } = {}): Promise<ApiResult<GetChecklistsResponse>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.status) q.set("status", params.status);
  const url = q.toString() ? `${BASE_URL}/api/checklist?${q.toString()}` : `${BASE_URL}/api/checklist`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export async function acceptChecklistApi(checklistId: string): Promise<ApiResult<{ success: boolean }>> {
  const response = await fetch(`${BASE_URL}/api/checklist/${encodeURIComponent(checklistId)}/accept`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export async function cancelChecklistApi(checklistId: string, note?: string): Promise<ApiResult<{ success: boolean }>> {
  const response = await fetch(`${BASE_URL}/api/checklist/${encodeURIComponent(checklistId)}/cancel`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ note }),
  });
  return parseResponse(response);
}

// Create Checklist
export interface CreateChecklistPayload {
  appointment_id: string;
  issue_type_id: string;
  issue_description: string;
  solution_applied: string;
  parts: Array<{ part_id: string; quantity: number }>;
}

export interface CreateChecklistResponse {
  success: boolean;
  data: {
    _id: string;
  };
  message?: string;
}

export async function createChecklistApi(payload: CreateChecklistPayload): Promise<ApiResult<CreateChecklistResponse>> {
  const response = await fetch(`${BASE_URL}/api/checklist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

// Create Checkin
export interface CreateCheckinPayload {
  appointment_id: string;
  initial_vehicle_condition: string;
}

export interface CreateCheckinResponse {
  success: boolean;
  message: string;
  data: {
    appointment: {
      _id: string;
      status: string;
      initial_vehicle_condition: string;
      checkin_datetime: string;
      checkin_by: unknown;
    };
  };
}

export async function createCheckinApi(payload: CreateCheckinPayload): Promise<ApiResult<CreateCheckinResponse>> {
  const response = await fetch(`${BASE_URL}/api/checklist/checkin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}


