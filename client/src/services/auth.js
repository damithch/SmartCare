const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const GET_CACHE_TTL_MS = 30 * 1000;
const requestCache = new Map();

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
  const method = String(options.method || "GET").toUpperCase();

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

  if (method !== "GET") {
    requestCache.clear();
  }

  return payload.data;
};

const getCacheKey = (path, token) => `${token}:${path}`;

const cachedAuthenticatedGet = async (path, token, ttlMs = GET_CACHE_TTL_MS) => {
  const cacheKey = getCacheKey(path, token);
  const cached = requestCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < ttlMs) {
    return cached.data;
  }

  const data = await authenticatedRequest(path, token, { method: "GET" });
  requestCache.set(cacheKey, {
    data,
    timestamp: now
  });

  return data;
};

export const loginUser = (credentials) => request("/auth/login", credentials);
export const registerUser = (userData) => request("/auth/register", userData);

export const fetchMyProfile = (token) => cachedAuthenticatedGet("/users/me", token, 60 * 1000);
export const fetchUserById = (token, id) => cachedAuthenticatedGet(`/users/${encodeURIComponent(id)}`, token, 60 * 1000);
export const updateMyProfile = (token, body) => authenticatedRequest("/users/me", token, { method: "PATCH", body: JSON.stringify(body) });

export const fetchUsers = (token, { search = "", role = "", isActive = "", limit = 100 } = {}) => {
  const params = new URLSearchParams({
    limit: String(limit),
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (isActive) params.set("isActive", isActive);

  return cachedAuthenticatedGet(`/users?${params.toString()}`, token, 10 * 1000);
};

export const createManagedUser = (token, body) =>
  authenticatedRequest("/users", token, { method: "POST", body: JSON.stringify(body) });

export const updateManagedUser = (token, id, body) =>
  authenticatedRequest(`/users/${encodeURIComponent(id)}`, token, { method: "PATCH", body: JSON.stringify(body) });

export const deactivateManagedUser = (token, id) =>
  authenticatedRequest(`/users/${encodeURIComponent(id)}`, token, { method: "DELETE" });

export const fetchAdminPayments = (token, { search = "", status = "", paymentMethod = "", reconciled = "", limit = 100 } = {}) => {
  const params = new URLSearchParams({
    limit: String(limit),
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (paymentMethod) params.set("paymentMethod", paymentMethod);
  if (reconciled) params.set("reconciled", reconciled);

  return cachedAuthenticatedGet(`/payments?${params.toString()}`, token, 10 * 1000);
};

export const fetchPaymentReport = (token) =>
  cachedAuthenticatedGet("/payments/report/generate", token, 10 * 1000);

export const reconcilePayments = (token, paymentIds, reconciliationNotes = "") =>
  authenticatedRequest("/payments/reconcile/batch", token, {
    method: "PATCH",
    body: JSON.stringify({ paymentIds, reconciliationNotes })
  });

export const fetchMyAvailability = (token, date) =>
  cachedAuthenticatedGet(`/doctor-availability/me${date ? `?date=${date}` : ""}`, token, 15 * 1000);
export const createMyAvailability = (token, body) =>
  authenticatedRequest("/doctor-availability/me", token, { method: "POST", body: JSON.stringify(body) });
export const deleteMyAvailability = (token, id) =>
  authenticatedRequest(`/doctor-availability/me/${id}`, token, { method: "DELETE" });

export const fetchMyAppointments = (token) =>
  cachedAuthenticatedGet("/appointments/my?limit=30&sortBy=appointmentDate&sortOrder=asc", token, 20 * 1000);
export const fetchPatientUpcomingAppointments = (token, patientId) =>
  patientId
    ? cachedAuthenticatedGet(`/appointments/patient/${encodeURIComponent(patientId)}/upcoming`, token, 20 * 1000)
    : Promise.resolve([]);
export const updateAppointment = (token, id, body) =>
  authenticatedRequest(`/appointments/${encodeURIComponent(id)}`, token, { method: "PATCH", body: JSON.stringify(body) });
export const cancelAppointment = (token, id) =>
  authenticatedRequest(`/appointments/${encodeURIComponent(id)}`, token, { method: "DELETE" });

export const fetchDoctors = (token, search = "") =>
  cachedAuthenticatedGet(`/users/doctors${search ? `?search=${encodeURIComponent(search)}` : ""}`, token, 30 * 1000);

export const fetchDoctorAvailability = (token, doctorId, date) =>
  cachedAuthenticatedGet(
    `/doctor-availability?doctorId=${encodeURIComponent(doctorId)}${date ? `&date=${encodeURIComponent(date)}` : ""}`,
    token,
    15 * 1000
  );

export const createAppointment = (token, body) =>
  authenticatedRequest("/appointments", token, { method: "POST", body: JSON.stringify(body) });
export const createAppointmentCheckout = (token, body) =>
  authenticatedRequest("/appointments/checkout-intent", token, { method: "POST", body: JSON.stringify(body) });
export const confirmAppointmentPayment = (token, body) =>
  authenticatedRequest("/appointments/confirm-payment", token, { method: "POST", body: JSON.stringify(body) });

export const fetchMedicines = (token, search = "") =>
  cachedAuthenticatedGet(`/medicines?limit=50${search ? `&search=${encodeURIComponent(search)}` : ""}`, token, 30 * 1000);
export const fetchLowStockMedicines = (token) =>
  cachedAuthenticatedGet("/medicines/inventory/low-stock", token, 20 * 1000);
export const addMedicine = (token, body) =>
  authenticatedRequest("/medicines", token, { method: "POST", body: JSON.stringify(body) });
export const fetchPrescriptionQueue = (token, status = "", search = "") =>
  cachedAuthenticatedGet(
    `/medical-records/prescriptions/queue?limit=50${status ? `&status=${encodeURIComponent(status)}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    token,
    15 * 1000
  );
export const updatePrescriptionQueueStatus = (token, recordId, prescriptionId, status) =>
  authenticatedRequest(
    `/medical-records/${encodeURIComponent(recordId)}/prescriptions/${encodeURIComponent(prescriptionId)}/status`,
    token,
    { method: "PATCH", body: JSON.stringify({ status }) }
  );
export const fetchMyBills = (token, status = "") =>
  cachedAuthenticatedGet(`/bills?limit=30&sortBy=createdAt&sortOrder=desc${status ? `&status=${encodeURIComponent(status)}` : ""}`, token, 20 * 1000);
export const payBill = (token, body) =>
  authenticatedRequest("/payments", token, { method: "POST", body: JSON.stringify(body) });

export const fetchMyMedicalRecords = (token) =>
  cachedAuthenticatedGet("/medical-records/my?limit=15&sortBy=createdAt&sortOrder=desc", token, 20 * 1000);
export const fetchPatientMedicalRecords = (token, patientId) =>
  patientId
    ? cachedAuthenticatedGet(`/medical-records/patient/${encodeURIComponent(patientId)}?limit=15&sortBy=createdAt&sortOrder=desc`, token, 20 * 1000)
    : Promise.resolve([]);
export const fetchAppointmentMedicalRecord = async (token, appointmentId) => {
  if (!appointmentId) {
    return null;
  }

  try {
    return await cachedAuthenticatedGet(`/medical-records/appointment/${encodeURIComponent(appointmentId)}`, token, 15 * 1000);
  } catch (error) {
    if ((error.message || "").toLowerCase().includes("not found")) {
      return null;
    }

    throw error;
  }
};
export const saveConsultation = (token, body) =>
  authenticatedRequest("/medical-records/consultation", token, { method: "POST", body: JSON.stringify(body) });

export const predictWaitTime = (token, body) =>
  authenticatedRequest("/ai/predict-wait-time", token, { method: "POST", body: JSON.stringify(body) });
