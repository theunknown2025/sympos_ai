import React, { useRef } from 'react';

interface InvitationMergeFieldInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}

const InvitationMergeFieldInput: React.FC<InvitationMergeFieldInputProps> = ({
  label,
  required = false,
  value,
  onChange,
  multiline = false,
  rows = 12,
  placeholder,
  hint,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const insertAtCursor = (token: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(`${value}${token}`);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
    onChange(next);

    requestAnimationFrame(() => {
      const pos = start + token.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const token = e.dataTransfer.getData('text/plain');
    if (token) insertAtCursor(token);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const commonClass =
    'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm';

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={commonClass}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={commonClass}
        />
      )}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
};

export default InvitationMergeFieldInput;
