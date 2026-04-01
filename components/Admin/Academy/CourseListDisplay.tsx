import React from 'react';
import { GraduationCap } from 'lucide-react';
import type { AcademyCourse } from '../../../types';
import { DisplayAction, EditAction, DeleteAction, PublishAction } from './actions';

export interface CourseListDisplayProps {
  course: AcademyCourse;
  onDisplay: (course: AcademyCourse) => void;
  onEdit: (course: AcademyCourse) => void;
  onDelete: (course: AcademyCourse) => void;
  onPublish: (course: AcademyCourse) => Promise<void>;
  onUnpublish?: (course: AcademyCourse) => Promise<void>;
}

const CourseListDisplay: React.FC<CourseListDisplayProps> = ({
  course,
  onDisplay,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}) => {
  const statusClass =
    course.status === 'published'
      ? 'bg-green-50 text-green-700 border-green-200'
      : course.status === 'draft'
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3">
        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap size={20} className="text-slate-300" />
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{course.title}</p>
          {course.slug && (
            <p className="text-xs text-slate-500 font-mono">{course.slug}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px]">
        <span className="line-clamp-2">{course.shortDescription || '—'}</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px]">
        <span className="line-clamp-2">{course.longDescription || '—'}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}
        >
          {course.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {course.difficulty || '—'}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {course.estimatedDurationMinutes ? `~${course.estimatedDurationMinutes} min` : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {course.visibility}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px]">
        <span className="line-clamp-1">
          {course.tags && course.tags.length > 0 ? course.tags.join(', ') : '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {course.createdAt.toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-0.5">
          <DisplayAction course={course} onDisplay={onDisplay} />
          <EditAction course={course} onEdit={onEdit} />
          <PublishAction
            course={course}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
          />
          <DeleteAction course={course} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  );
};

export default CourseListDisplay;
