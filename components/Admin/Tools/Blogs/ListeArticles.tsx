import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Trash2,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Eye,
  Search,
  Tag,
  User,
  Grid3x3,
  List,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  getUserBlogArticles,
  deleteBlogArticle,
  updateBlogArticle,
} from '../../../../services/blogArticleService';
import { BlogArticle } from '../../../../types';
import PreviewArticle from './PreviewArticle';
import EditArticle from './EditArticle';
import DeleteArticle from './DeleteArticle';

interface ListeArticlesProps {
  onEdit: (articleId: string) => void;
  onNew: () => void;
  refreshTrigger?: number;
}

const ListeArticles: React.FC<ListeArticlesProps> = ({ onEdit, onNew, refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewArticle, setPreviewArticle] = useState<BlogArticle | null>(null);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<BlogArticle | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'rows'>('cards');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadArticles();
    }
  }, [currentUser, refreshTrigger]);

  const loadArticles = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');
      const userArticles = await getUserBlogArticles(currentUser.id);
      setArticles(userArticles);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    try {
      await deleteBlogArticle(articleId);
      setArticles(articles.filter(a => a.id !== articleId));
      setDeletingArticle(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete article');
    }
  };

  const handlePublishToggle = async (article: BlogArticle) => {
    try {
      setPublishingId(article.id);
      const newStatus = article.status === 'published' ? 'draft' : 'published';
      await updateBlogArticle(article.id, {
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date() : undefined,
      });
      // Update local state
      setArticles(articles.map(a => 
        a.id === article.id 
          ? { ...a, status: newStatus, publishedAt: newStatus === 'published' ? new Date() : a.publishedAt }
          : a
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update article status');
    } finally {
      setPublishingId(null);
    }
  };


  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
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

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and View Mode */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search articles by title, excerpt, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'cards'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Card View"
          >
            <Grid3x3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('rows')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'rows'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Row View"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {searchQuery ? 'No articles found' : 'No blog articles yet'}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first blog article to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={onNew}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Article
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow relative"
            >
              {/* Publish Icon - Top Right */}
              {article.status === 'draft' && (
                <button
                  onClick={() => handlePublishToggle(article)}
                  disabled={publishingId === article.id}
                  className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Publish article"
                >
                  {publishingId === article.id ? (
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                  ) : (
                    <Send size={16} className="text-indigo-600" />
                  )}
                </button>
              )}

              {/* Featured Image */}
              {article.featuredImage && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 truncate mb-1">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-slate-600 line-clamp-2">{article.excerpt}</p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-3">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusColor(article.status)}`}>
                    {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                  </span>
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-slate-500">
                          +{article.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Author */}
                {article.authorName && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <User size={12} />
                    <span>{article.authorName}</span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-4 pb-4 border-b border-slate-200">
                  <Calendar size={12} />
                  <span>Updated {formatDate(article.updatedAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewArticle(article)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye size={18} />
                  </button>
                  {article.status === 'draft' && (
                    <button
                      onClick={() => handlePublishToggle(article)}
                      disabled={publishingId === article.id}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Publish"
                    >
                      {publishingId === article.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  )}
                  {article.status === 'published' && (
                    <button
                      onClick={() => handlePublishToggle(article)}
                      disabled={publishingId === article.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Unpublish"
                    >
                      {publishingId === article.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <X size={18} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setEditingArticle(article)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setDeletingArticle(article)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {article.featuredImage ? (
                        <div className="w-16 h-16 overflow-hidden rounded-lg">
                          <img
                            src={article.featuredImage}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusColor(article.status)}`}>
                        {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {article.tags && article.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {article.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded"
                            >
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-slate-500">
                              +{article.tags.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No tags</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {article.authorName ? (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <User size={12} />
                          <span>{article.authorName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} />
                        <span>{formatDate(article.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewArticle(article)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        {article.status === 'draft' && (
                          <button
                            onClick={() => handlePublishToggle(article)}
                            disabled={publishingId === article.id}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Publish"
                          >
                            {publishingId === article.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                          </button>
                        )}
                        {article.status === 'published' && (
                          <button
                            onClick={() => handlePublishToggle(article)}
                            disabled={publishingId === article.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Unpublish"
                          >
                            {publishingId === article.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <X size={16} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingArticle(article)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingArticle(article)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewArticle && (
        <PreviewArticle
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
        />
      )}

      {/* Edit Modal */}
      {editingArticle && (
        <EditArticle
          articleId={editingArticle.id}
          onSave={() => {
            setEditingArticle(null);
            loadArticles();
          }}
          onCancel={() => setEditingArticle(null)}
        />
      )}

      {/* Delete Modal */}
      {deletingArticle && (
        <DeleteArticle
          article={deletingArticle}
          onConfirm={() => {
            handleDelete(deletingArticle.id);
          }}
          onCancel={() => setDeletingArticle(null)}
        />
      )}
    </div>
  );
};

export default ListeArticles;
