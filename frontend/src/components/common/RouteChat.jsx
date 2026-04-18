import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../../services/api";
import { useWebSocket } from "../../hooks/useWebSocket";

export default function RouteChat({ routeKey, title, audience = "route", placeholder = "Type a message" }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { lastMessage } = useWebSocket(routeKey ? `route:${routeKey}` : null, Boolean(routeKey));

  useEffect(() => {
    if (!routeKey) return;
    api.request(`/api/chat/${routeKey}`).then(setMessages).catch(() => setMessages([]));
  }, [routeKey]);

  useEffect(() => {
    if (lastMessage?.type === "chat_message" && lastMessage.chat?.route_key === routeKey) {
      setMessages((items) => [...items.slice(-20), lastMessage.chat]);
    }
  }, [lastMessage, routeKey]);

  async function sendMessage() {
    if (!message.trim() || !routeKey) return;
    const payload = { route_key: routeKey, audience, message: message.trim() };
    try {
      const saved = await api.chat(payload);
      setMessages((items) => [...items.slice(-20), saved]);
    } catch {
      const saved = {
        id: `demo-chat-${Date.now()}`,
        route_key: routeKey,
        sender_name: "Demo User",
        sender_role: "demo",
        message: payload.message,
      };
      setMessages((items) => [...items.slice(-20), saved]);
      toast("Chat is in demo mode until backend is running.");
    }
    setMessage("");
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="text-brand" size={20} />
        <h3 className="text-lg font-bold text-ink">{title}</h3>
      </div>
      <div className="mt-4 max-h-44 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {messages.length ? (
          messages.map((item) => (
            <div key={item.id || `${item.sender_name}-${item.message}`} className="rounded-lg bg-white p-2 text-sm shadow-sm">
              <p className="font-bold text-ink">{item.sender_name || item.sender_role}</p>
              <p className="text-slate-600">{item.message}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No messages yet for this route.</p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder={placeholder}
        />
        <button onClick={sendMessage} className="rounded-lg bg-brand px-3 text-white">
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
