import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Calendar, Globe, Award, FileText, Loader2, AlertCircle, ArrowRight, FileCheck, Users, Eye, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getUserEvents, deleteEvent } from '../../../services/eventService';
import { Event, ViewState, PublishStatus } from '../../../types';
import { getLandingPage } from '../../../services/landingPageService';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { getCertificateTemplate } from '../../../services/certificateTemplateService';
import { getEventSubmissions } from '../../../services/registrationSubmissionService';
import { getRoutePath } from '../../../routes';
import NewEvent from './NewEvent';
import EditEvent from './EditEvent';
import EventPreview from './EventPreview';
import PublishHandler from './PublishHandler';

const ListOfEvents: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [previewingEventId, setPreviewingEventId] = useState<string | null>(null);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      if (!currentUser?.id) return;
      
      const userEvents = await getUserEvents(currentUser.id);
      setEvents(userEvents);
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(eventId);
      await deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert(err.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No events yet</h3>
        <p className="text-sm text-slate-500">Create your first event to get started.</p>
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleEdit = (eventId: string) => {
    setEditingEventId(eventId);
  };

  const handleEditClose = () => {
    setEditingEventId(null);
    loadEvents(); // Reload events after editing
  };

  const handlePreview = (eventId: string) => {
    setPreviewingEventId(eventId);
  };

  const handlePreviewClose = () => {
    setPreviewingEventId(null);
  };

  const handlePublish = (eventId: string) => {
    setPublishingEventId(eventId);
  };

  const handlePublishClose = () => {
    setPublishingEventId(null);
  };

  const handlePublishStatusChange = (eventId: string, newStatus: PublishStatus) => {
    setEvents(events.map(e => e.id === eventId ? { ...e, publishStatus: newStatus } : e));
    loadEvents(); // Reload to ensure consistency
  };

  // If editing, show the edit form
  if (editingEventId) {
    return (
      <div>
        <button
          onClick={handleEditClose}
          className="mb-4 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <ArrowRight className="rotate-180" size={16} />
          Back to Events List
        </button>
        <EditEvent 
          eventId={editingEventId}
          onSave={handleEditClose}
          onCancel={handleEditClose}
        />
      </div>
    );
  }

  // If previewing, show the preview
  if (previewingEventId) {
    return (
      <div>
        <button
          onClick={handlePreviewClose}
          className="mb-4 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <ArrowRight className="rotate-180" size={16} />
          Back to Events List
        </button>
        <EventPreview eventId={previewingEventId} onClose={handlePreviewClose} />
      </div>
    );
  }

  // Get the event being published
  const publishingEvent = publishingEventId ? events.find(e => e.id === publishingEventId) : null;

  return (
    <div className="space-y-6">
      {events.map(event => (
        <div key={event.id} className="space-y-4">
          <EventCard
            event={event}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onPublish={handlePublish}
            isDeleting={deletingId === event.id}
            isSelected={selectedEventId === event.id}
            onSelect={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}
          />
          {event.certificateTemplateIds.length > 0 && (
            <QuickAccessCards event={event} />
          )}
        </div>
      ))}

      {/* General Quick Access Section - appears when event is selected */}
      {selectedEvent && (
        <GeneralQuickAccess event={selectedEvent} />
      )}

      {/* Publish Handler Modal */}
      {publishingEvent && (
        <PublishHandler
          eventId={publishingEvent.id}
          currentStatus={publishingEvent.publishStatus || 'Draft'}
          onStatusChange={(newStatus) => handlePublishStatusChange(publishingEvent.id, newStatus)}
          onClose={handlePublishClose}
        />
      )}
    </div>
  );
};

interface EventCardProps {
  event: Event;
  onDelete: (eventId: string) => void;
  onEdit: (eventId: string) => void;
  onPreview: (eventId: string) => void;
  onPublish: (eventId: string) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

// Helper function to truncate description to first 100 words
const truncateDescription = (text: string, maxWords: number = 100): string => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
};

const EventCard: React.FC<EventCardProps> = ({ event, onDelete, onEdit, onPreview, onPublish, isDeleting, isSelected, onSelect }) => {
  const [registrationFormTitles, setRegistrationFormTitles] = useState<string[]>([]);

  useEffect(() => {
    loadRegistrationForms();
  }, [event]);

  // Helper function to remove prefix from form title
  const removePrefix = (title: string, prefix: string): string => {
    if (title.startsWith(prefix)) {
      return title.substring(prefix.length).trim();
    }
    return title;
  };

  const loadRegistrationForms = async () => {
    try {
      if (event.registrationFormIds && event.registrationFormIds.length > 0) {
        const formPromises = event.registrationFormIds.map(id => getRegistrationForm(id));
        const forms = await Promise.all(formPromises);
        const titles = forms
          .filter(f => f !== null)
          .map(f => removePrefix(f!.title, 'Reg'));
        setRegistrationFormTitles(titles);
      } else {
        setRegistrationFormTitles([]);
      }
    } catch (err) {
      console.error('Error loading registration forms:', err);
    }
  };

  return (
    <div 
      className={`bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer ${
        isSelected 
          ? 'border-indigo-500 shadow-md ring-2 ring-indigo-100' 
          : 'border-slate-200 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{event.name}</h3>
          {event.description && (
            <p className="text-sm text-slate-600">{truncateDescription(event.description, 100)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(event.id);
            }}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Preview event"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPublish(event.id);
            }}
            className={`p-2 rounded-lg transition-colors ${
              event.publishStatus === 'Published'
                ? 'text-green-600 hover:bg-green-50'
                : event.publishStatus === 'Closed'
                ? 'text-orange-600 hover:bg-orange-50'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            title={
              event.publishStatus === 'Published'
                ? 'Change publication status'
                : event.publishStatus === 'Closed'
                ? 'Reopen event'
                : 'Publish event'
            }
          >
            <Send size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event.id);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit event"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id);
            }}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete event"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Registration Forms */}
      {event.registrationFormIds && event.registrationFormIds.length > 0 && (
        <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg mb-3">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 mb-1">Registration Forms ({event.registrationFormIds.length})</p>
            {registrationFormTitles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {registrationFormTitles.slice(0, 2).map((title, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700"
                  >
                    {title}
                  </span>
                ))}
                {registrationFormTitles.length > 2 && (
                  <span className="px-2 py-0.5 text-xs text-slate-500">
                    +{registrationFormTitles.length - 2} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Loading...</p>
            )}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Created: {new Date(event.createdAt).toLocaleDateString()} • 
          Updated: {new Date(event.updatedAt).toLocaleDateString()}
        </p>
        {event.publishStatus && (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              event.publishStatus === 'Published'
                ? 'bg-green-100 text-green-700'
                : event.publishStatus === 'Closed'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {event.publishStatus}
          </span>
        )}
      </div>
    </div>
  );
};

interface QuickAccessCardsProps {
  event: Event;
}

const QuickAccessCards: React.FC<QuickAccessCardsProps> = ({ event }) => {
  const [certificateTitles, setCertificateTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificateData();
  }, [event]);

  const loadCertificateData = async () => {
    try {
      setLoading(true);
      
      // Load certificate titles
      if (event.certificateTemplateIds.length > 0) {
        const certPromises = event.certificateTemplateIds.map(id => getCertificateTemplate(id));
        const certs = await Promise.all(certPromises);
        setCertificateTitles(certs.filter(c => c !== null).map(c => c!.title));
      }
    } catch (err) {
      console.error('Error loading certificate data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Certificates Quick Access Card */}
      {event.certificateTemplateIds.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 mb-0.5">
                Certificates ({event.certificateTemplateIds.length})
              </p>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400">Loading...</span>
                </div>
              ) : certificateTitles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {certificateTitles.slice(0, 2).map((title, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs font-medium text-amber-700"
                    >
                      {title}
                    </span>
                  ))}
                  {certificateTitles.length > 2 && (
                    <span className="px-2 py-0.5 text-xs text-slate-500">
                      +{certificateTitles.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-slate-400">No certificates</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface GeneralQuickAccessProps {
  event: Event;
}

const GeneralQuickAccess: React.FC<GeneralQuickAccessProps> = ({ event }) => {
  const navigate = useNavigate();
  const [landingPageTitles, setLandingPageTitles] = useState<string[]>([]);
  const [landingPageIds, setLandingPageIds] = useState<string[]>([]);
  const [certificateTitles, setCertificateTitles] = useState<string[]>([]);
  const [firstCertificateId, setFirstCertificateId] = useState<string | null>(null);
  const [registrationFormTitles, setRegistrationFormTitles] = useState<string[]>([]);
  const [submissionFormTitles, setSubmissionFormTitles] = useState<string[]>([]);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [registrationsCount, setRegistrationsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Helper function to remove prefix from form title
  const removePrefix = (title: string, prefix: string): string => {
    if (title.startsWith(prefix)) {
      return title.substring(prefix.length).trim();
    }
    return title;
  };

  useEffect(() => {
    loadQuickAccessData();
  }, [event]);

  const loadQuickAccessData = async () => {
    try {
      setLoading(true);
      
      // Load landing page titles
      if (event.landingPageIds && event.landingPageIds.length > 0) {
        const pagePromises = event.landingPageIds.map(id => getLandingPage(id));
        const pages = await Promise.all(pagePromises);
        const validPages = pages.filter(p => p !== null);
        setLandingPageTitles(validPages.map(p => p!.title));
        setLandingPageIds(validPages.map(p => p!.id));
      } else {
        setLandingPageTitles([]);
        setLandingPageIds([]);
      }

      // Load certificate titles
      if (event.certificateTemplateIds.length > 0) {
        const certPromises = event.certificateTemplateIds.map(id => getCertificateTemplate(id));
        const certs = await Promise.all(certPromises);
        const validCerts = certs.filter(c => c !== null);
        setCertificateTitles(validCerts.map(c => c!.title));
        // Store the first certificate ID for navigation
        if (validCerts.length > 0) {
          setFirstCertificateId(event.certificateTemplateIds[0]);
        } else {
          setFirstCertificateId(null);
        }
      } else {
        setFirstCertificateId(null);
      }

      // Load registration form titles
      if (event.registrationFormIds && event.registrationFormIds.length > 0) {
        const formPromises = event.registrationFormIds.map(id => getRegistrationForm(id));
        const forms = await Promise.all(formPromises);
        const validForms = forms.filter(f => f !== null);
        const titles = validForms.map(f => removePrefix(f!.title, 'Reg'));
        setRegistrationFormTitles(titles);
      } else {
        setRegistrationFormTitles([]);
      }

      // Load submission form titles
      if (event.submissionFormIds && event.submissionFormIds.length > 0) {
        const formPromises = event.submissionFormIds.map(id => getRegistrationForm(id));
        const forms = await Promise.all(formPromises);
        const validForms = forms.filter(f => f !== null);
        const titles = validForms.map(f => removePrefix(f!.title, 'Sub'));
        setSubmissionFormTitles(titles);
      } else {
        setSubmissionFormTitles([]);
      }

      // Load submissions count
      try {
        const submissions = await getEventSubmissions(event.id);
        setSubmissionsCount(submissions.length);
      } catch (err) {
        console.error('Error loading submissions:', err);
      }

      // Load registrations count (using submissions as registrations)
      try {
        const registrations = await getEventSubmissions(event.id);
        setRegistrationsCount(registrations.length);
      } catch (err) {
        console.error('Error loading registrations:', err);
      }
    } catch (err) {
      console.error('Error loading quick access data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Landing Pages Card */}
        <div 
          onClick={() => {
            if (landingPageIds.length > 0) {
              navigate(`/builder/${landingPageIds[0]}`);
            } else {
              navigate(getRoutePath(ViewState.LANDING_PAGES));
            }
          }}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Globe className="w-6 h-6 text-indigo-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">Landing Pages</h3>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading...</span>
            </div>
          ) : landingPageTitles.length > 0 ? (
            <div>
              <p className="text-sm text-slate-600 mb-1">
                {landingPageTitles.length} page{landingPageTitles.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-1">
                {landingPageTitles.slice(0, 2).map((title, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-xs font-medium text-indigo-700"
                  >
                    {title}
                  </span>
                ))}
                {landingPageTitles.length > 2 && (
                  <span className="px-2 py-0.5 text-xs text-slate-500">
                    +{landingPageTitles.length - 2} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No landing pages</p>
          )}
        </div>

        {/* Certificates Card */}
        <div 
          onClick={() => {
            if (firstCertificateId) {
              // Navigate to edit the first certificate template
              navigate(`/certificates/templates/${firstCertificateId}`);
            } else {
              // Navigate to certificate templates list if no certificates
              navigate(getRoutePath(ViewState.CERTIFICATE_TEMPLATE_LIST));
            }
          }}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">Certificates</h3>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading...</span>
            </div>
          ) : certificateTitles.length > 0 ? (
            <p className="text-sm text-slate-600">
              {certificateTitles.length} template{certificateTitles.length !== 1 ? 's' : ''} available
            </p>
          ) : (
            <p className="text-sm text-slate-400">No certificates</p>
          )}
        </div>

        {/* Submissions Card */}
        <div 
          onClick={() => navigate(getRoutePath(ViewState.SUBMISSIONS_DASHBOARD))}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileCheck className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">Submission Forms</h3>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading...</span>
            </div>
          ) : submissionFormTitles.length > 0 ? (
            <div>
              <p className="text-sm text-slate-600 mb-1">
                {submissionFormTitles.length} form{submissionFormTitles.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-1">
                {submissionFormTitles.slice(0, 2).map((title, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700"
                  >
                    {title}
                  </span>
                ))}
                {submissionFormTitles.length > 2 && (
                  <span className="px-2 py-0.5 text-xs text-slate-500">
                    +{submissionFormTitles.length - 2} more
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {submissionsCount} submission{submissionsCount !== 1 ? 's' : ''} received
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-400 mb-1">No submission forms</p>
              <p className="text-xs text-slate-500">
                {submissionsCount} submission{submissionsCount !== 1 ? 's' : ''} received
              </p>
            </div>
          )}
        </div>

        {/* Registrations Card */}
        <div 
          onClick={() => navigate(getRoutePath(ViewState.REGISTRATION_LIST))}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">Registration Forms</h3>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading...</span>
            </div>
          ) : registrationFormTitles.length > 0 ? (
            <div>
              <p className="text-sm text-slate-600 mb-1">
                {registrationFormTitles.length} form{registrationFormTitles.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-1">
                {registrationFormTitles.slice(0, 2).map((title, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-green-50 border border-green-200 rounded text-xs font-medium text-green-700"
                  >
                    {title}
                  </span>
                ))}
                {registrationFormTitles.length > 2 && (
                  <span className="px-2 py-0.5 text-xs text-slate-500">
                    +{registrationFormTitles.length - 2} more
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {registrationsCount} registration{registrationsCount !== 1 ? 's' : ''} total
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-400 mb-1">No registration forms</p>
              <p className="text-xs text-slate-500">
                {registrationsCount} registration{registrationsCount !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListOfEvents;

