import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { PresenterPanel, PanelSpeaker } from '../../../../types';
import { uploadPresenterImage } from '../../../../services/presenterService';
import { useAuth } from '../../../../hooks/useAuth';

interface PanelFormProps {
  eventId: string;
  panel: PresenterPanel | null;
  onSave: (data: Omit<PresenterPanel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const PanelForm: React.FC<PanelFormProps> = ({ eventId, panel, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [moderatorName, setModeratorName] = useState('');
  const [moderatorTitle, setModeratorTitle] = useState('');
  const [moderatorEntity, setModeratorEntity] = useState('');
  const [moderatorPicture, setModeratorPicture] = useState('');
  const [speakers, setSpeakers] = useState<PanelSpeaker[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (panel) {
      setTitle(panel.title);
      setModeratorName(panel.moderatorName || '');
      setModeratorTitle(panel.moderatorTitle || '');
      setModeratorEntity(panel.moderatorEntity || '');
      setModeratorPicture(panel.moderatorPicture || '');
      setSpeakers(panel.speakers || []);
    }
  }, [panel]);

  const handleImageUpload = async (file: File, type: 'moderator' | 'speaker', speakerIndex?: number) => {
    if (!currentUser?.id || !file.type.startsWith('image/')) return;

    try {
      setUploading(true);
      const imageUrl = await uploadPresenterImage(currentUser.id, file);
      if (type === 'moderator') {
        setModeratorPicture(imageUrl);
      } else if (speakerIndex !== undefined) {
        const updated = [...speakers];
        updated[speakerIndex] = { ...updated[speakerIndex], picture: imageUrl };
        setSpeakers(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, { name: '', title: '', entity: '', picture: '' }]);
  };

  const removeSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const updateSpeaker = (index: number, field: keyof PanelSpeaker, value: string) => {
    const updated = [...speakers];
    updated[index] = { ...updated[index], [field]: value };
    setSpeakers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      eventId,
      title: title.trim(),
      moderatorName: moderatorName.trim() || undefined,
      moderatorTitle: moderatorTitle.trim() || undefined,
      moderatorEntity: moderatorEntity.trim() || undefined,
      moderatorPicture: moderatorPicture || undefined,
      speakers: speakers.filter(s => s.name.trim()),
      displayOrder: panel?.displayOrder || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{panel ? 'Edit Panel' : 'New Panel'}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <X size={20} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Panel Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      {/* Moderator Section */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold mb-4">Moderator</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <input
              type="text"
              value={moderatorName}
              onChange={(e) => setModeratorName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={moderatorTitle}
              onChange={(e) => setModeratorTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Entity</label>
            <input
              type="text"
              value={moderatorEntity}
              onChange={(e) => setModeratorEntity(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Picture</label>
            <div className="flex items-center gap-4">
              {moderatorPicture && (
                <img src={moderatorPicture} alt="Moderator" className="w-20 h-20 rounded-full object-cover" />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'moderator');
                  }}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  ) : (
                    <Upload size={16} />
                  )}
                  Upload
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Speakers Section */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Speakers</h3>
          <button
            type="button"
            onClick={addSpeaker}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Plus size={16} />
            Add Speaker
          </button>
        </div>

        {speakers.map((speaker, index) => (
          <div key={index} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Speaker {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeSpeaker(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={speaker.name}
                  onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={speaker.title || ''}
                  onChange={(e) => updateSpeaker(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Entity</label>
                <input
                  type="text"
                  value={speaker.entity || ''}
                  onChange={(e) => updateSpeaker(index, 'entity', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Picture</label>
                <div className="flex items-center gap-2">
                  {speaker.picture && (
                    <img src={speaker.picture} alt={speaker.name} className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'speaker', index);
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1 text-sm">
                      <ImageIcon size={14} />
                      Upload
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          {panel ? 'Update Panel' : 'Create Panel'}
        </button>
      </div>
    </form>
  );
};

export default PanelForm;
