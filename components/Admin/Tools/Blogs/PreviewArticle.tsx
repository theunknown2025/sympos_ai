import React, { useState } from 'react';
import { X, Calendar, User, Tag, Maximize2, Minimize2 } from 'lucide-react';
import { BlogArticle } from '../../../../types';

interface PreviewArticleProps {
  article: BlogArticle;
  onClose: () => void;
}

const PreviewArticle: React.FC<PreviewArticleProps> = ({ article, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'archived':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen 
          ? 'w-full h-full max-w-none max-h-none rounded-none' 
          : 'max-w-4xl w-full max-h-[90vh]'
      }`}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Article Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Featured Image */}
            {article.featuredImage && (
              <div className="w-full h-64 overflow-hidden rounded-lg">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{article.title}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded border ${getStatusColor(article.status)}`}>
                  {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                </span>
                {article.authorName && (
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <User size={14} />
                    <span>{article.authorName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Calendar size={14} />
                  <span>
                    {article.publishedAt
                      ? `Published ${formatDate(article.publishedAt)}`
                      : `Updated ${formatDate(article.updatedAt)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            {article.excerpt && (
              <div className="p-4 bg-slate-50 border-l-4 border-indigo-500 rounded">
                <p className="text-lg text-slate-700 italic">{article.excerpt}</p>
              </div>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-700 rounded border border-indigo-200"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
              />
            </div>

            {/* Meta Description */}
            {article.metaDescription && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  SEO Meta Description
                </p>
                <p className="text-sm text-slate-700">{article.metaDescription}</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewArticle;
