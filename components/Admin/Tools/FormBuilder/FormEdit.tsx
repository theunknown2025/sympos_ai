import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { RegistrationForm, EvaluationForm } from '../../../../types';
import { getRegistrationForm } from '../../../../services/registrationFormService';
import { getEvaluationForm } from '../../../../services/evaluationFormService';
import FormBuilder from './FormBuilder';

interface FormEditProps {
  formId: string;
  onClose: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const FormEdit: React.FC<FormEditProps> = ({ formId, onClose, onSave, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<RegistrationForm | EvaluationForm | null>(null);
  const [formType, setFormType] = useState<'registration' | 'submission' | 'evaluation' | null>(null);

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to load as registration form first
      let loadedForm = await getRegistrationForm(formId);
      let isEvaluationForm = false;
      
      // If not found, try evaluation form
      if (!loadedForm) {
        loadedForm = await getEvaluationForm(formId);
        isEvaluationForm = true;
      }
      
      if (loadedForm) {
        setForm(loadedForm);
        
        // Detect form type from title prefix
        const titleLower = loadedForm.title.toLowerCase();
        if (titleLower.startsWith('reg - ') || titleLower.startsWith('reg-')) {
          setFormType('registration');
        } else if (titleLower.startsWith('sub - ') || titleLower.startsWith('sub-')) {
          setFormType('submission');
        } else if (titleLower.startsWith('eval - ') || titleLower.startsWith('eval-') || isEvaluationForm) {
          setFormType('evaluation');
        } else {
          // If no prefix, try to detect from title
          if (titleLower.includes('registration') || titleLower.includes('register')) {
            setFormType('registration');
          } else if (titleLower.includes('submission') || titleLower.includes('submit')) {
            setFormType('submission');
          } else if (titleLower.includes('evaluation') || titleLower.includes('evaluate')) {
            setFormType('evaluation');
          } else {
            setFormType('registration'); // Default fallback
          }
        }
      } else {
        setError('Form not found');
      }
    } catch (err: any) {
      console.error('Error loading form:', err);
      setError('Failed to load form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    // FormBuilder will handle the actual save
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-500 mt-4">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Error</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3 text-red-700 mb-4">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadForm}
              className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto">
      <div className="min-h-full">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancel}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Go back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Edit Form</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {form.title}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Form Builder Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <FormBuilder
            formId={formId}
            onSave={handleSave}
            onEdit={(id) => {
              // If formId changes, reload
              if (id !== formId) {
                window.location.reload();
              }
            }}
            onNew={() => {
              // Handle new form creation if needed
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FormEdit;
