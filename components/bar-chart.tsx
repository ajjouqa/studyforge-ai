export function BarChart({
  data,
  height = 120,
  unit = "",
}: {
  data: { label: string; value: number }[];
  height?: number;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex flex-1 flex-col items-center justify-end gap-1"
        >
          <div
            className="w-full rounded-t bg-accent/70"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            title={`${d.label}: ${d.value}${unit}`}
          />
          <span className="text-[9px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
