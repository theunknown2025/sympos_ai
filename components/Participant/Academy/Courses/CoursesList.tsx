import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Grid3x3, List, Loader2, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import type { AcademyCourse, AcademyEnrollment } from '../../../../types';
import { getPublishedCoursesForParticipant } from '../../../../services/academyCourseService';
import { getParticipantEnrollments } from '../../../../services/academyEnrollmentService';

type ViewMode = 'cards' | 'rows';

const CoursesList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [enrollments, setEnrollments] = useState<AcademyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [availableCourses, myEnrollments] = await Promise.all([
          getPublishedCoursesForParticipant(currentUser.id, {}),
          getParticipantEnrollments(currentUser.id),
        ]);
        setCourses(availableCourses);
        setEnrollments(myEnrollments);
      } catch (e: any) {
        console.error('Error loading courses:', e);
        setError(e.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser?.id]);

  const filteredCourses = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return courses;
    return courses.filter(course => {
      const tags = course.tags?.join(' ') || '';
      return (
        course.title.toLowerCase().includes(search) ||
        (course.shortDescription || '').toLowerCase().includes(search) ||
        (course.longDescription || '').toLowerCase().includes(search) ||
        tags.toLowerCase().includes(search)
      );
    });
  }, [courses, query]);

  const enrollmentByCourseId = useMemo(() => {
    return new Map(enrollments.map(e => [e.courseId, e]));
  }, [enrollments]);

  const handleOpenCourse = (courseId: string) => {
    navigate(`/jury/academy/courses/${courseId}`);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold mb-2">Academy – Courses</h2>
          <p className="text-sm text-slate-600">
            Sign in as a participant to access published courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academy Courses</h1>
          <p className="text-sm text-slate-500">
            Search and explore the published courses from organizers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === 'cards'
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Card view"
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('rows')}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === 'rows'
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Row view"
          >
            <List size={16} />
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No courses match your search.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCourses.map(course => {
            const enrollment = enrollmentByCourseId.get(course.id);
            return (
              <button
                key={course.id}
                onClick={() => handleOpenCourse(course.id)}
                className="text-left bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                {(course.bannerImageUrl || course.thumbnailUrl) && (
                  <img
                    src={course.bannerImageUrl || course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {course.title}
                  </p>
                  {course.shortDescription && (
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {course.shortDescription}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {course.estimatedDurationMinutes
                      ? `~${course.estimatedDurationMinutes} min`
                      : 'Self-paced'}
                  </span>
                  {enrollment && (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <BookOpen size={11} />
                      Enrolled
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCourses.map(course => {
                const enrollment = enrollmentByCourseId.get(course.id);
                return (
                  <tr key={course.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{course.title}</p>
                        {course.shortDescription && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {course.shortDescription}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {course.estimatedDurationMinutes
                        ? `~${course.estimatedDurationMinutes} min`
                        : 'Self-paced'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {enrollment ? 'Enrolled' : 'Not enrolled'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenCourse(course.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CoursesList;
