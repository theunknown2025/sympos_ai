import React, { useState } from 'react';
import { X, Type, Video, Image, FileText, HelpCircle } from 'lucide-react';
import type { AcademyLesson } from '../../../types';

export interface LessonEditorModalProps {
  lesson: AcademyLesson | null;
  onClose: () => void;
  onSave: (updates: {
    title?: string;
    contentRichText?: any;
    videoUrl?: string;
    attachmentUrls?: string[];
    hasQuiz?: boolean;
  }) => Promise<void>;
}

const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  lesson,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(lesson?.title || '');
  const initialText =
    typeof lesson?.contentRichText === 'string'
      ? lesson.contentRichText
      : lesson?.contentRichText && typeof lesson.contentRichText === 'object' && 'text' in lesson.contentRichText
      ? (lesson.contentRichText as { text?: string }).text || ''
      : '';
  const [contentRichText, setContentRichText] = useState(initialText);
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || '');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(
    lesson?.attachmentUrls || []
  );
  const [hasQuiz, setHasQuiz] = useState(lesson?.hasQuiz ?? false);
  const [saving, setSaving] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<'text' | 'video' | 'files' | 'quiz'>('text');

  const handleSave = async () => {
    if (!lesson) return;
    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        contentRichText: contentRichText.trim() ? { text: contentRichText } : undefined,
        videoUrl: videoUrl.trim() || undefined,
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        hasQuiz,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const addAttachment = () => {
    const url = window.prompt('Enter file or image URL:');
    if (url?.trim()) {
      setAttachmentUrls(prev => [...prev, url.trim()]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachmentUrls(prev => prev.filter((_, i) => i !== index));
  };

  if (!lesson) return null;

  const contentTabs = [
    { id: 'text' as const, label: 'Text', icon: Type },
    { id: 'video' as const, label: 'Video', icon: Video },
    { id: 'files' as const, label: 'Images / Documents', icon: Image },
    { id: 'quiz' as const, label: 'Quiz', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Edit Lesson</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Lesson title"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Content</p>
            <div className="flex gap-2 border-b border-slate-200 mb-3">
              {contentTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveContentTab(id)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1 ${
                    activeContentTab === id
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {activeContentTab === 'text' && (
              <textarea
                value={contentRichText}
                onChange={e => setContentRichText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                placeholder="Rich text content (plain text for now; rich editor can be added later)"
              />
            )}

            {activeContentTab === 'video' && (
              <div>
                <label className="block text-xs text-slate-600 mb-1">Video URL</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://youtube.com/... or video URL"
                />
              </div>
            )}

            {activeContentTab === 'files' && (
              <div>
                <button
                  type="button"
                  onClick={addAttachment}
                  className="mb-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <FileText size={14} />
                  Add image or document URL
                </button>
                <div className="space-y-2">
                  {attachmentUrls.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs"
                    >
                      <span className="flex-1 truncate">{url}</span>
                      <button
                        onClick={() => removeAttachment(i)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeContentTab === 'quiz' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasQuiz"
                  checked={hasQuiz}
                  onChange={e => setHasQuiz(e.target.checked)}
                />
                <label htmlFor="hasQuiz" className="text-sm text-slate-700">
                  Include a quiz for this lesson
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonEditorModal;
