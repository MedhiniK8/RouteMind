import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { Bus, GraduationCap, MapPin, Navigation } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { campusCenter } from "../../utils/geo";

function makeBusIcon({ selected = false, breakdown = false } = {}) {
  return L.divIcon({
    html: renderToStaticMarkup(
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 ${selected ? "border-amber-300 ring-4 ring-amber-200" : "border-white"} ${breakdown ? "bg-coral" : "bg-brand"} text-white shadow-lg`}>
      <Bus size={22} />
      </div>
    ),
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

const stopIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="rounded-full bg-coral p-1 text-white shadow">
      <MapPin size={14} />
    </div>
  ),
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const studentIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-leaf text-white shadow-lg">
      <Navigation size={18} />
    </div>
  ),
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const collegeIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="flex min-w-48 items-center gap-2 rounded-lg border-2 border-amber-300 bg-white px-3 py-2 text-sm font-extrabold text-ink shadow-lg">
      <GraduationCap className="text-coral" size={20} />
      SDM Engineering College
    </div>
  ),
  className: "",
  iconSize: [210, 42],
  iconAnchor: [105, 42],
});

export default function LiveMap({ buses = [], routes = [], selectedBusId, height = "min-h-[420px]", studentLocation, showAllRoutes = false }) {
  const selectedBus = buses.find((bus) => bus.id === selectedBusId) || buses[0];
  const selectedRoute = routes.find((route) => route.id === selectedBus?.route_id) || routes[0];
  const center = selectedBus?.current_location
    ? [selectedBus.current_location.lat, selectedBus.current_location.lng]
    : campusCenter;

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${height}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full min-h-[420px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {(showAllRoutes ? routes : []).map((route) =>
          route?.polyline ? (
            <Polyline key={route.id} positions={route.polyline} pathOptions={{ color: "#0E7490", weight: 5, opacity: 0.54 }} />
          ) : null
        )}
        {!showAllRoutes && selectedRoute?.polyline ? (
          <Polyline positions={selectedRoute.polyline} pathOptions={{ color: "#0E7490", weight: 5, opacity: 0.74 }} />
        ) : null}
        {selectedRoute?.stops?.map((stop) => (
          <Marker key={stop.id} icon={stopIcon} position={[stop.lat, stop.lng]}>
            <Popup>
              <strong>{stop.name}</strong>
              <br />
              Stop {stop.order}
            </Popup>
          </Marker>
        ))}
        {buses.map((bus) =>
          bus.current_location ? (
            <Marker
              key={bus.id}
              icon={makeBusIcon({ selected: bus.id === selectedBusId, breakdown: bus.status === "breakdown" })}
              position={[bus.current_location.lat, bus.current_location.lng]}
            >
              <Popup>
                <strong>{bus.bus_number}</strong>
                <br />
                {bus.status} | {bus.speed} km/h
              </Popup>
            </Marker>
          ) : null
        )}
        {studentLocation ? (
          <Marker icon={studentIcon} position={[studentLocation.lat, studentLocation.lng]}>
            <Popup>Your live location</Popup>
          </Marker>
        ) : null}
        <Marker icon={collegeIcon} position={[15.3919, 75.0249]}>
          <Popup>
            <strong>SDM Engineering College, Dharwad</strong>
            <br />
            Highlighted destination for both routes.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
