import React, { useRef, useState } from 'react';
import { AlertCircle, FileSpreadsheet, GripVertical, Upload, X } from 'lucide-react';
import {
  BULK_INVITATION_FORMAT_ERROR,
  findEmailColumn,
  mergeFieldToken,
  parseBulkInvitationCsv,
  type ParsedBulkInvitationFile,
} from './bulkInvitationCsvUtils';

interface BulkInvitationCsvSectionProps {
  parsedFile: ParsedBulkInvitationFile | null;
  onParsedFileChange: (file: ParsedBulkInvitationFile | null) => void;
  disabled?: boolean;
}

const BulkInvitationCsvSection: React.FC<BulkInvitationCsvSectionProps> = ({
  parsedFile,
  onParsedFileChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.txt')) {
      setError("File doesn't respect format. Upload a CSV file with column titles in the first row.");
      onParsedFileChange(null);
      setFileName('');
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseBulkInvitationCsv(text);
      const emailColumn = findEmailColumn(parsed.headers);
      if (!emailColumn) {
        setError("File doesn't respect format. An 'email' column is required in the first row.");
        onParsedFileChange(null);
        setFileName('');
        return;
      }
      onParsedFileChange(parsed);
      setFileName(file.name);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : BULK_INVITATION_FORMAT_ERROR;
      setError(message);
      onParsedFileChange(null);
      setFileName('');
    }
  };

  const clearFile = () => {
    onParsedFileChange(null);
    setFileName('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-indigo-600" />
            Bulk recipients (CSV)
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            First row must contain column titles (e.g. name, email, fonction). From Excel: save as CSV.
          </p>
        </div>
        {parsedFile && (
          <button
            type="button"
            onClick={clearFile}
            disabled={disabled}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-white"
            title="Remove file"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,text/csv"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {!parsedFile ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-indigo-300 rounded-lg bg-white hover:border-indigo-400 hover:bg-indigo-50/50 disabled:opacity-50"
        >
          <Upload size={24} className="text-indigo-500" />
          <span className="text-sm font-medium text-slate-700">Upload CSV file</span>
          <span className="text-xs text-slate-500">Drag fields below into subject and message after upload</span>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-700 bg-white rounded-lg border border-slate-200 px-3 py-2">
            <span className="font-medium truncate">{fileName}</span>
            <span className="text-slate-500 shrink-0 ml-2">{parsedFile.rows.length} recipients</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Drag fields into subject or message
            </p>
            <div className="flex flex-wrap gap-2">
              {parsedFile.headers.map((header) => (
                <button
                  key={header}
                  type="button"
                  draggable={!disabled}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', mergeFieldToken(header));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-indigo-200 text-sm text-indigo-800 hover:bg-indigo-100 cursor-grab active:cursor-grabbing disabled:opacity-50"
                >
                  <GripVertical size={14} className="text-indigo-400" />
                  {header}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {parsedFile.headers.map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium text-slate-700 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedFile.rows.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {parsedFile.headers.map((header) => (
                      <td key={header} className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {row[header] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedFile.rows.length > 5 && (
              <p className="text-xs text-slate-500 px-3 py-2 border-t border-slate-100">
                + {parsedFile.rows.length - 5} more row{parsedFile.rows.length - 5 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default BulkInvitationCsvSection;
