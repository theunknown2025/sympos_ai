import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Plus, 
  X, 
  Users, 
  FileText,
  Save,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getUserEvents, Event } from '../../../../services/eventService';
import { getUserRegistrationForms, RegistrationForm } from '../../../../services/registrationFormService';
import { getUserEvaluationForms, EvaluationForm } from '../../../../services/evaluationFormService';
import { getEventSubmissions, FormSubmission } from '../../../../services/registrationSubmissionService';
import { getEvaluationAnswers, EvaluationAnswer } from '../../../../services/evaluationAnswerService';
import { getCommittees, Committee } from '../../../../services/committeeService';
import { getCommitteeMembers } from '../../../../services/committeeMemberService';
import { saveDispatchSubmission, getDispatchSubmission } from '../../../../services/dispatchService';
import { DispatchSubmission, ReviewCommitteeMember } from '../../../../types';

const DispatchSubmissions: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [evaluationForms, setEvaluationForms] = useState<EvaluationForm[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<ReviewCommitteeMember[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [evaluationAnswers, setEvaluationAnswers] = useState<EvaluationAnswer[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [selectedEvaluationFormId, setSelectedEvaluationFormId] = useState<string>('');
  const [formType, setFormType] = useState<'submission' | 'evaluation'>('submission');
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const [dispatching, setDispatching] = useState<{ [submissionId: string]: string[] }>({});
  const [draggedMember, setDraggedMember] = useState<ReviewCommitteeMember | null>(null);
  const [dragOverSubmission, setDragOverSubmission] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Helper function to remove prefix from form title
  const removePrefix = (title: string, prefix: string): string => {
    // Handle "Eval - " or "Eval-" patterns
    if (prefix === 'Eval') {
      return title
        .replace(/^eval\s*-\s*/i, '')
        .replace(/^eval\s*/i, '')
        .trim();
    }
    // Handle "Sub - " or "Sub-" patterns
    if (prefix === 'Sub') {
      return title
        .replace(/^sub\s*-\s*/i, '')
        .replace(/^sub\s*/i, '')
        .trim();
    }
    // Default behavior
    if (title.startsWith(prefix)) {
      return title.substring(prefix.length).trim();
    }
    return title;
  };

  // Get selected event's submission form IDs
  const selectedEventSubmissionFormIds = useMemo(() => {
    if (!selectedEventId) return [];
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return [];
    return event.submissionFormIds || [];
  }, [selectedEventId, events]);

  // Get selected event's evaluation form IDs
  const selectedEventEvaluationFormIds = useMemo(() => {
    if (!selectedEventId) return [];
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return [];
    return event.evaluationFormIds || [];
  }, [selectedEventId, events]);

  // Filter to show only submission forms attached to the selected event
  const submissionForms = useMemo(() => {
    if (!selectedEventId || selectedEventSubmissionFormIds.length === 0) {
      return [];
    }
    
    // Filter forms to only include those in the selected event's submissionFormIds
    return forms.filter(form => {
      // Must be in the event's submission form IDs
      if (!selectedEventSubmissionFormIds.includes(form.id)) {
        return false;
      }
      
      // Also check if it's a submission form by title (for safety)
      const titleLower = form.title.toLowerCase();
      return titleLower.startsWith('sub - ') || 
             titleLower.startsWith('sub-') || 
             titleLower.includes('submission') || 
             titleLower.includes('submit');
    });
  }, [forms, selectedEventId, selectedEventSubmissionFormIds]);

  // Filter to show only evaluation forms attached to the selected event
  const availableEvaluationForms = useMemo(() => {
    if (!selectedEventId || selectedEventEvaluationFormIds.length === 0) {
      return [];
    }
    
    // Filter evaluation forms to only include those in the selected event's evaluationFormIds
    return evaluationForms.filter(form => {
      // Must be in the event's evaluation form IDs
      if (!selectedEventEvaluationFormIds.includes(form.id)) {
        return false;
      }
      
      // Also check if it's an evaluation form by title (for safety)
      const titleLower = form.title.toLowerCase();
      return titleLower.startsWith('eval - ') || 
             titleLower.startsWith('eval-') || 
             titleLower.includes('evaluation') || 
             titleLower.includes('evaluate');
    });
  }, [evaluationForms, selectedEventId, selectedEventEvaluationFormIds]);

  // Filter to show only accepted submissions
  const acceptedSubmissions = useMemo(() => {
    return submissions.filter(sub => sub.decisionStatus === 'accepted');
  }, [submissions]);

  // All evaluation answers (no filtering needed as they're all "accepted" by default)
  const allEvaluationAnswers = useMemo(() => {
    return evaluationAnswers;
  }, [evaluationAnswers]);

  // Create a map of member ID to member object
  const membersMap = useMemo(() => {
    const map = new Map<string, ReviewCommitteeMember>();
    committeeMembers.forEach(member => {
      map.set(member.id, member);
    });
    return map;
  }, [committeeMembers]);

  // Get all unique committee members from all committees
  const allCommitteeMembers = useMemo(() => {
    const memberIdSet = new Set<string>();
    committees.forEach(committee => {
      committee.fieldsOfIntervention.forEach(field => {
        field.memberIds.forEach(id => memberIdSet.add(id));
      });
    });
    return Array.from(memberIdSet).map(id => membersMap.get(id)).filter(Boolean) as ReviewCommitteeMember[];
  }, [committees, membersMap]);

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  // Auto-select first form when event is selected
  useEffect(() => {
    if (selectedEventId) {
      // Reset form type and selections when event changes
      setFormType('submission');
      setSelectedFormId('');
      setSelectedEvaluationFormId('');
      
      // Auto-select first submission form if available
      if (submissionForms.length > 0) {
        setSelectedFormId(submissionForms[0].id);
        setFormType('submission');
      } else if (availableEvaluationForms.length > 0) {
        // If no submission forms, try evaluation forms
        setSelectedEvaluationFormId(availableEvaluationForms[0].id);
        setFormType('evaluation');
      }
    } else {
      // If no event selected, clear all selections
      setSelectedFormId('');
      setSelectedEvaluationFormId('');
      setFormType('submission');
    }
  }, [selectedEventId, submissionForms, availableEvaluationForms]);

  useEffect(() => {
    if (selectedEventId) {
      if (formType === 'submission' && selectedFormId) {
        loadSubmissions();
        loadExistingDispatch(selectedFormId);
      } else if (formType === 'evaluation' && selectedEvaluationFormId) {
        loadEvaluationAnswers();
        loadExistingDispatch(selectedEvaluationFormId);
      } else {
        setSubmissions([]);
        setEvaluationAnswers([]);
        setDispatching({});
        setDeadline('');
      }
    } else {
      setSubmissions([]);
      setEvaluationAnswers([]);
      setDispatching({});
      setDeadline('');
    }
  }, [selectedEventId, selectedFormId, selectedEvaluationFormId, formType, currentUser]);

  const loadInitialData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');

      const [eventsData, formsData, evalFormsData, committeesData, membersData] = await Promise.all([
        getUserEvents(currentUser.id),
        getUserRegistrationForms(currentUser.id),
        getUserEvaluationForms(currentUser.id),
        getCommittees(currentUser.id),
        getCommitteeMembers(currentUser.id)
      ]);

      setEvents(eventsData);
      setForms(formsData);
      setEvaluationForms(evalFormsData);
      setCommittees(committeesData);
      setCommitteeMembers(membersData);
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!selectedEventId || !currentUser?.id) return;

    try {
      setLoading(true);
      // Get all submissions for the event (includes submissions where event_id OR accepted_event_id matches)
      const eventSubmissions = await getEventSubmissions(selectedEventId);
      
      // Filter by:
      // 1. Selected form
      // 2. Accepted status
      // 3. Must be accepted for this specific event (prioritize acceptedEventId)
      const filteredSubmissions = eventSubmissions.filter(sub => {
        // Must match the selected form
        if (sub.formId !== selectedFormId) return false;
        
        // Must be accepted
        if (sub.decisionStatus !== 'accepted') return false;
        
        // Must be accepted for this event
        // Priority: if acceptedEventId exists, it must match; otherwise eventId must match
        if (sub.acceptedEventId) {
          // If acceptedEventId is set, it must match the selected event
          return sub.acceptedEventId === selectedEventId;
        } else {
          // For backward compatibility: if no acceptedEventId, use eventId
          return sub.eventId === selectedEventId;
        }
      });
      
      setSubmissions(filteredSubmissions);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationAnswers = async () => {
    if (!selectedEvaluationFormId || !currentUser?.id) return;

    try {
      setLoading(true);
      const answers = await getEvaluationAnswers(selectedEvaluationFormId);
      setEvaluationAnswers(answers);
    } catch (err: any) {
      console.error('Error loading evaluation answers:', err);
      setError(err.message || 'Failed to load evaluation answers');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingDispatch = async (formId: string) => {
    if (!selectedEventId || !formId || !currentUser?.id) return;

    try {
      const existing = await getDispatchSubmission(currentUser.id, selectedEventId, formId);
      if (existing) {
        setDispatching(existing.dispatching);
        // Set deadline if it exists, format for datetime-local input
        if (existing.deadline) {
          const deadlineDate = new Date(existing.deadline);
          // Format as YYYY-MM-DDTHH:mm for datetime-local input
          const year = deadlineDate.getFullYear();
          const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
          const day = String(deadlineDate.getDate()).padStart(2, '0');
          const hours = String(deadlineDate.getHours()).padStart(2, '0');
          const minutes = String(deadlineDate.getMinutes()).padStart(2, '0');
          setDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
        } else {
          setDeadline('');
        }
      } else {
        setDispatching({});
        setDeadline('');
      }
    } catch (err: any) {
      console.error('Error loading existing dispatch:', err);
      // Don't show error for this, just start with empty dispatch
      setDispatching({});
      setDeadline('');
    }
  };

  const toggleSubmissionExpanded = (submissionId: string) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedSubmissions(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, member: ReviewCommitteeMember) => {
    setDraggedMember(member);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', member.id);
  };

  const handleDragOver = (e: React.DragEvent, submissionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSubmission(submissionId);
  };

  const handleDragLeave = () => {
    setDragOverSubmission(null);
  };

  const handleDrop = (e: React.DragEvent, submissionId: string) => {
    e.preventDefault();
    setDragOverSubmission(null);

    if (!draggedMember) return;

    setDispatching(prev => {
      const currentMembers = prev[submissionId] || [];
      if (!currentMembers.includes(draggedMember.id)) {
        return {
          ...prev,
          [submissionId]: [...currentMembers, draggedMember.id]
        };
      }
      return prev;
    });

    setDraggedMember(null);
  };

  const removeMemberFromSubmission = (submissionId: string, memberId: string) => {
    setDispatching(prev => {
      const currentMembers = prev[submissionId] || [];
      return {
        ...prev,
        [submissionId]: currentMembers.filter(id => id !== memberId)
      };
    });
  };

  const getMemberName = (memberId: string): string => {
    const member = membersMap.get(memberId);
    if (!member) return 'Unknown Member';
    return `${member.title ? `${member.title} ` : ''}${member.firstName} ${member.lastName}`.trim();
  };

  const handleSave = async () => {
    const formId = formType === 'submission' ? selectedFormId : selectedEvaluationFormId;
    
    if (!selectedEventId || !formId || !currentUser?.id) {
      setError('Please select an event and form');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      // Convert deadline string to Date if provided
      const deadlineDate = deadline ? new Date(deadline) : undefined;

      await saveDispatchSubmission(
        currentUser.id,
        selectedEventId,
        formId,
        dispatching,
        deadlineDate
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving dispatch:', err);
      setError(err.message || 'Failed to save dispatch');
    } finally {
      setSaving(false);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedForm = submissionForms.find(f => f.id === selectedFormId);
  const selectedEvaluationForm = availableEvaluationForms.find(f => f.id === selectedEvaluationFormId);

  if (loading && events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Dispatch Submissions</h2>
        <p className="text-slate-600">Match accepted submissions with committee members</p>
      </div>

      {/* Selection Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              // Form will be auto-selected by useEffect if event has forms
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select an event --</option>
            {events
              .filter(event => 
                (event.submissionFormIds && event.submissionFormIds.length > 0) ||
                (event.evaluationFormIds && event.evaluationFormIds.length > 0)
              )
              .map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Submission Form
          </label>
          <select
            value={selectedFormId}
            onChange={(e) => {
              setSelectedFormId(e.target.value);
              if (e.target.value) {
                setFormType('submission');
                setSelectedEvaluationFormId('');
              }
            }}
            disabled={!selectedEventId || submissionForms.length === 0}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            {submissionForms.length === 0 ? (
              <option value="">
                {selectedEventId ? 'No submission forms for this event' : '-- Select an event first --'}
              </option>
            ) : (
              <>
                {submissionForms.length > 1 && <option value="">-- Select a form --</option>}
                {submissionForms.map(form => (
                  <option key={form.id} value={form.id}>
                    {removePrefix(form.title, 'Sub')}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <FileText className="text-orange-600" size={16} />
            Select Evaluation Form
          </label>
          <select
            value={selectedEvaluationFormId}
            onChange={(e) => {
              setSelectedEvaluationFormId(e.target.value);
              if (e.target.value) {
                setFormType('evaluation');
                setSelectedFormId('');
              }
            }}
            disabled={!selectedEventId || availableEvaluationForms.length === 0}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            {availableEvaluationForms.length === 0 ? (
              <option value="">
                {selectedEventId ? 'No evaluation forms for this event' : '-- Select an event first --'}
              </option>
            ) : (
              <>
                {availableEvaluationForms.length > 1 && <option value="">-- Select a form --</option>}
                {availableEvaluationForms.map(form => (
                  <option key={form.id} value={form.id}>
                    {removePrefix(form.title, 'Eval')}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {/* Deadline Section */}
      {selectedEventId && ((formType === 'submission' && selectedFormId) || (formType === 'evaluation' && selectedEvaluationFormId)) && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Review Deadline (Optional)
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 min-w-[250px]"
            />
            {deadline && (
              <button
                type="button"
                onClick={() => setDeadline('')}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Set a deadline for when reviews should be completed. Leave empty if no deadline is required.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800 text-sm">Dispatch saved successfully!</span>
        </div>
      )}

      {selectedEventId && ((formType === 'submission' && selectedFormId) || (formType === 'evaluation' && selectedEvaluationFormId)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Accepted Submissions or Evaluation Answers */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className={`h-5 w-5 ${formType === 'evaluation' ? 'text-orange-600' : ''}`} />
                {formType === 'evaluation' 
                  ? `Evaluation Answers (${allEvaluationAnswers.length})`
                  : `Accepted Submissions (${acceptedSubmissions.length})`
                }
              </h3>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {formType === 'evaluation' ? (
                allEvaluationAnswers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No evaluation answers found</p>
                  </div>
                ) : (
                  allEvaluationAnswers.map(answer => {
                    const isExpanded = expandedSubmissions.has(answer.id);
                    const assignedMembers = dispatching[answer.id] || [];
                    
                    return (
                      <div
                        key={answer.id}
                        className="border border-orange-200 rounded-lg p-3 bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 mb-1">
                              {answer.generalInfo?.name || answer.submittedBy || 'Unnamed Evaluation'}
                            </div>
                            <div className="text-sm text-slate-600">
                              {answer.generalInfo?.email || 'No email'}
                            </div>
                            {assignedMembers.length > 0 && (
                              <div className="mt-2 text-xs text-orange-600">
                                {assignedMembers.length} member{assignedMembers.length !== 1 ? 's' : ''} assigned
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => toggleSubmissionExpanded(answer.id)}
                            className="ml-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title={isExpanded ? 'Collapse' : 'Expand to assign members'}
                          >
                            <Plus className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="text-sm font-medium text-slate-700 mb-2">
                              Assigned Committee Members
                            </div>
                            <div
                              onDragOver={(e) => handleDragOver(e, answer.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, answer.id)}
                              className={`min-h-[100px] p-3 rounded-lg border-2 border-dashed transition-colors ${
                                dragOverSubmission === answer.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-slate-300 bg-slate-50'
                              }`}
                            >
                              {assignedMembers.length === 0 ? (
                                <div className="text-center text-slate-400 text-sm py-4">
                                  Drag committee members here
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {assignedMembers.map(memberId => {
                                    const member = membersMap.get(memberId);
                                    if (!member) return null;
                                    return (
                                      <div
                                        key={memberId}
                                        className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg"
                                      >
                                        <span className="text-sm text-slate-700">
                                          {getMemberName(memberId)}
                                        </span>
                                        <button
                                          onClick={() => removeMemberFromSubmission(answer.id, memberId)}
                                          className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                                          title="Remove member"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : acceptedSubmissions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No accepted submissions found</p>
                </div>
              ) : (
                acceptedSubmissions.map(submission => {
                  const isExpanded = expandedSubmissions.has(submission.id);
                  const assignedMembers = dispatching[submission.id] || [];
                  
                  return (
                    <div
                      key={submission.id}
                      className="border border-slate-200 rounded-lg p-3 bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 mb-1">
                            {submission.generalInfo?.name || submission.submittedBy || 'Unnamed Submission'}
                          </div>
                          <div className="text-sm text-slate-600">
                            {submission.generalInfo?.email || 'No email'}
                          </div>
                          {assignedMembers.length > 0 && (
                            <div className="mt-2 text-xs text-blue-600">
                              {assignedMembers.length} member{assignedMembers.length !== 1 ? 's' : ''} assigned
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleSubmissionExpanded(submission.id)}
                          className="ml-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          title={isExpanded ? 'Collapse' : 'Expand to assign members'}
                        >
                          <Plus className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="text-sm font-medium text-slate-700 mb-2">
                            Assigned Committee Members
                          </div>
                          <div
                            onDragOver={(e) => handleDragOver(e, submission.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, submission.id)}
                            className={`min-h-[100px] p-3 rounded-lg border-2 border-dashed transition-colors ${
                              dragOverSubmission === submission.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-300 bg-slate-50'
                            }`}
                          >
                            {assignedMembers.length === 0 ? (
                              <div className="text-center text-slate-400 text-sm py-4">
                                Drag committee members here
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {assignedMembers.map(memberId => {
                                  const member = membersMap.get(memberId);
                                  if (!member) return null;
                                  return (
                                    <div
                                      key={memberId}
                                      className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg"
                                    >
                                      <span className="text-sm text-slate-700">
                                        {getMemberName(memberId)}
                                      </span>
                                      <button
                                        onClick={() => removeMemberFromSubmission(submission.id, memberId)}
                                        className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                                        title="Remove member"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side - Committees */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Committees ({committees.length})
              </h3>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {committees.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No committees found</p>
                  <p className="text-sm mt-1">Create committees first to assign members</p>
                </div>
              ) : (
                committees.map(committee => {
                  // Get all unique members from this committee
                  const memberIdSet = new Set<string>();
                  committee.fieldsOfIntervention.forEach(field => {
                    field.memberIds.forEach(id => memberIdSet.add(id));
                  });
                  const committeeMembersList = Array.from(memberIdSet)
                    .map(id => membersMap.get(id))
                    .filter(Boolean) as ReviewCommitteeMember[];

                  return (
                    <div
                      key={committee.id}
                      className="border border-slate-200 rounded-lg p-3 bg-white"
                    >
                      <div className="font-medium text-slate-900 mb-2">
                        {committee.name}
                      </div>
                      {committee.description && (
                        <div className="text-sm text-slate-600 mb-3">
                          {committee.description}
                        </div>
                      )}
                      <div className="space-y-2">
                        {committeeMembersList.length === 0 ? (
                          <div className="text-sm text-slate-400 italic">
                            No members in this committee
                          </div>
                        ) : (
                          committeeMembersList.map(member => (
                            <div
                              key={member.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, member)}
                              className="p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-move hover:bg-slate-100 hover:border-slate-300 transition-colors"
                            >
                              <div className="text-sm font-medium text-slate-900">
                                {getMemberName(member.id)}
                              </div>
                              {member.email && (
                                <div className="text-xs text-slate-600 mt-0.5">
                                  {member.email}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {selectedEventId && ((formType === 'submission' && selectedFormId) || (formType === 'evaluation' && selectedEvaluationFormId)) && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Dispatch
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DispatchSubmissions;
