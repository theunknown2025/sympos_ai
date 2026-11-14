import React from 'react';
import { Check, ClipboardCheck, Send, ShieldCheck, UserPlus, type LucideIcon } from 'lucide-react';
import type { AccountManagerStep } from './types';

const STEPS: {
  id: AccountManagerStep;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { id: 'add', label: 'Add', description: 'Enter participant details', icon: UserPlus },
  { id: 'validate', label: 'Validate', description: 'Check existing accounts', icon: ShieldCheck },
  { id: 'approve', label: 'Approve', description: 'Review credentials', icon: ClipboardCheck },
  { id: 'send', label: 'Send', description: 'Email invitations', icon: Send },
];
interface AccountManagerProgressBarProps {
  currentStep: AccountManagerStep;
  completed?: boolean;
}

const AccountManagerProgressBar: React.FC<AccountManagerProgressBarProps> = ({
  currentStep,
  completed = false,
}) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progressPercent = completed
    ? 100
    : Math.round(((currentIndex + 1) / STEPS.length) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Account manager
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            Step {completed ? STEPS.length : currentIndex + 1} of {STEPS.length}
            {!completed && currentIndex >= 0 && (
              <span className="text-slate-700 font-medium"> · {STEPS[currentIndex]?.label}</span>
            )}
            {completed && <span className="text-emerald-700 font-medium"> · Complete</span>}
          </p>
        </div>
        <span className="text-sm font-semibold text-indigo-600 tabular-nums">{progressPercent}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-6">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            completed ? 'bg-emerald-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ol className="flex items-start w-full">
        {STEPS.map((step, index) => {
          const isDone = completed || index < currentIndex;
          const isActive = !completed && step.id === currentStep;
          const isUpcoming = !completed && index > currentIndex;
          const StepIcon = step.icon;

          return (            <li
              key={step.id}
              className={`flex items-start ${index < STEPS.length - 1 ? 'flex-1' : 'shrink-0'}`}
            >
              <div className="flex flex-col items-center min-w-[4.5rem] max-w-[5.5rem]">
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isActive
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isDone ? <Check size={18} strokeWidth={2.5} /> : <StepIcon size={18} strokeWidth={2} />}
                </div>                <p
                  className={`mt-2 text-xs font-semibold text-center leading-tight ${
                    isActive ? 'text-indigo-700' : isDone ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`mt-0.5 text-[10px] text-center leading-snug hidden sm:block ${
                    isUpcoming ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {step.description}
                </p>
              </div>

              {index < STEPS.length - 1 && (
                <div className="flex-1 pt-5 px-1 min-w-[1rem]">
                  <div className="h-0.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'w-full bg-emerald-500' : 'w-0 bg-indigo-600'
                      }`}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default AccountManagerProgressBar;
