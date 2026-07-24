import {
  Registration,
  Page,
  CreateRegistrationRequest,
  RegistrationStatus,
} from "./types";

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

export const getRegistrations = async (
  page = 0,
  size = 10,
  search = "",
  type = "",
  status = ""
): Promise<Page<Registration>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (search) params.append("search", search);
  if (type) params.append("type", type);
  if (status) params.append("status", status);

  const response = await fetch(
    `${API_BASE_URL}/registrations?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Không thể tải danh sách đăng ký");
  }

  const data = await response.json();

  // Đảm bảo mapping các trường ID từ Backend và gán giá trị mặc định là 0 nếu thiếu
  return {
    ...data,
    content: data.content.map((item: any) => ({
      ...item,
      residentId: item.residentId || item.resident_id || 0,
      houseId: item.houseId || item.house_id || 0,
    })),
  };
};

export const createRegistration = async (
  request: CreateRegistrationRequest
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/registrations`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Đăng ký thất bại");
  }

  return response.json();
};

export const updateRegistration = async (
  id: number,
  request: CreateRegistrationRequest
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Cập nhật đăng ký thất bại");
  }

  return response.json();
};

export const approveRegistration = async (
  id: number,
  isApproved: boolean,
  adminNote?: string
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/registrations/${id}/approval`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ isApproved, adminNote }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || "Thao tác phê duyệt thất bại");
  }

  return responseText;
};

export const deleteRegistration = async (id: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || "Xóa yêu cầu đăng ký thất bại");
  }

  return responseText;
};
