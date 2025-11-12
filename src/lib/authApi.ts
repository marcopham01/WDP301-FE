// Lấy profile user hiện tại
export async function getProfileApi() {
  const token = localStorage.getItem("accessToken");
  const response = await fetch("/api/users/getprofile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  let data;
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
  };
}
export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
}

export async function loginApi(payload: LoginPayload) {
  const response = await fetch("/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response;
}

export async function registerApi(payload: RegisterPayload) {
  const response = await fetch("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data;
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
  };
}

// Lấy tất cả profiles (admin)
export interface UserProfileItem {
  _id: string;
  username?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role?: string;
}

export async function getAllProfilesApi(params?: { page?: number; limit?: number; role?: string; id?: string }) {
  const token = localStorage.getItem("accessToken");
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.role) qs.set("role", params.role);
  if (params?.id) qs.set("id", params.id);
  const url = `/api/users/getallprofile${qs.toString() ? `?${qs.toString()}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  let data;
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
  } as {
    ok: boolean;
    status: number;
    data?: { success?: boolean; data?: unknown } | null;
    message?: string;
  };
}

// Quên mật khẩu - gửi email reset
export async function forgotPasswordApi(email: string) {
  const response = await fetch("/api/users/forgotPassword", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  let data;
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
  };
}
