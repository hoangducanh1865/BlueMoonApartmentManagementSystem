import { FaceRegistration, BuildingAccessLog } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// Helper to get headers with Auth token
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getMultipartHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const registerFace = async (
  userId: string,
  name: string,
  image: File
): Promise<FaceRegistration> => {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("name", name);
  formData.append("image", image);

  const response = await fetch(`${API_BASE_URL}/face-access/register`, {
    method: "POST",
    headers: getMultipartHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to register face");
  }

  return response.json();
};

export const getRegisteredFaces = async (): Promise<FaceRegistration[]> => {
  const response = await fetch(`${API_BASE_URL}/face-access/users`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch registered faces");
  }

  return response.json();
};

export const getBuildingAccessLogs = async (
  page: number = 0,
  size: number = 20,
  search?: string,
  startDate?: string,
  endDate?: string
): Promise<{ content: BuildingAccessLog[]; totalPages: number; totalElements: number }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (search) params.append("search", search);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await fetch(`${API_BASE_URL}/face-access/logs?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch access logs");
  }

  return response.json();
};
