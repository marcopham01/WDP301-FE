export interface ApiResult<T = any> {
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
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return {
    ok: response.ok,
    status: response.status,
    data,
    message: data?.message || data?.error || undefined,
  } as ApiResult<T>;
}

export interface WorkingHour {
  day_of_week: string;
  open_time?: string;
  close_time?: string;
  is_close?: boolean;
}

export interface ServiceCenter {
  _id: string;
  center_name: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
  working_hours?: WorkingHour[];
}

// GET /api/service-center/get
export async function getServiceCentersApi(): Promise<ApiResult<{ success: boolean; data: ServiceCenter[] }>> {
  const response = await fetch("/api/service-center/get", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}
