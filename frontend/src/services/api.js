import { demoBuses, demoNotifications, demoRoutes, demoUsers } from "./mockData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("routemind_token");
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function login(email, password, role) {
  try {
    return await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch {
    const user = demoUsers[role] || demoUsers.student;
    return { access_token: `demo-${role}-token`, token_type: "bearer", user };
  }
}

export const api = {
  request,
  apiUrl: API_URL,
  async buses() {
    try {
      return await request("/api/buses");
    } catch {
      return demoBuses;
    }
  },
  async routes() {
    try {
      return await request("/api/routes");
    } catch {
      return demoRoutes;
    }
  },
  async notifications() {
    try {
      return await request("/api/notifications");
    } catch {
      return demoNotifications;
    }
  },
  async overview() {
    try {
      return await request("/api/analytics/overview");
    } catch {
      return {
        total_buses: 3,
        active_buses: 2,
        delayed_buses: 1,
        active_sos: 1,
        accessible_buses: 2,
        punctuality_percent: 92,
        usage_percent: 78,
      };
    }
  },
  async sos(payload) {
    try {
      return await request("/api/sos", { method: "POST", body: JSON.stringify(payload) });
    } catch {
      return { id: `demo-sos-${Date.now()}`, ...payload, status: "active" };
    }
  },
  async startTrip(payload) {
    return request("/api/tracking/start-trip", { method: "POST", body: JSON.stringify(payload) });
  },
  async stopTrip(payload) {
    return request("/api/tracking/stop-trip", { method: "POST", body: JSON.stringify(payload) });
  },
  async updateLocation(payload) {
    return request("/api/tracking/update", { method: "POST", body: JSON.stringify(payload) });
  },
  async liveBuses() {
    try {
      return await request("/api/tracking/live-buses");
    } catch {
      return demoBuses.filter((bus) => bus.trip_active);
    }
  },
  async studentAssignment() {
    return request("/api/tracking/student-assignment");
  },
  async studentLocation(payload) {
    return request("/api/tracking/student-location", { method: "POST", body: JSON.stringify(payload) });
  },
  async adminMessage(payload) {
    return request("/api/notifications/admin-message", { method: "POST", body: JSON.stringify(payload) });
  },
  async notification(payload) {
    return request("/api/notifications", { method: "POST", body: JSON.stringify(payload) });
  },
  async routeChange(payload) {
    return request("/api/notifications/route-change", { method: "POST", body: JSON.stringify(payload) });
  },
  async chat(payload) {
    return request("/api/chat", { method: "POST", body: JSON.stringify(payload) });
  },
  async presence(payload) {
    try {
      return await request("/api/tracking/presence-check", { method: "POST", body: JSON.stringify(payload) });
    } catch {
      const distance = Math.round(Math.random() * 160);
      return {
        confirmed: distance <= 100,
        distance_m: distance,
        message: distance <= 100 ? "You are onboard" : "Sorry, it seems you are not inside the bus",
      };
    }
  },
};
