import React, { useState, useEffect, useMemo } from 'react';
import {
  Edit2,
  Trash2,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Plus,
  Eye,
  X,
  UserCheck,
  FileCheck,
  Grid3x3,
  List
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
import {
  getUserEvaluationForms,
  deleteEvaluationForm,
  getEvaluationForm,
  EvaluationForm
} from '../../../../services/evaluationFormService';
import FormFiltersComponent, { FormFilters } from './FormFilters';
import FormEdit from './FormEdit';

interface FormListProps {
  onEdit: (formId: string) => void;
  onNew: () => void;
  refreshTrigger?: number;
}

interface FormCardProps {
  form: RegistrationForm | EvaluationForm;
  formType: 'registration' | 'submission' | 'evaluation' | 'other';
  onEdit: (formId: string) => void;
  onDelete: (formId: string) => void;
  onDisplay: (formId: string) => void;
  isLoadingForm: boolean;
  deletingId: string | null;
  getTotalFieldCount: (form: RegistrationForm | EvaluationForm) => number;
  formatDate: (date: Date) => string;
  cleanFormTitle: (title: string) => string;
}

interface FormRowProps {
  form: RegistrationForm | EvaluationForm;
  formType: 'registration' | 'submission' | 'evaluation' | 'other';
  onEdit: (formId: string) => void;
  onDelete: (formId: string) => void;
  onDisplay: (formId: string) => void;
  isLoadingForm: boolean;
  deletingId: string | null;
  getTotalFieldCount: (form: RegistrationForm | EvaluationForm) => number;
  formatDate: (date: Date) => string;
  cleanFormTitle: (title: string) => string;
}

const FormCard: React.FC<FormCardProps> = ({
  form,
  formType,
  onEdit,
  onDelete,
  onDisplay,
  isLoadingForm,
  deletingId,
  getTotalFieldCount,
  formatDate,
  cleanFormTitle,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden flex flex-col ${
        formType === 'registration' 
          ? 'border-blue-200' 
          : formType === 'submission' 
          ? 'border-purple-200' 
          : formType === 'evaluation'
          ? 'border-orange-200'
          : 'border-slate-200'
      }`}
    >
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-slate-900 truncate flex-1">
            {cleanFormTitle(form.title)}
          </h3>
        </div>
        {form.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {form.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText 
              size={16} 
              className={
                formType === 'registration' 
                  ? 'text-blue-600' 
                  : formType === 'submission' 
                  ? 'text-purple-600' 
                  : formType === 'evaluation'
                  ? 'text-orange-600'
                  : 'text-slate-600'
              } 
            />
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

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Actions:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDisplay(form.id)}
            disabled={isLoadingForm}
            className="p-2.5 text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            title="Preview Form"
          >
            {isLoadingForm ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
          <button
            onClick={() => onEdit(form.id)}
            className="p-2.5 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow"
            title="Edit Form"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(form.id)}
            disabled={deletingId === form.id}
            className="p-2.5 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            title="Delete Form"
          >
            {deletingId === form.id ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const FormRow: React.FC<FormRowProps> = ({
  form,
  formType,
  onEdit,
  onDelete,
  onDisplay,
  isLoadingForm,
  deletingId,
  getTotalFieldCount,
  formatDate,
  cleanFormTitle,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all overflow-hidden ${
        formType === 'registration' 
          ? 'border-l-4 border-l-blue-500' 
          : formType === 'submission' 
          ? 'border-l-4 border-l-purple-500' 
          : formType === 'evaluation'
          ? 'border-l-4 border-l-orange-500'
          : 'border-l-4 border-l-slate-300'
      }`}
    >
      <div className="p-4 flex items-center justify-between gap-4">
        {/* Left Section - Form Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-900 truncate">
              {cleanFormTitle(form.title)}
            </h3>
          </div>
          {form.description && (
            <p className="text-sm text-slate-600 mb-2 line-clamp-1">
              {form.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <FileText 
                size={14} 
                className={
                  formType === 'registration' 
                    ? 'text-blue-600' 
                    : formType === 'submission' 
                    ? 'text-purple-600' 
                    : formType === 'evaluation'
                    ? 'text-orange-600'
                    : 'text-slate-600'
                } 
              />
              <span>{getTotalFieldCount(form)} field(s)</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Updated: {formatDate(form.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Created: {formatDate(form.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDisplay(form.id)}
            disabled={isLoadingForm}
            className="p-2 text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Preview Form"
          >
            {isLoadingForm ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
          <button
            onClick={() => onEdit(form.id)}
            className="p-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            title="Edit Form"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(form.id)}
            disabled={deletingId === form.id}
            className="p-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete Form"
          >
            {deletingId === form.id ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const FormList: React.FC<FormListProps> = ({ onEdit, onNew, refreshTrigger }) => {
  const [forms, setForms] = useState<(RegistrationForm | EvaluationForm)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [displayingForm, setDisplayingForm] = useState<RegistrationForm | EvaluationForm | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'rows'>('cards');
  const [filters, setFilters] = useState<FormFilters>({
    name: '',
    type: 'all',
    dateType: 'created',
    dateFrom: '',
    dateTo: '',
    minFields: '',
    maxFields: '',
  });

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
      const [registrationForms, evaluationForms] = await Promise.all([
        getUserRegistrationForms(userId),
        getUserEvaluationForms(userId)
      ]);
      
      // Combine and sort all forms by updated date
      const allForms: (RegistrationForm | EvaluationForm)[] = [
        ...registrationForms,
        ...evaluationForms
      ];
      allForms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setForms(allForms);
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
      const form = forms.find(f => f.id === formId);
      const formType = getFormType(form as RegistrationForm | EvaluationForm);
      
      if (formType === 'evaluation') {
        await deleteEvaluationForm(formId);
      } else {
        await deleteRegistrationForm(formId);
      }
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
      // Try to load as registration form first
      let form = await getRegistrationForm(formId);
      if (!form) {
        // If not found, try evaluation form
        form = await getEvaluationForm(formId);
      }
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

  const handleEdit = (formId: string) => {
    setEditingFormId(formId);
  };

  const handleEditClose = () => {
    setEditingFormId(null);
  };

  const handleEditSave = () => {
    setEditingFormId(null);
    // Reload forms to show updated data
    if (currentUser) {
      loadForms(currentUser.id);
    }
  };

  const getTotalFieldCount = (form: RegistrationForm | EvaluationForm): number => {
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

  const cleanFormTitle = (title: string): string => {
    // Remove "Reg - ", "Reg-", "Sub - ", "Sub-", "Eval - ", "Eval-" prefixes
    return title
      .replace(/^reg\s*-\s*/i, '')
      .replace(/^sub\s*-\s*/i, '')
      .replace(/^eval\s*-\s*/i, '')
      .trim();
  };

  // Detect form type from title prefix
  const getFormType = (form: RegistrationForm | EvaluationForm): 'registration' | 'submission' | 'evaluation' | 'other' => {
    const titleLower = form.title.toLowerCase();
    if (titleLower.startsWith('reg - ') || titleLower.startsWith('reg-') || titleLower.includes('registration')) {
      return 'registration';
    } else if (titleLower.startsWith('sub - ') || titleLower.startsWith('sub-') || titleLower.includes('submission')) {
      return 'submission';
    } else if (titleLower.startsWith('eval - ') || titleLower.startsWith('eval-') || titleLower.includes('evaluation')) {
      return 'evaluation';
    }
    return 'other';
  };

  // Filter forms based on filter criteria
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      // Name filter
      if (filters.name) {
        const cleanedTitle = cleanFormTitle(form.title).toLowerCase();
        const searchTerm = filters.name.toLowerCase();
        if (!cleanedTitle.includes(searchTerm) && 
            !(form.description?.toLowerCase().includes(searchTerm) ?? false)) {
          return false;
        }
      }

      // Type filter
      if (filters.type !== 'all') {
        const formType = getFormType(form);
        if (formType !== filters.type) {
          return false;
        }
      }

      // Date filters
      const dateToCheck = filters.dateType === 'created' ? form.createdAt : form.updatedAt;
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (dateToCheck < fromDate) {
          return false;
        }
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (dateToCheck > toDate) {
          return false;
        }
      }

      // Field count filters
      const fieldCount = getTotalFieldCount(form);
      if (filters.minFields) {
        const min = parseInt(filters.minFields, 10);
        if (!isNaN(min) && fieldCount < min) {
          return false;
        }
      }
      if (filters.maxFields) {
        const max = parseInt(filters.maxFields, 10);
        if (!isNaN(max) && fieldCount > max) {
          return false;
        }
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms, filters]);

  // Group forms by type
  const groupedForms = useMemo(() => {
    const registration: (RegistrationForm | EvaluationForm)[] = [];
    const submission: (RegistrationForm | EvaluationForm)[] = [];
    const evaluation: (RegistrationForm | EvaluationForm)[] = [];
    const other: (RegistrationForm | EvaluationForm)[] = [];

    filteredForms.forEach(form => {
      const type = getFormType(form);
      if (type === 'registration') {
        registration.push(form);
      } else if (type === 'submission') {
        submission.push(form);
      } else if (type === 'evaluation') {
        evaluation.push(form);
      } else {
        other.push(form);
      }
    });

    return { registration, submission, evaluation, other };
  }, [filteredForms]);

  const handleFiltersChange = (newFilters: FormFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      name: '',
      type: 'all',
      dateType: 'created',
      dateFrom: '',
      dateTo: '',
      minFields: '',
      maxFields: '',
    });
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
          <p className="text-slate-500 mt-1 text-sm">Manage your registration and submission forms</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card View"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('rows')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'rows'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Row View"
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200"
          >
            <Plus size={18} /> New Form
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      {forms.length > 0 && (
        <FormFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />
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
      ) : filteredForms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No forms match your filters</h3>
          <p className="text-slate-500 mb-6">Try adjusting your search criteria or clear the filters</p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-6 py-3 text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Registration Forms Section */}
          {groupedForms.registration.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCheck className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Registration Forms</h2>
                  <p className="text-sm text-slate-500">{groupedForms.registration.length} form(s)</p>
                </div>
              </div>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedForms.registration.map((form) => (
                    <FormCard
                      key={form.id}
                      form={form}
                      formType="registration"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDisplay={handleDisplay}
                      isLoadingForm={isLoadingForm}
                      deletingId={deletingId}
                      getTotalFieldCount={getTotalFieldCount}
                      formatDate={formatDate}
                      cleanFormTitle={cleanFormTitle}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedForms.registration.map((form) => (
                    <FormRow
                      key={form.id}
                      form={form}
                      formType="registration"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDisplay={handleDisplay}
                      isLoadingForm={isLoadingForm}
                      deletingId={deletingId}
                      getTotalFieldCount={getTotalFieldCount}
                      formatDate={formatDate}
                      cleanFormTitle={cleanFormTitle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submission Forms Section */}
          {groupedForms.submission.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileCheck className="text-purple-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Submission Forms</h2>
                  <p className="text-sm text-slate-500">{groupedForms.submission.length} form(s)</p>
                </div>
              </div>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedForms.submission.map((form) => (
                    <FormCard
                      key={form.id}
                      form={form}
                      formType="submission"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDisplay={handleDisplay}
                      isLoadingForm={isLoadingForm}
                      deletingId={deletingId}
                      getTotalFieldCount={getTotalFieldCount}
                      formatDate={formatDate}
                      cleanFormTitle={cleanFormTitle}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedForms.submission.map((form) => (
                    <FormRow
                      key={form.id}
                      form={form}
                      formType="submission"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDisplay={handleDisplay}
                      isLoadingForm={isLoadingForm}
                      deletingId={deletingId}
                      getTotalFieldCount={getTotalFieldCount}
                      formatDate={formatDate}
                      cleanFormTitle={cleanFormTitle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evaluation Forms Section */}
          {groupedForms.evaluation.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="text-orange-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Evaluation Forms</h2>
                  <p className="text-sm text-slate-500">{groupedForms.evaluation.length} form(s)</p>
                </div>
              </div>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedForms.evaluation.map((form) => (
                    <FormCard
                      key={form.id}
                      form={form}
                      formType="evaluation"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDisplay={handleDisplay}
                      isLoadingForm={isLoadingForm}
                      deletingId={deletingId}
                      getTotalFieldCount={getTotalFieldCount}
                      formatDate={formatDate}
                      cleanFormTitle={cleanFormTitle}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedForms.evaluation.map((form) => (
                    <FormRow
                      key={form.id}
                      form={form}
                      formType="evaluation"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDisplay={handleDisplay}
                      isLoadingForm={isLoadingForm}
                      deletingId={deletingId}
                      getTotalFieldCount={getTotalFieldCount}
                      formatDate={formatDate}
                      cleanFormTitle={cleanFormTitle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other Forms Section */}
          {groupedForms.other.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <FileText className="text-slate-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Other Forms</h2>
                  <p className="text-sm text-slate-500">{groupedForms.other.length} form(s)</p>
                </div>
              </div>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedForms.other.map((form) => (
                    <FormCard
                      key={form.id}
                      form={form}
                      formType="other"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDisplay={handleDisplay}
                      isLoadingForm={isLoadingForm}
                      deletingId={deletingId}
                      getTotalFieldCount={getTotalFieldCount}
                      formatDate={formatDate}
                      cleanFormTitle={cleanFormTitle}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedForms.other.map((form) => (
                    <FormRow
                      key={form.id}
                      form={form}
                      formType="other"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDisplay={handleDisplay}
                      isLoadingForm={isLoadingForm}
                      deletingId={deletingId}
                      getTotalFieldCount={getTotalFieldCount}
                      formatDate={formatDate}
                      cleanFormTitle={cleanFormTitle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingFormId && (
        <FormEdit
          formId={editingFormId}
          onClose={handleEditClose}
          onSave={handleEditSave}
          onCancel={handleEditClose}
        />
      )}

      {/* Display Modal */}
      {displayingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">{cleanFormTitle(displayingForm.title)}</h2>
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
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{cleanFormTitle(displayingForm.title)}</h1>
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

