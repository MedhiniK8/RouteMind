from math import asin, cos, radians, sin, sqrt


EARTH_RADIUS_M = 6371000


def haversine_m(a: dict, b: dict) -> float:
    lat1, lng1 = radians(a["lat"]), radians(a["lng"])
    lat2, lng2 = radians(b["lat"]), radians(b["lng"])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    value = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_M * asin(sqrt(value))


def calculate_speed_kmph(previous: dict | None, current: dict, seconds: float) -> float:
    if not previous or seconds <= 0:
        return 0
    meters = haversine_m(previous, current)
    return round((meters / seconds) * 3.6, 1)


def nearest_point_distance_m(point: dict, points: list[dict]) -> float:
    if not points:
        return float("inf")
    return min(haversine_m(point, candidate) for candidate in points)
