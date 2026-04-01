import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, GraduationCap, Clock, Globe, Tag, BookOpen, Maximize2 } from 'lucide-react';
import type { AcademyCourse } from '../../../types';

export interface CoursePreviewModalProps {
  course: AcademyCourse | null;
  onClose: () => void;
}

const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({ course, onClose }) => {
  if (!course) return null;
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Course Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigate(`/academy-lms/courses/${course.id}/preview`);
                onClose();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
              title="Open full screen"
              aria-label="Open full screen"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Close preview"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {(course.bannerImageUrl || course.thumbnailUrl) && (
            <img
              src={course.bannerImageUrl || course.thumbnailUrl}
              alt={course.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}
          <div>
            <h3 className="text-xl font-bold text-slate-900">{course.title}</h3>
            {course.slug && (
              <p className="text-sm text-slate-500 font-mono mt-0.5">{course.slug}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                course.status === 'published'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : course.status === 'draft'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {course.status}
            </span>
            {course.difficulty && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <GraduationCap size={12} />
                {course.difficulty}
              </span>
            )}
            {course.estimatedDurationMinutes && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <Clock size={12} />
                ~{course.estimatedDurationMinutes} min
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <Globe size={12} />
              {course.visibility}
            </span>
          </div>
          {course.shortDescription && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Short description</h4>
              <p className="text-sm text-slate-600">{course.shortDescription}</p>
            </div>
          )}
          {course.longDescription && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Long description</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{course.longDescription}</p>
            </div>
          )}
          {course.tags && course.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <Tag size={14} />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {course.modules && course.modules.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <BookOpen size={14} />
                Structure ({course.modules.length} module{course.modules.length !== 1 ? 's' : ''})
              </h4>
              <div className="space-y-2">
                {course.modules.map((mod, i) => (
                  <div
                    key={mod.id}
                    className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {i + 1}. {mod.title}
                    </p>
                    {mod.lessons && mod.lessons.length > 0 && (
                      <ul className="mt-2 ml-4 text-xs text-slate-600 space-y-1">
                        {mod.lessons.map((l, j) => (
                          <li key={l.id}>
                            {j + 1}. {l.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
            Created: {course.createdAt.toLocaleDateString()}
            {course.updatedAt && (
              <> · Updated: {course.updatedAt.toLocaleDateString()}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePreviewModal;
