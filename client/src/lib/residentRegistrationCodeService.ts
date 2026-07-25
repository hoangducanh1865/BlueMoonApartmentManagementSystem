export interface ResidentRegistrationCode {
  id: number;
  code: string;
  residentId: number;
  residentCode: number | null;
  residentName: string;
  residentPhone: string;
  residentEmail: string | null;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  expired: boolean;
  active: boolean;
}

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

export const getResidentRegistrationCodes = async (): Promise<
  ResidentRegistrationCode[]
> => {
  const response = await fetch(`${API_BASE_URL}/resident-registration-codes`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách mã đăng ký");
  }

  return response.json();
};

export const createResidentRegistrationCode = async (
  residentId: number,
  ttlHours: number
): Promise<ResidentRegistrationCode> => {
  const response = await fetch(`${API_BASE_URL}/resident-registration-codes`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ residentId, ttlHours }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Không thể tạo mã đăng ký");
  }

  return response.json();
};
