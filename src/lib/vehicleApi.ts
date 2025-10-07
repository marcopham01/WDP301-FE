export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data?: T | null;
  message?: string;
}

export interface VehicleModel {
  _id: string;
  brand?: string;
  model_name?: string;
  year?: number;
  battery_type?: string;
  type_model?: "1" | "2" | "3";
  maintenanceIntervalKm?: number;
  maintenanceIntervaMonths?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  _id: string;
  vin?: string;
  license_plate: string;
  color?: string;
  purchase_date?: string; // ISO date string
  current_miliage?: number;
  battery_health?: number;
  last_service_mileage?: number;
  model_id: VehicleModel | string;
  user_id: string | { _id: string };
  createdAt?: string;
  updatedAt?: string;
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

// GET: /api/vehicle/get -> list vehicle models
export async function getVehicleModelsApi(): Promise<ApiResult<{ success: boolean; data: VehicleModel[] }>> {
  const response = await fetch("/api/vehicle/get", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

// POST: /api/vehicle/createVehicle
export interface CreateVehiclePayload {
  license_plate: string;
  color?: string;
  purchase_date?: string; // YYYY-MM-DD
  current_miliage?: number;
  battery_health?: number;
  last_service_mileage?: number;
  model_id: string; // VehicleModel _id
}

export async function createVehicleApi(payload: CreateVehiclePayload): Promise<ApiResult<{ success: boolean }>> {
  const response = await fetch("/api/vehicle/createVehicle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

// GET: /api/vehicle/getVehicleUser -> vehicles of current user
export async function getUserVehiclesApi(): Promise<ApiResult<{ success: boolean; data: Vehicle[] }>> {
  const response = await fetch("/api/vehicle/getVehicleUser", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}

// GET: /api/vehicle/getAllVehicleUser -> all vehicles (admin/staff)
export async function getAllVehiclesApi(): Promise<ApiResult<{ success: boolean; data: Vehicle[] }>> {
  const response = await fetch("/api/vehicle/getAllVehicleUser", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  return parseResponse(response);
}
