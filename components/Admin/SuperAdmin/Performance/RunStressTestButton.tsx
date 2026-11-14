import React from 'react';
import { Flame, Loader2 } from 'lucide-react';

interface RunStressTestButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
}

const RunStressTestButton: React.FC<RunStressTestButtonProps> = ({
  onClick,
  disabled,
  loading,
  fullWidth = true,
  size = 'md',
}) => {
  const py = size === 'sm' ? 'py-2' : 'py-2.5';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${fullWidth ? 'w-full' : ''} inline-flex items-center justify-center gap-2 px-4 ${py} rounded-lg ${text} font-semibold border-2 border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'sm' ? 16 : 18} className="animate-spin" />
          Stress testing…
        </>
      ) : (
        <>
          <Flame size={size === 'sm' ? 16 : 18} />
          Run Stress Test
        </>
      )}
    </button>
  );
};

export default RunStressTestButton;
