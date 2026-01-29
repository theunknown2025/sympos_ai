import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Filter,
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
  ExternalLink,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getSubmissionsForUserForms, FormSubmission, deleteFormSubmission, deleteFormSubmissions, updateSubmissionDecision } from '../../../../services/registrationSubmissionService';
import { getRegistrationForm } from '../../../../services/registrationFormService';
import { getUserEvents } from '../../../../services/eventService';
import { getFileDownloadURL } from '../../../../services/storageService';
import { STORAGE_BUCKETS } from '../../../../supabase';
import { RegistrationForm, Event, DecisionStatus } from '../../../../types';
import SubmissionDecisionModal from './SubmissionDecisionModal';
import DisplayManagerModal from './DisplayManagerModal';

const ReceivedSubmissions: React.FC = () => {
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
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileUrls, setFileUrls] = useState<Map<string, string>>(new Map());
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedSubmissionForDecision, setSelectedSubmissionForDecision] = useState<FormSubmission | null>(null);
  const [displayManagerModalOpen, setDisplayManagerModalOpen] = useState(false);
  const [headerDisplayFields, setHeaderDisplayFields] = useState<string[]>(['general_name', 'general_email']); // Default fields
  const [currentFormForDisplay, setCurrentFormForDisplay] = useState<RegistrationForm | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadSubmissions();
    }
  }, [currentUser]);

  // Initialize header display fields with filter fields when forms are loaded
  useEffect(() => {
    if (formsMap.size > 0 && submissions.length > 0) {
      // Get all unique form IDs from submissions
      const formIds = Array.from(new Set(submissions.map(s => s.formId)));
      
      // Collect all filter field IDs from all forms
      const filterFieldIds = new Set<string>();
      formIds.forEach(formId => {
        const form = formsMap.get(formId);
        if (!form) return;

        // Check fields from sections
        form.sections.forEach(section => {
          section.fields.forEach(field => {
            if ((field.type === 'checkbox' || field.type === 'select') && field.useAsFilter) {
              filterFieldIds.add(field.id);
            }
          });
          section.subsections.forEach(subsection => {
            subsection.fields.forEach(field => {
              if ((field.type === 'checkbox' || field.type === 'select') && field.useAsFilter) {
                filterFieldIds.add(field.id);
              }
            });
          });
        });

        // Check legacy fields
        form.fields.forEach(field => {
          if ((field.type === 'checkbox' || field.type === 'select') && field.useAsFilter) {
            filterFieldIds.add(field.id);
          }
        });
      });
      
      // Update header display fields to include filter fields
      // Start with default fields, then add filter fields
      const defaultFields = ['general_name', 'general_email'];
      const allFields = [...defaultFields, ...Array.from(filterFieldIds)];
      
      // Only update if we have new filter fields or if current fields don't match
      if (filterFieldIds.size > 0 || headerDisplayFields.length === 2) {
        setHeaderDisplayFields(allFields);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formsMap, submissions.length]);

  const loadSubmissions = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');
      
      // Load events to get submission form IDs
      const userEvents = await getUserEvents(currentUser.id);
      setEvents(userEvents);
      
      // Create a set of submission form IDs from all events
      // Each event can have multiple submission forms (submissionFormIds array)
      const submissionFormIds = new Set<string>();
      userEvents.forEach(event => {
        // Handle both old single value (backward compatibility) and new array
        if (event.submissionFormIds && event.submissionFormIds.length > 0) {
          // New array format
          event.submissionFormIds.forEach(formId => {
            submissionFormIds.add(formId);
          });
        } else if ((event as any).submissionFormId) {
          // Old single value format (backward compatibility)
          submissionFormIds.add((event as any).submissionFormId);
        }
      });
      
      // Get submissions for forms created by this user
      // This gets all submissions where user_id = currentUser.id (form creator/organizer)
      // If submission form IDs are available, filter by them; otherwise show all
      const submissionFormIdsArray = submissionFormIds.size > 0 
        ? Array.from(submissionFormIds) 
        : undefined;
      
      const allSubmissions = await getSubmissionsForUserForms(
        currentUser.id,
        submissionFormIdsArray
      );
      
      // Normalize submissions: match them to events and update eventId/eventTitle
      // Note: submission.eventId might be a landing page ID (legacy) or an event ID (new)
      const normalizedSubmissions = allSubmissions
        .map(submission => {
          // Check if this formId is a submission form for any event
          if (!submissionFormIds.has(submission.formId)) {
            return null;
          }
          
          // Find matching event - check both event ID and landing page IDs
          const matchingEvent = userEvents.find(event => {
            // Check if formId is in this event's submission forms
            const hasFormId = (event.submissionFormIds && event.submissionFormIds.includes(submission.formId)) ||
                             ((event as any).submissionFormId === submission.formId);
            
            if (!hasFormId) {
              return false;
            }
            
            // Check if submission's eventId matches the event ID directly
            if (event.id === submission.eventId) {
              return true;
            }
            
            // Check if submission's eventId matches any of the event's landing page IDs (legacy support)
            if (event.landingPageIds && event.landingPageIds.includes(submission.eventId)) {
              return true;
            }
            
            return false;
          });
          
          if (!matchingEvent) {
            return null;
          }
          
          // Update submission's eventId to the actual event ID for consistent filtering
          return {
            ...submission,
            eventId: matchingEvent.id,
            eventTitle: matchingEvent.name
          };
        })
        .filter((submission): submission is FormSubmission => submission !== null);
      
      setSubmissions(normalizedSubmissions);
      
      // Load forms to get field labels
      await loadForms(normalizedSubmissions);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError(err.message || 'Failed to load submissions');
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

  const getFieldLabel = (formId: string, fieldId: string): string => {
    const form = formsMap.get(formId);
    if (!form) return fieldId; // Fallback to field ID if form not loaded
    
    // Check sections
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.id === fieldId) return field.label;
      }
      for (const subsection of section.subsections) {
        for (const field of subsection.fields) {
          if (field.id === fieldId) return field.label;
        }
      }
    }
    
    // Check legacy fields
    for (const field of form.fields) {
      if (field.id === fieldId) return field.label;
    }
    
    // Fallback to field ID if not found
    return fieldId;
  };

  const getUniqueEvents = (): Array<{ id: string; title: string }> => {
    // Get ALL events that have submission forms (regardless of whether they have submissions)
    const eventsWithSubmissionForms: { id: string; title: string }[] = events
      .filter(event => {
        // Check if event has submission forms
        const hasSubmissionForms = (event.submissionFormIds && event.submissionFormIds.length > 0) ||
                                  ((event as any).submissionFormId);
        return hasSubmissionForms;
      })
      .map(event => ({
        id: event.id,
        title: event.name
      }));
    
    // Also include events from submissions that might not be in the events list (fallback)
    // This handles edge cases where an event might have been deleted but submissions still reference it
    const submissionEvents: { id: string; title: string }[] = submissions.map(s => ({ 
      id: s.eventId, 
      title: s.eventTitle || 'Untitled Event'
    }));
    const uniqueSubmissionEvents: { id: string; title: string }[] = Array.from(
      new Map(submissionEvents.map(e => [e.id, e])).values()
    );
    
    // Merge and deduplicate - prioritize events from the events list over submission events
    const merged = new Map<string, { id: string; title: string }>();
    
    // First add events from the events list (these are authoritative)
    eventsWithSubmissionForms.forEach(event => {
      merged.set(event.id, event);
    });
    
    // Then add submission events that aren't already in the map
    uniqueSubmissionEvents.forEach(event => {
      if (!merged.has(event.id)) {
        merged.set(event.id, event);
      }
    });
    
    return Array.from(merged.values());
  };

  const getSubmissionsByEvent = () => {
    const grouped = new Map<string, FormSubmission[]>();
    submissions.forEach(submission => {
      // Filter by selected event
      if (selectedEvent !== 'all' && submission.eventId !== selectedEvent) {
        return;
      }
      
      // Additional safety check: verify the submission's formId is in the event's submissionFormIds
      const event = events.find(e => e.id === submission.eventId);
      if (event) {
        const hasFormId = (event.submissionFormIds && event.submissionFormIds.includes(submission.formId)) ||
                         ((event as any).submissionFormId === submission.formId);
        if (!hasFormId) {
          return;
        }
      }
      
      const matchesSearch = searchQuery === '' || 
        submission.submittedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.generalInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.generalInfo?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (matchesSearch) {
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

  // Get filter fields (fields with useAsFilter = true) for a form
  const getFilterFields = (formId: string): string[] => {
    const form = formsMap.get(formId);
    if (!form) return [];

    const filterFieldIds: string[] = [];

    // Check fields from sections
    form.sections.forEach(section => {
      section.fields.forEach(field => {
        if ((field.type === 'checkbox' || field.type === 'select') && field.useAsFilter) {
          filterFieldIds.push(field.id);
        }
      });
      section.subsections.forEach(subsection => {
        subsection.fields.forEach(field => {
          if ((field.type === 'checkbox' || field.type === 'select') && field.useAsFilter) {
            filterFieldIds.push(field.id);
          }
        });
      });
    });

    // Check legacy fields
    form.fields.forEach(field => {
      if ((field.type === 'checkbox' || field.type === 'select') && field.useAsFilter) {
        filterFieldIds.push(field.id);
      }
    });

    return filterFieldIds;
  };

  const getFieldValue = (submission: FormSubmission, fieldId: string): string => {
    if (fieldId.startsWith('general_')) {
      const key = fieldId.replace('general_', '') as keyof typeof submission.generalInfo;
      return submission.generalInfo?.[key] || 'N/A';
    }
    return renderFieldValue(fieldId, submission.answers[fieldId]);
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
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
      setError('Failed to delete submission. Please try again.');
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
    if (!window.confirm(`Are you sure you want to delete ${count} submission(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingIds(new Set(selectedSubmissions));
      await deleteFormSubmissions(Array.from(selectedSubmissions));
      setSubmissions(submissions.filter(s => !selectedSubmissions.has(s.id)));
      setSelectedSubmissions(new Set());
    } catch (err: any) {
      setError('Failed to delete submissions. Please try again.');
      console.error(err);
    } finally {
      setDeletingIds(new Set());
    }
  };

  const handleDeleteAllForEvent = async (eventId: string, eventTitle: string) => {
    const eventSubmissions = submissions.filter(s => s.eventId === eventId);
    if (eventSubmissions.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete all ${eventSubmissions.length} submission(s) for "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const submissionIds = eventSubmissions.map(s => s.id);
      setDeletingIds(new Set(submissionIds));
      await deleteFormSubmissions(submissionIds);
      setSubmissions(submissions.filter(s => s.eventId !== eventId));
      setSelectedSubmissions(new Set());
    } catch (err: any) {
      setError('Failed to delete submissions. Please try again.');
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
      const filtered = value.filter(v => v !== null && v !== undefined);
      if (filtered.length === 0) {
        return <p className="text-sm text-slate-400 italic">No entries provided</p>;
      }
      
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
      
      const allSubFieldIds = Array.from(new Set(
        filtered.flatMap(row => Object.keys(row))
      ));
      
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
           (value.startsWith('http') && (lower.includes('image') || !!lower.match(/\.(jpg|jpeg|png|gif|webp|svg)/)));
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

  /**
   * Extract file path from Supabase storage URL
   * Converts: https://...supabase.co/storage/v1/object/public/Sub_Files/path/to/file.pdf
   * To: path/to/file.pdf
   */
  const extractFilePathFromUrl = (url: string, bucketId: string): string | null => {
    try {
      const urlObj = new URL(url);
      // Extract path after /object/public/{bucketId}/
      const pathMatch = urlObj.pathname.match(new RegExp(`/object/public/${bucketId}/(.+)`));
      if (pathMatch && pathMatch[1]) {
        return pathMatch[1];
      }
      // Also try /object/sign/{bucketId}/
      const signedPathMatch = urlObj.pathname.match(new RegExp(`/object/sign/${bucketId}/(.+)`));
      if (signedPathMatch && signedPathMatch[1]) {
        return signedPathMatch[1];
      }
      // If URL already contains the path directly, extract it
      const directMatch = url.match(new RegExp(`${bucketId}/(.+)`));
      if (directMatch && directMatch[1]) {
        return directMatch[1].split('?')[0]; // Remove query params
      }
      return null;
    } catch {
      return null;
    }
  };

  /**
   * Get signed URL for a file from Sub_Files bucket
   */
  const getSignedFileUrl = async (fileUrl: string): Promise<string> => {
    // Check if we already have this URL cached
    if (fileUrls.has(fileUrl)) {
      return fileUrls.get(fileUrl)!;
    }

    // Check if we're already loading this URL
    if (loadingUrls.has(fileUrl)) {
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      if (fileUrls.has(fileUrl)) {
        return fileUrls.get(fileUrl)!;
      }
      return fileUrl; // Fallback to original URL
    }

    try {
      setLoadingUrls(prev => new Set(prev).add(fileUrl));
      
      // Extract file path from URL
      const filePath = extractFilePathFromUrl(fileUrl, STORAGE_BUCKETS.SUB_FILES);
      
      if (!filePath) {
        console.warn('Could not extract file path from URL:', fileUrl);
        return fileUrl; // Return original URL if we can't parse it
      }

      // Get signed URL
      const signedUrl = await getFileDownloadURL(STORAGE_BUCKETS.SUB_FILES, filePath);
      
      // Cache the signed URL
      setFileUrls(prev => new Map(prev).set(fileUrl, signedUrl));
      
      return signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return fileUrl; // Fallback to original URL
    } finally {
      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileUrl);
        return newSet;
      });
    }
  };

  /**
   * Handle file link click - get signed URL if needed
   */
  const handleFileClick = async (e: React.MouseEvent<HTMLAnchorElement>, fileUrl: string) => {
    // If URL is from Sub_Files bucket, we need a signed URL
    if (fileUrl.includes(STORAGE_BUCKETS.SUB_FILES) || fileUrl.includes('Sub_Files')) {
      e.preventDefault();
      try {
        const signedUrl = await getSignedFileUrl(fileUrl);
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Error opening file:', error);
        // Fallback: try opening original URL
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    }
    // For other URLs, let the default behavior handle it
  };

  // Preload signed URLs when submissions are expanded
  useEffect(() => {
    const preloadSignedUrls = async () => {
      const urlsToLoad: string[] = [];
      
      expandedSubmissions.forEach(submissionId => {
        const submission = submissions.find(s => s.id === submissionId);
        if (!submission) return;
        
        // Find all file URLs in this submission
        Object.values(submission.answers || {}).forEach(value => {
          if (typeof value === 'string' && 
              (value.startsWith('http://') || value.startsWith('https://')) &&
              (value.includes(STORAGE_BUCKETS.SUB_FILES) || value.includes('Sub_Files'))) {
            if (!fileUrls.has(value) && !loadingUrls.has(value)) {
              urlsToLoad.push(value);
            }
          }
        });
      });
      
      // Load all URLs in parallel
      if (urlsToLoad.length > 0) {
        Promise.all(urlsToLoad.map(url => getSignedFileUrl(url))).catch(err => {
          console.error('Error preloading signed URLs:', err);
        });
      }
    };
    
    if (expandedSubmissions.size > 0 && submissions.length > 0) {
      preloadSignedUrls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedSubmissions, submissions.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4">Loading submissions...</p>
      </div>
    );
  }

  const uniqueEvents = getUniqueEvents();
  const submissionsByEvent = getSubmissionsByEvent();

  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Received Submissions</h1>
          <p className="text-slate-500 mt-1 text-sm">View and manage paper submissions</p>
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
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Event Filter and Search */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or event title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-500" />
            <label className="text-sm font-medium text-slate-700">Filter by Event:</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      </div>

      {loadingForms && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading form details...</span>
        </div>
      )}

      {submissionsByEvent.size === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No submissions yet</h3>
          <p className="text-slate-500">
            {selectedEvent === 'all' 
              ? 'Submissions will appear here once users submit forms.'
              : 'No submissions found for this event.'}
          </p>
        </div>
      ) : (
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
                    <p className="text-sm text-slate-600 mt-1">{eventSubmissions.length} submission(s)</p>
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
                    
                    // Determine background color based on decision status
                    const getDecisionBackgroundColor = () => {
                      if (submission.decisionStatus === 'accepted') {
                        return 'bg-green-50/50';
                      } else if (submission.decisionStatus === 'reserved') {
                        return 'bg-yellow-50/50';
                      } else if (submission.decisionStatus === 'rejected') {
                        return 'bg-red-50/50';
                      }
                      return isSelected ? 'bg-indigo-50/50' : 'bg-white';
                    };

                    return (
                      <div 
                        key={submission.id} 
                        className={`border-b border-slate-200 last:border-b-0 ${getDecisionBackgroundColor()} ${isDeleting ? 'opacity-50' : ''}`}
                      >
                        {/* Collapsed Row Header */}
                        <div 
                          className={`px-6 py-4 transition-colors cursor-pointer ${
                            submission.decisionStatus === 'accepted' 
                              ? 'hover:bg-green-100/50' 
                              : submission.decisionStatus === 'reserved'
                              ? 'hover:bg-yellow-100/50'
                              : submission.decisionStatus === 'rejected'
                              ? 'hover:bg-red-100/50'
                              : 'hover:bg-slate-50'
                          }`}
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
                              
                              <div className={`flex-1 min-w-0 grid gap-4 ${headerDisplayFields.length === 1 ? 'grid-cols-1' : headerDisplayFields.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                                {headerDisplayFields.length > 0 ? (
                                  headerDisplayFields.map((fieldId) => {
                                    const form = formsMap.get(submission.formId);
                                    const fieldLabel = form ? getAllFieldLabels(submission.formId).find(f => f.id === fieldId)?.label : fieldId;
                                    let fieldValue: string = 'N/A';
                                    let icon = <FileText size={16} className="text-slate-400 flex-shrink-0" />;

                                    if (fieldId === 'general_name') {
                                      fieldValue = name;
                                      icon = <User size={16} className="text-slate-400 flex-shrink-0" />;
                                    } else if (fieldId === 'general_email') {
                                      fieldValue = email;
                                      icon = <Mail size={16} className="text-slate-400 flex-shrink-0" />;
                                    } else if (fieldId === 'general_phone') {
                                      fieldValue = submission.generalInfo?.phone || 'N/A';
                                      icon = <Phone size={16} className="text-slate-400 flex-shrink-0" />;
                                    } else if (fieldId === 'general_organization') {
                                      fieldValue = submission.generalInfo?.organization || 'N/A';
                                      icon = <Building size={16} className="text-slate-400 flex-shrink-0" />;
                                    } else if (fieldId === 'general_address') {
                                      fieldValue = submission.generalInfo?.address || 'N/A';
                                      icon = <MapPin size={16} className="text-slate-400 flex-shrink-0" />;
                                    } else if (fieldId === 'submitted_at') {
                                      fieldValue = formatDate(submission.submittedAt);
                                      icon = <Calendar size={16} className="text-slate-400 flex-shrink-0" />;
                                    } else {
                                      // Custom form field
                                      const value = submission.answers[fieldId];
                                      fieldValue = renderFieldValue(fieldId, value);
                                    }

                                    return (
                                      <div key={fieldId} className="flex items-center gap-2 min-w-0">
                                        {icon}
                                        <div className="min-w-0 flex-1">
                                          <span className="text-xs text-slate-500 block truncate">{fieldLabel || fieldId}</span>
                                          <span className="text-sm font-medium text-slate-900 truncate block">
                                            {fieldValue}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  // Fallback if no fields selected
                                  <>
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
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {eventSubmissions.indexOf(submission) === 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const form = formsMap.get(submission.formId);
                                    setCurrentFormForDisplay(form || null);
                                    setDisplayManagerModalOpen(true);
                                  }}
                                  disabled={isDeleting}
                                  className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Gérer l'affichage de l'en-tête"
                                >
                                  <Plus size={16} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubmissionForDecision(submission);
                                  setDecisionModalOpen(true);
                                }}
                                disabled={isDeleting}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Vérifier cette soumission"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubmission(submission.id);
                                }}
                                disabled={isDeleting}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete this submission"
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
                                      const originalFileUrl = typeof value === 'string' && isUrl(value) ? value : null;
                                      const isSubFilesBucket = originalFileUrl && (originalFileUrl.includes(STORAGE_BUCKETS.SUB_FILES) || originalFileUrl.includes('Sub_Files'));
                                      const cachedFileUrl = originalFileUrl && fileUrls.get(originalFileUrl);
                                      const fileUrl = cachedFileUrl || originalFileUrl;
                                      const isLoadingUrl = originalFileUrl && loadingUrls.has(originalFileUrl);
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
                                                      href={isSubFilesBucket ? '#' : fileUrl} 
                                                      target={isSubFilesBucket ? undefined : '_blank'}
                                                      rel={isSubFilesBucket ? undefined : 'noopener noreferrer'}
                                                      onClick={isSubFilesBucket ? (e) => handleFileClick(e, originalFileUrl!) : undefined}
                                                      className="block group"
                                                    >
                                                      <div className="relative overflow-hidden rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">
                                                        {isLoadingUrl ? (
                                                          <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <Loader2 className="animate-spin" size={24} />
                                                          </div>
                                                        ) : (
                                                          <>
                                                            <img 
                                                              src={fileUrl} 
                                                              alt={field.label}
                                                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                                              onError={(e) => {
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
                                                          </>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                            <ExternalLink size={14} className="text-indigo-600" />
                                                            <span className="text-xs font-medium text-indigo-600">Open in new tab</span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </a>
                                                    <a 
                                                      href={isSubFilesBucket ? '#' : fileUrl} 
                                                      target={isSubFilesBucket ? undefined : '_blank'}
                                                      rel={isSubFilesBucket ? undefined : 'noopener noreferrer'}
                                                      onClick={isSubFilesBucket ? (e) => handleFileClick(e, originalFileUrl!) : undefined}
                                                      className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                                                    >
                                                      {isLoadingUrl ? (
                                                        <>
                                                          <Loader2 className="animate-spin" size={14} />
                                                          <span>Loading...</span>
                                                        </>
                                                      ) : (
                                                        <>
                                                          <span className="truncate">{value}</span>
                                                          <ExternalLink size={14} />
                                                        </>
                                                      )}
                                                    </a>
                                                  </div>
                                                )}
                                                
                                                {/* PDF Link with Click to Open */}
                                                {isPdf && fileUrl && (
                                                  <a 
                                                    href={isSubFilesBucket ? '#' : fileUrl} 
                                                    target={isSubFilesBucket ? undefined : '_blank'}
                                                    rel={isSubFilesBucket ? undefined : 'noopener noreferrer'}
                                                    onClick={isSubFilesBucket ? (e) => handleFileClick(e, originalFileUrl!) : undefined}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
                                                  >
                                                    {isLoadingUrl ? (
                                                      <>
                                                        <Loader2 className="animate-spin text-red-600" size={18} />
                                                        <span className="text-sm font-medium text-red-700">Loading...</span>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <File size={18} className="text-red-600" />
                                                        <span className="text-sm font-medium text-red-700">{value.split('/').pop() || 'View PDF'}</span>
                                                        <ExternalLink size={14} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                      </>
                                                    )}
                                                  </a>
                                                )}
                                                
                                                {/* Other Files or URLs */}
                                                {!isImage && !isPdf && fileUrl && (
                                                  <a 
                                                    href={isSubFilesBucket ? '#' : fileUrl} 
                                                    target={isSubFilesBucket ? undefined : '_blank'}
                                                    rel={isSubFilesBucket ? undefined : 'noopener noreferrer'}
                                                    onClick={isSubFilesBucket ? (e) => handleFileClick(e, originalFileUrl!) : undefined}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors group"
                                                  >
                                                    {isLoadingUrl ? (
                                                      <>
                                                        <Loader2 className="animate-spin text-slate-600" size={18} />
                                                        <span className="text-sm font-medium text-slate-700">Loading...</span>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <span className="text-lg">{getFileIcon(value)}</span>
                                                        <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{value}</span>
                                                        <ExternalLink size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                      </>
                                                    )}
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
      )}

      {/* Decision Modal */}
      <SubmissionDecisionModal
        isOpen={decisionModalOpen}
        onClose={() => {
          setDecisionModalOpen(false);
          setSelectedSubmissionForDecision(null);
        }}
        onSubmit={async (decision: DecisionStatus, comment: string) => {
          if (!selectedSubmissionForDecision || !currentUser?.id) return;
          
          // Pass the event ID when accepting to track which event the submission was accepted for
          const acceptedEventId = decision === 'accepted' ? selectedSubmissionForDecision.eventId : undefined;
          
          await updateSubmissionDecision(
            selectedSubmissionForDecision.id,
            decision,
            comment,
            currentUser.id,
            acceptedEventId
          );
          
          // Reload submissions to get updated decision
          await loadSubmissions();
        }}
        currentDecision={selectedSubmissionForDecision?.decisionStatus}
        currentComment={selectedSubmissionForDecision?.decisionComment}
      />

      {/* Display Manager Modal */}
      <DisplayManagerModal
        isOpen={displayManagerModalOpen}
        onClose={() => {
          setDisplayManagerModalOpen(false);
          setCurrentFormForDisplay(null);
        }}
        onSave={(selectedFields) => {
          setHeaderDisplayFields(selectedFields);
        }}
        form={currentFormForDisplay}
        currentSelectedFields={headerDisplayFields}
      />
    </div>
  );
};

export default ReceivedSubmissions;

