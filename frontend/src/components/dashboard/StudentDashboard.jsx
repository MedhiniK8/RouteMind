import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Bell, MapPin } from "lucide-react";
import Layout from "../layout/Layout";
import LiveMap from "../maps/LiveMap";
import StatCard from "../common/StatCard";
import NotificationPanel from "../common/NotificationPanel";
import PresenceDetector from "../common/PresenceDetector";
import SOSButton from "../common/SOSButton";
import RouteChat from "../common/RouteChat";
import { api } from "../../services/api";
import { demoNotifications } from "../../services/mockData";
import { useAuth } from "../../context/AuthContext";
import { mergeBusUpdate, useWebSocket } from "../../hooks/useWebSocket";
import { COLLEGE_ROUTES } from "../../services/routeConfig";

function gpsErrorMessage(error) {
  if (!error) return "Unable to read GPS location.";
  if (error.code === 1) return "Location permission denied. Please allow GPS to track your bus.";
  if (error.code === 2) return "Location unavailable. Check GPS/network and try again.";
  if (error.code === 3) return "Location request timed out. Please retry.";
  return error.message || "Unable to read GPS location.";
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState(COLLEGE_ROUTES);
  const [buses, setBuses] = useState([]);
  const [notifications, setNotifications] = useState(demoNotifications);
  const [selectedRouteKey, setSelectedRouteKey] = useState(user?.route_key || "dharwad");
  const [selectedStopId, setSelectedStopId] = useState(user?.stop_id || "");
  const [studentLocation, setStudentLocation] = useState(null);
  const [trackingStudent, setTrackingStudent] = useState(false);
  const [gpsWarning, setGpsWarning] = useState("");
  const watchRef = useRef(null);
  const { connected, lastMessage, send } = useWebSocket(selectedRouteKey ? `route:${selectedRouteKey}` : null, Boolean(selectedRouteKey));

  const selectedRoute = COLLEGE_ROUTES.find((route) => route.key === selectedRouteKey);
  const selectedBus = buses.find((bus) => bus.route_key === selectedRouteKey && bus.trip_active) || buses.find((bus) => bus.route_key === selectedRouteKey);
  const selectedStop = selectedRoute?.stops.find((stop) => stop.id === selectedStopId);

  useEffect(() => {
    Promise.all([api.buses(), api.routes(), api.notifications()]).then(([busData, routeData, noteData]) => {
      setBuses(busData);
      setRoutes(routeData.length ? routeData : COLLEGE_ROUTES);
      setNotifications(noteData);
    });
    return () => stopStudentWatcher();
  }, []);

  useEffect(() => {
    if (lastMessage?.bus && lastMessage.bus.route_key === selectedRouteKey) setBuses((items) => mergeBusUpdate(items, lastMessage));
    if (lastMessage?.type === "trip_started" && lastMessage.bus?.route_key === selectedRouteKey) {
      setBuses((items) => mergeBusUpdate(items, lastMessage));
      addNotification({ id: `trip-${Date.now()}`, type: "trip_started", message: "Your bus is on the way.", priority: "high" });
    }
    if (lastMessage?.notification && lastMessage.notification.bus_id === selectedBus?.id) addNotification(lastMessage.notification);
    if (lastMessage?.alert && lastMessage.alert.bus_id === selectedBus?.id) addNotification({ ...lastMessage.alert, priority: "critical" });
    if (lastMessage?.type === "alert_resolved") {
      setNotifications((items) => items.filter((item) => item.id !== lastMessage.alert_id && item.alert_id !== lastMessage.alert_id));
      toast.success(lastMessage.message || "Alert resolved");
    }
    if (lastMessage?.type === "driver_status" && lastMessage.route_key === selectedRouteKey) {
      addNotification({ id: `status-${Date.now()}`, type: "driver_status", message: lastMessage.message, priority: "medium" });
    }
  }, [lastMessage, selectedRouteKey, selectedBus?.id]);

  function addNotification(item) {
    setNotifications((items) => [item, ...items.filter((existing) => existing.id !== item.id)].slice(0, 20));
    toast(item.message || "New RouteMind notification");
  }

  function stopStudentWatcher() {
    if (watchRef.current && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
  }

  function trackMyBus() {
    if (!selectedRoute || !selectedStopId) {
      toast.error("Choose your bus route and stop first.");
      return;
    }
    if (!navigator.geolocation) {
      setGpsWarning("This browser does not support GPS tracking.");
      return;
    }
    setGpsWarning("");
    setTrackingStudent(true);
    stopStudentWatcher();
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setStudentLocation(location);
        send({ type: "student_location", route_key: selectedRouteKey, bus_id: selectedBus?.id, location });
        // Student GPS is captured continuously and sent to the backend so admin
        // can see demand/presence near the selected route and stop.
        try {
          await api.studentLocation({ bus_id: selectedBus?.id, location });
        } catch {
          // Keep UI live locally when backend is offline, but never fake Bengaluru coordinates.
        }
      },
      (error) => {
        setTrackingStudent(false);
        setGpsWarning(gpsErrorMessage(error));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    toast.success(`Tracking ${selectedRoute.name} from ${selectedStop?.name}.`);
  }

  const eta = useMemo(() => {
    if (!selectedBus?.speed) return selectedBus?.trip_active ? "Live" : "Waiting";
    return `${Math.max(3, Math.round(28 - selectedBus.speed / 2))} min`;
  }, [selectedBus]);

  return (
    <Layout footer={false}>
      <section className="section py-8">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Student Dashboard</p>
            <h1 className="text-3xl font-extrabold text-ink">Track your SDM college bus live</h1>
          </div>
          <button onClick={trackMyBus} className="soft-button bg-leaf text-white">
            <MapPin size={18} /> {trackingStudent ? "Tracking My Bus" : "Track My Bus"}
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-5">
            <LiveMap
              buses={selectedBus ? [selectedBus] : buses.filter((bus) => bus.route_key === selectedRouteKey)}
              routes={selectedRoute ? [selectedRoute] : routes}
              selectedBusId={selectedBus?.id}
              studentLocation={studentLocation}
            />
            <div className="grid gap-5 md:grid-cols-4">
              <StatCard label="ETA" value={eta} tone="brand" helper="Updates when driver is active" />
              <StatCard label="Speed" value={`${selectedBus?.speed || 0} km/h`} tone="sun" helper="Live bus GPS speed" />
              <StatCard label="Selected Stop" value={selectedStop?.name || "Choose stop"} tone="leaf" helper={selectedRoute?.name || "Choose route"} />
              <StatCard label="Bus" value={selectedBus?.bus_number || "Waiting"} tone="coral" helper={selectedBus?.status || "inactive"} />
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="text-lg font-bold text-ink">Route & Stop</h3>
              <select value={selectedRouteKey} onChange={(event) => { setSelectedRouteKey(event.target.value); setSelectedStopId(""); }} className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3">
                {COLLEGE_ROUTES.map((route) => <option key={route.key} value={route.key}>{route.name}</option>)}
              </select>
              <select value={selectedStopId} onChange={(event) => setSelectedStopId(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3">
                <option value="">Choose your stop</option>
                {selectedRoute?.stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.name}</option>)}
              </select>
              {gpsWarning ? <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800"><AlertTriangle size={18} /> {gpsWarning}</div> : null}
              <div className="mt-4 rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-brand">
                <Bell size={18} className="mr-2 inline" /> Students only receive chat and alerts for their selected route.
              </div>
            </div>
            <PresenceDetector busId={selectedBus?.id} />
            <SOSButton busId={selectedBus?.id} userId={user?.id} routeKey={selectedRouteKey} />
            <RouteChat routeKey={selectedRouteKey} title="Route Driver Chat" audience="driver" placeholder="Message your route driver" />
            <NotificationPanel notifications={notifications} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
