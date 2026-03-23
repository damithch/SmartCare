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

export const fetchMyProfile = (token) => authenticatedRequest("/users/me", token, { method: "GET" });
export const fetchUserById = (token, id) => authenticatedRequest(`/users/${encodeURIComponent(id)}`, token, { method: "GET" });
export const updateMyProfile = (token, body) => authenticatedRequest("/users/me", token, { method: "PATCH", body: JSON.stringify(body) });

export const fetchMyAvailability = (token, date) =>
  authenticatedRequest(`/doctor-availability/me${date ? `?date=${date}` : ""}`, token, { method: "GET" });
export const createMyAvailability = (token, body) =>
  authenticatedRequest("/doctor-availability/me", token, { method: "POST", body: JSON.stringify(body) });
export const deleteMyAvailability = (token, id) =>
  authenticatedRequest(`/doctor-availability/me/${id}`, token, { method: "DELETE" });

export const fetchMyAppointments = (token) =>
  authenticatedRequest("/appointments/my?limit=100&sortBy=appointmentDate&sortOrder=asc", token, { method: "GET" });

export const fetchDoctors = (token, search = "") =>
  authenticatedRequest(`/users/doctors${search ? `?search=${encodeURIComponent(search)}` : ""}`, token, { method: "GET" });

export const fetchDoctorAvailability = (token, doctorId, date) =>
  authenticatedRequest(
    `/doctor-availability?doctorId=${encodeURIComponent(doctorId)}${date ? `&date=${encodeURIComponent(date)}` : ""}`,
    token,
    { method: "GET" }
  );

export const createAppointment = (token, body) =>
  authenticatedRequest("/appointments", token, { method: "POST", body: JSON.stringify(body) });
export const createAppointmentCheckout = (token, body) =>
  authenticatedRequest("/appointments/checkout-intent", token, { method: "POST", body: JSON.stringify(body) });
export const confirmAppointmentPayment = (token, body) =>
  authenticatedRequest("/appointments/confirm-payment", token, { method: "POST", body: JSON.stringify(body) });

export const fetchMedicines = (token, search = "") =>
  authenticatedRequest(`/medicines?limit=100${search ? `&search=${encodeURIComponent(search)}` : ""}`, token, { method: "GET" });
export const fetchLowStockMedicines = (token) =>
  authenticatedRequest("/medicines/inventory/low-stock", token, { method: "GET" });
export const addMedicine = (token, body) =>
  authenticatedRequest("/medicines", token, { method: "POST", body: JSON.stringify(body) });

export const fetchPatientMedicalRecords = (token, patientId) =>
  authenticatedRequest(`/medical-records/patient/${encodeURIComponent(patientId)}?limit=20&sortBy=createdAt&sortOrder=desc`, token, { method: "GET" });
export const fetchAppointmentMedicalRecord = (token, appointmentId) =>
  authenticatedRequest(`/medical-records/appointment/${encodeURIComponent(appointmentId)}`, token, { method: "GET" });
export const saveConsultation = (token, body) =>
  authenticatedRequest("/medical-records/consultation", token, { method: "POST", body: JSON.stringify(body) });
