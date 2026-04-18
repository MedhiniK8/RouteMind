from app.services.geo import haversine_m


def validate_presence(student_locations: list[dict], bus_location: dict, threshold_m: int = 100) -> dict:
    if not student_locations or not bus_location:
        return {
            "confirmed": False,
            "distance_m": None,
            "message": "Need live GPS samples to verify bus presence.",
        }

    distances = [haversine_m(sample, bus_location) for sample in student_locations]
    close_samples = [distance for distance in distances if distance <= threshold_m]
    confirmed = len(close_samples) >= max(1, round(len(distances) * 0.7))
    avg_distance = round(sum(distances) / len(distances))
    return {
        "confirmed": confirmed,
        "distance_m": avg_distance,
        "message": "You are onboard" if confirmed else "Sorry, it seems you are not inside the bus",
    }
