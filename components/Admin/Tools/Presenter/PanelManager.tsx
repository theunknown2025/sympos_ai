import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, User, Users, Layout } from 'lucide-react';
import {
  getEventPanels,
  savePresenterPanel,
  updatePresenterPanel,
  deletePresenterPanel,
  uploadPresenterImage,
} from '../../../../services/presenterService';
import { PresenterPanel, PanelSpeaker, PresenterEvent } from '../../../../types';
import { useAuth } from '../../../../hooks/useAuth';
import PanelForm from './PanelForm';
import PanelTemplateSelector from './PanelTemplateSelector';

interface PanelManagerProps {
  eventId: string;
  event?: PresenterEvent;
  onDisplay: (panelId: string, templateId?: string) => void;
}

const PanelManager: React.FC<PanelManagerProps> = ({ eventId, event, onDisplay }) => {
  const { currentUser } = useAuth();
  const [panels, setPanels] = useState<PresenterPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPanel, setEditingPanel] = useState<PresenterPanel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadPanels();
  }, [eventId]);

  const loadPanels = async () => {
    try {
      setLoading(true);
      setError('');
      const eventPanels = await getEventPanels(eventId);
      setPanels(eventPanels);
    } catch (err: any) {
      setError(err.message || 'Failed to load panels');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (panelData: Omit<PresenterPanel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.id) return;

    try {
      if (editingPanel) {
        await updatePresenterPanel(editingPanel.id, panelData);
      } else {
        await savePresenterPanel(currentUser.id, panelData);
      }
      await loadPanels();
      setShowForm(false);
      setEditingPanel(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save panel');
    }
  };

  const handleDelete = async (panelId: string) => {
    if (!confirm('Are you sure you want to delete this panel?')) return;

    try {
      await deletePresenterPanel(panelId);
      await loadPanels();
    } catch (err: any) {
      setError(err.message || 'Failed to delete panel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (showForm || editingPanel) {
    return (
      <PanelForm
        eventId={eventId}
        panel={editingPanel}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingPanel(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Panels</h2>
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
            Add Panel
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {panels.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <Users className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">No panels yet. Create your first panel to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {panels.map((panel) => (
            <div
              key={panel.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{panel.title}</h3>

              {panel.moderatorName && (
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                  <User size={16} />
                  <span className="font-medium">Moderator:</span>
                  <span>{panel.moderatorName}</span>
                </div>
              )}

              <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
                <Users size={16} />
                <span>{panel.speakers.length} Speaker{panel.speakers.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => onDisplay(panel.id, selectedTemplateId)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Eye size={16} />
                  Display
                </button>
                <button
                  onClick={() => setEditingPanel(panel)}
                  className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(panel.id)}
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
      <PanelTemplateSelector
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

export default PanelManager;
