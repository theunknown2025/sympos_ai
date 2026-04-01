import React, { useState, useEffect } from 'react';
import { Type, Video, Image, FileText, HelpCircle, Check, X } from 'lucide-react';
import type { AcademyLesson } from '../../../types';

export interface InlineLessonContentEditorProps {
  lesson: AcademyLesson;
  onSave: (updates: {
    title?: string;
    contentRichText?: any;
    videoUrl?: string;
    attachmentUrls?: string[];
    hasQuiz?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

const InlineLessonContentEditor: React.FC<InlineLessonContentEditorProps> = ({
  lesson,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(lesson.title);
  const initialText =
    typeof lesson.contentRichText === 'string'
      ? lesson.contentRichText
      : lesson.contentRichText && typeof lesson.contentRichText === 'object' && 'text' in lesson.contentRichText
      ? (lesson.contentRichText as { text?: string }).text || ''
      : '';
  const [contentRichText, setContentRichText] = useState(initialText);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl || '');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(lesson.attachmentUrls || []);
  const [hasQuiz, setHasQuiz] = useState(lesson.hasQuiz ?? false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'video' | 'files' | 'quiz'>('text');

  useEffect(() => {
    setTitle(lesson.title);
    setContentRichText(
      typeof lesson.contentRichText === 'string'
        ? lesson.contentRichText
        : lesson.contentRichText && typeof lesson.contentRichText === 'object' && 'text' in lesson.contentRichText
        ? (lesson.contentRichText as { text?: string }).text || ''
        : ''
    );
    setVideoUrl(lesson.videoUrl || '');
    setAttachmentUrls(lesson.attachmentUrls || []);
    setHasQuiz(lesson.hasQuiz ?? false);
  }, [lesson.id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        contentRichText: contentRichText.trim() ? { text: contentRichText } : undefined,
        videoUrl: videoUrl.trim() || undefined,
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        hasQuiz,
      });
      onCancel();
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

  const tabs = [
    { id: 'text' as const, label: 'Text', icon: Type },
    { id: 'video' as const, label: 'Video', icon: Video },
    { id: 'files' as const, label: 'Images / Documents', icon: Image },
    { id: 'quiz' as const, label: 'Quiz', icon: HelpCircle },
  ];

  return (
    <div className="ml-6 mt-2 mb-2 p-4 border border-slate-200 rounded-lg bg-slate-50/80 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Content: {lesson.title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="p-1.5 rounded text-green-600 hover:bg-green-100 disabled:opacity-40"
            title="Save"
          >
            <Check size={16} />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="Cancel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
          placeholder="Lesson title"
        />
      </div>

      <div>
        <div className="flex gap-1 border-b border-slate-200 mb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-2 py-1.5 text-xs font-medium border-b-2 flex items-center gap-1 ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'text' && (
          <textarea
            value={contentRichText}
            onChange={e => setContentRichText(e.target.value)}
            rows={4}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
            placeholder="Text content..."
          />
        )}

        {activeTab === 'video' && (
          <input
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
            placeholder="https://youtube.com/... or video URL"
          />
        )}

        {activeTab === 'files' && (
          <div>
            <button
              type="button"
              onClick={addAttachment}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2"
            >
              <FileText size={12} />
              Add image or document URL
            </button>
            <div className="space-y-1">
              {attachmentUrls.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 bg-white rounded text-xs border border-slate-200"
                >
                  <span className="flex-1 truncate">{url}</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="text-red-600 hover:text-red-700 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`quiz-${lesson.id}`}
              checked={hasQuiz}
              onChange={e => setHasQuiz(e.target.checked)}
            />
            <label htmlFor={`quiz-${lesson.id}`} className="text-xs text-slate-700">
              Include a quiz for this lesson
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineLessonContentEditor;
