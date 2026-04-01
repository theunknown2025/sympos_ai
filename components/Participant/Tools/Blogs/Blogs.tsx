import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import NewArticle from './NewArticle';
import ListeArticles from './ListeArticles';

const Blogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('list');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewArticle = () => {
    setEditingArticleId(null);
    setActiveTab('new');
  };

  const handleEditArticle = (articleId: string) => {
    setEditingArticleId(articleId);
    setActiveTab('new');
  };

  const handleSave = () => {
    setEditingArticleId(null);
    setActiveTab('list');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setEditingArticleId(null);
    setActiveTab('list');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="text-indigo-600" size={32} />
              Blog Management
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Create and manage blog articles with rich content editing
            </p>
          </div>
          {activeTab === 'list' && (
            <button
              onClick={handleNewArticle}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              New Article
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => {
            setEditingArticleId(null);
            setActiveTab('list');
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} />
            List of Articles
          </div>
        </button>
        {activeTab === 'new' && (
          <button
            className="px-4 py-2 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600"
          >
            <div className="flex items-center gap-2">
              <Plus size={16} />
              {editingArticleId ? 'Edit Article' : 'New Article'}
            </div>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'list' ? (
          <ListeArticles
            onEdit={handleEditArticle}
            onNew={handleNewArticle}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <NewArticle
            articleId={editingArticleId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default Blogs;
