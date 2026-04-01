import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { getCVs, deleteCV, CV } from '../../../../services/cvService';
import { FileText, Trash2, Edit2, Loader2, AlertCircle, Eye, X } from 'lucide-react';
import CVPreviewCard from './CVPreviewCard';
import CVPreview from './CVPreview';

interface CVListProps {
  onSelectCV?: (cv: CV) => void;
}

const CVList: React.FC<CVListProps> = ({ onSelectCV }) => {
  const { currentUser } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewCV, setPreviewCV] = useState<CV | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadCVs();
    }
  }, [currentUser?.id]);

  const loadCVs = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getCVs(currentUser.id);
      setCvs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load CVs');
      console.error('Error loading CVs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cvId: string) => {
    if (!window.confirm('Are you sure you want to delete this CV?')) {
      return;
    }

    if (!currentUser?.id) return;

    try {
      setDeletingId(cvId);
      await deleteCV(cvId, currentUser.id);
      setCvs(cvs.filter((cv) => cv.id !== cvId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete CV');
      console.error('Error deleting CV:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (cv: CV) => {
    if (onSelectCV) {
      onSelectCV(cv);
    }
  };

  const handlePreview = (cv: CV) => {
    setPreviewCV(cv);
  };

  const handleClosePreview = () => {
    setPreviewCV(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading CVs</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadCVs}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {previewCV ? (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Preview: {previewCV.title}</h2>
            <button
              onClick={handleClosePreview}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close preview"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CVPreview 
              cv={{
                title: previewCV.title,
                profileImage: previewCV.profileImage,
                sections: previewCV.sections,
              }} 
            />
          </div>
        </div>
      ) : (
        <>
          {cvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText size={64} className="mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-2">No CVs yet</p>
              <p className="text-sm">Create your first CV using the "New CV" tab</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cvs.map((cv) => (
                <div key={cv.id} className="relative group">
                  <CVPreviewCard cv={cv} onView={() => handlePreview(cv)} />
                  <div className="absolute top-4 right-4 flex items-center gap-3">
                    <button
                      onClick={() => handlePreview(cv)}
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                      title="View full preview"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(cv)}
                      className="text-indigo-600 hover:text-indigo-700 transition-colors"
                      title="Edit CV"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cv.id)}
                      disabled={deletingId === cv.id}
                      className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                      title="Delete CV"
                    >
                      {deletingId === cv.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CVList;
