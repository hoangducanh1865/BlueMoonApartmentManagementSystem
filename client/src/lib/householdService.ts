import {
  Household,
  ResidentMember,
  ApartmentStatus,
  ApartmentType,
  Page,
  ResidentInfo,
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

// Helper to filter out read-only fields (id, memberCount) and ensure correct data types
const preparePayload = (household: Partial<Household>) => {
  return {
    roomNumber: household.roomNumber,
    ownerName: household.ownerName || "",
    area: household.area,
    phoneNumber: household.phoneNumber || "",
    // Removed email and memberCount from payload as they are not editable in the form
    building: household.building || "",
    floor: household.floor,
    status: household.status || ApartmentStatus.OCCUPIED,
    type: household.type || ApartmentType.NORMAL,
  };
};

export const mapRelationship = (rel: string, isHost: boolean) => {
  if (isHost) return "Chủ hộ";
  if (!rel) return "";
  const r = rel.toUpperCase();
  if (r === "OWNER") return "Chủ hộ";
  if (r === "ADMIN") return "Quản trị viên";
  if (r === "WIFE" || r === "HUSBAND") return "Vợ/Chồng";
  if (r === "CHILD" || r === "SON" || r === "DAUGHTER") return "Con";
  if (r === "FATHER" || r === "MOTHER") return "Bố/Mẹ";
  return rel;
};

export const getAllResidents = async (
  page: number = 0,
  size: number = 10,
  search: string = ""
): Promise<Page<ResidentInfo>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (search) {
    params.append("search", search);
  }

  const response = await fetch(
    `${API_BASE_URL}/residents?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Không thể tải danh sách cư dân");
  }

  const data: Page<any> = await response.json();

  // Map response to ensure residentCode exists (fallback to ID if missing)
  return {
    ...data,
    content: data.content.map((item: any) => ({
      ...item,
      residentCode: item.residentCode || String(item.id),
    })),
  };
};

export const getHouseholds = async (search?: string): Promise<Household[]> => {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await fetch(`${API_BASE_URL}/households${query}`, {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách hộ khẩu");
    }

    const data = await response.json();

    // Map API response to Frontend Type. Handle potential snake_case from backend.
    return data.map((item: any) => ({
      id: String(item.id),
      roomNumber: item.roomNumber,
      ownerName: item.ownerName || item.owner_name || "",
      area: item.area,
      memberCount: item.memberCount || item.member_count,
      phoneNumber: item.phoneNumber || item.phone_number || "",
      email: item.email || "",
      building: item.building || "",
      floor: item.floor || 0,
      status: item.status || ApartmentStatus.OCCUPIED,
      type: item.type || ApartmentType.NORMAL,
    }));
  } catch (error: any) {
    throw new Error(error.message || "Lỗi kết nối server");
  }
};

export const getHouseholdById = async (id: string): Promise<Household> => {
  try {
    const response = await fetch(`${API_BASE_URL}/households/${id}`, {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Không thể tải thông tin hộ khẩu");
    }

    const item = await response.json();

    return {
      id: String(item.id),
      roomNumber: item.roomNumber,
      ownerName: item.ownerName || item.owner_name || "",
      area: item.area,
      memberCount: item.memberCount || item.member_count,
      phoneNumber: item.phoneNumber || item.phone_number || "",
      email: item.email || "",
      building: item.building || "",
      floor: item.floor || 0,
      status: item.status || ApartmentStatus.OCCUPIED,
      type: item.type || ApartmentType.NORMAL,
    };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi kết nối server");
  }
};

export const getHouseholdMembers = async (
  householdId: string
): Promise<ResidentMember[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/households/${householdId}/members`,
      {
        method: "GET",
        headers: getHeaders(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      // It's possible the endpoint returns 404 if no members, or empty list
      if (response.status === 404) return [];
      throw new Error("Không thể tải danh sách thành viên");
    }

    const data = await response.json();

    return data.map((item: any) => ({
      id: String(item.id),
      householdId: householdId,
      fullName: item.name || "",
      dateOfBirth: item.dob || "",
      relationToOwner: mapRelationship(item.relationship, item.isHost),
      cccd: item.cccd || "",
      phoneNumber: item.phoneNumber || "",
      residentCode: String(item.id), // Use ID as resident code if not provided
      email: item.email || "",
      status: item.status || "",
    }));
  } catch (error: any) {
    console.error("Error fetching members:", error);
    // Fallback to empty array to avoid UI crash
    return [];
  }
};

export const addHouseholdMember = async (
  householdId: string,
  member: Partial<ResidentMember>
): Promise<ResidentMember> => {
  const payload = {
    name: member.fullName,
    phoneNumber: member.phoneNumber,
    dob: member.dateOfBirth,
    relationship: member.relationToOwner,
    status: member.status || "THUONG_TRU",
    cccd: member.cccd,
    email: member.email,
  };

  const response = await fetch(
    `${API_BASE_URL}/households/${householdId}/members`,
    {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Thêm thành viên thất bại");
  }

  const data = await response.json();

  return {
    id: String(data.id),
    householdId: householdId,
    fullName: data.name,
    dateOfBirth: data.dob,
    relationToOwner: mapRelationship(data.relationship, data.isHost),
    cccd: data.cccd,
    phoneNumber: data.phoneNumber,
    residentCode: String(data.id),
    email: data.email || "",
    status: data.status || "",
  };
};

export const updateHouseholdMember = async (
  memberId: string,
  member: Partial<ResidentMember> & { newRoomNumber?: string }
): Promise<ResidentMember> => {
  const payload = {
    name: member.fullName,
    phoneNumber: member.phoneNumber,
    dob: member.dateOfBirth,
    relationship: member.relationToOwner,
    status: member.status,
    cccd: member.cccd,
    email: member.email,
    isHost: member.relationToOwner === "Chủ hộ",
    newRoomNumber: member.newRoomNumber || null,
  };

  const response = await fetch(
    `${API_BASE_URL}/households/members/${memberId}`,
    {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Cập nhật thành viên thất bại");
  }

  const data = await response.json();

  return {
    id: String(data.id),
    householdId: String(data.householdId || ""), // If moved, this might change, but UI handles list removal
    fullName: data.name,
    dateOfBirth: data.dob,
    relationToOwner: mapRelationship(data.relationship, data.isHost),
    cccd: data.cccd,
    phoneNumber: data.phoneNumber,
    residentCode: String(data.id),
    // Fallback to existing email if response doesn't contain it
    email: data.email || member.email || "",
    status: data.status || "",
  };
};

export const deleteResident = async (id: string | number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/residents/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || "Xóa cư dân thất bại");
  }

  return responseText;
};

export const createHousehold = async (
  household: Partial<Household>
): Promise<Household> => {
  const payload = preparePayload(household);

  const response = await fetch(`${API_BASE_URL}/households`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Thêm hộ khẩu thất bại");
  }

  const item = await response.json();
  return {
    id: String(item.id),
    roomNumber: item.roomNumber,
    ownerName: item.ownerName || item.owner_name || "",
    area: item.area,
    memberCount: item.memberCount || item.member_count,
    phoneNumber: item.phoneNumber || item.phone_number || "",
    email: item.email || "",
    building: item.building || "",
    floor: item.floor || 0,
    status: item.status || ApartmentStatus.OCCUPIED,
    type: item.type || ApartmentType.NORMAL,
  };
};

export const updateHousehold = async (
  id: string,
  household: Partial<Household>
): Promise<Household> => {
  const payload = preparePayload(household);

  const response = await fetch(`${API_BASE_URL}/households/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Cập nhật hộ khẩu thất bại");
  }

  const item = await response.json();
  return {
    id: String(item.id),
    roomNumber: item.roomNumber,
    ownerName: item.ownerName || item.owner_name || "",
    area: item.area,
    memberCount: item.memberCount || item.member_count,
    phoneNumber: item.phoneNumber || item.phone_number || "",
    email: item.email || "",
    building: item.building || "",
    floor: item.floor || 0,
    status: item.status || ApartmentStatus.OCCUPIED,
    type: item.type || ApartmentType.NORMAL,
  };
};

export const deleteHousehold = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/households/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  const responseText = await response.text();

  if (!response.ok) {
    // If error (e.g. 400), use the text returned from backend
    throw new Error(responseText || "Xóa hộ khẩu thất bại");
  }

  // Success (200), we can ignore the text "Đã xóa..." as the void return implies success
};
