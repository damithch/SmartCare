const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const parseError = async (response) => {
  try {
    const payload = await response.json();
    return payload?.error?.message || payload?.message || "Request failed";
  } catch {
    return "Request failed";
  }
};

const request = async (path, body) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = await response.json();
  return payload.data;
};

const authenticatedRequest = async (path, token, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = await response.json();
  return payload.data;
};

export const loginUser = (credentials) => request("/auth/login", credentials);

export const registerUser = (userData) => request("/auth/register", userData);

export const fetchMyProfile = (token) =>
  authenticatedRequest("/users/me", token, {
    method: "GET"
  });

export const updateMyProfile = (token, body) =>
  authenticatedRequest("/users/me", token, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
