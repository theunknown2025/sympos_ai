import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, Loader2, AlertCircle, ExternalLink, 
  Send, FileText, Eye, Share2, Heart, MapPin,
  Clock, X, Edit2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getJuryMemberProfile,
  getAvailableEvents,
  getJuryMemberEvents,
  confirmEventAttendance,
} from '../../../services/juryMemberService';
import { getRegistrationSubmissions } from '../../../services/registrationSubmissionService';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { saveEventForParticipant, removeSavedEvent } from '../../../services/participantEventService';
import { Event, EventAttendance, FormSubmission } from '../../../types';
import FormModal from '../../Admin/Tools/FormBuilder/FormModal';
import { useNavigate } from 'react-router-dom';
import AllEvents from './AllEvents';
import SavedEvents from './SavedEvents';

const Events: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<EventAttendance[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<FormSubmission[]>([]);
  const [mySubmissions, setMySubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  
  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showAlreadyRegisteredModal, setShowAlreadyRegisteredModal] = useState(false);
  const [showAlreadySubmittedModal, setShowAlreadySubmittedModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<FormSubmission | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  
  // Favorites state (using localStorage)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'favorite'>('all');

  useEffect(() => {
    if (currentUser) {
      loadData();
      loadFavorites();
    }
  }, [currentUser]);

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('eventFavorites');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setFavorites(new Set(parsed));
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const saveFavorites = (newFavorites: Set<string>) => {
    try {
      localStorage.setItem('eventFavorites', JSON.stringify(Array.from(newFavorites)));
      setFavorites(newFavorites);
    } catch (err) {
      console.error('Error saving favorites:', err);
    }
  };

  const toggleFavorite = async (eventId: string) => {
    if (!currentUser?.id) return;

    const newFavorites = new Set<string>(favorites);
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId);
      // Remove from saved events in database
      try {
        await removeSavedEvent(currentUser.id, eventId);
      } catch (err) {
        console.error('Error removing saved event:', err);
      }
    } else {
      newFavorites.add(eventId);
      // Save to database
      try {
        await saveEventForParticipant(currentUser.id, eventId);
      } catch (err) {
        console.error('Error saving event:', err);
      }
    }
    saveFavorites(newFavorites);
  };

  const isFavorite = (eventId: string): boolean => {
    return favorites.has(eventId);
  };

  const loadData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');

      const profile = await getJuryMemberProfile(currentUser.id);
      
      // Load events and attendance
      const [eventsData, myEventsData] = await Promise.all([
        getAvailableEvents(),
        profile ? getJuryMemberEvents(profile.id) : Promise.resolve([]),
      ]);
      setAvailableEvents(eventsData);
      setMyEvents(myEventsData);

      // Load user's registrations and submissions
      if (currentUser.email && currentUser.id) {
        try {
          let juryMemberEmail: string | undefined;
          if (profile) {
            juryMemberEmail = profile.email;
          }
          
          const allSubmissions = await getRegistrationSubmissions(
            currentUser.email,
            currentUser.id,
            juryMemberEmail
          );
          
          // Separate registrations and submissions
          const registrationSubmissions = [];
          const submissionSubmissions = [];
          for (const submission of allSubmissions) {
            try {
              const form = await getRegistrationForm(submission.formId);
              if (form) {
                const titleLower = form.title.toLowerCase();
                const isSubmissionForm = titleLower.startsWith('sub - ') || titleLower.startsWith('sub-') || 
                                         titleLower.includes('submission') || titleLower.includes('submit');
                if (isSubmissionForm) {
                  submissionSubmissions.push(submission);
                } else {
                  registrationSubmissions.push(submission);
                }
              }
            } catch (err) {
              console.error('Error loading form:', err);
            }
          }
          
          setMyRegistrations(registrationSubmissions);
          setMySubmissions(submissionSubmissions);
        } catch (err) {
          console.error('Error loading registrations/submissions:', err);
          // Don't fail the whole load if registrations/submissions fail
        }
      }
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async (event: Event) => {
    if (!currentUser?.id) {
      alert('You must be logged in to confirm attendance');
      return;
    }

    try {
      setConfirmingId(event.id);

      const profile = await getJuryMemberProfile(currentUser.id);
      if (!profile) {
        alert('Please complete your profile first');
        return;
      }

      await confirmEventAttendance(event.id, profile.id, profile.email, event.name);

      // Update local state
      const newAttendance: EventAttendance = {
        id: `temp-${Date.now()}`,
        eventId: event.id,
        eventName: event.name,
        juryMemberId: profile.id,
        juryMemberEmail: profile.email,
        attendanceConfirmed: true,
        confirmedAt: new Date(),
        createdAt: new Date(),
      };
      setMyEvents([...myEvents, newAttendance]);

      alert('Attendance confirmed successfully!');
    } catch (err: any) {
      console.error('Error confirming attendance:', err);
      alert(err.message || 'Failed to confirm attendance. Please try again.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSubmitPaper = (event: Event) => {
    if (!event.submissionFormIds || event.submissionFormIds.length === 0) {
      alert('No submission form available for this event');
      return;
    }

    // Check if user has already submitted for this event
    const existingSubmission = mySubmissions.find(
      sub => sub.eventId === event.id && 
      event.submissionFormIds.includes(sub.formId)
    );

    if (existingSubmission) {
      // User has already submitted - show modal
      setSelectedEvent(event);
      setSelectedSubmission(existingSubmission);
      setShowAlreadySubmittedModal(true);
      return;
    }

    // New submission
    setSelectedEvent(event);
    setSelectedFormId(event.submissionFormIds[0]);
    setShowSubmitModal(true);
  };

  const handleSubscribe = (event: Event) => {
    if (!event.registrationFormIds || event.registrationFormIds.length === 0) {
      alert('No registration form available for this event');
      return;
    }

    // Check if user has already registered for this event
    const existingRegistration = myRegistrations.find(
      reg => reg.eventId === event.id && 
      event.registrationFormIds.includes(reg.formId)
    );

    if (existingRegistration) {
      // User has already registered - show modal
      setSelectedEvent(event);
      setSelectedRegistration(existingRegistration);
      setShowAlreadyRegisteredModal(true);
      return;
    }

    // New registration
    setSelectedEvent(event);
    setSelectedFormId(event.registrationFormIds[0]);
    setShowSubscribeModal(true);
  };

  const isEventRegistered = (event: Event): boolean => {
    return myRegistrations.some(
      reg => reg.eventId === event.id && 
      event.registrationFormIds.includes(reg.formId)
    );
  };

  const getEventRegistration = (event: Event): FormSubmission | undefined => {
    return myRegistrations.find(
      reg => reg.eventId === event.id && 
      event.registrationFormIds.includes(reg.formId)
    );
  };

  const isEventSubmitted = (event: Event): boolean => {
    return mySubmissions.some(
      sub => sub.eventId === event.id && 
      event.submissionFormIds.includes(sub.formId)
    );
  };

  const getEventSubmission = (event: Event): FormSubmission | undefined => {
    return mySubmissions.find(
      sub => sub.eventId === event.id && 
      event.submissionFormIds.includes(sub.formId)
    );
  };

  const handlePreview = (event: Event) => {
    navigate(`/jury/events/preview/${event.id}`);
  };

  const handleShare = async (event: Event) => {
    const url = window.location.origin + `/jury/events/preview/${event.id}`;
    const shareData = {
      title: event.name,
      text: event.description || `Check out this event: ${event.name}`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
        alert('Event link copied to clipboard!');
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== 'AbortError') {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(url);
          alert('Event link copied to clipboard!');
        } catch (clipboardErr) {
          console.error('Error copying to clipboard:', clipboardErr);
        }
      }
    }
  };

  const isEventConfirmed = (eventId: string): boolean => {
    return myEvents.some((ev) => ev.eventId === eventId && ev.attendanceConfirmed);
  };

  // Helper function to strip HTML tags and get plain text preview
  const getPlainTextPreview = (html: string, maxLength: number = 150): string => {
    if (!html) return '';
    
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get plain text content
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Truncate if needed
    if (text.length > maxLength) {
      text = text.substring(0, maxLength).trim() + '...';
    }
    
    return text;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading events</p>
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

  const confirmedEvents = myEvents.filter((ev) => ev.attendanceConfirmed);

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Calendar size={32} className="text-indigo-600" />
          Events
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Browse events, submit papers, and subscribe to participate</p>
      </header>

      {/* Statistics */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-500">Confirmed Events</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{confirmedEvents.length}</p>
          </div>
          <Calendar className="text-indigo-600" size={32} />
        </div>
      </div>

      {/* My Confirmed Events */}
      {confirmedEvents.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">My Confirmed Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {confirmedEvents.map((attendance) => {
              const event = availableEvents.find((e) => e.id === attendance.eventId);
              return (
                <div
                  key={attendance.id}
                  className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900 flex-1">{attendance.eventName}</h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Confirmed
                    </span>
                  </div>
                  {event?.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {getPlainTextPreview(event.description, 100)}
                    </p>
                  )}
                  {attendance.confirmedAt && (
                    <p className="text-xs text-slate-400">
                      Confirmed: {new Date(attendance.confirmedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>All Events</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('favorite')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'favorite'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart size={16} />
                <span>Favorite</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <AllEvents
          onPreview={handlePreview}
          onSubscribe={handleSubscribe}
          onSubmitPaper={handleSubmitPaper}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
          isFavorite={isFavorite}
          isEventRegistered={isEventRegistered}
          isEventSubmitted={isEventSubmitted}
          isEventConfirmed={isEventConfirmed}
          myRegistrations={myRegistrations}
          mySubmissions={mySubmissions}
        />
      )}

      {activeTab === 'favorite' && (
        <SavedEvents
          onPreview={handlePreview}
          onSubscribe={handleSubscribe}
          onSubmitPaper={handleSubmitPaper}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
          isFavorite={isFavorite}
          isEventRegistered={isEventRegistered}
          isEventSubmitted={isEventSubmitted}
          isEventConfirmed={isEventConfirmed}
          myRegistrations={myRegistrations}
          mySubmissions={mySubmissions}
        />
      )}

      {/* Submit Paper Modal */}
      {showSubmitModal && selectedEvent && selectedFormId && (
        <FormModal
          formId={selectedFormId}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.name}
          onClose={() => {
            setShowSubmitModal(false);
            setSelectedEvent(null);
            setSelectedFormId(null);
          }}
          onSuccess={() => {
            setShowSubmitModal(false);
            setSelectedEvent(null);
            setSelectedFormId(null);
            alert('Paper submitted successfully!');
            loadData(); // Reload to update submissions
          }}
        />
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && selectedEvent && selectedFormId && (
        <FormModal
          formId={selectedFormId}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.name}
          onClose={() => {
            setShowSubscribeModal(false);
            setSelectedEvent(null);
            setSelectedFormId(null);
          }}
          onSuccess={() => {
            setShowSubscribeModal(false);
            setSelectedEvent(null);
            setSelectedFormId(null);
            alert('Subscription successful!');
            loadData(); // Reload to update confirmed events and registrations
          }}
        />
      )}

      {/* Already Registered Modal */}
      {showAlreadyRegisteredModal && selectedEvent && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <CheckCircle2 className="text-emerald-600" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Already Registered</h2>
                </div>
                <button
                  onClick={() => {
                    setShowAlreadyRegisteredModal(false);
                    setSelectedEvent(null);
                    setSelectedRegistration(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-slate-600 mb-6">
                You have already registered for <span className="font-semibold text-slate-900">{selectedEvent.name}</span>.
                You can view or edit your registration details.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAlreadyRegisteredModal(false);
                    setSelectedEvent(null);
                    setSelectedRegistration(null);
                    // Navigate to Registrations page
                    navigate('/jury/registrations');
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit Registration
                </button>
                <button
                  onClick={() => {
                    setShowAlreadyRegisteredModal(false);
                    setSelectedEvent(null);
                    setSelectedRegistration(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Already Submitted Modal */}
      {showAlreadySubmittedModal && selectedEvent && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <CheckCircle2 className="text-indigo-600" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Already Submitted</h2>
                </div>
                <button
                  onClick={() => {
                    setShowAlreadySubmittedModal(false);
                    setSelectedEvent(null);
                    setSelectedSubmission(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-slate-600 mb-6">
                You have already submitted a paper for <span className="font-semibold text-slate-900">{selectedEvent.name}</span>.
                You can view or edit your submission details.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAlreadySubmittedModal(false);
                    setSelectedEvent(null);
                    setSelectedSubmission(null);
                    // Navigate to Submissions page
                    navigate('/jury/submissions');
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit Submission
                </button>
                <button
                  onClick={() => {
                    setShowAlreadySubmittedModal(false);
                    setSelectedEvent(null);
                    setSelectedSubmission(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Events;
