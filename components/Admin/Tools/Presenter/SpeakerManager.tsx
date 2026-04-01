import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, User, Layout } from 'lucide-react';
import {
  getEventSpeakers,
  savePresenterSpeaker,
  updatePresenterSpeaker,
  deletePresenterSpeaker,
} from '../../../../services/presenterService';
import { PresenterSpeaker, PresenterEvent } from '../../../../types';
import { useAuth } from '../../../../hooks/useAuth';
import SpeakerForm from './SpeakerForm';
import SpeakerTemplateSelector from './SpeakerTemplateSelector';

interface SpeakerManagerProps {
  eventId: string;
  event?: PresenterEvent;
  onDisplay: (speakerId: string, templateId?: string) => void;
}

const SpeakerManager: React.FC<SpeakerManagerProps> = ({ eventId, event, onDisplay }) => {
  const { currentUser } = useAuth();
  const [speakers, setSpeakers] = useState<PresenterSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSpeaker, setEditingSpeaker] = useState<PresenterSpeaker | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadSpeakers();
  }, [eventId]);

  const loadSpeakers = async () => {
    try {
      setLoading(true);
      setError('');
      const eventSpeakers = await getEventSpeakers(eventId);
      setSpeakers(eventSpeakers);
    } catch (err: any) {
      setError(err.message || 'Failed to load speakers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (speakerData: Omit<PresenterSpeaker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.id) return;

    try {
      if (editingSpeaker) {
        await updatePresenterSpeaker(editingSpeaker.id, speakerData);
      } else {
        await savePresenterSpeaker(currentUser.id, speakerData);
      }
      await loadSpeakers();
      setShowForm(false);
      setEditingSpeaker(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save speaker');
    }
  };

  const handleDelete = async (speakerId: string) => {
    if (!confirm('Are you sure you want to delete this speaker?')) return;

    try {
      await deletePresenterSpeaker(speakerId);
      await loadSpeakers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete speaker');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (showForm || editingSpeaker) {
    return (
      <SpeakerForm
        eventId={eventId}
        speaker={editingSpeaker}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingSpeaker(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Speakers</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Layout size={18} />
            Select Template
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Add Speaker
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {speakers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <User className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">No speakers yet. Create your first speaker to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {speakers.map((speaker) => (
            <div
              key={speaker.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              {speaker.picture && (
                <img
                  src={speaker.picture}
                  alt={speaker.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-slate-900 mb-1 text-center">{speaker.name}</h3>
              {speaker.title && (
                <p className="text-sm text-slate-600 text-center mb-1">{speaker.title}</p>
              )}
              {speaker.entity && (
                <p className="text-sm text-slate-500 text-center mb-2">{speaker.entity}</p>
              )}
              {speaker.interventionTitle && (
                <p className="text-sm font-medium text-indigo-600 text-center mb-4">{speaker.interventionTitle}</p>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => onDisplay(speaker.id, selectedTemplateId)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Eye size={16} />
                  Display
                </button>
                <button
                  onClick={() => setEditingSpeaker(speaker)}
                  className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(speaker.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Selector Modal */}
      <SpeakerTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={(templateId) => {
          setSelectedTemplateId(templateId);
          setShowTemplateSelector(false);
        }}
        selectedTemplateId={selectedTemplateId}
        event={event}
      />
    </div>
  );
};

export default SpeakerManager;
