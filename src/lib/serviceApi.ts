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

export interface ServiceType {
  _id: string;
  service_name: string;
  description?: string;
  base_price?: number;
  estimated_duration?: string; // hours or text
  is_active?: boolean;
}

// GET /api/service/get -> active services (requires auth)
export async function getActiveServicesApi(): Promise<ApiResult<{ success: boolean; data: ServiceType[] }>> {
  const response = await fetch("/api/service/get", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}
