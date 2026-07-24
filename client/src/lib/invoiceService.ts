import { Invoice, InvoiceDetail, Page } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getInvoices = async (
  page = 0,
  size = 10,
  search = "",
  status = ""
): Promise<Page<Invoice>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (search) params.append("search", search);
  if (status) params.append("status", status);

  const response = await fetch(
    `${API_BASE_URL}/invoices?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Không thể tải danh sách hóa đơn");
  }

  return response.json();
};

export interface CreateInvoiceItem {
  feeId: number;
  quantity: number;
}

export interface CreateInvoiceRequest {
  houseId: number | string;
  month: number;
  year: number;
  dueDate: string;
  items: CreateInvoiceItem[];
}

export const createInvoice = async (
  request: CreateInvoiceRequest
): Promise<Invoice> => {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Tạo hóa đơn thất bại");
  }

  return data;
};

export const getInvoiceById = async (id: number | string): Promise<Invoice> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Không thể tải chi tiết hóa đơn");
  }

  return response.json();
};

export const deleteInvoice = async (id: number | string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || "Xóa hóa đơn thất bại");
  }

  return responseText;
};

export const updateInvoiceDetailQuantity = async (
  id: number,
  quantity: number
): Promise<InvoiceDetail> => {
  const response = await fetch(
    `${API_BASE_URL}/invoices/details/${id}?quantity=${quantity}`,
    {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Cập nhật số lượng thất bại");
  }

  return response.json();
};

export const updateInvoiceDueDate = async (
  id: number,
  dueDate: string
): Promise<Invoice> => {
  const response = await fetch(
    `${API_BASE_URL}/invoices/${id}?dueDate=${dueDate}`,
    {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Cập nhật hạn chót thất bại");
  }

  return response.json();
};

export const simulatePayment = async (
  invoiceId: number,
  amount?: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/payment/simulate`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ invoiceId, amount }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(responseText || "Thanh toán thất bại");
  }
  return responseText;
};
