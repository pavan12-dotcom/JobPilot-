'use client';
// components/dashboard/MatchChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart, Area,
} from 'recharts';

const DEMO_DATA = [
  { day: 'Mon', applied: 3, matched: 12, score: 78 },
  { day: 'Tue', applied: 5, matched: 18, score: 82 },
  { day: 'Wed', applied: 2, matched: 8, score: 75 },
  { day: 'Thu', applied: 7, matched: 22, score: 88 },
  { day: 'Fri', applied: 4, matched: 15, score: 84 },
  { day: 'Sat', applied: 1, matched: 6, score: 71 },
  { day: 'Sun', applied: 8, matched: 24, score: 91 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-semibold text-text mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }} className="text-xs">
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MatchChart({ data = DEMO_DATA }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="appliedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4D5E" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#EF4D5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
          <XAxis dataKey="day" tick={{ fill: '#8A8A9C', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8A8A9C', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="matched" fill="url(#appliedGrad)" stroke="#EF4D5E" strokeWidth={2.5} name="Jobs Matched" />
          <Bar dataKey="applied" fill="#10B981" opacity={0.8} radius={[4, 4, 0, 0]} name="Applied" />
          <Line type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={2} dot={false} name="Avg Score" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
