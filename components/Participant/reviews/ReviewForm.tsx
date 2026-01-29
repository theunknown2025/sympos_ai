import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Save, ArrowLeft, CheckCircle2, FileText, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getEvaluationForm } from '../../../services/evaluationFormService';
import { getEvent } from '../../../services/eventService';
import { getJuryMemberProfile } from '../../../services/juryMemberService';
import { getReviewForSubmission, saveReview } from '../../../services/reviewService';
import { DispatchedItem } from '../../../services/dispatchedItemsService';
import { FormField, FormSection, EvaluationForm, ReviewStatus } from '../../../types';
import { supabase, TABLES } from '../../../supabase';

interface ReviewFormProps {
  item: DispatchedItem;
  onBack: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ item, onBack }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<EvaluationForm | null>(null);
  const [answers, setAnswers] = useState<{ [fieldId: string]: any }>({});
  const [participantId, setParticipantId] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('draft');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, item]);

  const loadData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');

      // Get jury member profile to get email
      const profile = await getJuryMemberProfile(currentUser.id);
      if (!profile) {
        setError('Please create your profile first');
        return;
      }

      // Get committee member ID
      const { data: committeeMembers, error: cmError } = await supabase
        .from(TABLES.COMMITTEE_MEMBERS)
        .select('id')
        .eq('email', profile.email)
        .limit(1);

      if (cmError || !committeeMembers || committeeMembers.length === 0) {
        setError('Committee member profile not found. Please contact the organizer.');
        return;
      }

      setParticipantId(committeeMembers[0].id);

      // Determine which evaluation form to use
      let evaluationFormId: string;
      let evaluationForm: EvaluationForm | null = null;

      if (item.submissionType === 'evaluation') {
        // For evaluation answers, the form_id is already the evaluation form
        evaluationFormId = item.formId;
        console.log('[ReviewForm] Loading evaluation form for evaluation answer:', evaluationFormId);
        evaluationForm = await getEvaluationForm(evaluationFormId);
      } else {
        // For submissions, get the evaluation form from the event's evaluationFormIds
        console.log('[ReviewForm] Loading event to get evaluation form:', item.eventId);
        const event = await getEvent(item.eventId);
        if (!event) {
          console.error('[ReviewForm] Event not found:', item.eventId);
          setError('Event not found');
          return;
        }

        console.log('[ReviewForm] Event evaluationFormIds:', event.evaluationFormIds);

        if (!event.evaluationFormIds || event.evaluationFormIds.length === 0) {
          setError('No evaluation form configured for this event. Please contact the organizer.');
          return;
        }

        // Use the first evaluation form from the event
        // TODO: In the future, we could let the participant select if multiple exist
        evaluationFormId = event.evaluationFormIds[0];
        console.log('[ReviewForm] Loading evaluation form:', evaluationFormId);
        evaluationForm = await getEvaluationForm(evaluationFormId);
      }

      if (!evaluationForm) {
        console.error('[ReviewForm] Evaluation form not found:', evaluationFormId);
        setError(`Evaluation form not found (ID: ${evaluationFormId}). Please contact the organizer.`);
        return;
      }

      console.log('[ReviewForm] Successfully loaded evaluation form:', evaluationForm.title);

      setForm(evaluationForm);

      // Load existing review if it exists (use evaluationFormId for the review lookup)
      const existingReview = await getReviewForSubmission(
        committeeMembers[0].id,
        item.submissionId,
        evaluationFormId
      );

      if (existingReview) {
        setAnswers(existingReview.answers);
        setReviewStatus(existingReview.status || 'draft');
      }
    } catch (err: any) {
      console.error('Error loading review form:', err);
      setError(err.message || 'Failed to load review form');
    } finally {
      setLoading(false);
    }
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

  const handleSave = async (status: ReviewStatus) => {
    if (!currentUser?.id || !participantId || !form) {
      setError('Missing required information');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      // Use the evaluation form ID for saving the review
      const evaluationFormId = form.id;

      // Get the correct event_id from the submission itself (not from dispatch record)
      // This ensures the review is linked to the same event as the submission
      const submissionEventId = 'eventId' in item.submission 
        ? item.submission.eventId 
        : item.eventId; // Fallback to dispatch event_id if submission doesn't have it

      // Debug: Log the IDs we're using for saving
      console.log(`[ReviewForm] Saving review with:`, {
        participantId,
        userId: currentUser.id,
        eventId: submissionEventId,
        eventIdSource: 'eventId' in item.submission ? 'submission' : 'dispatch',
        dispatchEventId: item.eventId,
        submissionEventId: 'eventId' in item.submission ? item.submission.eventId : 'N/A',
        formId: evaluationFormId,
        submissionId: item.submissionId,
        submissionType: item.submissionType,
        status,
        submissionIdType: typeof item.submissionId,
        formIdType: typeof evaluationFormId,
        eventIdType: typeof submissionEventId,
      });

      // Save to participant_reviews table (single source of truth for reviews)
      const reviewId = await saveReview({
        participantId,
        userId: currentUser.id,
        eventId: submissionEventId, // Use submission's event_id to ensure correct event linkage
        formId: evaluationFormId, // Use evaluation form ID, not the submission form ID
        submissionId: item.submissionId,
        submissionType: item.submissionType,
        status,
        answers,
      });
      
      console.log(`[ReviewForm] Review saved successfully with ID: ${reviewId}`);
      
      // Note: We no longer save to evaluation_answers table as it lacks proper linking fields
      // (submission_id, event_id, participant_id, status). participant_reviews is the single source of truth.

      setReviewStatus(status);
      setSuccess(true);
      
      if (status === 'completed') {
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        // For draft, just show success message briefly
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error saving review:', err);
      setError(err.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave('completed');
  };

  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleSave('draft');
  };

  const renderField = (field: FormField) => {
    const value = answers[field.id];
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

    // Handle multiple answers
    if (isMultiple && (field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' || field.type === 'textarea')) {
      const values = Array.isArray(value) ? value : (value ? [value] : ['']);
      
      return (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
            <span className="text-xs text-slate-500 ml-2">(Multiple answers allowed)</span>
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

    // Single answer rendering
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
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'email' && (
          <input
            type="email"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'phone' && (
          <input
            type="tel"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'number' && (
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            rows={4}
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'select' && (
          <select
            value={(value as string) || ''}
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
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'url' && (
          <input
            type="url"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </div>
    );
  };

  const getAllFields = (): FormField[] => {
    if (!form) return [];
    
    const fields: FormField[] = [];
    
    // Add fields from sections
    form.sections.forEach(section => {
      // Fields directly in section
      fields.push(...section.fields);
      
      // Fields in subsections
      section.subsections.forEach(subsection => {
        fields.push(...subsection.fields);
      });
    });
    
    // Add legacy fields not in sections
    fields.push(...form.fields);
    
    // Sort by order
    return fields.sort((a, b) => a.order - b.order);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading review form...</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading review form</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={onBack}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  const submission = item.submission;
  const submissionName = 'generalInfo' in submission
    ? (submission.generalInfo?.name || submission.submittedBy || 'Unnamed Submission')
    : (submission.generalInfo?.name || submission.submittedBy || 'Unnamed Evaluation');

  return (
    <div className="h-full">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Reviews</span>
        </button>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileText size={32} className="text-indigo-600" />
          Review Evaluation
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Evaluating: <span className="font-medium">{submissionName}</span>
        </p>
        <p className="text-slate-500 text-sm">
          Event: <span className="font-medium">{item.eventName}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className={`mb-4 p-3 border rounded-lg flex items-center gap-2 ${
          reviewStatus === 'completed' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <CheckCircle2 className={`h-5 w-5 ${
            reviewStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
          }`} />
          <span className={`text-sm ${
            reviewStatus === 'completed' ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {reviewStatus === 'completed' 
              ? 'Review submitted successfully!' 
              : 'Draft saved successfully!'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6">
        {form.description && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-700">{form.description}</p>
          </div>
        )}

        <div className="space-y-6">
          {form.sections.length > 0 ? (
            form.sections.map(section => (
              <div key={section.id} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">{section.title}</h2>
                {section.description && (
                  <p className="text-sm text-slate-600 mb-4">{section.description}</p>
                )}
                
                <div className="space-y-4">
                  {/* Fields directly in section */}
                  {section.fields.map(field => renderField(field))}
                  
                  {/* Subsections */}
                  {section.subsections.map(subsection => (
                    <div key={subsection.id} className="ml-4 border-l-2 border-slate-200 pl-4">
                      <h3 className="text-md font-medium text-slate-800 mb-2">{subsection.title}</h3>
                      {subsection.description && (
                        <p className="text-xs text-slate-500 mb-3">{subsection.description}</p>
                      )}
                      <div className="space-y-4">
                        {subsection.fields.map(field => renderField(field))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Legacy: fields not in sections
            getAllFields().map(field => renderField(field))
          )}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {reviewStatus === 'draft' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Draft
              </span>
            )}
            {reviewStatus === 'completed' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Draft
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
