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

export interface CreateAppointmentPayload {
  appoinment_date: string; // YYYY-MM-DD
  appoinment_time: string; // HH:mm
  notes?: string;
  estimated_cost?: number;
  user_id: string; // current user id
  vehicle_id: string;
  center_id: string;
  assigned?: string; // optional technician id
}

export async function createAppointmentApi(payload: CreateAppointmentPayload): Promise<ApiResult<{ success: boolean }>> {
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

export async function getUserAppointmentsApi(
  username: string,
  params: GetUserAppointmentsParams = {}
): Promise<ApiResult<{ success: boolean; data: { appointments: any[]; pagination: any } }>> {
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
