export const SDM_COLLEGE = {
  name: "SDM Engineering College, Dharwad",
  lat: 15.3919,
  lng: 75.0249,
};

export const COLLEGE_ROUTES = [
  {
    key: "dharwad",
    id: "route-dharwad",
    name: "Dharwad Route",
    busId: "bus-dharwad",
    busNumber: "SDM-DWD-01",
    driverLabel: "Driver of Bus Route Dharwad",
    stops: [
      { id: "dwd-court", name: "Court Circle", lat: 15.4582, lng: 75.0078, order: 1, minutes_from_start: 0 },
      { id: "dwd-nttf", name: "NTTF", lat: 15.4464, lng: 75.0042, order: 2, minutes_from_start: 7 },
      { id: "dwd-hosayellapura", name: "Hosayellapura", lat: 15.4367, lng: 75.0071, order: 3, minutes_from_start: 13 },
      { id: "dwd-toll", name: "Toll Naka", lat: 15.4248, lng: 75.0114, order: 4, minutes_from_start: 19 },
      { id: "dwd-vidyagiri", name: "Vidyagiri", lat: 15.4149, lng: 75.0166, order: 5, minutes_from_start: 25 },
      { id: "dwd-gadhinagar", name: "Gadhinagar", lat: 15.4028, lng: 75.0205, order: 6, minutes_from_start: 31 },
      { id: "dwd-sdm", name: "SDM Engineering Clg", lat: SDM_COLLEGE.lat, lng: SDM_COLLEGE.lng, order: 7, minutes_from_start: 38 },
    ],
  },
  {
    key: "hubli",
    id: "route-hubli",
    name: "Hubli Route",
    busId: "bus-hubli",
    busNumber: "SDM-HBL-02",
    driverLabel: "Driver of Bus Route Hubli",
    stops: [
      { id: "hbl-president", name: "President Hotel", lat: 15.3647, lng: 75.1239, order: 1, minutes_from_start: 0 },
      { id: "hbl-navanagar", name: "Navanagar", lat: 15.3719, lng: 75.1075, order: 2, minutes_from_start: 9 },
      { id: "hbl-hospital", name: "SDM Hospital", lat: 15.3825, lng: 75.0869, order: 3, minutes_from_start: 18 },
      { id: "hbl-ys", name: "YS Colony", lat: 15.3889, lng: 75.0568, order: 4, minutes_from_start: 29 },
      { id: "hbl-sdm", name: "SDM College", lat: SDM_COLLEGE.lat, lng: SDM_COLLEGE.lng, order: 5, minutes_from_start: 40 },
    ],
  },
].map((route) => ({
  ...route,
  polyline: route.stops.map((stop) => [stop.lat, stop.lng]),
}));

export function routeByKey(routeKey) {
  return COLLEGE_ROUTES.find((route) => route.key === routeKey);
}

export function routeById(routeId) {
  return COLLEGE_ROUTES.find((route) => route.id === routeId || route.busId === routeId);
}
