import React from 'react';
import './richTextHtml.css';

interface RichTextHtmlContentProps {
  html: string;
  className?: string;
  emptyFallback?: React.ReactNode;
}

/**
 * Renders Quill HTML with heading sizes, lists, and alignment classes
 * (parent `text-sm` / `prose-sm` would otherwise flatten h1–h3).
 */
const RichTextHtmlContent: React.FC<RichTextHtmlContentProps> = ({
  html,
  className = '',
  emptyFallback = null,
}) => {
  const trimmed = html?.trim();
  if (!trimmed) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }

  return (
    <div
      className={`rich-text-html text-slate-700 leading-relaxed max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: trimmed }}
    />
  );
};

export default RichTextHtmlContent;
