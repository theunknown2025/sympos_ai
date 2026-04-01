import React, { useState, useEffect } from 'react';
import { X, Loader2, Edit2, CheckCircle2, XCircle, Clock, Users, AlertCircle } from 'lucide-react';
import { RegistrationForm, FormField, FormSubmission } from '../../../types';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { supabase, TABLES } from '../../../supabase';
import { getCommitteeMembersByIds } from '../../../services/committeeMemberService';

interface PreviewSubmissionProps {
  submission: FormSubmission;
  onClose: () => void;
  onEdit: () => void;
}

const PreviewSubmission: React.FC<PreviewSubmissionProps> = ({ submission, onClose, onEdit }) => {
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewers, setReviewers] = useState<Array<{ firstName: string; lastName: string; email: string }>>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);

  useEffect(() => {
    loadForm();
    loadReviewers();
  }, [submission.id, submission.formId]);

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

  const loadReviewers = async () => {
    try {
      setLoadingReviewers(true);
      
      // Get dispatch records for this submission
      const { data: dispatchRecords, error: dispatchError } = await supabase
        .from(TABLES.DISPATCH_SUBMISSIONS)
        .select('*')
        .eq('event_id', submission.eventId)
        .eq('form_id', submission.formId);
      
      if (dispatchError) {
        console.error('Error loading dispatch records:', dispatchError);
        return;
      }
      
      if (!dispatchRecords || dispatchRecords.length === 0) {
        setReviewers([]);
        setIsDispatched(false);
        return;
      }
      
      // Find the dispatch record that contains this submission
      let reviewerIds: string[] = [];
      for (const dispatchRecord of dispatchRecords) {
        const dispatching = typeof dispatchRecord.dispatching === 'string'
          ? JSON.parse(dispatchRecord.dispatching)
          : (dispatchRecord.dispatching || {});
        
        if (dispatching[submission.id] && Array.isArray(dispatching[submission.id])) {
          reviewerIds = dispatching[submission.id];
          break;
        }
      }
      
      if (reviewerIds.length === 0) {
        setReviewers([]);
        setIsDispatched(false);
        return;
      }
      
      // Submission is dispatched if reviewers are assigned
      setIsDispatched(true);
      
      // Get committee member details
      const committeeMembers = await getCommitteeMembersByIds(reviewerIds);
      const reviewerNames = committeeMembers.map(member => ({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
      }));
      
      setReviewers(reviewerNames);
    } catch (err: any) {
      console.error('Error loading reviewers:', err);
      setReviewers([]);
      setIsDispatched(false);
    } finally {
      setLoadingReviewers(false);
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
            <h2 className="text-2xl font-bold text-slate-900">Submission Preview</h2>
            <p className="text-sm text-slate-500 mt-1">{submission.eventTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {!submission.decisionStatus && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
              >
                <Edit2 size={16} />
                Edit
              </button>
            )}
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

        {/* Content - Two Column Layout */}
        <div className="p-6 flex gap-6">
          {/* Left Section: Submission Information */}
          <div className="flex-1 space-y-6">
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
              </div>
            </div>
          </div>

          {/* Right Section: Status Steps */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Review Status</h3>
              
              {/* Acceptance Step */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-slate-900">Acceptance Step</h4>
                  {submission.decisionStatus ? (
                    submission.decisionStatus === 'accepted' ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : submission.decisionStatus === 'reserved' ? (
                      <Clock size={16} className="text-amber-600" />
                    ) : (
                      <XCircle size={16} className="text-red-600" />
                    )
                  ) : (
                    <AlertCircle size={16} className="text-slate-400" />
                  )}
                </div>
                <div className="pl-4 space-y-1">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Status: </span>
                    {submission.decisionStatus ? (
                      <span className={`capitalize ${
                        submission.decisionStatus === 'accepted' ? 'text-emerald-700' :
                        submission.decisionStatus === 'reserved' ? 'text-amber-700' :
                        'text-red-700'
                      }`}>
                        {submission.decisionStatus === 'accepted' ? 'Accepted' :
                         submission.decisionStatus === 'reserved' ? 'Accepted under Reserve' :
                         'Not Accepted'}
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </p>
                  {submission.decisionComment && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Comment:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">
                        {submission.decisionComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dispatching Step */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-slate-900">Dispatching Step</h4>
                  {isDispatched || submission.dispatchingStatus ? (
                    <Users size={16} className="text-blue-600" />
                  ) : (
                    <AlertCircle size={16} className="text-slate-400" />
                  )}
                </div>
                <div className="pl-4 space-y-1">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Status: </span>
                    {isDispatched || submission.dispatchingStatus ? (
                      <span className="text-blue-700 capitalize">
                        {submission.dispatchingStatus ? submission.dispatchingStatus.replace('_', ' ') : 'Dispatched'}
                      </span>
                    ) : (
                      <span className="text-slate-400">Not Dispatched</span>
                    )}
                  </p>
                  {loadingReviewers ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-slate-400" />
                      <span className="text-xs text-slate-500">Loading reviewers...</span>
                    </div>
                  ) : reviewers.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Reviewers:</p>
                      <div className="space-y-1">
                        {reviewers.map((reviewer, index) => (
                          <p key={index} className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">
                            {reviewer.firstName} {reviewer.lastName}
                            {reviewer.email && (
                              <span className="text-xs text-slate-500 block mt-0.5">{reviewer.email}</span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (isDispatched || submission.dispatchingStatus) ? (
                    <p className="text-xs text-slate-400 italic mt-2">No reviewers assigned</p>
                  ) : null}
                </div>
              </div>

              {/* Approval Step */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-slate-900">Approval Step</h4>
                  {submission.approvalStatus ? (
                    submission.approvalStatus === 'accepted' ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : submission.approvalStatus === 'reserved' ? (
                      <Clock size={16} className="text-amber-600" />
                    ) : (
                      <XCircle size={16} className="text-red-600" />
                    )
                  ) : (
                    <AlertCircle size={16} className="text-slate-400" />
                  )}
                </div>
                <div className="pl-4 space-y-1">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Status: </span>
                    {submission.approvalStatus ? (
                      <span className={`capitalize ${
                        submission.approvalStatus === 'accepted' ? 'text-emerald-700' :
                        submission.approvalStatus === 'reserved' ? 'text-amber-700' :
                        'text-red-700'
                      }`}>
                        {submission.approvalStatus === 'accepted' ? 'Approved' :
                         submission.approvalStatus === 'reserved' ? 'Approved with Reserve' :
                         'Rejected'}
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </p>
                  {/* Note: Approval comment might not be in the current schema, but we can add it if needed */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewSubmission;
