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

export interface Pagination {
  current_page: number;
  items_per_page: number;
  total_items: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface Transaction {
  _id: string;
  order_code: number;
  amount: number;
  description: string;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  updatedAt: string;
  user_id?: {
    _id: string;
    username: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    role: string;
  };
  paid_at?: string;
  expired_at?: string;
  checkout_url?: string;
  qr_code?: string;
}

export interface GetMyTransactionsParams {
  page?: number;
  limit?: number;
  status?: "pending" | "paid" | "cancelled";
}

// Lấy danh sách transactions của user hiện tại
export async function getMyTransactionsApi(
  params: GetMyTransactionsParams = {}
): Promise<ApiResult<{ success: boolean; data: { items: Transaction[]; pagination: Pagination } }>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  // Add cache-busting parameter
  query.set("_t", String(Date.now()));
  const qs = query.toString();
  const url = `/api/payment/myTransactions?${qs}`;

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

// Get all transactions for statistics (no pagination)
export async function getAllMyTransactionsApi(): Promise<ApiResult<{ success: boolean; data: { items: Transaction[] } }>> {
  const query = new URLSearchParams();
  query.set("limit", "1000"); // Get up to 1000 transactions for stats
  query.set("_t", String(Date.now()));

  const qs = query.toString();
  const url = `/api/payment/myTransactions?${qs}`;

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

// Lấy thông tin transaction theo order_code
export async function getPaymentTransactionApi(
  orderCode: string | number
): Promise<ApiResult<{ success: boolean; data: Transaction }>> {
  const response = await fetch(`/api/payment/transaction/${orderCode}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  return parseResponse(response);
}
