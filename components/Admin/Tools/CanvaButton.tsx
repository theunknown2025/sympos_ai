import React from 'react';
import { ArrowLeft, Palette } from 'lucide-react';

interface CanvaButtonProps {
  onBack?: () => void;
  onClick?: () => void;
}

const CanvaButton: React.FC<CanvaButtonProps> = ({
  onBack,
  onClick,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create Certificate Background
            </h1>
            <p className="text-sm text-slate-500">Design your certificate background</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <Palette className="text-indigo-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Design Certificate Background
          </h2>
          <p className="text-slate-600 mb-6">
            Create a beautiful certificate background using our design editor
          </p>
          <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-lg transition-colors"
          >
            <Palette size={24} />
            Open Design Editor
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvaButton;

