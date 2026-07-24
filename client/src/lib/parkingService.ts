import {
  Vehicle,
  ParkingCard,
  ParkingSubscription,
  ParkingAccessLog,
  VehicleRegistration,
  ParkingPricing,
  Page,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  CreateParkingCardRequest,
  CreateSubscriptionRequest,
  RecordEntryRequest,
  RecordExitRequest,
  CreateVehicleRegistrationRequest,
  ApproveRegistrationRequest,
  CreatePricingRequest,
  VehicleType,
  SubscriptionType,
  ParkingRegistrationStatus,
} from "./types";

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

// ========================
// VEHICLE APIs
// ========================

export const getVehicles = async (
  page: number = 0,
  size: number = 10,
  licensePlate?: string,
  vehicleType?: VehicleType,
  householdId?: number
): Promise<Page<Vehicle>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (licensePlate) params.append("licensePlate", licensePlate);
  if (vehicleType) params.append("vehicleType", vehicleType);
  if (householdId) params.append("householdId", householdId.toString());

  const response = await fetch(`${API_BASE_URL}/vehicles?${params}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải danh sách xe");
  }

  return response.json();
};

export const getVehicleById = async (id: number): Promise<Vehicle> => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không tìm thấy xe");
  }

  return response.json();
};

export const getVehicleByLicensePlate = async (
  licensePlate: string
): Promise<Vehicle> => {
  const response = await fetch(
    `${API_BASE_URL}/vehicles/plate/${licensePlate}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không tìm thấy xe");
  }

  return response.json();
};

export const createVehicle = async (
  request: CreateVehicleRequest
): Promise<Vehicle> => {
  const response = await fetch(`${API_BASE_URL}/vehicles`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tạo xe mới");
  }

  return response.json();
};

export const updateVehicle = async (
  id: number,
  request: UpdateVehicleRequest
): Promise<Vehicle> => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể cập nhật xe");
  }

  return response.json();
};

export const deleteVehicle = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể xóa xe");
  }
};

// ========================
// PARKING CARD APIs
// ========================

export const getParkingCards = async (
  page: number = 0,
  size: number = 10,
  vehicleId?: number,
  isActive?: boolean
): Promise<Page<ParkingCard>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (vehicleId) params.append("vehicleId", vehicleId.toString());
  if (isActive !== undefined) params.append("isActive", isActive.toString());

  const response = await fetch(`${API_BASE_URL}/parking-cards?${params}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải danh sách thẻ");
  }

  return response.json();
};

export const getParkingCardById = async (id: number): Promise<ParkingCard> => {
  const response = await fetch(`${API_BASE_URL}/parking-cards/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không tìm thấy thẻ");
  }

  return response.json();
};

export const createParkingCard = async (
  request: CreateParkingCardRequest
): Promise<ParkingCard> => {
  const response = await fetch(`${API_BASE_URL}/parking-cards`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tạo thẻ mới");
  }

  return response.json();
};

export const activateParkingCard = async (id: number): Promise<ParkingCard> => {
  const response = await fetch(`${API_BASE_URL}/parking-cards/${id}/activate`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể kích hoạt thẻ");
  }

  return response.json();
};

export const deactivateParkingCard = async (
  id: number
): Promise<ParkingCard> => {
  const response = await fetch(
    `${API_BASE_URL}/parking-cards/${id}/deactivate`,
    {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể vô hiệu hóa thẻ");
  }

  return response.json();
};

export const deleteParkingCard = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/parking-cards/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể xóa thẻ");
  }
};

// ========================
// SUBSCRIPTION APIs
// ========================

export const getSubscriptions = async (
  page: number = 0,
  size: number = 10,
  vehicleId?: number,
  subscriptionType?: SubscriptionType,
  isActive?: boolean
): Promise<Page<ParkingSubscription>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (vehicleId) params.append("vehicleId", vehicleId.toString());
  if (subscriptionType) params.append("subscriptionType", subscriptionType);
  if (isActive !== undefined) params.append("isActive", isActive.toString());

  const response = await fetch(
    `${API_BASE_URL}/parking-subscriptions?${params}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải danh sách gói cước");
  }

  return response.json();
};

export const getSubscriptionById = async (
  id: number
): Promise<ParkingSubscription> => {
  const response = await fetch(`${API_BASE_URL}/parking-subscriptions/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không tìm thấy gói cước");
  }

  return response.json();
};

export const getActiveSubscriptionByVehicle = async (
  vehicleId: number
): Promise<ParkingSubscription | null> => {
  const response = await fetch(
    `${API_BASE_URL}/parking-subscriptions/vehicle/${vehicleId}/active`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải gói cước");
  }

  return response.json();
};

export const createSubscription = async (
  request: CreateSubscriptionRequest
): Promise<ParkingSubscription> => {
  const response = await fetch(`${API_BASE_URL}/parking-subscriptions`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tạo gói cước mới");
  }

  return response.json();
};

export const cancelSubscription = async (
  id: number
): Promise<ParkingSubscription> => {
  const response = await fetch(
    `${API_BASE_URL}/parking-subscriptions/${id}/cancel`,
    {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể hủy gói cước");
  }

  return response.json();
};

// ========================
// ACCESS CONTROL APIs
// ========================

export const getAccessLogs = async (
  page: number = 0,
  size: number = 10,
  licensePlate?: string,
  startDate?: string,
  endDate?: string
): Promise<Page<ParkingAccessLog>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (licensePlate) params.append("licensePlate", licensePlate);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await fetch(
    `${API_BASE_URL}/parking-access/logs?${params}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải lịch sử ra vào");
  }

  return response.json();
};

export const getAccessLogById = async (
  id: number
): Promise<ParkingAccessLog> => {
  const response = await fetch(`${API_BASE_URL}/parking-access/logs/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không tìm thấy log");
  }

  return response.json();
};

export const getCurrentlyParkedVehicles = async (
  page: number = 0,
  size: number = 10
): Promise<Page<ParkingAccessLog>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());

  const response = await fetch(
    `${API_BASE_URL}/parking-access/currently-parked?${params}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải danh sách xe đang đỗ");
  }

  return response.json();
};

export const recordEntry = async (
  request: RecordEntryRequest
): Promise<ParkingAccessLog> => {
  const response = await fetch(`${API_BASE_URL}/parking-access/entry`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể ghi nhận xe vào");
  }

  return response.json();
};

export const recordExit = async (
  request: RecordExitRequest
): Promise<ParkingAccessLog> => {
  const response = await fetch(`${API_BASE_URL}/parking-access/exit`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể ghi nhận xe ra");
  }

  return response.json();
};

export const calculateParkingFee = async (logId: number): Promise<number> => {
  const response = await fetch(
    `${API_BASE_URL}/parking-access/logs/${logId}/calculate-fee`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tính phí");
  }

  return response.json();
};

export const markPaid = async (logId: number): Promise<ParkingAccessLog> => {
  const response = await fetch(
    `${API_BASE_URL}/parking-access/logs/${logId}/mark-paid`,
    {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể đánh dấu đã thanh toán");
  }

  return response.json();
};

// ========================
// VEHICLE REGISTRATION APIs
// ========================

export const getVehicleRegistrations = async (
  page: number = 0,
  size: number = 10,
  status?: ParkingRegistrationStatus,
  vehicleType?: VehicleType
): Promise<Page<VehicleRegistration>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (status) params.append("status", status);
  if (vehicleType) params.append("vehicleType", vehicleType);

  const response = await fetch(
    `${API_BASE_URL}/vehicle-registrations?${params}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải danh sách đăng ký xe");
  }

  return response.json();
};

export const getVehicleRegistrationById = async (
  id: number
): Promise<VehicleRegistration> => {
  const response = await fetch(`${API_BASE_URL}/vehicle-registrations/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không tìm thấy đăng ký");
  }

  return response.json();
};

export const getRegistrationsByResidentId = async (
  residentId: number
): Promise<VehicleRegistration[]> => {
  const response = await fetch(
    `${API_BASE_URL}/vehicle-registrations/resident/${residentId}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải danh sách đăng ký của cư dân");
  }

  return response.json();
};

export const createVehicleRegistration = async (
  request: CreateVehicleRegistrationRequest
): Promise<VehicleRegistration> => {
  const response = await fetch(`${API_BASE_URL}/vehicle-registrations`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tạo đăng ký mới");
  }

  return response.json();
};

export const approveVehicleRegistration = async (
  id: number,
  approved: boolean,
  adminNotes?: string
): Promise<VehicleRegistration> => {
  const response = await fetch(
    `${API_BASE_URL}/vehicle-registrations/${id}/process`,
    {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify({ approved, adminNotes }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể xử lý đăng ký");
  }

  return response.json();
};

export const deleteVehicleRegistration = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/vehicle-registrations/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể xóa đăng ký");
  }
};

// ========================
// PRICING APIs
// ========================

export const getPricings = async (
  vehicleType?: VehicleType,
  subscriptionType?: SubscriptionType,
  isActive?: boolean
): Promise<ParkingPricing[]> => {
  const params = new URLSearchParams();
  if (vehicleType) params.append("vehicleType", vehicleType);
  if (subscriptionType) params.append("subscriptionType", subscriptionType);
  if (isActive !== undefined) params.append("isActive", isActive.toString());

  const response = await fetch(`${API_BASE_URL}/parking-pricing?${params}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải bảng giá");
  }

  return response.json();
};

export const getPricingById = async (id: number): Promise<ParkingPricing> => {
  const response = await fetch(`${API_BASE_URL}/parking-pricing/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không tìm thấy bảng giá");
  }

  return response.json();
};

export const getCurrentPrice = async (
  vehicleType: VehicleType,
  subscriptionType: SubscriptionType
): Promise<ParkingPricing | null> => {
  const response = await fetch(
    `${API_BASE_URL}/parking-pricing/current?vehicleType=${vehicleType}&subscriptionType=${subscriptionType}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tải giá");
  }

  return response.json();
};

export const createPricing = async (
  request: CreatePricingRequest
): Promise<ParkingPricing> => {
  const response = await fetch(`${API_BASE_URL}/parking-pricing`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể tạo bảng giá mới");
  }

  return response.json();
};

export const updatePricing = async (
  id: number,
  request: Partial<CreatePricingRequest>
): Promise<ParkingPricing> => {
  const response = await fetch(`${API_BASE_URL}/parking-pricing/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể cập nhật bảng giá");
  }

  return response.json();
};

export const deactivatePricing = async (id: number): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/parking-pricing/${id}/deactivate`,
    {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể vô hiệu hóa bảng giá");
  }
};

// ========================
// LICENSE PLATE RECOGNITION APIs
// ========================

const LP_API_URL = import.meta.env.VITE_LP_API_URL || "http://localhost:5000";

export const recognizeLicensePlate = async (
  imageFile: File
): Promise<{ plates: string[] }> => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${LP_API_URL}/recognize`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể nhận dạng biển số");
  }

  return response.json();
};

export const checkLicensePlateHealth = async (): Promise<{
  status: string;
}> => {
  const response = await fetch(`${LP_API_URL}/health`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("LP Recognition service is down");
  }

  return response.json();
};
