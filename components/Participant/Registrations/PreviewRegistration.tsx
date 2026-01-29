import React, { useState, useEffect } from 'react';
import { X, Loader2, Edit2 } from 'lucide-react';
import { RegistrationForm, FormField, FormSubmission } from '../../../types';
import { getRegistrationForm } from '../../../services/registrationFormService';

interface PreviewRegistrationProps {
  submission: FormSubmission;
  onClose: () => void;
  onEdit: () => void;
}

const PreviewRegistration: React.FC<PreviewRegistrationProps> = ({ submission, onClose, onEdit }) => {
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const renderFieldValue = (field: FormField) => {
    const value = submission.answers[field.id];
    
    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-400 italic">Not provided</span>;
    }

    switch (field.type) {
      case 'checkbox':
        if (field.multiple && Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : <span className="text-slate-400 italic">Not provided</span>;
        }
        return value ? 'Yes' : 'No';
      
      case 'file':
        return (
          <a 
            href={value as string} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            View File
          </a>
        );
      
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString();
        }
        return String(value);
      
      case 'textarea':
        return (
          <div className="whitespace-pre-wrap text-sm">{String(value)}</div>
        );
      
      default:
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value);
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
            <h2 className="text-2xl font-bold text-slate-900">Registration Preview</h2>
            <p className="text-sm text-slate-500 mt-1">{submission.eventTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
            >
              <Edit2 size={16} />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* General Info */}
          {(form.generalInfo.collectName || form.generalInfo.collectEmail || form.generalInfo.collectPhone || 
            form.generalInfo.collectOrganization || form.generalInfo.collectAddress) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.generalInfo.collectName && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                    <p className="text-sm text-slate-900">
                      {submission.generalInfo?.name || <span className="text-slate-400 italic">Not provided</span>}
                    </p>
                  </div>
                )}
                {form.generalInfo.collectEmail && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                    <p className="text-sm text-slate-900">
                      {submission.generalInfo?.email || <span className="text-slate-400 italic">Not provided</span>}
                    </p>
                  </div>
                )}
                {form.generalInfo.collectPhone && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Phone</label>
                    <p className="text-sm text-slate-900">
                      {submission.generalInfo?.phone || <span className="text-slate-400 italic">Not provided</span>}
                    </p>
                  </div>
                )}
                {form.generalInfo.collectOrganization && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Organization</label>
                    <p className="text-sm text-slate-900">
                      {submission.generalInfo?.organization || <span className="text-slate-400 italic">Not provided</span>}
                    </p>
                  </div>
                )}
                {form.generalInfo.collectAddress && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-500 mb-1">Address</label>
                    <p className="text-sm text-slate-900">
                      {submission.generalInfo?.address || <span className="text-slate-400 italic">Not provided</span>}
                    </p>
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
                      <label className="block text-sm font-medium text-slate-500 mb-1">
                        {field.label}
                      </label>
                      <div className="text-sm text-slate-900">
                        {renderFieldValue(field)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Direct fields in section */}
              {section.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    {field.label}
                  </label>
                  <div className="text-sm text-slate-900">
                    {renderFieldValue(field)}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Legacy fields (not in sections) */}
          {form.fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-slate-500 mb-1">
                {field.label}
              </label>
              <div className="text-sm text-slate-900">
                {renderFieldValue(field)}
              </div>
            </div>
          ))}

          {/* Submission Info */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Submitted On</label>
                <p className="text-slate-900">
                  {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
              {submission.decisionStatus && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Status</label>
                  <p className="text-slate-900 capitalize">{submission.decisionStatus}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewRegistration;
