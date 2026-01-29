import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  MapPin, 
  Loader2,
  FileText,
  AlertCircle,
  Globe,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { 
  getUserLandingPages, 
  deleteLandingPage, 
  SavedLandingPage,
  publishLandingPage,
  unpublishLandingPage
} from '../../../../services/landingPageService';

interface LandingPageManagerProps {
  onEdit: (pageId: string) => void;
  onNew: () => void;
}

const LandingPageManager: React.FC<LandingPageManagerProps> = ({ onEdit, onNew }) => {
  const [pages, setPages] = useState<SavedLandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { currentUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (currentUser && !authLoading) {
      loadPages(currentUser.id);
    } else if (!authLoading && !currentUser) {
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  const loadPages = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      const userPages = await getUserLandingPages(userId);
      // Sort by updatedAt descending (most recent first)
      userPages.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setPages(userPages);
    } catch (err: any) {
      setError('Failed to load landing pages. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!window.confirm('Are you sure you want to delete this landing page? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(pageId);
      await deleteLandingPage(pageId);
      setPages(pages.filter(p => p.id !== pageId));
    } catch (err: any) {
      setError('Failed to delete landing page. Please try again.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (pageId: string) => {
    try {
      setPublishingId(pageId);
      setError('');
      const publishedUrl = await publishLandingPage(pageId);
      // Reload pages to get updated published status
      if (currentUser) {
        await loadPages(currentUser.id);
      }
    } catch (err: any) {
      setError('Failed to publish landing page. Please try again.');
      console.error(err);
    } finally {
      setPublishingId(null);
    }
  };

  const handleUnpublish = async (pageId: string) => {
    try {
      setPublishingId(pageId);
      setError('');
      await unpublishLandingPage(pageId);
      // Reload pages to get updated published status
      if (currentUser) {
        await loadPages(currentUser.id);
      }
    } catch (err: any) {
      setError('Failed to unpublish landing page. Please try again.');
      console.error(err);
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4">Loading landing pages...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Landing Pages</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your saved landing pages</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200"
        >
          <Plus size={18} /> New Landing Page
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No landing pages yet</h3>
          <p className="text-slate-500 mb-6">Create your first landing page to get started</p>
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            <Plus size={18} /> Create Landing Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-3 truncate">
                  {page.title}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={16} />
                    <span>{page.config.date || 'No date set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} />
                    <span className="truncate">{page.config.location || 'No location set'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">
                    Created: {formatDate(page.createdAt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Updated: {formatDate(page.updatedAt)}
                  </p>
                </div>

                {/* Published Status */}
                {page.isPublished && page.publishedUrl && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                      <Globe size={16} />
                      <span className="font-medium">Published</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                      <input
                        type="text"
                        value={page.publishedUrl}
                        readOnly
                        className="flex-1 text-xs text-slate-600 bg-transparent border-none outline-none truncate"
                      />
                      <button
                        onClick={() => handleCopyUrl(page.publishedUrl!)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Copy URL"
                      >
                        {copiedUrl === page.publishedUrl ? (
                          <Check size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenUrl(page.publishedUrl!)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Open in new tab"
                      >
                        <Globe size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {page.isPublished ? (
                    <button
                      onClick={() => handleUnpublish(page.id)}
                      disabled={publishingId === page.id}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Unpublish"
                    >
                      {publishingId === page.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                      <span className="hidden sm:inline">Unpublish</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublish(page.id)}
                      disabled={publishingId === page.id}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Publish"
                    >
                      {publishingId === page.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                      <span className="hidden sm:inline">Publish</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(page.id)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 size={16} /> <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    disabled={deletingId === page.id}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === page.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandingPageManager;

