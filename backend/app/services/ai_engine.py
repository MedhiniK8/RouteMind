from datetime import datetime, timezone

from app.services.geo import haversine_m, nearest_point_distance_m


def calculate_eta_minutes(bus_location: dict, destination: dict, speed_kmph: float) -> int:
    distance_km = haversine_m(bus_location, destination) / 1000
    realistic_speed = max(speed_kmph, 12)
    return max(1, round((distance_km / realistic_speed) * 60))


def detect_delay(route: dict | None, bus: dict) -> dict:
    if not route or not bus.get("trip_active"):
        return {"is_delayed": False, "minutes": 0, "reason": "Trip has not started"}

    stops = route.get("stops", [])
    location = bus.get("current_location")
    if not stops or not location:
        return {"is_delayed": False, "minutes": 0, "reason": "Insufficient route data"}

    nearest_stop = min(stops, key=lambda stop: haversine_m(location, stop))
    expected_minutes = nearest_stop.get("minutes_from_start", 0)
    started_at = bus.get("started_at")
    if not started_at:
        return {"is_delayed": False, "minutes": 0, "reason": "No start time"}

    if isinstance(started_at, str):
        started_at = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
    elapsed = (datetime.now(timezone.utc) - started_at).total_seconds() / 60
    delay = round(elapsed - expected_minutes)
    return {
        "is_delayed": delay > 5,
        "minutes": max(0, delay),
        "reason": "Bus is behind expected stop timing" if delay > 5 else "On schedule",
    }


def suggest_alternate_bus(student_stop: dict, buses: list[dict], routes: list[dict]) -> dict | None:
    route_by_id = {route["id"]: route for route in routes}
    candidates = []
    for bus in buses:
        if bus.get("status") not in {"active", "idle"}:
            continue
        route = route_by_id.get(bus.get("route_id"))
        if not route:
            continue
        distance = nearest_point_distance_m(student_stop, route.get("stops", []))
        if distance <= 900:
            candidates.append((distance, bus, route))
    if not candidates:
        return None
    distance, bus, route = sorted(candidates, key=lambda item: item[0])[0]
    return {
        "bus_id": bus["id"],
        "bus_number": bus["bus_number"],
        "route": route["name"],
        "walk_distance_m": round(distance),
        "message": f"Try {bus['bus_number']} on {route['name']} nearby.",
    }


def prioritize_alert(alert_type: str, message: str) -> dict:
    weights = {"sos": 100, "delay": 70, "missed": 60, "presence": 45, "info": 20}
    score = weights.get(alert_type, 20)
    if any(word in message.lower() for word in ["emergency", "accident", "medical"]):
        score += 20
    if score >= 100:
        priority = "critical"
    elif score >= 70:
        priority = "high"
    elif score >= 45:
        priority = "medium"
    else:
        priority = "low"
    return {"score": score, "priority": priority}
