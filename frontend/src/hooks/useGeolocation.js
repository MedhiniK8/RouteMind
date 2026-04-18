import { useCallback, useState } from "react";

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");

  const requestLocation = useCallback(() => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ lat: result.coords.latitude, lng: result.coords.longitude });
      },
      () => setError("Location permission was blocked. Demo coordinates will be used."),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 }
    );
  }, []);

  return { position, error, requestLocation };
}
