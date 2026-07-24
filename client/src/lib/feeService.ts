import { FeeDefinition } from "./types";

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

export const getAllFeeDefinitions = async (): Promise<FeeDefinition[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/fees`, {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách khoản phí");
    }

    const data = await response.json();

    // Map backend response (lowercase/snake-ish) to frontend interface (camelCase)
    return data.map((item: any) => ({
      id: item.id,
      name: item.feename,
      description: item.description,
      unitPrice: item.unitprice,
      unit: item.unit,
      billingCycle: item.billingcycle,
      isMandatory: item._mandatory,
    }));
  } catch (error: any) {
    throw new Error(error.message || "Lỗi kết nối server");
  }
};

export const createFeeDefinition = async (
  fee: Partial<FeeDefinition>
): Promise<FeeDefinition> => {
  // Payload needs to match the backend expectation
  const payload = {
    feeName: fee.name,
    description: fee.description,
    unitPrice: fee.unitPrice,
    unit: fee.unit,
    billingCycle: fee.billingCycle,
    isMandatory: fee.isMandatory,
  };

  const response = await fetch(`${API_BASE_URL}/fees`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Thêm khoản phí thất bại");
  }

  const item = await response.json();

  // Map response back
  return {
    id: item.id,
    name: item.feename,
    description: item.description,
    unitPrice: item.unitprice,
    unit: item.unit,
    billingCycle: item.billingcycle,
    isMandatory: item._mandatory,
  };
};
