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
    message: (data as Record<string, unknown>)?.message as string || (data as Record<string, unknown>)?.error as string || undefined,
  } as ApiResult<T>;
}

export interface DashboardOverviewParams {
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  center_id?: string;
}

export interface DashboardOverviewData {
  revenue: {
    totalRevenue: number;
    totalTransactions: number;
  };
  paymentRate: {
    total: number;
    breakdown: {
      PAID: number;
      PENDING: number;
      FAILED: number;
      CANCELLED: number;
      EXPIRED: number;
      TIMEOUT: number;
      pending?: number;
      cancelled?: number;
      canceled?: number;
      paid?: number;
      rates: {
        PAID: number;
        PENDING: number;
        FAILED: number;
        CANCELLED: number;
        EXPIRED: number;
        TIMEOUT: number;
      };
    };
  };
  appointmentRate: {
    total: number;
    breakdown: {
      pending: number;
      assigned: number;
      check_in: number;
      in_progress: number;
      completed: number;
      delay: number;
      canceled: number;
      rates: {
        pending: number;
        assigned: number;
        check_in: number;
        in_progress: number;
        completed: number;
        delay: number;
        canceled: number;
      };
    };
  };
  period: {
    from: string | null;
    to: string | null;
  };
}

export interface DashboardOverviewResponse {
  message: string;
  success: boolean;
  data: DashboardOverviewData;
}

export async function getDashboardOverviewApi(
  params?: DashboardOverviewParams
): Promise<ApiResult<DashboardOverviewResponse>> {
  const query = new URLSearchParams();
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  if (params?.center_id) query.set("center_id", params.center_id);
  
  const qs = query.toString();
  const url = qs ? `${BASE_URL}/api/dashboard/overview?${qs}` : `${BASE_URL}/api/dashboard/overview`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export interface TopTechniciansAppointmentsParams {
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  center_id?: string;
}

export interface TechnicianAppointment {
  technician_id: string;
  technician_name: string;
  technician_username: string;
  technician_email: string;
  appointment_count: number;
}

export interface TopTechniciansAppointmentsResponse {
  message: string;
  success: boolean;
  data: {
    period: string;
    from: string;
    to: string;
    technicians: TechnicianAppointment[];
  };
}

export async function getTopTechniciansAppointmentsApi(
  params?: TopTechniciansAppointmentsParams
): Promise<ApiResult<TopTechniciansAppointmentsResponse>> {
  const query = new URLSearchParams();
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  if (params?.center_id) query.set("center_id", params.center_id);
  
  const qs = query.toString();
  const url = qs ? `${BASE_URL}/api/dashboard/top-technicians-appointments?${qs}` : `${BASE_URL}/api/dashboard/top-technicians-appointments`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

export interface TopTechniciansRevenueParams {
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  center_id?: string;
}

export interface TechnicianRevenue {
  technician_id: string;
  technician_name: string;
  technician_username: string;
  technician_email: string;
  total_revenue: number;
}

export interface TopTechniciansRevenueResponse {
  message: string;
  success: boolean;
  data: {
    period: string;
    from: string;
    to: string;
    technicians: TechnicianRevenue[];
  };
}

export async function getTopTechniciansRevenueApi(
  params?: TopTechniciansRevenueParams
): Promise<ApiResult<TopTechniciansRevenueResponse>> {
  const query = new URLSearchParams();
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  if (params?.center_id) query.set("center_id", params.center_id);
  
  const qs = query.toString();
  const url = qs ? `${BASE_URL}/api/dashboard/top-technicians-revenue?${qs}` : `${BASE_URL}/api/dashboard/top-technicians-revenue`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

