import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';

interface ParticipantBulkUploadPanelProps {
  fileName: string;
  participantCount: number;
  error: string;
  onFile: (file: File) => void | Promise<void>;
  onClose: () => void;
}

const SAMPLE_ROWS = [
  { fullName: 'Jane Doe', email: 'jane@example.com' },
  { fullName: 'John Smith', email: 'john@example.com' },
  { fullName: 'Marie Dupont', email: 'marie@example.com' },
];

const ParticipantBulkUploadPanel: React.FC<ParticipantBulkUploadPanelProps> = ({
  fileName,
  participantCount,
  error,
  onFile,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const acceptFile = async (file: File) => {
    setProcessing(true);
    try {
      await onFile(file);
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void acceptFile(file);
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-indigo-100 bg-white/80">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FileSpreadsheet size={18} className="text-indigo-600" />
          Bulk upload
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          aria-label="Close bulk upload"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0">
        {/* Left — instructions & table illustration */}
        <div className="p-5 lg:border-r border-indigo-100 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">How it works</h4>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Prepare a spreadsheet with one participant per row.</li>
              <li>
                Required columns: <strong className="text-slate-800">full name</strong> and{' '}
                <strong className="text-slate-800">email</strong>.
              </li>
              <li>In Excel: File → Save As → <strong className="text-slate-800">CSV</strong>.</li>
              <li>Upload the file — one form is created per row; passwords are auto-generated.</li>
              <li>Maximum 15 participants per batch.</li>
            </ol>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Expected format
            </p>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-indigo-50 border-b border-indigo-100">
                    <th className="px-3 py-2 text-left font-semibold text-indigo-900">full name</th>
                    <th className="px-3 py-2 text-left font-semibold text-indigo-900">email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SAMPLE_ROWS.map((row) => (
                    <tr key={row.email} className="text-slate-600">
                      <td className="px-3 py-2">{row.fullName}</td>
                      <td className="px-3 py-2 font-mono text-[11px]">{row.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-3 py-1.5 text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100">
                First row must be column headers
              </p>
            </div>
          </div>
        </div>

        {/* Right — drag & drop upload */}
        <div className="p-5 flex flex-col">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void acceptFile(file);
              e.target.value = '';
            }}
          />

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 min-h-[220px] flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-100/60'
                : 'border-indigo-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40'
            } ${processing ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <div
              className={`p-3 rounded-full ${
                isDragging ? 'bg-indigo-200 text-indigo-700' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              <Upload size={28} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">
                {isDragging ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
              </p>
              <p className="text-xs text-slate-500 mt-1">or</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
              >
                Browse files
              </button>
            </div>
            <p className="text-[11px] text-slate-400">CSV or TXT · exported from Excel</p>
          </div>

          {fileName && !error && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {participantCount} participant form{participantCount !== 1 ? 's' : ''} loaded
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantBulkUploadPanel;
