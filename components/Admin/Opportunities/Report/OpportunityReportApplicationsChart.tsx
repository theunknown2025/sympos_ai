import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OpportunityReportTimePoint } from './types';

interface OpportunityReportApplicationsChartProps {
  data: OpportunityReportTimePoint[];
  periodStartLabel: string;
  periodEndLabel: string;
}

const OpportunityReportApplicationsChart: React.FC<OpportunityReportApplicationsChartProps> = ({
  data,
  periodStartLabel,
  periodEndLabel,
}) => {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <p className="text-xs text-slate-500 mb-4">
        From opportunity creation ({periodStartLabel}) to deadline ({periodEndLabel})
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="oppAppsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'cumulative') return [value, 'Total applications'];
                return [value, 'New this period'];
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#oppAppsGradient)"
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#a78bfa"
              strokeWidth={1.5}
              fillOpacity={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-slate-400 mt-2 text-center">
        Solid line: cumulative applications · Light line: new per period
      </p>
    </div>
  );
};

export default OpportunityReportApplicationsChart;
