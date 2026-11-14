import React, { useRef, useState } from 'react';
import { CloudUpload, File, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { uploadFileToStorage } from '../../../services/storageService';
import type { OpportunityAttachedFile } from '../../../types';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

const ACCEPT =
  '.pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp';

interface OpportunityFilesUploadProps {
  userId: string;
  files: OpportunityAttachedFile[];
  onChange: (files: OpportunityAttachedFile[]) => void;
  storagePrefix?: string;
  disabled?: boolean;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const OpportunityFilesUpload: React.FC<OpportunityFilesUploadProps> = ({
  userId,
  files,
  onChange,
  storagePrefix = 'draft',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const uploadList = async (fileList: FileList | File[]) => {
    const selected = Array.from(fileList);
    if (!selected.length || disabled) return;

    const tooLarge = selected.find((f) => f.size > MAX_FILE_BYTES);
    if (tooLarge) {
      setUploadError(`"${tooLarge.name}" exceeds 50 MB limit`);
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const uploaded = await Promise.all(
        selected.map(async (file) => {
          const url = await uploadFileToStorage(userId, file, 'opportunity-files');
          return {
            id: crypto.randomUUID(),
            fileName: file.name,
            fileUrl: url,
            fileSize: file.size,
            fileType: file.type,
          } satisfies OpportunityAttachedFile;
        })
      );
      onChange([...files, ...uploaded]);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await uploadList(e.target.files);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) await uploadList(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Upload files</label>
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
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
          ${uploading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={handleFileInput}
          disabled={uploading || disabled}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-sm font-medium text-slate-700">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}`}
            >
              <CloudUpload size={32} className={isDragging ? 'text-indigo-600' : 'text-slate-400'} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {isDragging ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-xs text-slate-500">
                or <span className="text-indigo-600 font-medium">click to browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Multiple files · PDF, Office, images, ZIP · max 50 MB each
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">Attached files ({files.length})</p>
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <File size={20} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{file.fileName}</p>
                  {file.fileSize != null && (
                    <p className="text-xs text-slate-500">{formatFileSize(file.fileSize)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  title="Open"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  disabled={disabled}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OpportunityFilesUpload;
