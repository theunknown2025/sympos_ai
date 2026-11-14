import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const EMPTY_HTML = '<p><br></p>';

function normalizeHtml(html: string): string {
  const t = html.trim();
  if (!t || t === EMPTY_HTML) return '';
  return html;
}

const quillToolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
];

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'color',
  'background',
  'align',
  'link',
  'image',
];

interface InlineRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  editorHeight?: number;
  className?: string;
}

/**
 * Inline Quill rich text editor — same toolbar/config as {@link TextEditorModal}.
 */
const InlineRichTextEditor: React.FC<InlineRichTextEditorProps> = ({
  value,
  onChange,
  editorHeight = 280,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const lastEmittedRef = useRef<string>(normalizeHtml(value));

  onChangeRef.current = onChange;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const destroyQuill = () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
        quillRef.current = null;
      }
      mount.innerHTML = '';
    };

    destroyQuill();

    const editorEl = document.createElement('div');
    editorEl.style.height = `${editorHeight}px`;
    mount.appendChild(editorEl);

    const quill = new Quill(editorEl, {
      theme: 'snow',
      modules: { toolbar: quillToolbar },
      formats: quillFormats,
    });
    quillRef.current = quill;

    const initial = normalizeHtml(value);
    if (initial) {
      quill.root.innerHTML = value;
    }
    lastEmittedRef.current = initial;

    const onTextChange = () => {
      const html = normalizeHtml(quill.root.innerHTML);
      lastEmittedRef.current = html;
      onChangeRef.current(html);
    };
    quill.on('text-change', onTextChange);

    return destroyQuill;
  }, [editorHeight]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const next = normalizeHtml(value);
    if (next === lastEmittedRef.current) return;
    lastEmittedRef.current = next;
    quill.root.innerHTML = value || EMPTY_HTML;
  }, [value]);

  return (
    <div
      className={`rounded-lg border border-slate-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${className}`}
    >
      <div ref={mountRef} />
    </div>
  );
};

export default InlineRichTextEditor;
