import { COLLEGE_ROUTES } from "./routeConfig";

export const demoRoutes = COLLEGE_ROUTES;

export const demoBuses = [
  {
    id: "bus-dharwad",
    bus_number: "SDM-DWD-01",
    route_id: "route-dharwad",
    route_key: "dharwad",
    status: "idle",
    is_accessible: true,
    speed: 28,
    current_location: null,
    trip_active: false,
  },
  {
    id: "bus-hubli",
    bus_number: "SDM-HBL-02",
    route_id: "route-hubli",
    route_key: "hubli",
    status: "idle",
    is_accessible: false,
    speed: 0,
    current_location: null,
    trip_active: false,
  },
];

export const demoNotifications = [
  { id: "n1", type: "info", message: "Select your route and stop to start tracking your SDM bus.", priority: "medium" },
];

export const demoUsers = {
  student: {
    id: "student-demo",
    name: "Ananya Student",
    email: "student@routemind.dev",
    role: "student",
    bus_id: "bus-dharwad",
    route_id: "route-dharwad",
    route_key: "dharwad",
    stop_id: "dwd-court",
  },
  driver: {
    id: "driver-demo",
    name: "Ravi Driver",
    email: "driver@routemind.dev",
    role: "driver",
    bus_id: null,
    route_id: null,
    route_key: null,
  },
  admin: {
    id: "admin-demo",
    name: "Priya Admin",
    email: "admin@routemind.dev",
    role: "admin",
  },
};
