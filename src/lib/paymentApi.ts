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

export type PaymentStatus = 
  | "PENDING" 
  | "PAID" 
  | "FAILED" 
  | "CANCELLED" 
  | "EXPIRED" 
  | "TIMEOUT";

export interface CustomerInfo {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Transaction {
  _id: string;
  orderCode?: number;
  order_code?: number; // Backward compatibility
  amount: number;
  description: string;
  status: PaymentStatus;
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
  paidAt?: string;
  paid_at?: string; // Backward compatibility
  cancelledAt?: string;
  cancelled_at?: string; // Backward compatibility
  expiredAt?: string;
  expired_at?: string; // Backward compatibility
  timeoutAt?: string;
  timeout_at?: string; // Backward compatibility
  checkoutUrl?: string;
  checkout_url?: string; // Backward compatibility
  qrCode?: string;
  qr_code?: string; // Backward compatibility
  retryOf?: number;
  replacedBy?: number;
  customer?: CustomerInfo;
  paymentLinkId?: string;
}

// Helper function to normalize transaction data
export function normalizeTransaction(txn: Transaction): Transaction {
  return {
    ...txn,
    orderCode: txn.orderCode || txn.order_code,
    checkoutUrl: txn.checkoutUrl || txn.checkout_url,
    qrCode: txn.qrCode || txn.qr_code,
    paidAt: txn.paidAt || txn.paid_at,
    cancelledAt: txn.cancelledAt || txn.cancelled_at,
    expiredAt: txn.expiredAt || txn.expired_at,
    timeoutAt: txn.timeoutAt || txn.timeout_at,
  };
}

export interface CreatePaymentRequest {
  amount: number;
  description: string;
  customer?: CustomerInfo;
  /**
   * Optional: number of seconds before the payment link expires (server will compute timeoutAt)
   * If omitted, backend default (PAYMENT_EXPIRED_TIME) is used.
   */
  timeoutSeconds?: number;
}

export interface CreatePaymentResponse {
  message: string;
  success: boolean;
  data: {
    payment_id: string;
    orderCode: number;
    amount: number;
    description: string;
    checkoutUrl: string;
    qrCode: string;
    timeoutAt: string;
    canRetry?: boolean;
    customer_info: {
      user_id: string;
      username: string;
      fullName: string;
      email: string;
      phone?: string;
      address?: string;
      role: string;
    };
  };
}

export interface UpdatePaymentStatusRequest {
  order_code: number;
  status: "pending" | "paid" | "cancelled" | "failed";
}

export interface RetryPaymentResponse {
  message: string;
  success: boolean;
  data: {
    newOrderCode: number;
    oldOrderCode: number;
    checkoutUrl: string;
    qrCode: string;
    appointmentUpdated?: boolean;
    appointmentId?: string;
  };
}

export interface PaymentHistoryItem {
  _id: string;
  orderCode: number;
  amount: number;
  description: string;
  status: PaymentStatus;
  createdAt: string;
  checkoutUrl?: string;
  qrCode?: string;
  retryOf?: number;
  replacedBy?: number;
  customer?: CustomerInfo;
}

export interface GetMyTransactionsParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
}

export interface GetPaymentListParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  user_id?: string;
}

// ========== CREATE PAYMENT LINK ==========
/**
 * Tạo link thanh toán PayOS
 * POST /api/payment/create
 */
export async function createPaymentLinkApi(
  request: CreatePaymentRequest
): Promise<ApiResult<CreatePaymentResponse>> {
  const response = await fetch("/api/payment/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(request),
  });

  return parseResponse(response);
}

// ========== UPDATE PAYMENT STATUS ==========
/**
 * Cập nhật trạng thái thanh toán
 * POST /api/payment/update-status
 */
export async function updatePaymentStatusApi(
  request: UpdatePaymentStatusRequest
): Promise<ApiResult<{ success: boolean; data: { payment_id: string; order_code: number; status: string; updated_at: string } }>> {
  const response = await fetch("/api/payment/update-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(request),
  });

  return parseResponse(response);
}

// ========== GET PAYMENT TRANSACTION ==========
/**
 * Lấy thông tin transaction thanh toán theo order_code
 * GET /api/payment/transaction/:order_code
 */
export async function getPaymentTransactionApi(
  orderCode: string | number
): Promise<ApiResult<{ success: boolean; message: string; data: Transaction }>> {
  const response = await fetch(`/api/payment/transaction/${orderCode}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  return parseResponse(response);
}

// ========== GET PAYMENT LIST ==========
/**
 * Lấy danh sách thanh toán (for admin/staff)
 * GET /api/payment/list
 */
export async function getPaymentListApi(
  params: GetPaymentListParams = {}
): Promise<ApiResult<{ success: boolean; data: { items: Transaction[]; pagination: Pagination } }>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.user_id) query.set("user_id", params.user_id);
  query.set("_t", String(Date.now()));
  
  const qs = query.toString();
  const url = `/api/payment/list?${qs}`;

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

// ========== GET MY TRANSACTIONS ==========
/**
 * Lấy danh sách transactions của user hiện tại đang đăng nhập
 * GET /api/payment/myTransactions
 */
export async function getMyTransactionsApi(
  params: GetMyTransactionsParams = {}
): Promise<ApiResult<{ success: boolean; data: { items: Transaction[]; pagination: Pagination } }>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
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

// ========== GET ALL MY TRANSACTIONS (NO PAGINATION) ==========
/**
 * Get all transactions for statistics (no pagination)
 * GET /api/payment/myTransactions?limit=1000
 */
export async function getAllMyTransactionsApi(): Promise<ApiResult<{ success: boolean; data: { items: Transaction[] } }>> {
  const query = new URLSearchParams();
  query.set("limit", "1000");
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

// ========== RETRY PAYMENT ==========
/**
 * Retry failed payment by payment ID
 * GET /api/payment/retry/:id
 */
export async function retryPaymentApi(
  paymentId: string
): Promise<ApiResult<RetryPaymentResponse>> {
  const response = await fetch(`/api/payment/retry/${paymentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  return parseResponse(response);
}

// ========== CANCEL PAYMENT ==========
/**
 * Cancel payment by order code
 * POST /api/payment/cancel/:orderCode
 */
export async function cancelPaymentApi(
  orderCode: string | number
): Promise<ApiResult<{ success: boolean; message: string; data?: { orderCode: number; status: string } }>> {
  const response = await fetch(`/api/payment/cancel/${orderCode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  return parseResponse(response);
}

// ========== TIMEOUT CHECK ==========
/**
 * Check for timeout payments
 * GET /api/payment/timeout-check
 */
export async function timeoutCheckApi(): Promise<ApiResult<{ success: boolean; message: string; data?: { updated: number } }>> {
  const response = await fetch("/api/payment/timeout-check", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  return parseResponse(response);
}

// ========== TEST RETRY FUNCTIONALITY ==========
/**
 * Test retry functionality for a payment
 * GET /api/payment/test-retry/:orderCode
 */
export async function testRetryFunctionalityApi(
  orderCode: string | number
): Promise<ApiResult<{ success: boolean; message: string; data?: unknown }>> {
  const response = await fetch(`/api/payment/test-retry/${orderCode}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  return parseResponse(response);
}

// ========== GET PAYMENT HISTORY BY APPOINTMENT ==========
/**
 * Get payment history for an appointment
 * GET /api/payment/history/appointment/:appointmentId
 */
export async function getPaymentHistoryByAppointmentApi(
  appointmentId: string
): Promise<ApiResult<{ 
  success: boolean; 
  message: string; 
  data: { 
    appointment_id: string;
    current_payment: Transaction | null;
    payment_history: PaymentHistoryItem[];
    total_attempts: number;
  } 
}>> {
  const response = await fetch(`/api/payment/history/appointment/${appointmentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  return parseResponse(response);
}
