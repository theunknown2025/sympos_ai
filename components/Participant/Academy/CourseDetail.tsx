import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GraduationCap, Loader2, AlertCircle, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { AcademyCourse, AcademyEnrollment } from '../../../types';
import { getCourseWithContent } from '../../../services/academyCourseService';
import { enrollInCourse, getEnrollment } from '../../../services/academyEnrollmentService';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [enrollment, setEnrollment] = useState<AcademyEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const detail = await getCourseWithContent(courseId);
        setCourse(detail);
        if (currentUser?.id && detail) {
          const existing = await getEnrollment(detail.id, currentUser.id);
          setEnrollment(existing);
        }
      } catch (e: any) {
        console.error('Error loading course detail:', e);
        setError(e.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId, currentUser?.id]);

  const handleEnroll = async () => {
    if (!course || !currentUser?.id) return;
    try {
      setActionLoading(true);
      const enr = await enrollInCourse(course.id, currentUser.id, 'self');
      setEnrollment(enr);
      navigate(`/jury/academy/courses/${course.id}/learn`);
    } catch (e: any) {
      console.error('Error enrolling in course:', e);
      setError(e.message || 'Failed to enroll in course');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold mb-2">Course not found</h2>
          <p className="text-sm text-slate-600">
            The course you are looking for does not exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const totalLessons =
    course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
            {course.shortDescription && (
              <p className="text-sm text-slate-500 max-w-2xl">
                {course.shortDescription}
              </p>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            {course.longDescription && (
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {course.longDescription}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {course.estimatedDurationMinutes
                  ? `~${course.estimatedDurationMinutes} min total`
                  : 'Self-paced'}
              </span>
              {course.difficulty && (
                <span className="capitalize">
                  Difficulty: {course.difficulty}
                </span>
              )}
              {totalLessons > 0 && (
                <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen size={16} />
              Curriculum
            </h2>
            {(!course.modules || course.modules.length === 0) ? (
              <p className="text-sm text-slate-500">
                The course structure has not been published yet.
              </p>
            ) : (
              <div className="space-y-3">
                {course.modules.map(module => (
                  <div key={module.id} className="border border-slate-200 rounded-lg">
                    <div className="px-3 py-2 bg-slate-50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        {module.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {module.lessons?.length || 0} lessons
                      </span>
                    </div>
                    {module.lessons && module.lessons.length > 0 && (
                      <ul className="px-3 py-2 text-xs text-slate-600 space-y-1">
                        {module.lessons.map(lesson => (
                          <li key={lesson.id} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                            <span>{lesson.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              {enrollment ? 'Continue course' : 'Enroll in this course'}
            </p>
            <p className="text-xs text-slate-600">
              {enrollment
                ? 'You are already enrolled. Resume the course where you left off.'
                : 'Enroll to unlock the full content and track your progress.'}
            </p>
            <button
              onClick={enrollment ? () => navigate(`/jury/academy/courses/${course.id}/learn`) : handleEnroll}
              disabled={actionLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : enrollment ? (
                <>
                  <BookOpen className="w-4 h-4" />
                  Continue learning
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  Enroll now
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseDetail;

