import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, AlertCircle, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { AcademyCourse, AcademyEnrollment, AcademyCertificate } from '../../../types';
import { getPublishedCoursesForParticipant } from '../../../services/academyCourseService';
import { getParticipantEnrollments } from '../../../services/academyEnrollmentService';
import { getCertificatesForParticipant } from '../../../services/academyCertificateService';

const AcademyHome: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [enrollments, setEnrollments] = useState<AcademyEnrollment[]>([]);
  const [certificates, setCertificates] = useState<AcademyCertificate[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [availableCourses, myEnrollments, myCertificates] = await Promise.all([
          getPublishedCoursesForParticipant(currentUser.id, {}),
          getParticipantEnrollments(currentUser.id),
          getCertificatesForParticipant(currentUser.id),
        ]);
        setCourses(availableCourses);
        setEnrollments(myEnrollments);
        setCertificates(myCertificates);
      } catch (e: any) {
        console.error('Error loading Academy home data:', e);
        setError(e.message || 'Failed to load Academy data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold mb-2">Academy – LMS</h2>
          <p className="text-sm text-slate-600">
            Sign in as a participant to access your learning space.
          </p>
        </div>
      </div>
    );
  }

  const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

  const myCourses = courses.filter(c => enrolledCourseIds.has(c.id));
  const availableCourses = courses.filter(c => !enrolledCourseIds.has(c.id));

  const certificateByCourseId = new Map<string, AcademyCertificate>();
  certificates.forEach(c => {
    if (!certificateByCourseId.has(c.courseId)) {
      certificateByCourseId.set(c.courseId, c);
    }
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Academy – My Learning</h1>
            <p className="text-sm text-slate-500">
              Browse courses, continue your learning path, and access your certificates.
            </p>
          </div>
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
      ) : (
        <div className="space-y-6">
          {/* My Courses */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen size={16} />
                My Courses
              </h2>
            </div>
            {myCourses.length === 0 ? (
              <p className="text-sm text-slate-500">
                You are not enrolled in any courses yet. Browse the catalog below to get
                started.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {myCourses.map(course => {
                  const enrollment = enrollments.find(e => e.courseId === course.id);
                  const certificate = certificateByCourseId.get(course.id);
                  return (
                    <button
                      key={course.id}
                      onClick={() =>
                        navigate(`/jury/academy/courses/${course.id}/learn`)
                      }
                      className="text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 transition-colors flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                          {course.title}
                        </p>
                        {certificate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <CheckCircle2 size={12} />
                            Certified
                          </span>
                        )}
                      </div>
                      {course.shortDescription && (
                        <p className="text-xs text-slate-600 line-clamp-3">
                          {course.shortDescription}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} />
                          {course.estimatedDurationMinutes
                            ? `~${course.estimatedDurationMinutes} min`
                            : 'Self-paced'}
                        </span>
                        {enrollment && (
                          <span className="capitalize">
                            {enrollment.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Catalog */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen size={16} />
                Course Catalog
              </h2>
            </div>
            {courses.length === 0 ? (
              <p className="text-sm text-slate-500">
                No courses are available yet. Please check again later.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map(course => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  return (
                    <div
                      key={course.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2"
                    >
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                        {course.title}
                      </p>
                      {course.shortDescription && (
                        <p className="text-xs text-slate-600 line-clamp-3">
                          {course.shortDescription}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} />
                          {course.estimatedDurationMinutes
                            ? `~${course.estimatedDurationMinutes} min`
                            : 'Self-paced'}
                        </span>
                        {course.difficulty && (
                          <span className="capitalize">{course.difficulty}</span>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/jury/academy/courses/${course.id}`)
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => {
                            navigate(
                              isEnrolled
                                ? `/jury/academy/courses/${course.id}/learn`
                                : `/jury/academy/courses/${course.id}`
                            );
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[12px] rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          {isEnrolled ? 'Continue' : 'Enroll'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Certificates */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={16} />
                Certificates
              </h2>
            </div>
            {certificates.length === 0 ? (
              <p className="text-sm text-slate-500">
                You don’t have any Academy certificates yet. Complete courses to earn
                them.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {certificates.map(cert => {
                  const course = courses.find(c => c.id === cert.courseId);
                  return (
                    <div
                      key={cert.id}
                      className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 text-xs text-emerald-900 flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span className="font-semibold">
                          {course?.title || 'Academy Course'}
                        </span>
                      </div>
                      <p>
                        Issued:{' '}
                        {cert.issuedAt.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      {cert.verificationCode && (
                        <p className="font-mono text-[11px]">
                          Code: {cert.verificationCode}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AcademyHome;

