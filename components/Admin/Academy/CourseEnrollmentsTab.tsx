import React from 'react';
import { Users } from 'lucide-react';
import type { AcademyCourse, AcademyEnrollment } from '../../../types';

export interface CourseEnrollmentsTabProps {
  course: AcademyCourse | null;
  enrollments: AcademyEnrollment[];
}

const CourseEnrollmentsTab: React.FC<CourseEnrollmentsTabProps> = ({
  course,
  enrollments,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
        <Users size={16} />
        Enrollments (overview)
      </h2>
      {!course ? (
        <p className="text-sm text-slate-500">
          Select a course to see who is enrolled and their status.
        </p>
      ) : enrollments.length === 0 ? (
        <p className="text-sm text-slate-500">
          No enrollments yet for this course.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Participant ID
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Enrolled
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Last accessed
                </th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(enrollment => (
                <tr key={enrollment.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                    {enrollment.participantUserId}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                        enrollment.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : enrollment.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : enrollment.status === 'failed'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {enrollment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {enrollment.enrolledAt.toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {enrollment.lastAccessedAt
                      ? enrollment.lastAccessedAt.toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollmentsTab;

