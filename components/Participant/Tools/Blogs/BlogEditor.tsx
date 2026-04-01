import React, { useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, Code, Eye } from 'lucide-react';

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
  onPreview?: () => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ content, onChange, onPreview }) => {
  const [showPreview, setShowPreview] = useState(false);

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('blog-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = textarea.value.substring(0, start) + before + selectedText + after + textarea.value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertText('**', '**'),
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertText('*', '*'),
    },
    {
      icon: Underline,
      label: 'Underline',
      action: () => insertText('<u>', '</u>'),
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => insertText('- '),
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => insertText('1. '),
    },
    {
      icon: Link,
      label: 'Link',
      action: () => {
        const url = prompt('Enter URL:');
        if (url) {
          const textarea = document.getElementById('blog-content') as HTMLTextAreaElement;
          const selectedText = textarea?.value.substring(textarea.selectionStart, textarea.selectionEnd) || 'Link Text';
          insertText(`[${selectedText}](`, ')');
          setTimeout(() => {
            const textarea = document.getElementById('blog-content') as HTMLTextAreaElement;
            if (textarea) {
              const pos = textarea.value.lastIndexOf(')');
              textarea.setSelectionRange(pos, pos);
              insertText(url);
            }
          }, 10);
        }
      },
    },
    {
      icon: Image,
      label: 'Image',
      action: () => {
        const url = prompt('Enter image URL:');
        if (url) {
          const alt = prompt('Enter alt text (optional):') || '';
          insertText(`![${alt}](${url})`);
        }
      },
    },
    {
      icon: Code,
      label: 'Code',
      action: () => insertText('`', '`'),
    },
  ];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-t-lg">
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={button.action}
              className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
              title={button.label}
            >
              <Icon size={16} />
            </button>
          );
        })}
        {onPreview && (
          <div className="flex-1" />
        )}
        {onPreview && (
          <button
            type="button"
            onClick={() => {
              setShowPreview(!showPreview);
              if (!showPreview && onPreview) {
                onPreview();
              }
            }}
            className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
            title="Preview"
          >
            <Eye size={16} />
          </button>
        )}
      </div>

      {/* Editor */}
      {!showPreview ? (
        <textarea
          id="blog-content"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          className="w-full px-4 py-3 border border-slate-300 rounded-b-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-y"
          placeholder="Start writing your blog article... You can use Markdown formatting."
        />
      ) : (
        <div className="w-full px-4 py-3 border border-slate-300 rounded-b-lg bg-white min-h-[400px] prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </div>
      )}
    </div>
  );
};

export default BlogEditor;
