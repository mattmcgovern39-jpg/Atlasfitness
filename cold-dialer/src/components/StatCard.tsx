export function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      {sublabel && <div className="mt-1 text-xs text-slate-500">{sublabel}</div>}
    </div>
  );
}
