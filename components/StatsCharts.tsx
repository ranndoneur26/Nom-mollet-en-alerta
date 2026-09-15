"use client";

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useDictionary } from "@/lib/i18n/dictionary-context";
import { STATUS_COLORS } from "@/lib/reference-data";

export function StatsCharts({
  byMonth, byCategory, byStatus, byNeighborhood,
}: {
  byMonth: { month: string; count: number }[];
  byCategory: { name: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byNeighborhood: { name: string; count: number }[];
}) {
  const { dict } = useDictionary();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="chart-grid">
      <div className="panel" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>{dict.dashboard.byMonth}</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={byMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={10.5} />
            <YAxis allowDecimals={false} fontSize={10.5} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#173B4C" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>{dict.dashboard.byCategory}</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byCategory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={9} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} fontSize={10.5} />
            <Tooltip />
            <Bar dataKey="count" fill="#1F7A68" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>{dict.dashboard.byStatus}</h4>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byStatus} dataKey="count" nameKey="status" outerRadius={80} label={(e) => e.status}>
              {byStatus.map((s, i) => (
                <Cell key={i} fill={STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] ?? "#999"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>{dict.dashboard.byNeighborhood}</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byNeighborhood}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={9} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} fontSize={10.5} />
            <Tooltip />
            <Bar dataKey="count" fill="#C97B1E" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
