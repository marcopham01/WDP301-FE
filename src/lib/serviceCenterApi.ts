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
  const result = {
    ok: response.ok,
    status: response.status,
    data,
    message: (data as Record<string, unknown>)?.message as string || (data as Record<string, unknown>)?.error as string || undefined,
  } as ApiResult<T>;
  if (!result.ok) {
    // Surface details for debugging in dev
    console.error("[serviceCenterApi] Error", result.status, result.message, result.data);
  }
  return result;
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
  email?: string;
  is_active?: boolean;
  working_hours?: WorkingHour[];
}

export interface CreateServiceCenterPayload {
  center_name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  working_hours?: WorkingHour[];
}

export interface UpdateServiceCenterPayload {
  center_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

export interface CreateSchedulePayload {
  day_of_week: string;
  open_time: string;
  close_time: string;
  is_close?: boolean;
}

// GET /api/service-center/get - Lấy danh sách tất cả trung tâm và giờ làm việc
export async function getServiceCentersApi(): Promise<ApiResult<{ success: boolean; data: ServiceCenter[] }>> {
  try {
    const response = await fetch("/api/service-center/get", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return parseResponse(response);
  } catch (err: unknown) {
    console.error("[serviceCenterApi] Network error", err);
    return { ok: false, status: 0, data: null, message: String((err as Error)?.message || err) };
  }
}

// POST /api/service-center/create - Tạo trung tâm dịch vụ mới
export async function createServiceCenterApi(payload: CreateServiceCenterPayload): Promise<ApiResult<{ success: boolean; data: ServiceCenter }>> {
  try {
    const response = await fetch("/api/service-center/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  } catch (err: unknown) {
    console.error("[serviceCenterApi] Network error", err);
    return { ok: false, status: 0, data: null, message: String((err as Error)?.message || err) };
  }
}

// POST /api/service-center/schedule/create/:id - Tạo lịch làm việc cho trung tâm
export async function createServiceCenterScheduleApi(centerId: string, payload: CreateSchedulePayload): Promise<ApiResult<{ success: boolean; data: Record<string, unknown> }>> {
  try {
    const response = await fetch(`/api/service-center/schedule/create/${centerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  } catch (err: unknown) {
    console.error("[serviceCenterApi] Network error", err);
    return { ok: false, status: 0, data: null, message: String((err as Error)?.message || err) };
  }
}

// PUT /api/service-center/update/:id - Cập nhật thông tin trung tâm dịch vụ
export async function updateServiceCenterApi(id: string, payload: UpdateServiceCenterPayload): Promise<ApiResult<{ success: boolean; data: ServiceCenter }>> {
  try {
    const response = await fetch(`/api/service-center/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  } catch (err: unknown) {
    console.error("[serviceCenterApi] Network error", err);
    return { ok: false, status: 0, data: null, message: String((err as Error)?.message || err) };
  }
}

// DELETE /api/service-center/delete/:id - Xóa trung tâm dịch vụ
export async function deleteServiceCenterApi(id: string): Promise<ApiResult<{ success: boolean }>> {
  try {
    const response = await fetch(`/api/service-center/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return parseResponse(response);
  } catch (err: unknown) {
    console.error("[serviceCenterApi] Network error", err);
    return { ok: false, status: 0, data: null, message: String((err as Error)?.message || err) };
  }
}
