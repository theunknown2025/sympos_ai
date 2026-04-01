import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { AcademyCourse } from '../../../../types';

export interface PublishActionProps {
  course: AcademyCourse;
  onPublish: (course: AcademyCourse) => Promise<void>;
  onUnpublish?: (course: AcademyCourse) => Promise<void>;
}

const PublishAction: React.FC<PublishActionProps> = ({
  course,
  onPublish,
  onUnpublish,
}) => {
  const [loading, setLoading] = useState(false);
  const isPublished = course.status === 'published';

  const handleClick = async () => {
    if (loading) return;
    try {
      setLoading(true);
      if (isPublished && onUnpublish) {
        await onUnpublish(course);
      } else if (!isPublished) {
        await onPublish(course);
      }
    } finally {
      setLoading(false);
    }
  };

  if (course.status === 'archived') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${
        isPublished
          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
          : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isPublished ? 'Unpublish course' : 'Publish course'}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Send size={16} />
      )}
    </button>
  );
};

export default PublishAction;
