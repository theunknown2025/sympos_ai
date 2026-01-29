import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Link as LinkIcon, Building, Hash, 
  Globe, Award, ClipboardList, Send, UserCheck, 
  Loader2, AlertCircle, ArrowLeft, ExternalLink,
  Clock, Tag, FileText
} from 'lucide-react';
import { getEvent } from '../../../services/eventService';
import { getCommittee } from '../../../services/committeeService';
import { Event, Committee, EventBanner } from '../../../types';

interface EventPreviewProps {
  eventId?: string;
  onClose?: () => void;
}

const EventPreview: React.FC<EventPreviewProps> = ({ eventId: propEventId, onClose }) => {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const eventId = propEventId || paramEventId;
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const eventData = await getEvent(eventId);
      if (!eventData) {
        throw new Error('Event not found');
      }

      setEvent(eventData);

      // Load committees
      if (eventData.committeeIds && eventData.committeeIds.length > 0) {
        const committeePromises = eventData.committeeIds.map(id => getCommittee(id));
        const committeeResults = await Promise.all(committeePromises);
        setCommittees(committeeResults.filter((c): c is Committee => c !== null));
      }
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to get banner style
  const getBannerStyle = (banner?: EventBanner) => {
    if (!banner) {
      return { background: 'linear-gradient(to right, #4f46e5, #7c3aed)' };
    }
    
    if (banner.type === 'image' && banner.imageUrl) {
      const positionY = banner.imagePositionY !== undefined ? banner.imagePositionY : 50;
      return { 
        backgroundImage: `url(${banner.imageUrl})`,
        backgroundPosition: `center ${positionY}%`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    if (banner.type === 'color' && banner.color) {
      return { backgroundColor: banner.color };
    }
    
    if (banner.type === 'gradient' && banner.gradientColors) {
      const direction = banner.gradientColors.direction === 'to-r' ? 'to right' :
                       banner.gradientColors.direction === 'to-l' ? 'to left' :
                       banner.gradientColors.direction === 'to-b' ? 'to bottom' :
                       banner.gradientColors.direction === 'to-t' ? 'to top' :
                       banner.gradientColors.direction === 'to-br' ? 'to bottom right' :
                       banner.gradientColors.direction === 'to-bl' ? 'to bottom left' :
                       banner.gradientColors.direction === 'to-tr' ? 'to top right' :
                       'to top left';
      return {
        background: `linear-gradient(${direction}, ${banner.gradientColors.from}, ${banner.gradientColors.to})`
      };
    }
    
    return { background: 'linear-gradient(to right, #4f46e5, #7c3aed)' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Event Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The event you are looking for does not exist.'}</p>
          <button
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate('/event-management');
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner Section */}
      <div className="relative text-white" style={getBannerStyle(event.banner)}>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <button
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate('/event-management');
              }
            }}
            className="mb-6 inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Events</span>
          </button>
          <h1 className="text-5xl font-bold drop-shadow-lg">{event.name}</h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {event.description && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-800">Description</h2>
                </div>
                <div 
                  className="text-slate-700 leading-relaxed prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </section>
            )}

            {/* Keywords */}
            {event.keywords && event.keywords.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-800">Keywords</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Dates */}
            {event.dates && event.dates.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-800">Event Dates</h2>
                </div>
                <div className="space-y-3">
                  {event.dates.map((dateRange, index) => (
                    <div key={dateRange.id || index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-800">
                          {formatDate(dateRange.startDate)}
                          {dateRange.endDate && dateRange.endDate !== dateRange.startDate && (
                            <> - {formatDate(dateRange.endDate)}</>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Partners */}
            {event.partners && event.partners.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-800">Partners</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {event.partners.map((partner, index) => (
                    <div
                      key={partner.id || index}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <p className="font-medium text-slate-800">{partner.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Links */}
            {event.links && event.links.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <LinkIcon className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-800">Links</h2>
                </div>
                <div className="space-y-2">
                  {event.links.map((link, index) => (
                    <a
                      key={link.id || index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                      <span className="font-medium text-slate-800 group-hover:text-indigo-600">
                        {link.name}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Committees */}
            {committees.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-800">Committees</h2>
                </div>
                <div className="space-y-4">
                  {committees.map((committee) => (
                    <div key={committee.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h3 className="font-semibold text-slate-800 mb-2">{committee.name}</h3>
                      {committee.description && (
                        <p className="text-sm text-slate-600 mb-3">{committee.description}</p>
                      )}
                      {committee.fieldsOfIntervention && committee.fieldsOfIntervention.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {committee.fieldsOfIntervention.map((field, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                            >
                              {field.name || field}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location */}
            {event.location && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Location</h2>
                </div>
                <p className="text-slate-700">{event.location}</p>
              </section>
            )}

            {/* Landing Pages */}
            {event.landingPageIds && event.landingPageIds.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Landing Pages</h2>
                </div>
                <p className="text-sm text-slate-600">
                  {event.landingPageIds.length} landing page{event.landingPageIds.length !== 1 ? 's' : ''} configured
                </p>
              </section>
            )}

            {/* Registration Forms */}
            {event.registrationFormIds && event.registrationFormIds.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Registration Forms</h2>
                </div>
                <p className="text-sm text-slate-600">
                  {event.registrationFormIds.length} form{event.registrationFormIds.length !== 1 ? 's' : ''} configured
                </p>
              </section>
            )}

            {/* Submission Forms */}
            {event.submissionFormIds && event.submissionFormIds.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Send className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Submission Forms</h2>
                </div>
                <p className="text-sm text-slate-600">
                  {event.submissionFormIds.length} form{event.submissionFormIds.length !== 1 ? 's' : ''} configured
                </p>
              </section>
            )}

            {/* Certificates */}
            {event.certificateTemplateIds && event.certificateTemplateIds.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Certificates</h2>
                </div>
                <p className="text-sm text-slate-600">
                  {event.certificateTemplateIds.length} template{event.certificateTemplateIds.length !== 1 ? 's' : ''} configured
                </p>
              </section>
            )}

            {/* Event Metadata */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Event Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Created:</span>
                  <span className="text-slate-800 font-medium">
                    {event.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Updated:</span>
                  <span className="text-slate-800 font-medium">
                    {event.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPreview;
