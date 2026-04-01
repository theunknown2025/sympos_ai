import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, BookOpen, Clock, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import type { AcademyCourse, AcademyEnrollment } from '../../../../types';
import { getCourseWithContent } from '../../../../services/academyCourseService';
import {
  enrollInCourse,
  getEnrollment,
  getCourseEnrollments,
  updateEnrollmentStatus,
  withdrawEnrollment,
} from '../../../../services/academyEnrollmentService';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [enrollment, setEnrollment] = useState<AcademyEnrollment | null>(null);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
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
        if (detail) {
          const enrollments = await getCourseEnrollments(detail.id);
          setEnrollmentCount(enrollments.length);
        }
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

  const hasEnrollment = !!enrollment && enrollment.status !== 'withdrawn';

  const totalLessons = useMemo(() => {
    return (
      course?.modules?.reduce((sum, m) => {
        const direct = m.lessons?.length || 0;
        const sections = m.sections?.reduce((s, sec) => s + (sec.lessons?.length || 0), 0) || 0;
        return sum + direct + sections;
      }, 0) || 0
    );
  }, [course]);

  const handleEnroll = async () => {
    if (!course || !currentUser?.id) return;
    try {
      setActionLoading(true);
      if (enrollment && enrollment.status === 'withdrawn') {
        const updated = await updateEnrollmentStatus(enrollment.id, 'in_progress');
        setEnrollment(updated);
      } else {
        const enr = await enrollInCourse(course.id, currentUser.id, 'self');
        setEnrollment(enr);
      }
    } catch (e: any) {
      console.error('Error enrolling in course:', e);
      setError(e.message || 'Failed to enroll in course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDropout = async () => {
    if (!enrollment) return;
    try {
      setActionLoading(true);
      const updated = await withdrawEnrollment(enrollment.id);
      setEnrollment(updated);
    } catch (e: any) {
      console.error('Error dropping out:', e);
      setError(e.message || 'Failed to drop out');
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
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
            <p className="text-xs text-slate-400 mt-1">
              {enrollmentCount} enrollment{enrollmentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnroll}
            disabled={actionLoading || hasEnrollment}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                Enroll
              </>
            )}
          </button>
          {hasEnrollment && (
            <button
              onClick={handleDropout}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dropout
            </button>
          )}
          {hasEnrollment && (
            <button
              onClick={() => navigate(`/jury/academy/courses/${course.id}/learn`)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-100"
            >
              Continue
            </button>
          )}
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
          {(course.bannerImageUrl || course.thumbnailUrl) && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={course.bannerImageUrl || course.thumbnailUrl}
                alt={course.title}
                className="w-full h-56 object-cover"
              />
            </div>
          )}
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
                <span className="capitalize">Difficulty: {course.difficulty}</span>
              )}
              {totalLessons > 0 && (
                <span>
                  {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                </span>
              )}
              <span>
                {enrollmentCount} enrollment{enrollmentCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen size={16} />
              Course Structure
            </h2>
            {(!course.modules || course.modules.length === 0) ? (
              <p className="text-sm text-slate-500">
                The course structure has not been published yet.
              </p>
            ) : (
              <div className="space-y-3">
                {course.modules.map(module => (
                  <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        {module.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {(module.lessons?.length || 0) +
                          (module.sections?.reduce((sum, sec) => sum + (sec.lessons?.length || 0), 0) || 0)}{' '}
                        lessons
                      </span>
                    </div>

                    {module.sections && module.sections.length > 0 && (
                      <div className="px-3 py-2 space-y-2">
                        {module.sections.map(section => (
                          <div key={section.id} className="border border-slate-200 rounded-md p-2">
                            <p className="text-xs font-semibold text-slate-700">
                              {section.title}
                            </p>
                            {section.lessons && section.lessons.length > 0 && (
                              <ul className="mt-2 text-xs text-slate-600 space-y-1">
                                {section.lessons.map(lesson => (
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
              {hasEnrollment ? 'You are enrolled' : 'Enroll to start learning'}
            </p>
            <p className="text-xs text-slate-600">
              {hasEnrollment
                ? 'Access the course content, complete lessons, and track progress.'
                : 'Enroll to unlock the full content and track your progress.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseDetail;
