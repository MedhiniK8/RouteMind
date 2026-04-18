export default function StatCard({ label, value, tone = "brand", helper }) {
  const colors = {
    brand: "bg-cyan-50 text-brand",
    coral: "bg-rose-50 text-coral",
    sun: "bg-amber-50 text-amber-700",
    leaf: "bg-green-50 text-leaf",
  };

  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <div className={`mt-3 inline-flex rounded-lg px-3 py-2 text-2xl font-bold ${colors[tone]}`}>
        {value}
      </div>
      {helper ? <p className="mt-3 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}
