import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Accessibility, AlertTriangle, Play, Square, Wrench } from "lucide-react";
import Layout from "../layout/Layout";
import LiveMap from "../maps/LiveMap";
import SOSButton from "../common/SOSButton";
import StatCard from "../common/StatCard";
import RouteChat from "../common/RouteChat";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { mergeBusUpdate, useWebSocket } from "../../hooks/useWebSocket";
import { COLLEGE_ROUTES } from "../../services/routeConfig";

function gpsErrorMessage(error) {
  if (!error) return "Unable to read GPS location.";
  if (error.code === 1) return "Location permission denied. Please allow GPS access to start live tracking.";
  if (error.code === 2) return "Location unavailable. Check GPS/network and try again.";
  if (error.code === 3) return "Location request timed out. Move near a window or retry.";
  return error.message || "Unable to read GPS location.";
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState(COLLEGE_ROUTES);
  const [buses, setBuses] = useState([]);
  const [selectedRouteKey, setSelectedRouteKey] = useState("");
  const [tripActive, setTripActive] = useState(false);
  const [gpsWarning, setGpsWarning] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTripId, setActiveTripId] = useState(null);
  const [accessible, setAccessible] = useState(true);
  const watchRef = useRef(null);
  const { lastMessage, send, connected } = useWebSocket("drivers", true);

  const selectedRoute = COLLEGE_ROUTES.find((route) => route.key === selectedRouteKey);
  const myBus =
    buses.find((bus) => bus.route_key === selectedRouteKey && bus.driver_id === user?.id) ||
    buses.find((bus) => bus.route_key === selectedRouteKey) ||
    (selectedRoute
      ? {
          id: selectedRoute.busId,
          bus_number: selectedRoute.busNumber,
          route_id: selectedRoute.id,
          route_key: selectedRoute.key,
          status: "idle",
          speed: 0,
          trip_active: false,
          current_location: null,
        }
      : null);

  useEffect(() => {
    Promise.all([api.buses(), api.routes()]).then(([busData, routeData]) => {
      setBuses(busData);
      setRoutes(routeData.length ? routeData : COLLEGE_ROUTES);
    });
    return () => stopGpsWatcher();
  }, []);

  useEffect(() => {
    if (lastMessage?.bus) setBuses((items) => mergeBusUpdate(items, lastMessage));
    if (lastMessage?.type === "sos_alert") toast.error(lastMessage.alert?.message || "Route alert received");
    if (lastMessage?.type === "alert_resolved") toast.success(lastMessage.message || "Alert resolved");
    if (lastMessage?.type === "admin_message") toast(lastMessage.notification?.message || "New admin instruction");
  }, [lastMessage]);

  function stopGpsWatcher() {
    if (watchRef.current && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
  }

  async function pushDriverLocation(position, busId, tripId) {
    const location = { lat: position.coords.latitude, lng: position.coords.longitude };
    const payload = {
      bus_id: busId,
      driver_id: user?.id,
      trip_id: tripId,
      location,
      heading: position.coords.heading || 0,
    };

    // Live GPS is captured by watchPosition and pushed to FastAPI through
    // WebSocket first, with REST as a persistence fallback for Atlas.
    send({ type: "driver_location", payload });
    try {
      const update = await api.updateLocation(payload);
      setBuses((items) => mergeBusUpdate(items, update));
    } catch {
      setBuses((items) => mergeBusUpdate(items, { bus: { ...myBus, id: busId, current_location: location, status: "active", trip_active: true } }));
    }
  }

  async function startTrip() {
    if (!selectedRoute) {
      toast.error("Choose Dharwad Route or Hubli Route first.");
      return;
    }
    if (!navigator.geolocation) {
      setGpsWarning("This browser does not support GPS tracking.");
      return;
    }

    setGpsWarning("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const initialLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        let busId = selectedRoute.busId;
        let tripId = null;
        try {
          const result = await api.startTrip({ route_key: selectedRoute.key, location: initialLocation });
          busId = result.bus.id;
          tripId = result.trip_id;
          setActiveTripId(tripId);
          setBuses((items) => mergeBusUpdate(items, result));
        } catch {
          toast("Backend offline: showing live GPS locally until Atlas backend is running.");
        }

        setTripActive(true);
        toast.success(`${selectedRoute.name} started. Your bus is on the way.`);
        send({ type: "trip_started", route_key: selectedRoute.key, bus_id: busId, message: "Your bus is on the way" });
        await pushDriverLocation(position, busId, tripId);

        stopGpsWatcher();
        watchRef.current = navigator.geolocation.watchPosition(
          (gpsPosition) => pushDriverLocation(gpsPosition, busId, tripId),
          (error) => setGpsWarning(gpsErrorMessage(error)),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
      },
      (error) => setGpsWarning(gpsErrorMessage(error)),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  async function stopTrip() {
    stopGpsWatcher();
    setTripActive(false);
    if (myBus?.id) {
      try {
        const result = await api.stopTrip({ bus_id: myBus.id });
        setBuses((items) => mergeBusUpdate(items, result));
      } catch {
        setBuses((items) => items.map((bus) => (bus.id === myBus.id ? { ...bus, status: "idle", trip_active: false } : bus)));
      }
    }
    toast("Trip stopped and GPS watcher cleaned up.");
  }

  async function reportIssue(alertType) {
    if (!myBus) return;
    const message =
      alertType === "breakdown"
        ? `${myBus.bus_number} reported a breakdown on ${selectedRoute?.name}.`
        : `${myBus.bus_number} sent an SOS alert on ${selectedRoute?.name}.`;
    const alert = { bus_id: myBus.id, user_id: user?.id, alert_type: alertType, message, location: myBus.current_location };
    await api.sos(alert);
    send({ type: alertType, route_key: selectedRoute?.key, bus_id: myBus.id, alert });
    toast.error(message);
  }

  async function sendStatus() {
    if (!statusMessage.trim() || !selectedRoute) return;
    await api.notification({ bus_id: myBus?.id, type: "driver_status", message: statusMessage, priority: "medium" }).catch(() => null);
    send({ type: "driver_status", route_key: selectedRoute.key, bus_id: myBus?.id, message: statusMessage });
    toast.success("Status sent to admin and route students.");
    setStatusMessage("");
  }

  return (
    <Layout footer={false}>
      <section className="section py-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Driver Dashboard</p>
          <h1 className="text-3xl font-extrabold text-ink">Start inactive. Choose a route. Share live GPS.</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-5">
            <LiveMap buses={myBus ? [myBus] : buses} routes={routes} selectedBusId={myBus?.id} />
            <div className="grid gap-5 md:grid-cols-3">
              <StatCard label="Driver Status" value={tripActive ? "Active" : "Inactive"} tone={tripActive ? "leaf" : "sun"} helper="Manual activation required" />
              <StatCard label="Selected Bus" value={myBus?.bus_number || "Choose route"} tone="brand" helper={selectedRoute?.name || "No route selected"} />
              <StatCard label="Live Speed" value={`${myBus?.speed || 0} km/h`} tone="coral" helper="Calculated from GPS updates" />
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="text-lg font-bold text-ink">Start Trip</h3>
              <div className="mt-4 grid gap-3">
                {COLLEGE_ROUTES.map((route) => (
                  <button
                    key={route.key}
                    onClick={() => setSelectedRouteKey(route.key)}
                    className={`rounded-lg border px-4 py-3 text-left font-bold transition ${
                      selectedRouteKey === route.key ? "border-brand bg-cyan-50 text-brand" : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {route.name}
                    <span className="block text-sm font-medium text-slate-500">{route.busNumber}</span>
                  </button>
                ))}
              </div>
              {gpsWarning ? (
                <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  <AlertTriangle size={18} /> {gpsWarning}
                </div>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button onClick={startTrip} className="soft-button bg-leaf text-white">
                  <Play size={18} /> Start Trip
                </button>
                <button onClick={stopTrip} className="soft-button bg-slate-100 text-ink">
                  <Square size={18} /> Stop Trip
                </button>
              </div>
              <button onClick={() => setAccessible((value) => !value)} className="soft-button mt-3 w-full bg-cyan-50 text-brand">
                <Accessibility size={18} /> Accessible mode: {accessible ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-ink">Route Status</h3>
              <textarea value={statusMessage} onChange={(event) => setStatusMessage(event.target.value)} className="mt-4 min-h-24 w-full rounded-lg border border-slate-200 p-3" placeholder="Delay, pickup, or route update" />
              <button onClick={sendStatus} className="soft-button mt-3 w-full bg-brand text-white">Send Status Update</button>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button onClick={() => reportIssue("breakdown")} className="soft-button bg-coral text-white">
                  <Wrench size={18} /> Breakdown
                </button>
                <SOSButton busId={myBus?.id} userId={user?.id} routeKey={selectedRoute?.key} />
              </div>
            </div>

            <RouteChat routeKey={selectedRoute?.key} title="Chat with Admin" audience="admin" placeholder="Message admin" />
            <RouteChat routeKey={selectedRoute?.key} title="Chat with Students" audience="students" placeholder="Message students on this route" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
