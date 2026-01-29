import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Trash2, AlertCircle } from 'lucide-react';
import { RegistrationForm, FormField, FormSubmission, SubscriptionType, SubscriptionRole } from '../../../types';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { deleteFormSubmission, updateFormSubmission } from '../../../services/registrationSubmissionService';
import { uploadFileToStorage } from '../../../services/storageService';
import { useAuth } from '../../../hooks/useAuth';

interface EditSubmissionProps {
  submission: FormSubmission;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
}

const EditSubmission: React.FC<EditSubmissionProps> = ({ submission, onClose, onSuccess, onDelete }) => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<{ [fieldId: string]: boolean }>({});

  // Form data state - pre-filled with existing submission
  const [generalInfo, setGeneralInfo] = useState({
    name: submission.generalInfo?.name || '',
    email: submission.generalInfo?.email || '',
    phone: submission.generalInfo?.phone || '',
    organization: submission.generalInfo?.organization || '',
    address: submission.generalInfo?.address || '',
  });
  const [answers, setAnswers] = useState<{ [fieldId: string]: any }>(submission.answers || {});

  useEffect(() => {
    loadForm();
  }, [submission.formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const loadedForm = await getRegistrationForm(submission.formId);
      if (loadedForm) {
        setForm(loadedForm);
      } else {
        setError('Form not found');
      }
    } catch (err: any) {
      setError('Failed to load form. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralInfoChange = (field: string, value: string) => {
    setGeneralInfo({ ...generalInfo, [field]: value });
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setAnswers({ ...answers, [fieldId]: value });
  };

  const handleMultipleFieldChange = (fieldId: string, index: number, value: any) => {
    const currentValues = (answers[fieldId] as any[]) || [];
    const newValues = [...currentValues];
    newValues[index] = value;
    setAnswers({ ...answers, [fieldId]: newValues });
  };

  const addMultipleAnswer = (fieldId: string) => {
    const currentValues = (answers[fieldId] as any[]) || [];
    setAnswers({ ...answers, [fieldId]: [...currentValues, ''] });
  };

  const removeMultipleAnswer = (fieldId: string, index: number) => {
    const currentValues = (answers[fieldId] as any[]) || [];
    const newValues = currentValues.filter((_, i) => i !== index);
    setAnswers({ ...answers, [fieldId]: newValues });
  };

  const getSubFieldRows = (fieldId: string): any[] => {
    const value = answers[fieldId];
    if (!value || !Array.isArray(value)) {
      return [{}];
    }
    return value;
  };

  const addSubFieldRow = (fieldId: string, subFields: FormField[]) => {
    const currentRows = getSubFieldRows(fieldId);
    const newRow: any = {};
    subFields.forEach(subField => {
      newRow[subField.id] = '';
    });
    setAnswers({ ...answers, [fieldId]: [...currentRows, newRow] });
  };

  const removeSubFieldRow = (fieldId: string, rowIndex: number) => {
    const currentRows = getSubFieldRows(fieldId);
    const newRows = currentRows.filter((_, i) => i !== rowIndex);
    setAnswers({ ...answers, [fieldId]: newRows });
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!currentUser?.id) {
      setError('You must be logged in to upload files');
      return;
    }

    try {
      setUploadingFiles({ ...uploadingFiles, [fieldId]: true });
      // Use 'form-submissions' folder which maps to Sub_Files bucket
      const fileUrl = await uploadFileToStorage(currentUser.id, file, 'form-submissions');
      setAnswers({ ...answers, [fieldId]: fileUrl });
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFiles({ ...uploadingFiles, [fieldId]: false });
    }
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    // Validate general info fields
    if (form.generalInfo.collectName && !generalInfo.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (form.generalInfo.collectEmail && !generalInfo.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (form.generalInfo.collectPhone && form.generalInfo.collectPhone && !generalInfo.phone.trim()) {
      setError('Phone is required');
      return false;
    }

    // Validate form fields
    const allFields: FormField[] = [];
    form.sections.forEach(section => {
      section.subsections?.forEach(subsection => {
        allFields.push(...subsection.fields);
      });
      allFields.push(...section.fields);
    });
    allFields.push(...form.fields);

    for (const field of allFields) {
      if (field.required) {
        const value = answers[field.id];
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim())) {
          setError(`${field.label} is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to save changes');
      return;
    }

    try {
      setSaving(true);

      const updatedSubmission = {
        formId: submission.formId,
        eventId: submission.eventId,
        eventTitle: submission.eventTitle,
        userId: submission.userId,
        participantUserId: submission.participantUserId || currentUser.id,
        submittedBy: generalInfo.email || generalInfo.name || submission.submittedBy || 'Anonymous',
        subscriptionType: submission.subscriptionType,
        entityName: submission.entityName,
        role: submission.role,
        generalInfo: {
          ...(form!.generalInfo.collectName && { name: generalInfo.name }),
          ...(form!.generalInfo.collectEmail && { email: generalInfo.email }),
          ...(form!.generalInfo.collectPhone && { phone: generalInfo.phone }),
          ...(form!.generalInfo.collectOrganization && { organization: generalInfo.organization }),
          ...(form!.generalInfo.collectAddress && { address: generalInfo.address }),
        },
        answers,
      };

      await updateFormSubmission(submission.id, updatedSubmission);
      onSuccess();
    } catch (err: any) {
      console.error('Error updating submission:', err);
      setError(err.message || 'Failed to update submission. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteFormSubmission(submission.id);
      onDelete();
    } catch (err: any) {
      console.error('Error deleting submission:', err);
      setError(err.message || 'Failed to delete submission. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = answers[field.id];
    const isUploading = uploadingFiles[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={field.type}
            id={field.id}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        );

      case 'select':
        if (field.multiple) {
          const values = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              {values.map((val, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={val || ''}
                    onChange={(e) => handleMultipleFieldChange(field.id, index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    {field.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMultipleAnswer(field.id, index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addMultipleAnswer(field.id)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                + Add another
              </button>
            </div>
          );
        }
        return (
          <select
            id={field.id}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        if (field.multiple) {
          const values = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              {field.options?.map(option => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={values.includes(option)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...values, option]
                        : values.filter(v => v !== option);
                      handleFieldChange(field.id, newValues);
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          );
        }
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span>{field.label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            id={field.id}
            value={value ? (value instanceof Date ? value.toISOString().split('T')[0] : value) : ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value ? new Date(e.target.value) : null)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        );

      case 'file':
        return (
          <div className="space-y-2">
            {value && (
              <div className="text-sm text-slate-600">
                Current file: <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{value as string}</a>
              </div>
            )}
            <input
              type="file"
              id={field.id}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(field.id, file);
                }
              }}
              disabled={isUploading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            {isUploading && (
              <div className="text-sm text-slate-500">Uploading...</div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
          <p className="text-slate-500 mt-4">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <p className="text-red-600">Form not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Edit Submission</h2>
            <p className="text-sm text-slate-500 mt-1">{submission.eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* General Info */}
          {(form.generalInfo.collectName || form.generalInfo.collectEmail || form.generalInfo.collectPhone || 
            form.generalInfo.collectOrganization || form.generalInfo.collectAddress) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.generalInfo.collectName && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={generalInfo.name}
                      onChange={(e) => handleGeneralInfoChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {form.generalInfo.collectEmail && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={generalInfo.email}
                      onChange={(e) => handleGeneralInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {form.generalInfo.collectPhone && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={generalInfo.phone}
                      onChange={(e) => handleGeneralInfoChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {form.generalInfo.collectOrganization && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                    <input
                      type="text"
                      value={generalInfo.organization}
                      onChange={(e) => handleGeneralInfoChange('organization', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {form.generalInfo.collectAddress && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea
                      value={generalInfo.address}
                      onChange={(e) => handleGeneralInfoChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Sections */}
          {form.sections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-slate-600">{section.description}</p>
              )}

              {/* Subsections */}
              {section.subsections?.map((subsection) => (
                <div key={subsection.id} className="ml-4 space-y-4">
                  <h4 className="text-md font-medium text-slate-800">{subsection.title}</h4>
                  {subsection.description && (
                    <p className="text-sm text-slate-600">{subsection.description}</p>
                  )}
                  {subsection.fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {renderField(field)}
                      {field.helpText && (
                        <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Direct fields in section */}
              {section.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderField(field)}
                  {field.helpText && (
                    <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Legacy fields (not in sections) */}
          {form.fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {renderField(field)}
              {field.helpText && (
                <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>
              )}
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete Submission'}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSubmission;
