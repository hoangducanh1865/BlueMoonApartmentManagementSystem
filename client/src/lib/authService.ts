import { User } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface AuthResponse {
  token: string;
  // refreshToken is now handled via HttpOnly cookie
  user: User;
}

// Helper to get headers with Ngrok bypass and Auth token
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // Bypasses Ngrok warning page
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "include", // Important: Allows browser to receive Set-Cookie (Refresh Token)
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errJson = JSON.parse(errorText);
        throw new Error(errJson.message || "Đăng nhập thất bại");
      } catch (e) {
        throw new Error(errorText || "Đăng nhập thất bại");
      }
    }

    const data: AuthResponse = await response.json();

    // Persist Access Token and User Info (Refresh token is in HttpOnly Cookie)
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data.user;
  } catch (error: any) {
    throw new Error(error.message || "Lỗi kết nối server");
  }
};

export const register = async (
  email: string,
  password: string,
  residentCode: string,
  phoneNumber: string
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "include",
      body: JSON.stringify({ email, password, residentCode, phoneNumber }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      // Backend returns plain text error messages for registration issues
      throw new Error(responseText || "Đăng ký thất bại");
    }

    // Try to parse JSON if possible, otherwise return the text
    try {
      return JSON.parse(responseText);
    } catch (e) {
      // Response was successful (200 OK) but plain text (e.g., "Đăng ký thành công")
      return { message: responseText };
    }
  } catch (error: any) {
    throw new Error(error.message || "Lỗi kết nối server");
  }
};

export const refreshToken = async (): Promise<string | null> => {
  // We rely on the browser sending the HttpOnly cookie via credentials: 'include'
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "include", // Sends the Refresh Token Cookie
    });

    if (response.ok) {
      const data = await response.json();
      // Expected response: { "accessToken": "..." }
      const newAccessToken = data.accessToken;
      if (newAccessToken) {
        localStorage.setItem("token", newAccessToken);
        return newAccessToken;
      }
    }

    return null;
  } catch (e) {
    console.error("Token refresh failed", e);
    return null;
  }
};

export const logout = async () => {
  try {
    // Attempt 1: Try to logout with current access token
    // This tells the backend to remove the refresh token associated with this user/session
    let response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
    });

    // If 401 Unauthorized, the Access Token is expired.
    // We must refresh it to get a valid one, so we can successfully call logout
    // and ensure the backend deletes the Refresh Token from the DB.
    if (response.status === 401) {
      console.log(
        "Logout 401: Access token expired. Attempting refresh to clean up backend session..."
      );

      const newToken = await refreshToken();

      if (newToken) {
        // Attempt 2: Retry logout with new valid access token
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${newToken}`,
          },
          credentials: "include",
        });
        console.log("Logout retry successful");
      } else {
        console.warn(
          "Could not refresh token for logout. Session might already be invalid."
        );
      }
    }
  } catch (error) {
    console.error("Logout request failed", error);
  } finally {
    // Always clear client state to ensure user is logged out on UI
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};
