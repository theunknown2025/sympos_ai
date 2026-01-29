import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface TextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  initialContent?: string;
}

const TextEditorModal: React.FC<TextEditorModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialContent = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Initialize or reinitialize editor when modal opens
    if (editorRef.current) {
      // Clear any existing content
      if (editorRef.current.firstChild) {
        editorRef.current.innerHTML = '';
      }

      // Create new Quill instance
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
          ],
        },
        formats: [
          'header',
          'bold', 'italic', 'underline', 'strike',
          'list', 'bullet',
          'color', 'background',
          'align',
          'link', 'image'
        ]
      });

      // Set initial content
      if (initialContent) {
        quillRef.current.root.innerHTML = initialContent;
      }
    }

    // Cleanup when modal closes or component unmounts
    return () => {
      if (!isOpen && quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [isOpen]); // Only depend on isOpen to reinitialize when modal opens

  // Separate effect to update content when initialContent changes while editor is open
  useEffect(() => {
    if (isOpen && quillRef.current && initialContent !== undefined) {
      const currentContent = quillRef.current.root.innerHTML;
      // Only update if content actually changed (and it's not just empty paragraph)
      if (currentContent !== initialContent && initialContent !== '<p><br></p>') {
        quillRef.current.root.innerHTML = initialContent;
      }
    }
  }, [initialContent, isOpen]);

  const handleInsert = () => {
    if (quillRef.current) {
      const content = quillRef.current.root.innerHTML;
      onInsert(content);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Text Editor</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="h-[400px] bg-white">
            <div ref={editorRef} style={{ height: '350px' }} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextEditorModal;
