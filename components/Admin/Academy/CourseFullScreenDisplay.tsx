import React from 'react';
import {
  GraduationCap,
  Clock,
  Globe,
  Tag,
  BookOpen,
} from 'lucide-react';
import type { AcademyCourse } from '../../../types';

export interface CourseFullScreenDisplayProps {
  course: AcademyCourse;
}

const CourseFullScreenDisplay: React.FC<CourseFullScreenDisplayProps> = ({ course }) => {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-10">
      <div className="mt-2">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
          Course Overview
        </p>
        <h2 className="text-lg font-semibold text-slate-900">{course.title}</h2>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          {(course.bannerImageUrl || course.thumbnailUrl) && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={course.bannerImageUrl || course.thumbnailUrl}
                alt={course.title}
                className="w-full h-56 object-cover"
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{course.title}</h3>
              {course.slug && (
                <p className="text-sm text-slate-500 font-mono mt-1">{course.slug}</p>
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
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {course.longDescription}
                </p>
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
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1">
              <BookOpen size={14} />
              Course Structure
            </h4>
            {course.modules && course.modules.length > 0 ? (
              <div className="space-y-3">
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
            ) : (
              <p className="text-sm text-slate-500">No modules added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseFullScreenDisplay;
