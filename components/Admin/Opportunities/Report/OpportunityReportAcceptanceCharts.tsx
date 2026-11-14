import React from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type {
  OpportunityReportAcceptanceSlice,
  OpportunityReportStepAcceptance,
} from './types';

interface OpportunityReportAcceptanceChartsProps {
  totalAcceptancePercent: number;
  totalSlices: OpportunityReportAcceptanceSlice[];
  stepAcceptance: OpportunityReportStepAcceptance[];
  showOverall?: boolean;
  showSteps?: boolean;
  compactOverall?: boolean;
}

function AcceptancePie({
  title,
  percent,
  slices,
  size = 'md',
}: {
  title: string;
  percent: number;
  slices: OpportunityReportAcceptanceSlice[];
  size?: 'md' | 'lg';
}) {
  const outer = size === 'lg' ? 100 : 72;
  const height = size === 'lg' ? 'h-64' : 'h-52';

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold text-slate-800 mb-1 text-center">{title}</p>
      <p className="text-2xl font-bold text-indigo-600 mb-2 tabular-nums">{percent}%</p>
      <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wide">acceptance</p>
      <div className={`w-full ${height}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={outer * 0.45}
              outerRadius={outer}
              paddingAngle={2}
              dataKey="value"
            >
              {slices.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const OpportunityReportAcceptanceCharts: React.FC<OpportunityReportAcceptanceChartsProps> = ({
  totalAcceptancePercent,
  totalSlices,
  stepAcceptance,
  showOverall = true,
  showSteps = true,
  compactOverall = false,
}) => {
  return (
    <div className="space-y-6 h-full">
      {showOverall && (
        <div
          className={`h-full rounded-xl border border-slate-100 bg-slate-50 ${
            compactOverall ? 'p-4' : 'p-6'
          }`}
        >
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Overall acceptance</h4>
          <p className="text-xs text-slate-500 mb-3">
            Share of decided applications that were accepted (completed) vs rejected
          </p>
          <AcceptancePie
            title="All applications"
            percent={totalAcceptancePercent}
            slices={totalSlices}
            size={compactOverall ? 'md' : 'lg'}
          />
        </div>
      )}

      {showSteps && stepAcceptance.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-4">Acceptance by step</h4>
          <p className="text-xs text-slate-500 mb-4">
            Advanced vs rejected among applications reviewed at each step
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stepAcceptance.map((step) => (
              <div
                key={step.key}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <AcceptancePie
                  title={`Step ${step.stepIndex + 1}: ${step.title}`}
                  percent={step.acceptancePercent}
                  slices={step.slices}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityReportAcceptanceCharts;
