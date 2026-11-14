import React from 'react';
import { ClipboardList } from 'lucide-react';

export interface CheckinConfiguredFieldRow {
  key: string;
  label: string;
  value: string;
}

interface CheckinConfiguredFieldsPanelProps {
  fields: CheckinConfiguredFieldRow[];
  variant?: 'light' | 'dark';
  title?: string;
}

const CheckinConfiguredFieldsPanel: React.FC<CheckinConfiguredFieldsPanelProps> = ({
  fields,
  variant = 'light',
  title = 'Check-in details',
}) => {
  if (fields.length === 0) return null;

  const isDark = variant === 'dark';

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        isDark
          ? 'border-slate-700 bg-slate-800/50'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <h3
        className={`text-sm font-semibold flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        <ClipboardList size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
        {title}
      </h3>
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.key}>
            <p
              className={`text-xs uppercase tracking-wide ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {field.label}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckinConfiguredFieldsPanel;
