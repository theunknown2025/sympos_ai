import React, { useState, useEffect, useCallback } from 'react';
import type { AcademyLessonContentBlockType } from '../../../../types';
import type { ContentBlock, ContentBlockParentType } from '../../../../services/academyContentBlockService';
import {
  getContentBlocks,
  createContentBlock,
  updateContentBlock,
  deleteContentBlock,
} from '../../../../services/academyContentBlockService';
import AddContentActions from './AddContentActions';
import ContentBlockDisplay from './ContentBlockDisplay';
import ContentBlockEditor, { type ContentBlockFormData } from './ContentBlockEditor';

const LABELS: Record<ContentBlockParentType, string> = {
  lesson: 'Lesson content',
  section: 'Section content',
  module: 'Chapter content',
};

export interface ContentManagerProps {
  parentType: ContentBlockParentType;
  parentId: string;
  onBlocksChange?: () => void;
}

const ContentManager: React.FC<ContentManagerProps> = ({ parentType, parentId, onBlocksChange }) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingType, setAddingType] = useState<AcademyLessonContentBlockType | null>(null);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);

  const loadBlocks = useCallback(async () => {
    if (!parentId) return;
    setLoading(true);
    try {
      const data = await getContentBlocks(parentType, parentId);
      setBlocks(data);
    } catch (e) {
      console.error('Error loading content blocks:', e);
    } finally {
      setLoading(false);
    }
  }, [parentType, parentId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const handleAdd = (blockType: AcademyLessonContentBlockType) => {
    setEditingBlock(null);
    setAddingType(blockType);
  };

  const handleSaveNew = async (content: ContentBlockFormData) => {
    if (!addingType) return;
    setSaving(true);
    try {
      await createContentBlock(parentType, parentId, {
        blockType: addingType,
        content,
        orderIndex: blocks.length,
      });
      await loadBlocks();
      setAddingType(null);
      onBlocksChange?.();
    } catch (e) {
      console.error('Error creating content block:', e);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (block: ContentBlock) => {
    setAddingType(null);
    setEditingBlock(block);
  };

  const handleSaveEdit = async (content: ContentBlockFormData) => {
    if (!editingBlock) return;
    setSaving(true);
    try {
      await updateContentBlock(parentType, editingBlock.id, { content });
      await loadBlocks();
      setEditingBlock(null);
      onBlocksChange?.();
    } catch (e) {
      console.error('Error updating content block:', e);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (block: ContentBlock) => {
    if (!window.confirm('Delete this content block?')) return;
    setSaving(true);
    try {
      await deleteContentBlock(parentType, block.id);
      await loadBlocks();
      if (editingBlock?.id === block.id) setEditingBlock(null);
      onBlocksChange?.();
    } catch (e) {
      console.error('Error deleting content block:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAddOrEdit = () => {
    setAddingType(null);
    setEditingBlock(null);
  };

  const label = LABELS[parentType];

  return (
    <div className="p-6 space-y-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{label}</h3>
        <p className="text-sm text-slate-500">Add video, text, images, links, and documents.</p>
      </div>

      <AddContentActions onAdd={handleAdd} disabled={saving} />

      {addingType && (
        <ContentBlockEditor
          blockType={addingType}
          initialContent={{}}
          onSave={handleSaveNew}
          onCancel={handleCancelAddOrEdit}
        />
      )}

      {editingBlock && (
        <ContentBlockEditor
          blockType={editingBlock.blockType}
          initialContent={editingBlock.content}
          onSave={handleSaveEdit}
          onCancel={handleCancelAddOrEdit}
        />
      )}

      <div className="space-y-2 mt-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading content...</p>
        ) : blocks.length === 0 && !addingType ? (
          <p className="text-sm text-slate-500 py-4">No content yet. Click an action above to add content.</p>
        ) : (
          blocks
            .filter(b => b.id !== editingBlock?.id)
            .map(block => (
              <ContentBlockDisplay
                key={block.id}
                block={block}
                onEdit={() => handleStartEdit(block)}
                onDelete={() => handleDelete(block)}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default ContentManager;
