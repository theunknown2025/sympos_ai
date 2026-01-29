import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  File,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getJuryMemberProfile } from '../../../services/juryMemberService';
import { getDispatchedItemsByEvent, DispatchedItem } from '../../../services/dispatchedItemsService';
import { getReviewForSubmission } from '../../../services/reviewService';
import { getEvent } from '../../../services/eventService';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { getEvaluationForm } from '../../../services/evaluationFormService';
import { getFileDownloadURL } from '../../../services/storageService';
import { supabase, TABLES, STORAGE_BUCKETS } from '../../../supabase';
import { RegistrationForm, EvaluationForm, FormSubmission, EvaluationAnswer } from '../../../types';
import ReviewForm from './ReviewForm';

const ReviewsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dispatchedItemsByEvent, setDispatchedItemsByEvent] = useState<Record<string, DispatchedItem[]>>({});
  const [selectedItem, setSelectedItem] = useState<DispatchedItem | null>(null);
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, 'draft' | 'completed' | null>>({});
  const [formsMap, setFormsMap] = useState<Map<string, RegistrationForm | EvaluationForm>>(new Map());
  const [loadingForms, setLoadingForms] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [fileUrls, setFileUrls] = useState<Map<string, string>>(new Map());
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

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

      console.log('Loading reviews for jury member email:', profile.email);

      // Get dispatched items grouped by event
      const itemsByEvent = await getDispatchedItemsByEvent(profile.email);
      console.log('Dispatched items by event:', itemsByEvent);
      setDispatchedItemsByEvent(itemsByEvent);

      // Check review statuses for all items (now includes status: 'draft' | 'completed' | null)
      const statuses: Record<string, 'draft' | 'completed' | null> = {};
      for (const eventId in itemsByEvent) {
        for (const item of itemsByEvent[eventId]) {
          // Get committee member IDs for this jury member
          const { data: committeeMembers, error: cmError } = await supabase
            .from(TABLES.COMMITTEE_MEMBERS)
            .select('id')
            .eq('email', profile.email);
          
          if (cmError) {
            console.error('Error fetching committee members:', cmError);
          }
          
          if (committeeMembers && committeeMembers.length > 0) {
            // Determine which form ID to use for the review lookup
            let reviewFormId = item.formId;
            
            if (item.submissionType === 'submission') {
              // For submissions, get the evaluation form from the event
              try {
                const event = await getEvent(eventId);
                if (event && event.evaluationFormIds && event.evaluationFormIds.length > 0) {
                  reviewFormId = event.evaluationFormIds[0];
                }
              } catch (err) {
                console.error('Error getting event for review status:', err);
              }
            }
            
            const review = await getReviewForSubmission(
              committeeMembers[0].id,
              item.submissionId,
              reviewFormId
            );
            statuses[`${item.submissionId}-${reviewFormId}`] = review?.status || null;
          }
        }
      }
      setReviewStatuses(statuses);

      // Load events to get evaluation form IDs
      const eventIds = Object.keys(itemsByEvent);
      const loadedEvents = [];
      for (const eventId of eventIds) {
        try {
          const event = await getEvent(eventId);
          if (event) {
            loadedEvents.push(event);
          }
        } catch (err) {
          console.error(`Error loading event ${eventId}:`, err);
        }
      }
      setEvents(loadedEvents);

      // Load forms for displaying field labels
      await loadForms(itemsByEvent);
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadForms = async (itemsByEvent: Record<string, DispatchedItem[]>) => {
    try {
      setLoadingForms(true);
      const uniqueFormIds = new Set<string>();
      
      // Collect all unique form IDs
      Object.values(itemsByEvent).forEach(items => {
        items.forEach(item => {
          uniqueFormIds.add(item.formId);
        });
      });

      const forms = new Map<string, RegistrationForm | EvaluationForm>();
      
      for (const formId of uniqueFormIds) {
        try {
          // Try registration form first
          let form = await getRegistrationForm(formId);
          if (!form) {
            // Try evaluation form
            form = await getEvaluationForm(formId);
          }
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

  const handleEvaluate = (item: DispatchedItem) => {
    setSelectedItem(item);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    loadData(); // Reload to refresh review statuses
  };

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
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

  const renderFieldValueDisplay = (fieldId: string, value: any, fieldLabel: string, form?: RegistrationForm | EvaluationForm) => {
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

  // Preload signed URLs when items are expanded
  useEffect(() => {
    const preloadSignedUrls = async () => {
      const urlsToLoad: string[] = [];
      
      expandedItems.forEach(itemKey => {
        const [submissionId, formId] = itemKey.split('-');
        // Find the item
        Object.values(dispatchedItemsByEvent).forEach(items => {
          const item = items.find(i => i.submissionId === submissionId && i.formId === formId);
          if (!item) return;
          
          // Find all file URLs in this submission
          Object.values(item.submission.answers || {}).forEach(value => {
            if (typeof value === 'string' && 
                (value.startsWith('http://') || value.startsWith('https://')) &&
                (value.includes(STORAGE_BUCKETS.SUB_FILES) || value.includes('Sub_Files'))) {
              if (!fileUrls.has(value) && !loadingUrls.has(value)) {
                urlsToLoad.push(value);
              }
            }
          });
        });
      });
      
      // Load all URLs in parallel
      if (urlsToLoad.length > 0) {
        Promise.all(urlsToLoad.map(url => getSignedFileUrl(url))).catch(err => {
          console.error('Error preloading signed URLs:', err);
        });
      }
    };
    
    if (expandedItems.size > 0 && Object.keys(dispatchedItemsByEvent).length > 0) {
      preloadSignedUrls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedItems, Object.keys(dispatchedItemsByEvent).length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading reviews</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <ReviewForm
        item={selectedItem}
        onBack={handleBackToList}
      />
    );
  }

  // Filter events based on selected filter
  const allEventIds = Object.keys(dispatchedItemsByEvent);
  const filteredEventIds = selectedEventFilter === 'all' 
    ? allEventIds 
    : allEventIds.filter(id => id === selectedEventFilter);
  
  const totalItems = Object.values(dispatchedItemsByEvent).flat().length;
  const filteredTotalItems = filteredEventIds.reduce((sum, id) => sum + dispatchedItemsByEvent[id].length, 0);
  
  // Get unique events for filter dropdown
  const uniqueEvents = allEventIds.map(eventId => {
    const items = dispatchedItemsByEvent[eventId];
    const eventName = items[0]?.eventName || 'Unknown Event';
    return { id: eventId, name: eventName };
  });

  if (totalItems === 0) {
    return (
      <div className="h-full">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText size={32} className="text-indigo-600" />
            Reviews
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Review and evaluate submissions assigned to you
          </p>
        </header>

        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="text-slate-300 mb-4" size={48} />
          <p className="text-lg font-medium text-slate-600">No reviews assigned</p>
          <p className="text-sm text-slate-500 mt-2">
            You don't have any submissions or evaluations assigned to review yet.
          </p>
          <p className="text-xs text-slate-400 mt-4">
            Check the browser console for debugging information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileText size={32} className="text-indigo-600" />
          Reviews
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Review and evaluate submissions assigned to you
        </p>
      </header>

      {loadingForms && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading form details...</span>
        </div>
      )}

      {/* Event Filter */}
      {uniqueEvents.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-500" />
            <label className="text-sm font-medium text-slate-700">Filter by Event:</label>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Events ({totalItems})</option>
              {uniqueEvents.map((event) => {
                const count = dispatchedItemsByEvent[event.id].length;
                return (
                  <option key={event.id} value={event.id}>
                    {event.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {filteredEventIds.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No reviews found</h3>
          <p className="text-slate-500">
            {selectedEventFilter === 'all' 
              ? 'No reviews are available for the selected filter.'
              : 'No reviews found for the selected event.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredEventIds.map(eventId => {
          const items = dispatchedItemsByEvent[eventId];
          const eventName = items[0]?.eventName || 'Unknown Event';

          return (
            <div key={eventId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50 border-b border-slate-200 px-6 py-4">
                <h2 className="text-2xl font-bold text-slate-900">{eventName}</h2>
                <p className="text-sm text-slate-600 mt-1">{items.length} item(s) to review</p>
              </div>
              
              <div className="divide-y divide-slate-200">
                {items.map(item => {
                  const submission = item.submission;
                  const submissionName = 'generalInfo' in submission
                    ? (submission.generalInfo?.name || (submission as FormSubmission).submittedBy || 'Unnamed Submission')
                    : (submission.generalInfo?.name || (submission as EvaluationAnswer).submittedBy || 'Unnamed Evaluation');
                  
                  // Check review status - try both formId and evaluation form ID
                  // First try with item.formId (for evaluations)
                  let reviewStatus = reviewStatuses[`${item.submissionId}-${item.formId}`] || null;
                  
                  // For submissions, also check with evaluation form ID from events
                  if (item.submissionType === 'submission' && reviewStatus === null) {
                    const event = events.find(e => e.id === item.eventId);
                    if (event && event.evaluationFormIds && event.evaluationFormIds.length > 0) {
                      const evaluationFormId = event.evaluationFormIds[0];
                      reviewStatus = reviewStatuses[`${item.submissionId}-${evaluationFormId}`] || null;
                    }
                  }
                  const hasReview = reviewStatus !== null;
                  const isCompleted = reviewStatus === 'completed';
                  const isDraft = reviewStatus === 'draft';
                  
                  const submissionTypeLabel = item.submissionType === 'evaluation' ? 'Evaluation' : 'Submission';
                  const itemKey = `${item.submissionId}-${item.formId}`;
                  const isExpanded = expandedItems.has(itemKey);
                  const form = formsMap.get(item.formId);
                  const fieldLabels = form ? getAllFieldLabels(item.formId) : [];
                  const name = submission.generalInfo?.name || (submission as FormSubmission).submittedBy || 'Anonymous';
                  const email = submission.generalInfo?.email || 'N/A';
                  const submittedAt = 'submittedAt' in submission 
                    ? submission.submittedAt 
                    : ('createdAt' in submission ? submission.createdAt : new Date());

                  return (
                    <div 
                      key={itemKey} 
                      className={`border-b border-slate-200 last:border-b-0 ${
                        isCompleted 
                          ? 'bg-green-50/30' 
                          : isDraft 
                          ? 'bg-yellow-50/30' 
                          : 'bg-white'
                      }`}
                    >
                      {/* Collapsed Row Header */}
                      <div 
                        className={`px-6 py-4 transition-colors cursor-pointer ${
                          isCompleted 
                            ? 'hover:bg-green-100/50' 
                            : isDraft 
                            ? 'hover:bg-yellow-100/50' 
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => toggleExpanded(itemKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FileText 
                                className={`h-5 w-5 flex-shrink-0 ${item.submissionType === 'evaluation' ? 'text-orange-600' : 'text-blue-600'}`} 
                              />
                              <span className="text-sm font-medium text-slate-500">
                                {submissionTypeLabel}
                              </span>
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Completed
                                </span>
                              )}
                              {isDraft && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                  Draft
                                </span>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2 min-w-0">
                                <User size={16} className="text-slate-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs text-slate-500 block truncate">Name</span>
                                  <span className="text-sm font-medium text-slate-900 truncate block">{name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <Mail size={16} className="text-slate-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs text-slate-500 block truncate">Email</span>
                                  <span className="text-sm text-slate-600 truncate block">{email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs text-slate-500 block truncate">Submitted</span>
                                  <span className="text-sm text-slate-600">{formatDate(submittedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEvaluate(item);
                              }}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                              {isCompleted ? 'View Review' : isDraft ? 'Continue Review' : 'Evaluate'}
                              <ChevronRight className="h-4 w-4" />
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
                                            renderFieldValueDisplay(field.id, value, field.label, form)
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
                                Submitted on {formatDate(submittedAt)}
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
    </div>
  );
};

export default ReviewsList;
