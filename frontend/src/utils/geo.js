import { SDM_COLLEGE } from "../services/routeConfig";

export const campusCenter = [SDM_COLLEGE.lat, SDM_COLLEGE.lng];

export function haversineMeters(a, b) {
  const radius = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const value =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

export function nextPoint(polyline, tick) {
  if (!polyline?.length) return { lat: campusCenter[0], lng: campusCenter[1] };
  const index = tick % polyline.length;
  const [lat, lng] = polyline[index];
  return { lat, lng };
}
