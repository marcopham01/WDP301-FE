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
    message: (data as Record<string, unknown>)?.message as string || (data as Record<string, unknown>)?.error as string || undefined,
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

export interface CreateServicePayload {
  service_name: string;
  description?: string;
  base_price?: number;
  estimated_duration?: string;
  is_active?: boolean;
}

export interface UpdateServicePayload {
  service_name?: string;
  description?: string;
  base_price?: number;
  estimated_duration?: string;
  is_active?: boolean;
}

// GET /api/service/get -> lấy danh sách dịch vụ đang hoạt động
export async function getAllServicesApi(): Promise<ApiResult<{ success: boolean; data: ServiceType[] }>> {
  try {
    console.log("Fetching all services");
    const response = await fetch("/api/service/get", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    console.log("Get services response status:", response.status);
    const result = await parseResponse<{ success: boolean; data: ServiceType[] }>(response);
    console.log("Get services parsed result:", result);
    return result;
  } catch (error) {
    console.error("Error in getAllServicesApi:", error);
    return {
      ok: false,
      status: 500,
      data: null,
      message: "Lỗi kết nối đến server: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

// POST /api/service/create -> create new service (requires admin/staff auth)
export async function createServiceApi(payload: CreateServicePayload): Promise<ApiResult<{ success: boolean; data: ServiceType }>> {
  try {
    console.log("Creating service with payload:", payload);
    const response = await fetch("/api/service/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    console.log("Create service response status:", response.status);
    const result = await parseResponse<{ success: boolean; data: ServiceType }>(response);
    console.log("Create service parsed result:", result);
    return result;
  } catch (error) {
    console.error("Error in createServiceApi:", error);
    return {
      ok: false,
      status: 500,
      data: null,
      message: "Lỗi kết nối đến server: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

// PUT /api/service/update/:id -> update service (requires admin/staff auth)
export async function updateServiceApi(id: string, payload: UpdateServicePayload): Promise<ApiResult<{ success: boolean; data: ServiceType }>> {
  const response = await fetch(`/api/service/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

// DELETE /api/service/delete/:id -> delete service (requires admin/staff auth)
export async function deleteServiceApi(id: string): Promise<ApiResult<{ success: boolean }>> {
  const response = await fetch(`/api/service/delete/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}
