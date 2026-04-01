import React, { useState, useRef } from 'react';
import { Plus, Trash2, Save, X, Loader2, Upload, File, Download, CloudUpload } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  savePaymentMethod,
  type PaymentMethod,
  type PaymentMethodField,
} from '../../../../services/paymentService';
import { uploadFileToStorage } from '../../../../services/storageService';
import { STORAGE_BUCKETS } from '../../../../supabase';
import { supabase, TABLES } from '../../../../supabase';

interface PaymentMethodFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

interface NewPaymentInformationProps {
  editingMethod?: PaymentMethod | null;
  onSave: () => void;
  onCancel: () => void;
}

const NewPaymentInformation: React.FC<NewPaymentInformationProps> = ({
  editingMethod,
  onSave,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const [paymentMethodName, setPaymentMethodName] = useState(editingMethod?.name || '');
  const [fields, setFields] = useState<PaymentMethodField[]>(
    editingMethod?.fields.map(f => ({
      id: f.id,
      name: f.name,
      content: f.content,
    })) || []
  );
  const [files, setFiles] = useState<PaymentMethodFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load existing files when editing
  React.useEffect(() => {
    if (editingMethod?.id) {
      loadFiles(editingMethod.id);
    }
  }, [editingMethod?.id]);

  const loadFiles = async (paymentMethodId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENT_METHOD_FILES)
        .select('*')
        .eq('payment_method_id', paymentMethodId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      setFiles((data || []).map(f => ({
        id: f.id,
        fileName: f.file_name,
        fileUrl: f.file_url,
        fileSize: f.file_size,
        fileType: f.file_type,
      })));
    } catch (error: any) {
      console.error('Error loading files:', error);
    }
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    if (!currentUser || fileList.length === 0) return;

    const selectedFiles = Array.from(fileList);
    setUploadingFiles(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileUrl = await uploadFileToStorage(
          currentUser.id,
          file,
          'payment-method-files'
        );

        return {
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          fileType: file.type,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles([...files, ...uploadedFiles]);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files: ' + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    await uploadFiles(event.target.files);
    // Reset input
    event.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    await uploadFiles(e.dataTransfer.files);
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  const addField = () => {
    const newField: PaymentMethodField = {
      id: Date.now().toString(),
      name: '',
      content: '',
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<PaymentMethodField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('You must be logged in to save payment methods');
      return;
    }

    if (!paymentMethodName.trim()) {
      alert('Please enter a payment method name');
      return;
    }

    setSaving(true);
    try {
      const methodData: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string } = {
        name: paymentMethodName,
        fields: fields.filter(f => f.name.trim() && f.content.trim()).map(f => ({
          id: f.id || '',
          paymentMethodId: editingMethod?.id || '',
          name: f.name,
          content: f.content,
          displayOrder: 0,
          createdAt: new Date(),
        })),
      };

      if (editingMethod) {
        methodData.id = editingMethod.id;
      }

      const savedMethodId = await savePaymentMethod(currentUser.id, methodData);

      // Save files to database
      if (files.length > 0 && savedMethodId) {
        // Delete existing files if editing
        if (editingMethod?.id) {
          await supabase
            .from(TABLES.PAYMENT_METHOD_FILES)
            .delete()
            .eq('payment_method_id', savedMethodId);
        }

        // Insert new files
        const filesData = files.map(f => ({
          payment_method_id: savedMethodId,
          file_name: f.fileName,
          file_url: f.fileUrl,
          file_size: f.fileSize || null,
          file_type: f.fileType || null,
        }));

        const { error: filesError } = await supabase
          .from(TABLES.PAYMENT_METHOD_FILES)
          .insert(filesData);

        if (filesError) {
          throw filesError;
        }
      }
      
      // Reset form
      setPaymentMethodName('');
      setFields([]);
      setFiles([]);
      onSave();
    } catch (error: any) {
      console.error('Error saving payment method:', error);
      alert('Failed to save payment method: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">
        {editingMethod ? 'Edit Payment Method' : 'New Payment Method Information'}
      </h2>

      <div className="space-y-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={paymentMethodName}
            onChange={(e) => setPaymentMethodName(e.target.value)}
            placeholder="Enter payment method name"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Fields Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-slate-700">
              Fields
            </label>
            <button
              onClick={addField}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Add Field
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
              <p className="text-slate-500">No fields added yet. Click "Add Field" to add one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Field Name
                      </label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="Field name"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Field Content
                      </label>
                      <input
                        type="text"
                        value={field.content}
                        onChange={(e) => updateField(field.id, { content: e.target.value })}
                        placeholder="Field content"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeField(field.id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                  >
                    <Trash2 size={16} />
                    Remove Field
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Files
          </label>

          {/* Drag and Drop Zone */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClickUpload}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragging 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
              }
              ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploadingFiles}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx"
            />

            {uploadingFiles ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <p className="text-sm font-medium text-slate-700">Uploading files...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}`}>
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
                    Supported: PDF, DOC, DOCX, TXT, JPG, PNG, XLS, XLSX (Max 50MB per file)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Uploaded Files ({files.length})
              </p>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-white"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File size={20} className="text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{file.fileName}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.fileSize)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file.fileUrl, file.fileName);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving || uploadingFiles}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save
              </>
            )}
          </button>
          {editingMethod && (
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewPaymentInformation;
