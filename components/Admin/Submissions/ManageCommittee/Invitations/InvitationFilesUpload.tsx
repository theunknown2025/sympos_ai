import React, { useRef, useState } from 'react';
import { CloudUpload, File, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { uploadFileToStorage } from '../../../../../services/storageService';
import type { CommitteeInvitationAttachment } from '../../../../../types';

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ACCEPT =
  '.pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp';

interface InvitationFilesUploadProps {
  userId: string;
  files: CommitteeInvitationAttachment[];
  onChange: (files: CommitteeInvitationAttachment[]) => void;
  disabled?: boolean;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const InvitationFilesUpload: React.FC<InvitationFilesUploadProps> = ({
  userId,
  files,
  onChange,
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
          const url = await uploadFileToStorage(userId, file, 'committee-invitation-files');
          return {
            id: crypto.randomUUID(),
            fileName: file.name,
            fileUrl: url,
            fileSize: file.size,
            fileType: file.type,
          } satisfies CommitteeInvitationAttachment;
        })
      );
      onChange([...files, ...uploaded]);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Documents to include</label>
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
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) await uploadList(e.dataTransfer.files);
        }}
        onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
          ${uploading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          disabled={uploading || disabled}
          onChange={async (e) => {
            if (!e.target.files?.length) return;
            await uploadList(e.target.files);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <Loader2 className="mx-auto animate-spin text-indigo-600" size={28} />
        ) : (
          <CloudUpload className="mx-auto text-slate-400 mb-2" size={28} />
        )}
        <p className="text-sm text-slate-600">Drop files here or click to upload (max 50 MB each)</p>
      </div>
      {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <File size={18} className="text-indigo-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.fileName}</p>
                {file.fileSize != null && (
                  <p className="text-xs text-slate-500">{formatFileSize(file.fileSize)}</p>
                )}
              </div>
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-500 hover:text-indigo-600"
                title="Open"
              >
                <ExternalLink size={16} />
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(files.filter((f) => f.id !== file.id))}
                  className="p-1.5 text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InvitationFilesUpload;
