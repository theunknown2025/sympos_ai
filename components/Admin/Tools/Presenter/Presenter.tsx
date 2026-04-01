import React, { useState, useEffect } from 'react';
import { Presentation, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  getUserPresenterEvents,
  savePresenterEvent,
  updatePresenterEvent,
  deletePresenterEvent,
} from '../../../../services/presenterService';
import { PresenterEvent } from '../../../../types';
import EventInfo from './EventInfo';
import PanelManager from './PanelManager';
import SpeakerManager from './SpeakerManager';
import DisplayPanel from './DisplayPanel';
import DisplaySpeaker from './DisplaySpeaker';

const Presenter: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<PresenterEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PresenterEvent | null>(null);
  const [activeView, setActiveView] = useState<'events' | 'panels' | 'speakers'>('events');
  const [displayingPanelId, setDisplayingPanelId] = useState<string | null>(null);
  const [displayingSpeakerId, setDisplayingSpeakerId] = useState<string | null>(null);
  const [panelTemplateId, setPanelTemplateId] = useState<string | undefined>(undefined);
  const [speakerTemplateId, setSpeakerTemplateId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser]);

  const loadEvents = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');
      const userEvents = await getUserPresenterEvents(currentUser.id);
      setEvents(userEvents);
      if (userEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(userEvents[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: Omit<PresenterEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.id) return;

    try {
      const eventId = await savePresenterEvent(currentUser.id, eventData);
      await loadEvents();
      // Find the newly created event
      const allEvents = await getUserPresenterEvents(currentUser.id);
      const newEvent = allEvents.find(e => e.id === eventId);
      if (newEvent) {
        setSelectedEvent(newEvent);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: Partial<PresenterEvent>) => {
    try {
      await updatePresenterEvent(eventId, eventData);
      await loadEvents();
      const updated = events.find(e => e.id === eventId);
      if (updated) {
        setSelectedEvent({ ...updated, ...eventData });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deletePresenterEvent(eventId);
      await loadEvents();
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(events.length > 1 ? events.find(e => e.id !== eventId) || null : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show full-page display if displaying panel or speaker
  if (displayingPanelId && selectedEvent) {
    return (
      <DisplayPanel
        panelId={displayingPanelId}
        event={selectedEvent}
        onClose={() => {
          setDisplayingPanelId(null);
          setPanelTemplateId(undefined);
        }}
        templateId={panelTemplateId}
      />
    );
  }

  if (displayingSpeakerId && selectedEvent) {
    return (
      <DisplaySpeaker
        speakerId={displayingSpeakerId}
        event={selectedEvent}
        onClose={() => {
          setDisplayingSpeakerId(null);
          setSpeakerTemplateId(undefined);
        }}
        templateId={speakerTemplateId}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Presentation className="text-indigo-600" size={32} />
              Conference Presenter
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Create and manage conference presentations with panels and speakers
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Event Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Event
        </label>
        <div className="flex gap-2">
          <select
            value={selectedEvent?.id || ''}
            onChange={(e) => {
              const event = events.find(ev => ev.id === e.target.value);
              setSelectedEvent(event || null);
            }}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Select or Create Event --</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const newEvent: PresenterEvent = {
                id: '',
                userId: currentUser?.id || '',
                name: 'New Event',
                place: '',
                date: undefined,
                link: '',
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              setSelectedEvent(newEvent);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            New Event
          </button>
        </div>
      </div>

      {/* Event Info Display */}
      {selectedEvent && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-indigo-600" size={20} />
              <div>
                <div className="text-xs text-slate-500">Date</div>
                <div className="font-medium">{selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-indigo-600" size={20} />
              <div>
                <div className="text-xs text-slate-500">Place</div>
                <div className="font-medium">{selectedEvent.place || 'Not set'}</div>
              </div>
            </div>
            {selectedEvent.link && (
              <div className="flex items-center gap-2">
                <LinkIcon className="text-indigo-600" size={20} />
                <div>
                  <div className="text-xs text-slate-500">Link</div>
                  <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline">
                    Open Link
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {selectedEvent && (
        <>
          <div className="flex gap-2 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveView('events')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'events'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Event Info
            </button>
            <button
              onClick={() => setActiveView('panels')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'panels'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Panels
            </button>
            <button
              onClick={() => setActiveView('speakers')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'speakers'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Speakers
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {activeView === 'events' && (
              <EventInfo
                event={selectedEvent}
                onSave={handleUpdateEvent}
                onDelete={handleDeleteEvent}
              />
            )}
            {activeView === 'panels' && (
              <PanelManager
                eventId={selectedEvent.id}
                event={selectedEvent}
                onDisplay={(panelId, templateId) => {
                  setPanelTemplateId(templateId);
                  setDisplayingPanelId(panelId);
                }}
              />
            )}
            {activeView === 'speakers' && (
              <SpeakerManager
                eventId={selectedEvent.id}
                event={selectedEvent}
                onDisplay={(speakerId, templateId) => {
                  setSpeakerTemplateId(templateId);
                  setDisplayingSpeakerId(speakerId);
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Create Event Form */}
      {!selectedEvent && (
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
            <EventInfo
              event={null}
              onSave={handleCreateEvent}
              onDelete={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Presenter;
