import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Trash2,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Plus,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  getUserRegistrationForms,
  deleteRegistrationForm,
  getRegistrationForm,
  RegistrationForm,
  FormField,
  FormFieldType
} from '../../../../services/registrationFormService';

interface FormListProps {
  onEdit: (formId: string) => void;
  onNew: () => void;
  refreshTrigger?: number;
}

const FormList: React.FC<FormListProps> = ({ onEdit, onNew, refreshTrigger }) => {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [displayingForm, setDisplayingForm] = useState<RegistrationForm | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadForms(currentUser.id);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Reload forms when refreshTrigger changes
  useEffect(() => {
    if (currentUser && refreshTrigger !== undefined) {
      loadForms(currentUser.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const loadForms = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      const userForms = await getUserRegistrationForms(userId);
      userForms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setForms(userForms);
    } catch (err: any) {
      setError('Failed to load forms. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(formId);
      await deleteRegistrationForm(formId);
      setForms(forms.filter(f => f.id !== formId));
    } catch (err: any) {
      setError('Failed to delete form. Please try again.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDisplay = async (formId: string) => {
    try {
      setIsLoadingForm(true);
      const form = await getRegistrationForm(formId);
      if (form) {
        setDisplayingForm(form);
      }
    } catch (err: any) {
      setError('Failed to load form. Please try again.');
      console.error(err);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const getTotalFieldCount = (form: RegistrationForm): number => {
    let count = form.fields?.length || 0;
    form.sections?.forEach(section => {
      count += section.fields?.length || 0;
      section.subsections?.forEach(subsection => {
        count += subsection.fields?.length || 0;
      });
    });
    return count;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderPreviewField = (field: FormField) => {
    return (
      <div key={field.id} className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.helpText && (
          <p className="text-xs text-slate-500">{field.helpText}</p>
        )}
        
        {field.type === 'text' && (
          <input
            type="text"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        )}
        {field.type === 'email' && (
          <input
            type="email"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        )}
        {field.type === 'phone' && (
          <input
            type="tel"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        )}
        {field.type === 'number' && (
          <input
            type="number"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            rows={4}
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        )}
        {field.type === 'select' && (
          <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled>
            <option value="">Select an option</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        )}
        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input type="radio" name={field.id} value={option} className="text-indigo-600" disabled />
                <span className="text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        )}
        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input type="checkbox" value={option} className="text-indigo-600 rounded" disabled />
                <span className="text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        )}
        {field.type === 'date' && (
          <input
            type="date"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        )}
        {field.type === 'file' && (
          <input
            type="file"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        )}
        {field.type === 'url' && (
          <input
            type="url"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4">Loading forms...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">List of Forms</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your registration forms</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200"
        >
          <Plus size={18} /> New Form
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {forms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No forms yet</h3>
          <p className="text-slate-500 mb-6">Create your first registration form to get started</p>
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            <Plus size={18} /> Create Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">
                  {form.title}
                </h3>
                {form.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {form.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText size={16} />
                    <span>{getTotalFieldCount(form)} field(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={16} />
                    <span>Updated: {formatDate(form.updatedAt)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">
                    Created: {formatDate(form.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(form.generalInfo)
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <span
                          key={key}
                          className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded"
                        >
                          {key.replace('collect', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleDisplay(form.id)}
                  disabled={isLoadingForm}
                  className="p-2 text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Display Form"
                >
                  {isLoadingForm ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
                <button
                  onClick={() => onEdit(form.id)}
                  className="p-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Edit Form"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(form.id)}
                  disabled={deletingId === form.id}
                  className="p-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete Form"
                >
                  {deletingId === form.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Display Modal */}
      {displayingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">{displayingForm.title}</h2>
              <button
                onClick={() => setDisplayingForm(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form className="space-y-6">
                {/* Form Title and Description */}
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{displayingForm.title}</h1>
                  {displayingForm.description && <p className="text-slate-600">{displayingForm.description}</p>}
                </div>

                {/* General Information */}
                {(displayingForm.generalInfo.collectName || displayingForm.generalInfo.collectEmail || 
                  displayingForm.generalInfo.collectPhone || displayingForm.generalInfo.collectOrganization || 
                  displayingForm.generalInfo.collectAddress) && (
                  <div className="border-t border-slate-200 pt-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">General Information</h2>
                    <div className="space-y-4">
                      {displayingForm.generalInfo.collectName && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your full name"
                            disabled
                          />
                        </div>
                      )}
                      {displayingForm.generalInfo.collectEmail && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your email"
                            disabled
                          />
                        </div>
                      )}
                      {displayingForm.generalInfo.collectPhone && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your phone number"
                            disabled
                          />
                        </div>
                      )}
                      {displayingForm.generalInfo.collectOrganization && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Organization/Institution</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your organization"
                            disabled
                          />
                        </div>
                      )}
                      {displayingForm.generalInfo.collectAddress && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                          <textarea
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your address"
                            disabled
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {displayingForm.sections?.map((section) => (
                  <div key={section.id} className="border-t border-slate-200 pt-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">{section.title}</h2>
                    {section.description && <p className="text-slate-600 mb-4">{section.description}</p>}
                    
                    {/* Subsections */}
                    {section.subsections?.map((subsection) => (
                      <div key={subsection.id} className="mb-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-2">{subsection.title}</h3>
                        {subsection.description && <p className="text-sm text-slate-600 mb-3">{subsection.description}</p>}
                        <div className="space-y-4">
                          {subsection.fields?.map((field) => renderPreviewField(field))}
                        </div>
                      </div>
                    ))}

                    {/* Section Fields */}
                    {section.fields?.length > 0 && (
                      <div className="space-y-4">
                        {section.fields.map((field) => renderPreviewField(field))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Legacy Fields */}
                {displayingForm.fields?.length > 0 && (
                  <div className="border-t border-slate-200 pt-6 space-y-4">
                    {displayingForm.fields.map((field) => renderPreviewField(field))}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Submit (Preview Mode)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormList;

