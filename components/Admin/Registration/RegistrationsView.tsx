import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Filter,
  Download,
  Trash2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  User,
  Building,
  MapPin,
  File,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserSubmissions, FormSubmission, deleteFormSubmission, deleteFormSubmissions } from '../../../services/registrationSubmissionService';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { RegistrationForm } from '../../../types';

const RegistrationsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [formsMap, setFormsMap] = useState<Map<string, RegistrationForm>>(new Map());
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      loadSubmissions(currentUser.id);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadSubmissions = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      const userSubmissions = await getUserSubmissions(userId);
      setSubmissions(userSubmissions);
      
      // Load all unique forms
      await loadForms(userSubmissions);
    } catch (err: any) {
      setError('Failed to load registrations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadForms = async (submissions: FormSubmission[]) => {
    try {
      setLoadingForms(true);
      const uniqueFormIds = Array.from(new Set(submissions.map(s => s.formId)));
      const forms = new Map<string, RegistrationForm>();
      
      for (const formId of uniqueFormIds) {
        try {
          const form = await getRegistrationForm(formId);
          if (form) {
            forms.set(formId, form);
          }
        } catch (err) {
          console.error(`Error loading form ${formId}:`, err);
        }
      }
      
      setFormsMap(forms);
    } catch (err: any) {
      console.error('Error loading forms:', err);
    } finally {
      setLoadingForms(false);
    }
  };

  const getUniqueEvents = () => {
    const events = submissions.map(s => ({ id: s.eventId, title: s.eventTitle }));
    const unique = Array.from(new Map(events.map(e => [e.id, e])).values());
    return unique;
  };

  const getSubmissionsByEvent = () => {
    const grouped = new Map<string, FormSubmission[]>();
    submissions.forEach(submission => {
      if (selectedEvent === 'all' || submission.eventId === selectedEvent) {
        const existing = grouped.get(submission.eventId) || [];
        grouped.set(submission.eventId, [...existing, submission]);
      }
    });
    return grouped;
  };

  const getAllFieldLabels = (formId: string): { id: string; label: string }[] => {
    const form = formsMap.get(formId);
    if (!form) return [];

    const fields: { id: string; label: string }[] = [];

    // General info fields
    if (form.generalInfo.collectName) fields.push({ id: 'general_name', label: 'Full Name' });
    if (form.generalInfo.collectEmail) fields.push({ id: 'general_email', label: 'Email' });
    if (form.generalInfo.collectPhone) fields.push({ id: 'general_phone', label: 'Phone' });
    if (form.generalInfo.collectOrganization) fields.push({ id: 'general_organization', label: 'Organization' });
    if (form.generalInfo.collectAddress) fields.push({ id: 'general_address', label: 'Address' });

    // Form fields from sections
    form.sections.forEach(section => {
      section.fields.forEach(field => {
        fields.push({ id: field.id, label: field.label });
      });
      section.subsections.forEach(subsection => {
        subsection.fields.forEach(field => {
          fields.push({ id: field.id, label: field.label });
        });
      });
    });

    // Legacy fields
    form.fields.forEach(field => {
      fields.push({ id: field.id, label: field.label });
    });

    return fields;
  };

  const getFieldValue = (submission: FormSubmission, fieldId: string): string => {
    if (fieldId.startsWith('general_')) {
      const key = fieldId.replace('general_', '') as keyof typeof submission.generalInfo;
      return submission.generalInfo?.[key] || 'N/A';
    }
    return renderFieldValue(fieldId, submission.answers[fieldId]);
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this registration? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(submissionId));
      await deleteFormSubmission(submissionId);
      setSubmissions(submissions.filter(s => s.id !== submissionId));
      setSelectedSubmissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    } catch (err: any) {
      setError('Failed to delete registration. Please try again.');
      console.error(err);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubmissions.size === 0) return;
    
    const count = selectedSubmissions.size;
    if (!window.confirm(`Are you sure you want to delete ${count} registration(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingIds(new Set(selectedSubmissions));
      await deleteFormSubmissions(Array.from(selectedSubmissions));
      setSubmissions(submissions.filter(s => !selectedSubmissions.has(s.id)));
      setSelectedSubmissions(new Set());
    } catch (err: any) {
      setError('Failed to delete registrations. Please try again.');
      console.error(err);
    } finally {
      setDeletingIds(new Set());
    }
  };

  const handleDeleteAllForEvent = async (eventId: string, eventTitle: string) => {
    const eventSubmissions = submissions.filter(s => s.eventId === eventId);
    if (eventSubmissions.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete all ${eventSubmissions.length} registration(s) for "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const submissionIds = eventSubmissions.map(s => s.id);
      setDeletingIds(new Set(submissionIds));
      await deleteFormSubmissions(submissionIds);
      setSubmissions(submissions.filter(s => s.eventId !== eventId));
      setSelectedSubmissions(new Set());
    } catch (err: any) {
      setError('Failed to delete registrations. Please try again.');
      console.error(err);
    } finally {
      setDeletingIds(new Set());
    }
  };

  const toggleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const toggleSelectAllForEvent = (eventSubmissions: FormSubmission[]) => {
    const allSelected = eventSubmissions.every(s => selectedSubmissions.has(s.id));
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        eventSubmissions.forEach(s => newSet.delete(s.id));
      } else {
        eventSubmissions.forEach(s => newSet.add(s.id));
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    const submissionsByEvent = getSubmissionsByEvent();
    
    // Collect all data
    const csvData: string[] = [];
    
    Array.from(submissionsByEvent.entries()).forEach(([eventId, eventSubmissions]) => {
      const eventTitle = eventSubmissions[0]?.eventTitle || 'Unknown Event';
      const formId = eventSubmissions[0]?.formId;
      const fieldLabels = formId ? getAllFieldLabels(formId) : [];
      
      // Event header
      csvData.push(`Event: ${eventTitle}`);
      csvData.push(`Total Registrations: ${eventSubmissions.length}`);
      csvData.push('');
      
      // Table header
      const headers = ['Submitted At', ...fieldLabels.map(f => f.label)];
      csvData.push(headers.join(','));
      
      // Table rows
      eventSubmissions.forEach(submission => {
        const row = [
          formatDate(submission.submittedAt),
          ...fieldLabels.map(field => {
            const value = submission.answers[field.id];
            let formattedValue: string;
            
            // Handle sub-fields (array of objects)
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
              // Format as: "Entry 1: Name=John, Phone=123; Entry 2: Name=Jane, Phone=456"
              formattedValue = value
                .filter(v => v !== null && v !== undefined)
                .map((row, index) => {
                  const entries = Object.entries(row)
                    .filter(([_, val]) => val !== null && val !== undefined && val !== '')
                    .map(([key, val]) => `${key}=${val}`)
                    .join(', ');
                  return `Entry ${index + 1}: ${entries}`;
                })
                .join('; ');
            } else {
              // For multiple simple answers, format as semicolon-separated list
              formattedValue = Array.isArray(value) 
                ? value.filter(v => v !== null && v !== undefined && v !== '').join('; ')
                : getFieldValue(submission, field.id);
            }
            
            // Escape commas and quotes in CSV
            return `"${String(formattedValue).replace(/"/g, '""')}"`;
          })
        ];
        csvData.push(row.join(','));
      });
      
      csvData.push('');
      csvData.push('');
    });
    
    // Create and download CSV file
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const renderFieldValue = (fieldId: string, value: any): string => {
    if (Array.isArray(value)) {
      // Filter out empty values and join
      const filtered = value.filter(v => v !== null && v !== undefined && v !== '');
      return filtered.length > 0 ? filtered.join(', ') : 'N/A';
    }
    if (value instanceof Date) {
      return formatDate(value);
    }
    return String(value || 'N/A');
  };

  const renderFieldValueDisplay = (fieldId: string, value: any, fieldLabel: string, form?: RegistrationForm) => {
    // Check if this is a sub-fields array (array of objects)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      // This is a sub-fields structure (array of objects)
      const filtered = value.filter(v => v !== null && v !== undefined);
      if (filtered.length === 0) {
        return <p className="text-sm text-slate-400 italic">No entries provided</p>;
      }
      
      // Find the field definition to get sub-field labels
      let field: any = null;
      if (form) {
        const allFields: any[] = [
          ...form.fields,
          ...form.sections.flatMap(s => [
            ...s.fields,
            ...s.subsections.flatMap(sub => sub.fields)
          ])
        ];
        field = allFields.find(f => f.id === fieldId);
      }
      
      const subFields = field?.subFields || [];
      const subFieldLabels = new Map(subFields.map((sf: any) => [sf.id, sf.label]));
      
      // Get all unique sub-field IDs from all rows to ensure consistent columns
      const allSubFieldIds = Array.from(new Set(
        filtered.flatMap(row => Object.keys(row))
      ));
      
      // If we have sub-field definitions, use those; otherwise use the keys from the data
      const columns = subFields.length > 0 
        ? subFields.map((sf: any) => ({ id: sf.id, label: sf.label }))
        : allSubFieldIds.map(id => ({ id, label: subFieldLabels.get(id) || id }));
      
      return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-16">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filtered.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                      {rowIndex + 1}
                    </td>
                    {columns.map((col) => {
                      const subValue = row[col.id];
                      return (
                        <td key={col.id} className="px-4 py-3 text-sm text-slate-900">
                          {subValue instanceof Date 
                            ? formatDate(subValue) 
                            : String(subValue || 'N/A')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    // Check if this is a multiple answer field (array of simple values)
    if (Array.isArray(value)) {
      const filtered = value.filter(v => v !== null && v !== undefined && v !== '');
      if (filtered.length === 0) {
        return <p className="text-sm text-slate-400 italic">No answers provided</p>;
      }
      return (
        <div className="space-y-2">
          {filtered.map((val, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-sm text-slate-900 flex-1">{String(val)}</p>
            </div>
          ))}
        </div>
      );
    }
    
    // Single value display
    if (value instanceof Date) {
      return <p className="text-sm text-slate-900">{formatDate(value)}</p>;
    }
    return <p className="text-sm text-slate-900 break-words">{String(value || 'N/A')}</p>;
  };

  const toggleExpanded = (submissionId: string) => {
    setExpandedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const isFileField = (value: any): boolean => {
    if (typeof value === 'string') {
      // Check if it looks like a file name or URL
      return value.includes('.') && (
        value.endsWith('.pdf') || 
        value.endsWith('.doc') || 
        value.endsWith('.docx') || 
        value.endsWith('.jpg') || 
        value.endsWith('.jpeg') || 
        value.endsWith('.png') ||
        value.endsWith('.gif') ||
        value.endsWith('.webp') ||
        value.endsWith('.svg') ||
        value.startsWith('http://') ||
        value.startsWith('https://')
      );
    }
    return false;
  };

  const isImageFile = (value: string): boolean => {
    if (typeof value !== 'string') return false;
    const lower = value.toLowerCase();
    return lower.endsWith('.jpg') || 
           lower.endsWith('.jpeg') || 
           lower.endsWith('.png') ||
           lower.endsWith('.gif') ||
           lower.endsWith('.webp') ||
           lower.endsWith('.svg') ||
           (value.startsWith('http') && (lower.includes('image') || lower.match(/\.(jpg|jpeg|png|gif|webp|svg)/)));
  };

  const isPdfFile = (value: string): boolean => {
    if (typeof value !== 'string') return false;
    const lower = value.toLowerCase();
    return lower.endsWith('.pdf') || (value.startsWith('http') && lower.includes('.pdf'));
  };

  const isUrl = (value: string): boolean => {
    return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg': return '🖼️';
      default: return '📎';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4">Loading registrations...</p>
      </div>
    );
  }

  const uniqueEvents = getUniqueEvents();

  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Registrations</h1>
          <p className="text-slate-500 mt-1 text-sm">View and manage event registrations</p>
        </div>
        <div className="flex gap-3">
          {selectedSubmissions.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              disabled={deletingIds.size > 0}
              className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingIds.size > 0 ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} /> Delete Selected ({selectedSubmissions.size})
                </>
              )}
            </button>
          )}
          <button 
            onClick={exportToCSV}
            disabled={submissions.length === 0 || loadingForms}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Event Filter */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-slate-500" />
          <label className="text-sm font-medium text-slate-700">Filter by Event:</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Events ({submissions.length})</option>
            {uniqueEvents.map((event) => {
              const count = submissions.filter(s => s.eventId === event.id).length;
              return (
                <option key={event.id} value={event.id}>
                  {event.title} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {loadingForms && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading form details...</span>
        </div>
      )}

      {(() => {
        const submissionsByEvent = getSubmissionsByEvent();
        
        if (submissionsByEvent.size === 0) {
          return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <FileText className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No registrations yet</h3>
              <p className="text-slate-500">
                {selectedEvent === 'all' 
                  ? 'Registrations will appear here once users submit forms.'
                  : 'No registrations found for this event.'}
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {Array.from(submissionsByEvent.entries()).map(([eventId, eventSubmissions]) => {
              const eventTitle = eventSubmissions[0]?.eventTitle || 'Unknown Event';
              const formId = eventSubmissions[0]?.formId;
              const fieldLabels = formId ? getAllFieldLabels(formId) : [];
              
              const allSelected = eventSubmissions.every(s => selectedSubmissions.has(s.id));
              const someSelected = eventSubmissions.some(s => selectedSubmissions.has(s.id));
              
              return (
                <div key={eventId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-indigo-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{eventTitle}</h2>
                      <p className="text-sm text-slate-600 mt-1">{eventSubmissions.length} registration(s)</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAllForEvent(eventId, eventTitle)}
                      disabled={deletingIds.size > 0 || eventSubmissions.some(s => deletingIds.has(s.id))}
                      className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {eventSubmissions.some(s => deletingIds.has(s.id)) ? (
                        <>
                          <Loader2 className="animate-spin" size={16} /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} /> Delete All
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="divide-y divide-slate-200">
                    {/* Select All Header */}
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <button
                        onClick={() => toggleSelectAllForEvent(eventSubmissions)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                        title={allSelected ? 'Deselect all' : 'Select all'}
                      >
                        {allSelected ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : someSelected ? (
                          <Square size={18} className="text-indigo-600 border-2 border-indigo-600 rounded" />
                        ) : (
                          <Square size={18} className="text-slate-400 border-2 border-slate-300 rounded" />
                        )}
                        <span>Select All</span>
                      </button>
                    </div>

                    {/* Accordion Rows */}
                    {eventSubmissions.map((submission) => {
                      const isSelected = selectedSubmissions.has(submission.id);
                      const isDeleting = deletingIds.has(submission.id);
                      const isExpanded = expandedSubmissions.has(submission.id);
                      const name = submission.generalInfo?.name || submission.submittedBy || 'Anonymous';
                      const email = submission.generalInfo?.email || 'N/A';
                      
                      return (
                        <div 
                          key={submission.id} 
                          className={`border-b border-slate-200 last:border-b-0 ${isSelected ? 'bg-indigo-50/50' : 'bg-white'} ${isDeleting ? 'opacity-50' : ''}`}
                        >
                          {/* Collapsed Row Header */}
                          <div 
                            className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => toggleExpanded(submission.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectSubmission(submission.id);
                                  }}
                                  disabled={isDeleting}
                                  className="flex-shrink-0"
                                >
                                  {isSelected ? (
                                    <CheckSquare size={18} className="text-indigo-600" />
                                  ) : (
                                    <Square size={18} className="text-slate-400 border-2 border-slate-300 rounded" />
                                  )}
                                </button>
                                
                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <User size={16} className="text-slate-400 flex-shrink-0" />
                                    <span className="font-semibold text-slate-900 truncate">{name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Mail size={16} className="text-slate-400 flex-shrink-0" />
                                    <span className="text-slate-600 truncate">{email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                                    <span className="text-slate-600 text-sm">{formatDate(submission.submittedAt)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSubmission(submission.id);
                                  }}
                                  disabled={isDeleting}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete this registration"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="animate-spin" size={16} />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                                {isExpanded ? (
                                  <ChevronUp size={20} className="text-slate-400" />
                                ) : (
                                  <ChevronDown size={20} className="text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="px-6 py-6 bg-slate-50 border-t border-slate-200">
                              <div className="space-y-6">
                                {/* General Information */}
                                {submission.generalInfo && (
                                  <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                      <User size={16} />
                                      General Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {submission.generalInfo.name && (
                                        <div className="flex items-start gap-3">
                                          <User size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Full Name</p>
                                            <p className="text-sm text-slate-900">{submission.generalInfo.name}</p>
                                          </div>
                                        </div>
                                      )}
                                      {submission.generalInfo.email && (
                                        <div className="flex items-start gap-3">
                                          <Mail size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>
                                            <a href={`mailto:${submission.generalInfo.email}`} className="text-sm text-indigo-600 hover:underline">
                                              {submission.generalInfo.email}
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                      {submission.generalInfo.phone && (
                                        <div className="flex items-start gap-3">
                                          <Phone size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</p>
                                            <p className="text-sm text-slate-900">{submission.generalInfo.phone}</p>
                                          </div>
                                        </div>
                                      )}
                                      {submission.generalInfo.organization && (
                                        <div className="flex items-start gap-3">
                                          <Building size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Organization</p>
                                            <p className="text-sm text-slate-900">{submission.generalInfo.organization}</p>
                                          </div>
                                        </div>
                                      )}
                                      {submission.generalInfo.address && (
                                        <div className="flex items-start gap-3 md:col-span-2">
                                          <MapPin size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Address</p>
                                            <p className="text-sm text-slate-900">{submission.generalInfo.address}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Form Answers */}
                                {fieldLabels.length > 0 && (
                                  <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                      <FileText size={16} />
                                      Form Answers
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {fieldLabels.map((field) => {
                                        const value = submission.answers[field.id];
                                        const displayValue = renderFieldValue(field.id, value);
                                        const isFile = isFileField(value);
                                        const fileUrl = typeof value === 'string' && isUrl(value) ? value : null;
                                        const isImage = typeof value === 'string' && isImageFile(value);
                                        const isPdf = typeof value === 'string' && isPdfFile(value);
                                        const isMultiple = Array.isArray(value) && value.length > 0;
                                        
                                        return (
                                          <div key={field.id} className={`flex items-start gap-3 ${isMultiple ? 'md:col-span-2' : ''}`}>
                                            <FileText size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                                {field.label}
                                                {isMultiple && (
                                                  <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                    Multiple Answers ({value.length})
                                                  </span>
                                                )}
                                              </p>
                                              {isFile && typeof value === 'string' ? (
                                                <div className="space-y-2">
                                                  {/* Image Preview with Click to Open */}
                                                  {isImage && fileUrl && (
                                                    <div className="space-y-2">
                                                      <a 
                                                        href={fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="block group"
                                                      >
                                                        <div className="relative overflow-hidden rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">
                                                          <img 
                                                            src={fileUrl} 
                                                            alt={field.label}
                                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                              // Hide image if it fails to load, show fallback
                                                              e.currentTarget.style.display = 'none';
                                                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                              if (fallback) fallback.style.display = 'block';
                                                            }}
                                                          />
                                                          <div 
                                                            className="hidden w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400"
                                                            style={{ display: 'none' }}
                                                          >
                                                            <File size={32} />
                                                          </div>
                                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                              <ExternalLink size={14} className="text-indigo-600" />
                                                              <span className="text-xs font-medium text-indigo-600">Open in new tab</span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </a>
                                                      <a 
                                                        href={fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                                                      >
                                                        <span className="truncate">{value}</span>
                                                        <ExternalLink size={14} />
                                                      </a>
                                                    </div>
                                                  )}
                                                  
                                                  {/* PDF Link with Click to Open */}
                                                  {isPdf && fileUrl && (
                                                    <a 
                                                      href={fileUrl} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
                                                    >
                                                      <File size={18} className="text-red-600" />
                                                      <span className="text-sm font-medium text-red-700">{value.split('/').pop() || 'View PDF'}</span>
                                                      <ExternalLink size={14} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </a>
                                                  )}
                                                  
                                                  {/* Other Files or URLs */}
                                                  {!isImage && !isPdf && fileUrl && (
                                                    <a 
                                                      href={fileUrl} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors group"
                                                    >
                                                      <span className="text-lg">{getFileIcon(value)}</span>
                                                      <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{value}</span>
                                                      <ExternalLink size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                    </a>
                                                  )}
                                                  
                                                  {/* File Name Only (not a URL) */}
                                                  {!fileUrl && (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                                                      <span className="text-lg">{getFileIcon(value)}</span>
                                                      <File size={14} className="text-slate-400" />
                                                      <span className="text-sm text-slate-900">{value}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                renderFieldValueDisplay(field.id, value, field.label, formsMap.get(submission.formId))
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Submitted Info */}
                                <div className="pt-4 border-t border-slate-200">
                                  <p className="text-xs text-slate-500">
                                    Submitted on {formatDate(submission.submittedAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

    </div>
  );
};

export default RegistrationsView;

