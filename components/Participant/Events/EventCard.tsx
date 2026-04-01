import React from 'react';
import { 
  Calendar, CheckCircle2, Eye, Share2, Heart, MapPin,
  Clock, FileText, Send
} from 'lucide-react';
import { Event } from '../../../types';

interface EventCardProps {
  event: Event;
  onPreview: (event: Event) => void;
  onSubscribe: (event: Event) => void;
  onSubmitPaper: (event: Event) => void;
  onToggleFavorite: (eventId: string) => void;
  onShare: (event: Event) => void;
  isFavorite: boolean;
  isEventRegistered: boolean;
  isEventSubmitted: boolean;
  isEventConfirmed: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onPreview,
  onSubscribe,
  onSubmitPaper,
  onToggleFavorite,
  onShare,
  isFavorite,
  isEventRegistered,
  isEventSubmitted,
  isEventConfirmed,
}) => {
  const hasSubmissionForm = event.submissionFormIds && event.submissionFormIds.length > 0;
  const hasRegistrationForm = event.registrationFormIds && event.registrationFormIds.length > 0;

  // Helper function to strip HTML tags and get plain text preview
  const getPlainTextPreview = (html: string, maxLength: number = 150): string => {
    if (!html) return '';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let text = tempDiv.textContent || tempDiv.innerText || '';
    text = text.replace(/\s+/g, ' ').trim();
    
    if (text.length > maxLength) {
      text = text.substring(0, maxLength).trim() + '...';
    }
    
    return text;
  };

  return (
    <div
      className={`bg-white border rounded-lg p-5 hover:shadow-md transition-shadow ${
        isEventConfirmed ? 'border-emerald-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-900 flex-1 pr-2">{event.name}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreview(event)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            title="Preview Event"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onToggleFavorite(event.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-red-500 hover:bg-red-50'
                : 'text-slate-400 hover:bg-slate-50 hover:text-red-500'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
          </button>
          <button
            onClick={() => onShare(event)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            title="Share Event"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
      
      {event.description && (
        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
          {getPlainTextPreview(event.description, 150)}
        </p>
      )}

      {/* Event Details */}
      <div className="space-y-2 mb-4">
        {event.location && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
        )}
        {event.dates && event.dates.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={14} />
            <span>
              {new Date(event.dates[0].startDate).toLocaleDateString()}
              {event.dates[0].endDate && event.dates[0].endDate !== event.dates[0].startDate && (
                <> - {new Date(event.dates[0].endDate).toLocaleDateString()}</>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => onSubscribe(event)}
          disabled={!hasRegistrationForm}
          className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
            !hasRegistrationForm
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isEventRegistered
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
          title={
            !hasRegistrationForm 
              ? 'No registration form available'
              : isEventRegistered
              ? 'Already registered - Click to view/edit'
              : 'Register'
          }
        >
          {isEventRegistered ? (
            <>
              <CheckCircle2 size={14} />
              Registered
            </>
          ) : (
            <>
              <FileText size={14} />
              Register
            </>
          )}
        </button>
        
        <button
          onClick={() => onSubmitPaper(event)}
          disabled={!hasSubmissionForm}
          className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
            !hasSubmissionForm
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isEventSubmitted
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
          title={
            !hasSubmissionForm 
              ? 'No submission form available'
              : isEventSubmitted
              ? 'Already submitted - Click to view/edit'
              : 'Submit Paper'
          }
        >
          {isEventSubmitted ? (
            <>
              <CheckCircle2 size={14} />
              Submitted
            </>
          ) : (
            <>
              <Send size={14} />
              Submit
            </>
          )}
        </button>
      </div>

      {isEventConfirmed && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2 w-fit">
            <CheckCircle2 size={14} />
            Attendance Confirmed
          </span>
        </div>
      )}
    </div>
  );
};

export default EventCard;
