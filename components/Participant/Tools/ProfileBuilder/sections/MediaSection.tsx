import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getEditorTranslations } from '../editorTranslations';

interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'document';
  url: string;
  description?: string;
}

interface MediaSectionProps {
  data: {
    mediaItems: MediaItem[];
  };
  onChange: (data: { mediaItems: MediaItem[] }) => void;
  language?: 'en' | 'fr' | 'ar';
  direction?: 'ltr' | 'rtl';
}

const MediaSection: React.FC<MediaSectionProps> = ({ data, onChange, language = 'en', direction = 'ltr' }) => {
  const t = getEditorTranslations(language);

  const handleAddMedia = () => {
    onChange({
      mediaItems: [
        ...data.mediaItems,
        {
          id: uuidv4(),
          title: '',
          type: 'image',
          url: '',
          description: '',
        },
      ],
    });
  };

  const handleRemoveMedia = (id: string) => {
    onChange({
      mediaItems: data.mediaItems.filter((item) => item.id !== id),
    });
  };

  const handleUpdateMedia = (id: string, field: keyof MediaItem, value: string) => {
    onChange({
      mediaItems: data.mediaItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  return (
    <div className="space-y-4" dir={direction}>
      {data.mediaItems.map((mediaItem, index) => (
        <div key={mediaItem.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">{t.mediaItem} {index + 1}</h4>
            {data.mediaItems.length > 1 && (
              <button
                onClick={() => handleRemoveMedia(mediaItem.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t.remove}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.mediaTitle}</label>
              <input
                type="text"
                value={mediaItem.title || ''}
                onChange={(e) => handleUpdateMedia(mediaItem.id, 'title', e.target.value)}
                placeholder={direction === 'rtl' ? 'عنوان الوسائط' : 'Media Title'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir={direction}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.mediaType}</label>
              <select
                value={mediaItem.type || 'image'}
                onChange={(e) => handleUpdateMedia(mediaItem.id, 'type', e.target.value as MediaItem['type'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir={direction}
              >
                <option value="image">{t.image}</option>
                <option value="video">{t.video}</option>
                <option value="document">{direction === 'rtl' ? 'مستند' : 'Document'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.url}</label>
              <input
                type="url"
                value={mediaItem.url || ''}
                onChange={(e) => handleUpdateMedia(mediaItem.id, 'url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.description} ({t.optional})</label>
              <textarea
                value={mediaItem.description || ''}
                onChange={(e) => handleUpdateMedia(mediaItem.id, 'description', e.target.value)}
                placeholder={direction === 'rtl' ? 'وصف موجز...' : 'Brief description...'}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                dir={direction}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddMedia}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        {t.add} {direction === 'rtl' ? 'وسائط' : 'Media'}
      </button>
    </div>
  );
};

export default MediaSection;
