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
    const response = await fetch(`${BASE_URL}/api/service-center/get`, {
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
    const response = await fetch(`${BASE_URL}/api/service-center/create`, {
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
    const response = await fetch(`${BASE_URL}/api/service-center/schedule/create/${centerId}`, {
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
    const response = await fetch(`${BASE_URL}/api/service-center/update/${id}`, {
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
    const response = await fetch(`${BASE_URL}/api/service-center/delete/${id}`, {
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

// ============================================================================
// TECHNICIAN MANAGEMENT APIs
// ============================================================================

export interface TechnicianUser {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface Technician {
  _id: string;
  user: TechnicianUser;
  center_id: string;
  status: 'on' | 'off';
  createdAt: string;
  updatedAt: string;
}

export interface GetTechniciansResponse {
  success: boolean;
  message: string;
  data: Technician[];
}

/**
 * GET /api/service-center/technicians?center_id=xxx
 * Lấy danh sách kỹ thuật viên
 * - Nếu có center_id: lấy technicians của trung tâm đó
 * - Nếu không: lấy tất cả technicians đang active (status=on)
 */
export async function getTechniciansApi(
  centerId?: string
): Promise<ApiResult<GetTechniciansResponse>> {
  try {
    const url = centerId 
      ? `${BASE_URL}/api/service-center/technicians?center_id=${centerId}`
      : `${BASE_URL}/api/service-center/technicians`;
    
    const response = await fetch(url, {
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

export interface AddTechnicianPayload {
  user_id: string;      // ID của user có role "technician"
  center_id: string;    // ID của Service Center
  maxSlotsPerDay?: number; // Optional: số slot/ngày cho mỗi technician (swagger ví dụ là 4)
  status?: 'on' | 'off';   // Optional: trạng thái của technician trong trung tâm
}

export interface AddTechnicianResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    user_id: string;
    center_id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * POST /api/service-center/technican/add
 * Thêm kỹ thuật viên vào trung tâm dịch vụ
 * - Mỗi technician chỉ được thuộc 1 trung tâm
 * - Sau khi thêm, availableSlots trong ServiceCenterHours sẽ tự động cập nhật = 4
 * - Mỗi technician có thể nhận tối đa 4 appointments/ngày
 */
export async function addTechnicianToServiceCenterApi(
  payload: AddTechnicianPayload
): Promise<ApiResult<AddTechnicianResponse>> {
  try {
    const response = await fetch(`${BASE_URL}/api/service-center/technican/add`, {
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

export interface RemoveTechnicianPayload {
  user_id: string;
  center_id: string;
}

/**
 * POST /api/service-center/technican/remove
 * Xóa kỹ thuật viên khỏi trung tâm
 * - Sẽ cập nhật lại availableSlots của ServiceCenterHours
 */
export async function removeTechnicianFromServiceCenterApi(
  payload: RemoveTechnicianPayload
): Promise<ApiResult<{ success: boolean; message: string }>> {
  try {
    const response = await fetch(`${BASE_URL}/api/service-center/technican/remove`, {
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
