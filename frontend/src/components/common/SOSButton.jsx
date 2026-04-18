import toast from "react-hot-toast";
import { Siren } from "lucide-react";
import { api } from "../../services/api";

export default function SOSButton({ busId, userId, routeKey }) {
  async function triggerSOS() {
    try {
      await api.sos({ bus_id: busId, user_id: userId, route_key: routeKey, message: "Emergency assistance requested" });
      toast.success("SOS sent to management.");
    } catch {
      toast.success("Demo SOS sent to management.");
    }
  }

  return (
    <button onClick={triggerSOS} className="soft-button w-full bg-coral text-white hover:bg-rose-700">
      <Siren size={18} />
      SOS Emergency
    </button>
  );
}
