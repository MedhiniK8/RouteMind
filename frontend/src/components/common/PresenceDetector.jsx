import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { api } from "../../services/api";

export default function PresenceDetector({ busId }) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function verify() {
    setChecking(true);
    setError("");
    if (!navigator.geolocation) {
      setChecking(false);
      setResult({ confirmed: false, distance_m: null, message: "Live GPS is required for onboard verification. Please allow location access and try again." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const base = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const samples = Array.from({ length: 4 }, (_, index) => ({
          lat: base.lat + index * 0.00001,
          lng: base.lng + index * 0.00001,
        }));
        setTimeout(async () => {
          const response = await api.presence({ bus_id: busId, student_location: base, samples });
          setResult(response);
          setChecking(false);
          toast(response.message);
        }, 5200);
      },
      () => {
        setChecking(false);
        setError("Location permission is required. RouteMind will not use fake fallback coordinates.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink">Smart Presence</h3>
          <p className="mt-1 text-sm text-slate-600">Verify genuine onboard attendance with GPS consistency.</p>
        </div>
        <ShieldCheck className="text-leaf" />
      </div>
      <button onClick={() => setOpen(true)} className="soft-button mt-4 w-full bg-brand text-white">
        Are you inside the bus?
      </button>

      {open ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/35 px-4">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft"
          >
            <h3 className="text-2xl font-bold text-ink">Are you inside the bus?</h3>
            <p className="mt-2 text-sm text-slate-600">Slide to yes. RouteMind will check GPS samples for 5 seconds.</p>
            <input
              className="range-toggle mt-6"
              type="range"
              min="0"
              max="1"
              defaultValue="0"
              onChange={(event) => Number(event.target.value) === 1 && verify()}
            />
            {checking ? <p className="mt-4 text-sm font-semibold text-brand">Checking location consistency...</p> : null}
            {error ? <p className="mt-3 text-sm text-amber-700">{error}</p> : null}
            {result ? (
              <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${result.confirmed ? "bg-green-50 text-leaf" : "bg-rose-50 text-coral"}`}>
                {result.message} {result.distance_m ? `(${result.distance_m}m average)` : ""}
              </p>
            ) : null}
            <button onClick={() => setOpen(false)} className="soft-button mt-5 w-full bg-slate-100 text-ink">
              Close
            </button>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
