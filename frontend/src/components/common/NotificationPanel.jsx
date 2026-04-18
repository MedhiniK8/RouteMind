import { Bell, CircleAlert, Info } from "lucide-react";

export default function NotificationPanel({ notifications }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink">Smart Alerts</h3>
        <Bell className="text-brand" size={20} />
      </div>
      <div className="mt-4 space-y-3">
        {notifications.map((item) => (
          <div key={item.id || item.message} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex gap-3">
              {item.priority === "high" || item.priority === "critical" ? (
                <CircleAlert className="mt-0.5 text-coral" size={18} />
              ) : (
                <Info className="mt-0.5 text-brand" size={18} />
              )}
              <div>
                <p className="text-sm font-semibold capitalize text-ink">{item.type}</p>
                <p className="text-sm text-slate-600">{item.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
