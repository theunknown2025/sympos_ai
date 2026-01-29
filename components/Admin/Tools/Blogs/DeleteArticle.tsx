import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { BlogArticle } from '../../../../types';

interface DeleteArticleProps {
  article: BlogArticle;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteArticle: React.FC<DeleteArticleProps> = ({ article, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Delete Article</h2>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Are you sure you want to delete this article?
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                <strong>"{article.title}"</strong>
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone. All content, images, and metadata will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Article
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteArticle;
