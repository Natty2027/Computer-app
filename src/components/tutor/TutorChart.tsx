import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import type { ChartSpec } from "@/lib/tutorVisuals";

// Palette that reads well in both light and dark themes.
const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

/**
 * Renders a tutor `chart` spec with recharts, or a data table for
 * `type: "table"`. Defensive by design — a spec missing its data/series
 * renders a small "couldn't render" note rather than throwing, so one
 * bad visual never takes down the chat.
 */
export function TutorChart({ spec }: { spec: ChartSpec }) {
  if (spec.type === "table") return <TutorTable spec={spec} />;

  const data = Array.isArray(spec.data) ? spec.data : [];
  const series =
    Array.isArray(spec.series) && spec.series.length > 0 ? spec.series : [];
  const xKey = spec.xKey ?? "name";

  if (data.length === 0 || (spec.type !== "pie" && series.length === 0)) {
    return <CantRender />;
  }

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis
        dataKey={spec.type === "scatter" ? xKey : xKey}
        type={spec.type === "scatter" ? "number" : "category"}
        name={spec.xLabel}
        tick={{ fontSize: 11 }}
        stroke="hsl(var(--muted-foreground))"
      />
      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
      <Tooltip
        contentStyle={{
          background: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 8,
          fontSize: 12,
        }}
      />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
    </>
  );

  let chart: React.ReactElement;
  switch (spec.type) {
    case "line":
      chart = (
        <LineChart data={data}>
          {axes}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      );
      break;
    case "area":
      chart = (
        <AreaChart data={data}>
          {axes}
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.25}
            />
          ))}
        </AreaChart>
      );
      break;
    case "scatter":
      chart = (
        <ScatterChart>
          {axes}
          {series.map((s, i) => (
            <Scatter
              key={s.key}
              data={data.map((d) => ({ [xKey]: d[xKey], [s.key]: d[s.key] }))}
              dataKey={s.key}
              name={s.name ?? s.key}
              fill={COLORS[i % COLORS.length]}
            />
          ))}
        </ScatterChart>
      );
      break;
    case "pie": {
      const valueKey = series[0]?.key ?? "value";
      chart = (
        <PieChart>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={{ fontSize: 11 }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      );
      break;
    }
    case "bar":
    default:
      chart = (
        <BarChart data={data}>
          {axes}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name ?? s.key}
              fill={COLORS[i % COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chart}
      </ResponsiveContainer>
    </div>
  );
}

function TutorTable({ spec }: { spec: ChartSpec }) {
  const columns = spec.columns ?? [];
  const rows = spec.rows ?? [];
  if (columns.length === 0 && rows.length === 0) return <CantRender />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {columns.length > 0 && (
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className="border-b border-border px-3 py-1.5 text-left font-semibold"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="odd:bg-secondary/30">
              {r.map((cell, ci) => (
                <td key={ci} className="border-b border-border/60 px-3 py-1.5">
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CantRender() {
  return (
    <p className="text-xs italic text-muted-foreground">
      (This chart couldn't be rendered.)
    </p>
  );
}
