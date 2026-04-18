import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Send, Siren } from "lucide-react";
import Layout from "../layout/Layout";
import LiveMap from "../maps/LiveMap";
import StatCard from "../common/StatCard";
import RouteChat from "../common/RouteChat";
import { api } from "../../services/api";
import { mergeBusUpdate, useWebSocket } from "../../hooks/useWebSocket";
import { COLLEGE_ROUTES } from "../../services/routeConfig";

export default function AdminDashboard() {
  const [routes, setRoutes] = useState(COLLEGE_ROUTES);
  const [buses, setBuses] = useState([]);
  const [overview, setOverview] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [instruction, setInstruction] = useState("");
  const [selectedRouteKey, setSelectedRouteKey] = useState("dharwad");
  const { connected, lastMessage, send } = useWebSocket("admin", true);

  useEffect(() => {
    Promise.all([api.buses(), api.routes(), api.overview(), api.liveBuses()]).then(([busData, routeData, overviewData, liveData]) => {
      const merged = [...busData];
      liveData.forEach((bus) => {
        const index = merged.findIndex((item) => item.id === bus.id);
        if (index >= 0) merged[index] = bus;
        else merged.push(bus);
      });
      setBuses(merged);
      setRoutes(routeData.length ? routeData : COLLEGE_ROUTES);
      setOverview(overviewData);
    });
  }, []);

  useEffect(() => {
    if (lastMessage?.bus) setBuses((items) => mergeBusUpdate(items, lastMessage));
    if (lastMessage?.type === "trip_started") {
      setBuses((items) => mergeBusUpdate(items, lastMessage));
      toast.success(`${lastMessage.bus?.bus_number || "Bus"} started ${lastMessage.bus?.route_key || ""}`);
    }
    if (lastMessage?.alert) {
      setAlerts((items) => [lastMessage.alert, ...items.filter((alert) => alert.id !== lastMessage.alert.id)]);
      toast.error(lastMessage.alert.message || "Route alert received");
    }
    if (lastMessage?.type === "alert_resolved") {
      setAlerts((items) => items.filter((alert) => alert.id !== lastMessage.alert_id));
      toast.success(lastMessage.message || "Alert resolved");
    }
  }, [lastMessage]);

  const selectedRoute = COLLEGE_ROUTES.find((route) => route.key === selectedRouteKey);
  const selectedBus =
    buses.find((bus) => bus.route_key === selectedRouteKey && bus.trip_active) ||
    buses.find((bus) => bus.route_key === selectedRouteKey) ||
    null;

  const dashboardBuses = useMemo(() => {
    return COLLEGE_ROUTES.map((route) => {
      const bus = buses.find((item) => item.route_key === route.key);
      return (
        bus || {
          id: route.busId,
          bus_number: route.busNumber,
          route_id: route.id,
          route_key: route.key,
          status: "idle",
          trip_active: false,
          speed: 0,
          current_location: null,
        }
      );
    });
  }, [buses]);

  async function sendAdminMessage(kind = "message") {
    if (!selectedBus && !selectedRoute) return;
    const message = instruction || (kind === "route" ? "Route change: follow the latest pickup instructions." : "Please follow the admin instruction.");
    const payload = { bus_id: selectedBus?.id || selectedRoute.busId, message, audience: "all" };
    if (kind === "route") await api.routeChange(payload).catch(() => null);
    else await api.adminMessage(payload).catch(() => null);
    send({ type: kind === "route" ? "route_change" : "admin_message", route_key: selectedRouteKey, notification: { message } });
    toast.success(kind === "route" ? "Route change broadcast sent." : "Instruction sent.");
    setInstruction("");
  }

  function resolveAlert(alert) {
    setAlerts((items) => items.filter((item) => item.id !== alert.id));
    send({ type: "alert_resolved", route_key: alert.route_key || selectedRouteKey, alert_id: alert.id, message: "Alert resolved by management." });
    toast.success("Resolved alert cleared from active dashboard state.");
  }

  return (
    <Layout footer={false}>
      <section className="section py-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Management Dashboard</p>
          <h1 className="text-3xl font-extrabold text-ink">SDM live route command center</h1>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <StatCard label="Realtime" value={connected ? "Online" : "Demo"} tone={connected ? "leaf" : "sun"} helper="WebSocket admin room" />
          <StatCard label="Active Buses" value={dashboardBuses.filter((bus) => bus.trip_active).length} tone="brand" helper="Dharwad + Hubli" />
          <StatCard label="Alerts" value={alerts.length} tone="coral" helper="Active unresolved only" />
          <StatCard label="Destination" value="SDM" tone="leaf" helper="College highlighted on map" />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-5">
            <LiveMap buses={dashboardBuses} routes={routes} selectedBusId={selectedBus?.id} showAllRoutes />
            <div className="grid gap-4 md:grid-cols-2">
              {COLLEGE_ROUTES.map((route) => {
                const bus = dashboardBuses.find((item) => item.route_key === route.key);
                return (
                  <button
                    key={route.key}
                    onClick={() => setSelectedRouteKey(route.key)}
                    className={`rounded-lg border p-4 text-left transition ${
                      selectedRouteKey === route.key ? "border-brand bg-cyan-50 shadow-soft" : "border-slate-200 bg-white"
                    }`}
                  >
                    <p className="font-extrabold text-ink">{route.driverLabel}</p>
                    <p className="mt-1 text-sm text-slate-600">{bus?.bus_number} | {bus?.status || "idle"}</p>
                  </button>
                );
              })}
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-ink">Selected Driver Details</h3>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <p><strong>Status:</strong> {selectedBus?.trip_active ? "Active" : "Inactive"}</p>
                <p><strong>Route:</strong> {selectedRoute?.name}</p>
                <p><strong>Bus:</strong> {selectedBus?.bus_number || selectedRoute?.busNumber}</p>
                <p><strong>Speed:</strong> {selectedBus?.speed || 0} km/h</p>
                <p><strong>Trip:</strong> {selectedBus?.trip_active ? "Running" : "Stopped"}</p>
                <p><strong>Alert:</strong> {alerts.find((alert) => alert.bus_id === selectedBus?.id)?.message || "None"}</p>
                <p className="md:col-span-2">
                  <strong>GPS:</strong>{" "}
                  {selectedBus?.current_location ? `${selectedBus.current_location.lat}, ${selectedBus.current_location.lng}` : "Waiting for driver GPS"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <Siren className="text-coral" />
                <h3 className="text-lg font-bold text-ink">Active SOS / Breakdown</h3>
              </div>
              {alerts.length ? (
                alerts.map((alert) => (
                  <div key={alert.id || alert.message} className="mt-4 rounded-lg bg-rose-50 p-4 text-sm text-coral">
                    <p className="font-bold">{alert.message}</p>
                    {alert.location ? <p className="text-xs">Lat {alert.location.lat}, Lng {alert.location.lng}</p> : null}
                    <button onClick={() => resolveAlert(alert)} className="soft-button mt-3 bg-white text-coral">
                      <CheckCircle2 size={17} /> Mark Resolved
                    </button>
                  </div>
                ))
              ) : (
                <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm font-semibold text-leaf">No active unresolved alerts.</p>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-ink">Send Instructions</h3>
              <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} className="mt-4 min-h-24 w-full rounded-lg border border-slate-200 p-3" placeholder="Message to selected route driver/students" />
              <button onClick={() => sendAdminMessage("message")} className="soft-button mt-3 w-full bg-leaf text-white">
                <Send size={18} /> Send to Selected Route
              </button>
              <button onClick={() => sendAdminMessage("route")} className="soft-button mt-3 w-full bg-brand text-white">
                Broadcast Route Change
              </button>
            </div>

            <RouteChat routeKey={selectedRouteKey} title={`Admin Chat - ${selectedRoute?.name}`} audience="driver" placeholder="Message selected route driver" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
