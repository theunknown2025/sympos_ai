import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { RegistrationForm, FormField, FormFieldType, FormSubmission } from '../../../../types';
import { getRegistrationForm } from '../../../../services/registrationFormService';
import { saveFormSubmission } from '../../../../services/registrationSubmissionService';
import { uploadFileToStorage } from '../../../../services/storageService';
import { sendCopyOfAnswers, sendConfirmationEmail } from '../../../../services/emailService';
import { useAuth } from '../../../../hooks/useAuth';

interface FormModalProps {
  formId: string;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const FormModal: React.FC<FormModalProps> = ({ formId, eventId, eventTitle, onClose, onSuccess }) => {
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { currentUser } = useAuth();
  const [uploadingFiles, setUploadingFiles] = useState<{ [fieldId: string]: boolean }>({});

  // Form data state
  const [generalInfo, setGeneralInfo] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    address: '',
  });
  const [answers, setAnswers] = useState<{ [fieldId: string]: any }>({});

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const loadedForm = await getRegistrationForm(formId);
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

  // Sub-fields handlers (for fields with multiple sub-fields in each row)
  const getSubFieldRows = (fieldId: string): any[] => {
    const value = answers[fieldId];
    if (!value || !Array.isArray(value)) {
      return [{}]; // Start with one empty row
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
    setAnswers({ ...answers, [fieldId]: newRows.length > 0 ? newRows : [{}] });
  };

  const handleSubFieldChange = (fieldId: string, rowIndex: number, subFieldId: string, value: any) => {
    const currentRows = getSubFieldRows(fieldId);
    const newRows = [...currentRows];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = {};
    }
    newRows[rowIndex] = { ...newRows[rowIndex], [subFieldId]: value };
    setAnswers({ ...answers, [fieldId]: newRows });
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!currentUser) {
      setError('You must be logged in to upload files');
      return;
    }

    try {
      setUploadingFiles({ ...uploadingFiles, [fieldId]: true });
      setError('');
      
      // Upload file to Supabase Storage
      const downloadURL = await uploadFileToStorage(currentUser.id, file, 'form-submissions');
      
      // Store the download URL in answers
      handleFieldChange(fieldId, downloadURL);
    } catch (err: any) {
      console.error('Error uploading file:', err);
      // If it's a CORS error, provide a helpful message with link to fix
      if (err.message?.includes('CORS')) {
        setError(
          'CORS Configuration Required!\n\n' +
          'The storage bucket needs CORS configured to allow uploads from localhost.\n\n' +
          'Quick Fix: See CUSTOM_BUCKET_SETUP.md or QUICK_CORS_SETUP.md for instructions.\n' +
          'Easiest method: Use Google Cloud Console (takes 2 minutes, no installation needed).'
        );
      } else {
        setError(err.message || 'Failed to upload file. Please try again.');
      }
    } finally {
      setUploadingFiles({ ...uploadingFiles, [fieldId]: false });
    }
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    // Validate general info
    if (form.generalInfo.collectName && !generalInfo.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (form.generalInfo.collectEmail && !generalInfo.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (form.generalInfo.collectPhone && !generalInfo.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (form.generalInfo.collectOrganization && !generalInfo.organization.trim()) {
      setError('Please enter your organization');
      return false;
    }
    if (form.generalInfo.collectAddress && !generalInfo.address.trim()) {
      setError('Please enter your address');
      return false;
    }

    // Validate required fields
    const allFields: FormField[] = [
      ...form.fields,
      ...form.sections.flatMap(s => [
        ...s.fields,
        ...s.subsections.flatMap(sub => sub.fields)
      ])
    ];

    for (const field of allFields) {
      if (field.required) {
        const answer = answers[field.id];
        
        // Handle sub-fields (array of objects)
        if (field.hasSubFields && field.subFields) {
          if (!Array.isArray(answer) || answer.length === 0) {
            setError(`Please add at least one entry for: ${field.label}`);
            return false;
          }
          
          // Validate each row's required sub-fields
          for (let rowIndex = 0; rowIndex < answer.length; rowIndex++) {
            const row = answer[rowIndex];
            if (!row || typeof row !== 'object') {
              setError(`Please fill in all required fields in row ${rowIndex + 1} of: ${field.label}`);
              return false;
            }
            
            for (const subField of field.subFields) {
              if (subField.required) {
                const subValue = row[subField.id];
                if (!subValue || (typeof subValue === 'string' && !subValue.trim())) {
                  setError(`Please fill in "${subField.label}" in row ${rowIndex + 1} of: ${field.label}`);
                  return false;
                }
              }
            }
          }
        } else if (field.multiple) {
          // For multiple fields, check if array exists and has at least one non-empty value
          if (!Array.isArray(answer) || answer.length === 0 || answer.every((val: any) => !val || (typeof val === 'string' && !val.trim()))) {
            setError(`Please fill in the required field: ${field.label}`);
            return false;
          }
        } else {
          // For single fields
          if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && !answer.trim())) {
            setError(`Please fill in the required field: ${field.label}`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to submit forms');
      return;
    }

    try {
      setSubmitting(true);
      
      const submission = {
        formId: form!.id,
        eventId,
        eventTitle,
        userId: currentUser.id,
        submittedBy: generalInfo.email || generalInfo.name || 'Anonymous',
        generalInfo: {
          ...(form!.generalInfo.collectName && { name: generalInfo.name }),
          ...(form!.generalInfo.collectEmail && { email: generalInfo.email }),
          ...(form!.generalInfo.collectPhone && { phone: generalInfo.phone }),
          ...(form!.generalInfo.collectOrganization && { organization: generalInfo.organization }),
          ...(form!.generalInfo.collectAddress && { address: generalInfo.address }),
        },
        answers,
      };

      const submissionId = await saveFormSubmission(submission);
      
      // Create submission object with ID and timestamp for email service
      const fullSubmission: FormSubmission = {
        ...submission,
        id: submissionId,
        submittedAt: new Date(),
      };

      // Trigger email actions if enabled
      if (form?.actions) {
        try {
          if (form.actions.sendCopyOfAnswers) {
            await sendCopyOfAnswers(form, fullSubmission);
          }
          if (form.actions.sendConfirmationEmail) {
            await sendConfirmationEmail(form, fullSubmission);
          }
        } catch (emailError) {
          // Log email errors but don't fail the submission
          console.error('Error sending emails:', emailError);
        }
      }

      setSuccess(true);
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError('Failed to submit form. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = answers[field.id] || '';
    const isMultiple = field.multiple || false;
    const hasSubFields = field.hasSubFields || false;

    // If sub-fields are enabled, render as a table with multiple rows
    if (hasSubFields && field.subFields && field.subFields.length > 0) {
      const rows = getSubFieldRows(field.id);
      
      return (
        <div key={field.id} className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
            <span className="text-xs text-slate-500 ml-2">(Add multiple entries)</span>
          </label>
          {field.helpText && (
            <p className="text-xs text-slate-500">{field.helpText}</p>
          )}
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {field.subFields.map((subField) => (
                      <th
                        key={subField.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        {subField.label}
                        {subField.required && <span className="text-red-500 ml-1">*</span>}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50">
                      {field.subFields.map((subField) => (
                        <td key={subField.id} className="px-4 py-3">
                          {subField.type === 'text' && (
                            <input
                              type="text"
                              value={row[subField.id] || ''}
                              onChange={(e) => handleSubFieldChange(field.id, rowIndex, subField.id, e.target.value)}
                              placeholder={subField.placeholder || subField.label}
                              required={subField.required && rowIndex === 0}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          )}
                          {subField.type === 'email' && (
                            <input
                              type="email"
                              value={row[subField.id] || ''}
                              onChange={(e) => handleSubFieldChange(field.id, rowIndex, subField.id, e.target.value)}
                              placeholder={subField.placeholder || subField.label}
                              required={subField.required && rowIndex === 0}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          )}
                          {subField.type === 'phone' && (
                            <input
                              type="tel"
                              value={row[subField.id] || ''}
                              onChange={(e) => handleSubFieldChange(field.id, rowIndex, subField.id, e.target.value)}
                              placeholder={subField.placeholder || subField.label}
                              required={subField.required && rowIndex === 0}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          )}
                          {subField.type === 'number' && (
                            <input
                              type="number"
                              value={row[subField.id] || ''}
                              onChange={(e) => handleSubFieldChange(field.id, rowIndex, subField.id, parseFloat(e.target.value) || 0)}
                              placeholder={subField.placeholder || subField.label}
                              required={subField.required && rowIndex === 0}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          )}
                          {subField.type === 'textarea' && (
                            <textarea
                              rows={2}
                              value={row[subField.id] || ''}
                              onChange={(e) => handleSubFieldChange(field.id, rowIndex, subField.id, e.target.value)}
                              placeholder={subField.placeholder || subField.label}
                              required={subField.required && rowIndex === 0}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          )}
                          {subField.type === 'url' && (
                            <input
                              type="url"
                              value={row[subField.id] || ''}
                              onChange={(e) => handleSubFieldChange(field.id, rowIndex, subField.id, e.target.value)}
                              placeholder={subField.placeholder || subField.label}
                              required={subField.required && rowIndex === 0}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          )}
                          {subField.type === 'date' && (
                            <input
                              type="date"
                              value={row[subField.id] || ''}
                              onChange={(e) => handleSubFieldChange(field.id, rowIndex, subField.id, e.target.value)}
                              required={subField.required && rowIndex === 0}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          )}
                          {subField.type === 'select' && (
                            <select
                              value={row[subField.id] || ''}
                              onChange={(e) => handleSubFieldChange(field.id, rowIndex, subField.id, e.target.value)}
                              required={subField.required && rowIndex === 0}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                              <option value="">Select...</option>
                              {subField.options?.map((option, idx) => (
                                <option key={idx} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeSubFieldRow(field.id, rowIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={rows.length === 1 && field.required}
                          title="Remove row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => addSubFieldRow(field.id, field.subFields || [])}
                className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
              >
                <Plus size={16} />
                Add Another Row
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If multiple is enabled, render multiple inputs
    if (isMultiple && (field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' || field.type === 'textarea' || field.type === 'url' || field.type === 'date')) {
      const values = Array.isArray(value) ? value : (value ? [value] : ['']);
      
      return (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
            {isMultiple && <span className="text-xs text-slate-500 ml-2">(Multiple answers allowed)</span>}
          </label>
          {field.helpText && (
            <p className="text-xs text-slate-500">{field.helpText}</p>
          )}
          <div className="space-y-2">
            {values.map((val, index) => (
              <div key={index} className="flex gap-2">
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={val as string}
                    onChange={(e) => handleMultipleFieldChange(field.id, index, e.target.value)}
                    placeholder={field.placeholder || `Answer ${index + 1}`}
                    required={field.required && index === 0}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                {field.type === 'email' && (
                  <input
                    type="email"
                    value={val as string}
                    onChange={(e) => handleMultipleFieldChange(field.id, index, e.target.value)}
                    placeholder={field.placeholder || `Email ${index + 1}`}
                    required={field.required && index === 0}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                {field.type === 'phone' && (
                  <input
                    type="tel"
                    value={val as string}
                    onChange={(e) => handleMultipleFieldChange(field.id, index, e.target.value)}
                    placeholder={field.placeholder || `Phone ${index + 1}`}
                    required={field.required && index === 0}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={val as number}
                    onChange={(e) => handleMultipleFieldChange(field.id, index, parseFloat(e.target.value) || 0)}
                    placeholder={field.placeholder || `Number ${index + 1}`}
                    required={field.required && index === 0}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                {field.type === 'textarea' && (
                  <textarea
                    rows={3}
                    value={val as string}
                    onChange={(e) => handleMultipleFieldChange(field.id, index, e.target.value)}
                    placeholder={field.placeholder || `Answer ${index + 1}`}
                    required={field.required && index === 0}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                {field.type === 'url' && (
                  <input
                    type="url"
                    value={val as string}
                    onChange={(e) => handleMultipleFieldChange(field.id, index, e.target.value)}
                    placeholder={field.placeholder || `URL ${index + 1}`}
                    required={field.required && index === 0}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={val as string}
                    onChange={(e) => handleMultipleFieldChange(field.id, index, e.target.value)}
                    required={field.required && index === 0}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMultipleAnswer(field.id, index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={values.length === 1 && field.required}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addMultipleAnswer(field.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
            >
              <Plus size={16} />
              Add Another Answer
            </button>
          </div>
        </div>
      );
    }

    // Single answer rendering (existing code)
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
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'email' && (
          <input
            type="email"
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'phone' && (
          <input
            type="tel"
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'number' && (
          <input
            type="number"
            value={value as number}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            rows={4}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'select' && (
          <>
            {isMultiple ? (
              <div className="space-y-2">
                {(Array.isArray(value) ? value : value ? [value] : []).map((val, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={val as string}
                      onChange={(e) => handleMultipleFieldChange(field.id, index, e.target.value)}
                      required={field.required && index === 0}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((option, idx) => (
                        <option key={idx} value={option}>{option}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMultipleAnswer(field.id, index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={(!Array.isArray(value) ? (value ? [value] : []) : value).length === 1 && field.required}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addMultipleAnswer(field.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                >
                  <Plus size={16} />
                  Add Another Selection
                </button>
              </div>
            ) : (
              <select
                value={value as string}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                required={field.required}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select an option</option>
                {field.options?.map((option, idx) => (
                  <option key={idx} value={option}>{option}</option>
                ))}
              </select>
            )}
          </>
        )}
        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                  className="text-indigo-600"
                />
                <span className="text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        )}
        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option, idx) => {
              const checkedValues = (value as string[]) || [];
              return (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={option}
                    checked={checkedValues.includes(option)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...checkedValues, option]
                        : checkedValues.filter(v => v !== option);
                      handleFieldChange(field.id, newValues);
                    }}
                    className="text-indigo-600 rounded"
                  />
                  <span className="text-sm text-slate-700">{option}</span>
                </label>
              );
            })}
          </div>
        )}
        {field.type === 'date' && (
          <input
            type="date"
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'file' && (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(field.id, file);
                }
              }}
              required={field.required}
              disabled={uploadingFiles[field.id]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {uploadingFiles[field.id] && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="animate-spin" size={16} />
                <span>Uploading file...</span>
              </div>
            )}
            {value && typeof value === 'string' && value.startsWith('http') && !uploadingFiles[field.id] && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle size={16} />
                <span>File uploaded successfully</span>
              </div>
            )}
          </div>
        )}
        {field.type === 'url' && (
          <input
            type="url"
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-500 mt-4">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Error</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-slate-600">{error || 'Form not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{form.title}</h2>
            {form.description && <p className="text-slate-600 mt-1">{form.description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
              <CheckCircle size={20} />
              <span>Form submitted successfully!</span>
            </div>
          )}

          <div className="space-y-6">
            {/* General Information */}
            {(form.generalInfo.collectName || form.generalInfo.collectEmail || 
              form.generalInfo.collectPhone || form.generalInfo.collectOrganization || 
              form.generalInfo.collectAddress) && (
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">General Information</h3>
                <div className="space-y-4">
                  {form.generalInfo.collectName && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name {form.generalInfo.collectName && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={generalInfo.name}
                        onChange={(e) => handleGeneralInfoChange('name', e.target.value)}
                        required={form.generalInfo.collectName}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                  )}
                  {form.generalInfo.collectEmail && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address {form.generalInfo.collectEmail && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="email"
                        value={generalInfo.email}
                        onChange={(e) => handleGeneralInfoChange('email', e.target.value)}
                        required={form.generalInfo.collectEmail}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  )}
                  {form.generalInfo.collectPhone && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number {form.generalInfo.collectPhone && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="tel"
                        value={generalInfo.phone}
                        onChange={(e) => handleGeneralInfoChange('phone', e.target.value)}
                        required={form.generalInfo.collectPhone}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  )}
                  {form.generalInfo.collectOrganization && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Organization/Institution {form.generalInfo.collectOrganization && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={generalInfo.organization}
                        onChange={(e) => handleGeneralInfoChange('organization', e.target.value)}
                        required={form.generalInfo.collectOrganization}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter your organization"
                      />
                    </div>
                  )}
                  {form.generalInfo.collectAddress && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Address {form.generalInfo.collectAddress && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        rows={3}
                        value={generalInfo.address}
                        onChange={(e) => handleGeneralInfoChange('address', e.target.value)}
                        required={form.generalInfo.collectAddress}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter your address"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sections */}
            {form.sections.map((section) => (
              <div key={section.id} className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{section.title}</h3>
                {section.description && <p className="text-slate-600 mb-4">{section.description}</p>}
                
                {/* Subsections */}
                {section.subsections.map((subsection) => (
                  <div key={subsection.id} className="mb-6">
                    <h4 className="text-md font-medium text-slate-800 mb-2">{subsection.title}</h4>
                    {subsection.description && <p className="text-sm text-slate-600 mb-3">{subsection.description}</p>}
                    <div className="space-y-4">
                      {subsection.fields.map((field) => renderField(field))}
                    </div>
                  </div>
                ))}

                {/* Section Fields */}
                {section.fields.length > 0 && (
                  <div className="space-y-4">
                    {section.fields.map((field) => renderField(field))}
                  </div>
                )}
              </div>
            ))}

            {/* Legacy Fields */}
            {form.fields.length > 0 && (
              <div className="border-t border-slate-200 pt-6 space-y-4">
                {form.fields.map((field) => renderField(field))}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting || success}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle size={20} />
                    Submitted!
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;

