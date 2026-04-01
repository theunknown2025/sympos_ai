import React, { useState, useEffect } from 'react';
import { Save, X, Upload } from 'lucide-react';
import { PresenterSpeaker } from '../../../../types';
import { uploadPresenterImage } from '../../../../services/presenterService';
import { useAuth } from '../../../../hooks/useAuth';

interface SpeakerFormProps {
  eventId: string;
  speaker: PresenterSpeaker | null;
  onSave: (data: Omit<PresenterSpeaker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const SpeakerForm: React.FC<SpeakerFormProps> = ({ eventId, speaker, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [entity, setEntity] = useState('');
  const [picture, setPicture] = useState('');
  const [interventionTitle, setInterventionTitle] = useState('');
  const [speakerInfo, setSpeakerInfo] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (speaker) {
      setName(speaker.name);
      setTitle(speaker.title || '');
      setEntity(speaker.entity || '');
      setPicture(speaker.picture || '');
      setInterventionTitle(speaker.interventionTitle || '');
      setSpeakerInfo(speaker.speakerInfo || '');
    }
  }, [speaker]);

  const handleImageUpload = async (file: File) => {
    if (!currentUser?.id || !file.type.startsWith('image/')) return;

    try {
      setUploading(true);
      const imageUrl = await uploadPresenterImage(currentUser.id, file);
      setPicture(imageUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      eventId,
      name: name.trim(),
      title: title.trim() || undefined,
      entity: entity.trim() || undefined,
      picture: picture || undefined,
      interventionTitle: interventionTitle.trim() || undefined,
      speakerInfo: speakerInfo.trim() || undefined,
      displayOrder: speaker?.displayOrder || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{speaker ? 'Edit Speaker' : 'New Speaker'}</h2>
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
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Entity</label>
          <input
            type="text"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Intervention Title</label>
        <input
          type="text"
          value={interventionTitle}
          onChange={(e) => setInterventionTitle(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Speaker Information</label>
        <textarea
          value={speakerInfo}
          onChange={(e) => setSpeakerInfo(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Additional information about the speaker..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Picture</label>
        <div className="flex items-center gap-4">
          {picture && (
            <img src={picture} alt={name} className="w-32 h-32 rounded-full object-cover" />
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
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
              Upload Picture
            </div>
          </label>
        </div>
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
          {speaker ? 'Update Speaker' : 'Create Speaker'}
        </button>
      </div>
    </form>
  );
};

export default SpeakerForm;
