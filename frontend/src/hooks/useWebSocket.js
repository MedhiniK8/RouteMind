import { useEffect, useMemo, useRef, useState } from "react";
import { demoBuses, demoRoutes } from "../services/mockData";
import { nextPoint } from "../utils/geo";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

export function useWebSocket(room, enabled = true) {
  const [lastMessage, setLastMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled || !room) return undefined;
    let closed = false;
    let reconnect;
    const connect = () => {
      const socket = new WebSocket(`${WS_URL}/ws/${room}`);
      socketRef.current = socket;
      socket.onopen = () => setConnected(true);
      socket.onmessage = (event) => setLastMessage(JSON.parse(event.data));
      socket.onclose = () => {
        setConnected(false);
        if (!closed) reconnect = setTimeout(connect, 2500);
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(reconnect);
      socketRef.current?.close();
    };
  }, [room, enabled]);

  const send = useMemo(
    () => (payload) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(payload));
      }
    },
    []
  );

  return { connected, lastMessage, send };
}

export function mergeBusUpdate(buses, message) {
  if (!message?.bus) return buses;
  const exists = buses.some((bus) => bus.id === message.bus.id);
  if (exists) {
    return buses.map((bus) => (bus.id === message.bus.id ? { ...bus, ...message.bus } : bus));
  }
  return [...buses, message.bus];
}

export function useDemoBusFeed(seedBuses = demoBuses) {
  const [buses, setBuses] = useState(seedBuses);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((value) => value + 1);
      setBuses((items) =>
        items.map((bus, index) => {
          const route = demoRoutes.find((item) => item.id === bus.route_id);
          const point = nextPoint(route?.polyline, tick + index);
          return bus.trip_active
            ? { ...bus, current_location: point, speed: bus.status === "delayed" ? 14 : 27 + ((tick + index) % 6) }
            : bus;
        })
      );
    }, 2600);
    return () => clearInterval(id);
  }, [tick]);

  return buses;
}
