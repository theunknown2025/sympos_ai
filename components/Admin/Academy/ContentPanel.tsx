import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, FileText } from 'lucide-react';
import type { AcademyModule, AcademySection, AcademyLesson } from '../../../types';
import type { SelectedItem } from './StructureSummaryPanel';
import { ContentManager } from './ContentManager';

export interface ContentPanelProps {
  selectedItem: SelectedItem;
  onSaveChapter: (chapter: AcademyModule, updates: { title?: string; description?: string }) => Promise<void>;
  onSaveSection: (section: AcademySection, updates: { title?: string; description?: string }) => Promise<void>;
  onBlocksChange?: () => void;
  onSaveLesson: (lesson: AcademyLesson, updates: {
    title?: string;
    contentRichText?: any;
    videoUrl?: string;
    attachmentUrls?: string[];
    hasQuiz?: boolean;
  }) => Promise<void>;
}

const ContentPanel: React.FC<ContentPanelProps> = ({
  selectedItem,
  onSaveChapter,
  onSaveSection,
  onSaveLesson,
  onBlocksChange,
}) => {
  const [saving, setSaving] = useState(false);

  if (!selectedItem) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <BookOpen size={48} className="mb-4 opacity-50" />
        <p className="text-sm font-medium">Select a chapter, section, or lesson</p>
        <p className="text-xs mt-1">from the structure to add or edit content</p>
      </div>
    );
  }

  if (selectedItem.type === 'chapter') {
    return (
      <ChapterContentForm
        chapter={selectedItem.data}
        onSave={onSaveChapter}
        saving={saving}
        setSaving={setSaving}
        onBlocksChange={onBlocksChange}
      />
    );
  }

  if (selectedItem.type === 'section') {
    return (
      <SectionContentForm
        section={selectedItem.data}
        onSave={onSaveSection}
        saving={saving}
        setSaving={setSaving}
        onBlocksChange={onBlocksChange}
      />
    );
  }

  return (
    <LessonContentForm
      lesson={selectedItem.data}
      onSave={onSaveLesson}
      saving={saving}
      setSaving={setSaving}
      onBlocksChange={onBlocksChange}
    />
  );
};

const ChapterContentForm: React.FC<{
  chapter: AcademyModule;
  onSave: (c: AcademyModule, u: { title?: string; description?: string }) => Promise<void>;
  saving: boolean;
  setSaving: (v: boolean) => void;
  onBlocksChange?: () => void;
}> = ({ chapter, onSave, saving, setSaving, onBlocksChange }) => {
  const [title, setTitle] = useState(chapter.title);
  const [description, setDescription] = useState(chapter.description || '');

  useEffect(() => {
    setTitle(chapter.title);
    setDescription(chapter.description || '');
  }, [chapter.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(chapter, { title: title.trim(), description: description.trim() || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={20} className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">Chapter content</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Chapter description, objectives..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto border-t border-slate-200">
        <ContentManager parentType="module" parentId={chapter.id} onBlocksChange={onBlocksChange} />
      </div>
    </div>
  );
};

const SectionContentForm: React.FC<{
  section: AcademySection;
  onSave: (s: AcademySection, u: { title?: string; description?: string }) => Promise<void>;
  saving: boolean;
  setSaving: (v: boolean) => void;
  onBlocksChange?: () => void;
}> = ({ section, onSave, saving, setSaving, onBlocksChange }) => {
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description || '');

  useEffect(() => {
    setTitle(section.title);
    setDescription(section.description || '');
  }, [section.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(section, { title: title.trim(), description: description.trim() || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={20} className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">Section content</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Section description or content..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto border-t border-slate-200">
        <ContentManager parentType="section" parentId={section.id} onBlocksChange={onBlocksChange} />
      </div>
    </div>
  );
};

const LessonContentForm: React.FC<{
  lesson: AcademyLesson;
  onSave: (l: AcademyLesson, u: any) => Promise<void>;
  saving: boolean;
  setSaving: (v: boolean) => void;
  onBlocksChange?: () => void;
}> = ({ lesson, onSave, saving, setSaving, onBlocksChange }) => {
  const [title, setTitle] = useState(lesson.title);

  useEffect(() => {
    setTitle(lesson.title);
  }, [lesson.id]);

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(lesson, { title: title.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-indigo-600" />
          <label className="text-sm font-medium text-slate-700">Lesson title</label>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Lesson title"
          />
          <button
            onClick={handleSaveTitle}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ContentManager parentType="lesson" parentId={lesson.id} onBlocksChange={onBlocksChange} />
      </div>
    </div>
  );
};

export default ContentPanel;
