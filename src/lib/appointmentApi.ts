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

export interface CreateAppointmentPayload {
  appoinment_date: string; // YYYY-MM-DD format: "2025-10-12"
  appoinment_time: string; // HH:mm format: "09:00"
  notes?: string;
  user_id: string; // ID người dùng
  vehicle_id: string; // ID xe cần bảo dưỡng
  center_id: string; // ID trung tâm bảo dưỡng
  service_type_id: string; // ID loại dịch vụ bảo dưỡng (REQUIRED)
}

export interface CreateAppointmentResponse {
  message: string;
  success: boolean;
  data: {
    _id: string;
    appoinment_date: string;
    appoinment_time: string;
    status: string;
    estimated_cost: number;
    user_id: {
      _id: string;
      username?: string;
      fullName?: string;
      email?: string;
    };
    vehicle_id: {
      _id: string;
      license_plate?: string;
      brand?: string;
      model?: string;
    };
    center_id: {
      _id: string;
      center_name?: string;
      address?: string;
    };
    service_type_id: {
      _id: string;
      service_name?: string;
      base_price?: number;
      estimated_duration?: string;
    };
    payment_id?: {
      _id: string;
      order_code?: number;
      amount?: number;
      status?: string;
      checkout_url?: string;
      qr_code?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export async function createAppointmentApi(payload: CreateAppointmentPayload): Promise<ApiResult<CreateAppointmentResponse>> {
  const response = await fetch("/api/appointment/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export interface GetUserAppointmentsParams {
  page?: number;
  limit?: number;
  status?: string; // pending | accept | deposited | completed | canceled
}

export type Appointment = {
  _id: string;
  status: string;
  appoinment_date?: string;
  appoinment_time?: string;
  estimated_end_time?: string;
  notes?: string;
  estimated_cost?: number;
  reason?: string;
  user_id?: { 
    _id?: string; 
    username?: string; 
    fullName?: string; 
    email?: string;
    phone?: string;
  };
  vehicle_id?: { 
    _id?: string; 
    brand?: string; 
    model?: string; 
    license_plate?: string;
    vin?: string;
  };
  center_id?: { 
    _id?: string; 
    name?: string; 
    center_name?: string; 
    address?: string;
    phone?: string;
  };
  service_type_id?: {
    _id?: string;
    service_name?: string;
    description?: string;
    base_price?: number;
    estimated_duration?: string;
  };
  assigned_by?: {
    _id?: string;
    username?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  assigned?: {
    _id?: string;
    username?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  technician_id?: {
    _id?: string;
    username?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  payment_id?: {
    _id?: string;
    order_code?: number;
    amount?: number;
    status?: string;
    checkout_url?: string;
    qr_code?: string;
  };
  final_payment_id?: {
    _id?: string;
    order_code?: number;
    amount?: number;
    status?: string;
    checkout_url?: string;
    qr_code?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

// Types cho Technician Schedule
export interface TechnicianScheduleParams {
  technician_id?: string;
  date_from: string;
  date_to: string;
  page?: number;
  limit?: number;
}

export interface TechnicianInfo {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface ScheduleItem {
  _id: string;
  appoinment_date: string;
  appoinment_time: string;
  estimated_end_time?: string;
  status: string;
  notes?: string;
  estimated_cost?: number;
  user_id: {
    _id: string;
    fullName: string;
    phone: string;
  };
  vehicle_id: {
    _id: string;
    license_plate: string;
    brand: string;
    model: string;
  };
  center_id: {
    _id: string;
    center_name: string;
    address: string;
  };
  service_type_id: {
    _id: string;
    service_name: string;
    estimated_duration: string;
  };
}

export interface TechnicianScheduleResponse {
  technician?: TechnicianInfo;
  date_range: {
    from: string;
    to: string;
  };
  schedules: ScheduleItem[];
  total_assignments: number;
}

export interface TechnicianScheduleItem {
  technician: TechnicianInfo;
  schedules: ScheduleItem[];
  total_assignments: number;
}

export interface TechnicianScheduleListResponse {
  items: TechnicianScheduleItem[];
  pagination: {
    current_page: number;
    items_per_page: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  date_range: {
    from: string;
    to: string;
  };
}

export type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
  totalDocs: number;
};

export async function getUserAppointmentsApi(
  username: string,
  params: GetUserAppointmentsParams = {}
): Promise<ApiResult<{ success: boolean; data: { appointments: Appointment[]; pagination: Pagination } }>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  const url = qs ? `/api/appointment/user/${encodeURIComponent(username)}?${qs}` : `/api/appointment/user/${encodeURIComponent(username)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export interface GetAppointmentsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export async function getAppointmentsApi(
  params: GetAppointmentsParams = {}
): Promise<ApiResult<{ success: boolean; data: { appointments: Appointment[]; pagination: Pagination } }>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  const url = qs ? `/api/appointment/list?${qs}` : `/api/appointment/list`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

// API lấy danh sách appointment của user hiện tại
export async function getMyAppointmentsApi(
  params: GetAppointmentsParams = {}
): Promise<ApiResult<{ success: boolean; data: { appointments: Appointment[]; pagination: Pagination } }>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  // Add cache-busting parameter
  query.set("_t", String(Date.now()));
  const qs = query.toString();
  const url = `/api/appointment/myAppointment?${qs}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      ...getAuthHeader(),
    },
  });

  return parseResponse(response);
}

export interface UpdateAppointmentStatusPayload {
  appointment_id: string;
  status: string;
}

export async function updateAppointmentStatusApi(payload: UpdateAppointmentStatusPayload): Promise<ApiResult<{ success: boolean }>> {
  const response = await fetch("/api/appointment/update-status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

// API lấy thông tin appointment theo ID
export async function getAppointmentByIdApi(appointmentId: string): Promise<ApiResult<{ success: boolean; data: Appointment }>> {
  const response = await fetch(`/api/appointment/${appointmentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

// API xóa appointment (chỉ cho phép xóa appointment có trạng thái pending)
export async function deleteAppointmentApi(appointmentId: string): Promise<ApiResult<{ success: boolean; message: string }>> {
  const response = await fetch(`/api/appointment/${appointmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

// API lấy lịch làm việc của Technician
export async function getTechnicianScheduleApi(params: TechnicianScheduleParams): Promise<ApiResult<{ success: boolean; data: TechnicianScheduleListResponse }>> {
  const query = new URLSearchParams();
  if (params.technician_id) query.set("technician_id", params.technician_id);
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  
  const qs = query.toString();
  const url = qs ? `/api/appointment/technician-schedule?${qs}` : `/api/appointment/technician-schedule`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export interface AssignTechnicianPayload {
  appointment_id: string;
  technician_id: string;
}

// API gán technician cho appointment
export async function assignTechnicianApi(payload: AssignTechnicianPayload): Promise<ApiResult<{ success: boolean }>> {
  const response = await fetch("/api/appointment/assign-technician", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}
