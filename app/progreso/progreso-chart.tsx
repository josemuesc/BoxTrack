"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Punto = { fecha: string; peso_kg: number };

export default function ProgresoChart({ data }: { data: Punto[] }) {
  const chartData = data.map((d) => ({
    label: new Date(`${d.fecha}T00:00:00`).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    }),
    peso: d.peso_kg,
  }));

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="#2e2e2e" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#a3a3a3", fontSize: 11 }}
            axisLine={{ stroke: "#2e2e2e" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip
            contentStyle={{
              background: "#161616",
              border: "1px solid #2e2e2e",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a3a3a3" }}
            itemStyle={{ color: "#ff7a1a" }}
            formatter={(value) => [`${value} kg`, "Peso"]}
          />
          <Line
            type="monotone"
            dataKey="peso"
            stroke="#ff7a1a"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#ff7a1a", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
