import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type {
  AcademyCourse,
  AcademyLesson,
  AcademyModule,
  AcademyEnrollment,
  AcademyLessonProgress,
  AcademyQuiz,
} from '../../../types';
import { getCourseWithContent } from '../../../services/academyCourseService';
import {
  enrollInCourse,
  getEnrollment,
  upsertLessonProgress,
  getLessonProgressForEnrollment,
  getCourseCompletionPercentage,
  updateEnrollmentStatus,
} from '../../../services/academyEnrollmentService';
import { getQuizForLesson, submitQuizAttempt } from '../../../services/academyQuizService';
import { issueCertificateForEnrollment } from '../../../services/academyCertificateService';

const CoursePlayer: React.FC = () => {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [enrollment, setEnrollment] = useState<AcademyEnrollment | null>(null);
  const [progress, setProgress] = useState<AcademyLessonProgress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [quiz, setQuiz] = useState<AcademyQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[] | boolean>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [completionPercent, setCompletionPercent] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!courseId || !currentUser?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const detail = await getCourseWithContent(courseId);
        if (!detail) {
          setCourse(null);
          return;
        }
        setCourse(detail);

        let enr = await getEnrollment(detail.id, currentUser.id);
        if (!enr) {
          enr = await enrollInCourse(detail.id, currentUser.id, 'self');
        }
        setEnrollment(enr);

        const lessonProgress = await getLessonProgressForEnrollment(enr.id);
        setProgress(lessonProgress);

        const percentage = await getCourseCompletionPercentage(enr.id);
        setCompletionPercent(percentage);

        const firstLesson = getFirstLesson(detail.modules || []);
        setSelectedLesson(firstLesson || null);
        if (firstLesson?.hasQuiz) {
          const q = await getQuizForLesson(firstLesson.id);
          setQuiz(q);
          setQuizAnswers({});
        } else {
          setQuiz(null);
        }
      } catch (e: any) {
        console.error('Error initializing course player:', e);
        setError(e.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [courseId, currentUser?.id]);

  const getFirstLesson = (modules: AcademyModule[]): AcademyLesson | null => {
    for (const m of modules) {
      if (m.lessons && m.lessons.length > 0) {
        return m.lessons[0];
      }
    }
    return null;
  };

  const handleSelectLesson = async (lesson: AcademyLesson) => {
    setSelectedLesson(lesson);
    setError(null);

    if (!enrollment) return;

    try {
      await upsertLessonProgress(enrollment.id, lesson.id, isLessonCompleted(lesson.id));
      if (lesson.hasQuiz) {
        const q = await getQuizForLesson(lesson.id);
        setQuiz(q);
        setQuizAnswers({});
      } else {
        setQuiz(null);
      }
    } catch (e: any) {
      console.error('Error selecting lesson:', e);
      setError(e.message || 'Failed to load lesson');
    }
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return progress.some(p => p.lessonId === lessonId && p.isCompleted);
  };

  const markLessonCompleted = async () => {
    if (!selectedLesson || !enrollment) return;
    try {
      const updated = await upsertLessonProgress(enrollment.id, selectedLesson.id, true);
      setProgress(prev => {
        const existingIndex = prev.findIndex(p => p.id === updated.id);
        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = updated;
          return copy;
        }
        return [...prev, updated];
      });
      const percentage = await getCourseCompletionPercentage(enrollment.id);
      setCompletionPercent(percentage);

      if (percentage >= 100 && enrollment.status !== 'completed') {
        const completedEnrollment = await updateEnrollmentStatus(enrollment.id, 'completed');
        setEnrollment(completedEnrollment);
        await issueCertificateForEnrollment({ enrollmentId: completedEnrollment.id });
      }
    } catch (e: any) {
      console.error('Error marking lesson as completed:', e);
      setError(e.message || 'Failed to update lesson progress');
    }
  };

  const handleAnswerChange = (questionId: string, value: string[] | boolean) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !enrollment || !selectedLesson) return;
    try {
      setSubmittingQuiz(true);
      setError(null);
      const attempt = await submitQuizAttempt({
        quizId: quiz.id,
        enrollmentId: enrollment.id,
        answers: quizAnswers,
      });

      if (attempt.passed) {
        await markLessonCompleted();
      }
    } catch (e: any) {
      console.error('Error submitting quiz:', e);
      setError(e.message || 'Failed to submit quiz');
    } finally {
      setSubmittingQuiz(false);
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
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
            <p className="text-sm text-slate-500">
              {completionPercent !== null
                ? `Progress: ${completionPercent.toFixed(0)}%`
                : 'Track your progress as you learn.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/jury/academy')}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          Back to Academy
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar navigation */}
        <aside className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h2 className="text-xs font-semibold text-slate-700 flex items-center gap-2 mb-1">
            <BookOpen size={14} />
            Course Outline
          </h2>
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {course.modules?.map(module => (
              <div key={module.id} className="border border-slate-200 rounded-lg">
                <div className="px-3 py-2 bg-slate-50 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-800">
                    {module.title}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {module.lessons?.length || 0} lessons
                  </span>
                </div>
                {module.lessons && module.lessons.length > 0 && (
                  <div className="px-2 py-1">
                    {module.lessons.map(lesson => {
                      const completed = isLessonCompleted(lesson.id);
                      const isActive = selectedLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleSelectLesson(lesson)}
                          className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[11px] text-left ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {completed ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <span className="w-3 h-3 rounded-full border border-slate-300" />
                            )}
                            <span className="line-clamp-1">{lesson.title}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Lesson content & quiz */}
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[220px]">
            {selectedLesson ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <BookOpen size={16} />
                    {selectedLesson.title}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} />
                      {selectedLesson.estimatedDurationMinutes
                        ? `~${selectedLesson.estimatedDurationMinutes} min`
                        : 'Short lesson'}
                    </span>
                    {isLessonCompleted(selectedLesson.id) && (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={12} />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Content type: {selectedLesson.contentType}
                </p>
                <div className="text-sm text-slate-700 space-y-2">
                  {selectedLesson.contentType === 'article' && selectedLesson.contentRichText && (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
                      {JSON.stringify(selectedLesson.contentRichText, null, 2)}
                    </pre>
                  )}
                  {selectedLesson.contentType === 'video' && selectedLesson.videoUrl && (
                    <a
                      href={selectedLesson.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Open video
                    </a>
                  )}
                  {selectedLesson.contentType === 'link' && selectedLesson.externalLink && (
                    <a
                      href={selectedLesson.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Open resource
                    </a>
                  )}
                  {selectedLesson.attachmentUrls && selectedLesson.attachmentUrls.length > 0 && (
                    <ul className="text-xs text-slate-600 list-disc list-inside">
                      {selectedLesson.attachmentUrls.map((url, idx) => (
                        <li key={idx}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            Attachment {idx + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!selectedLesson.contentRichText &&
                    !selectedLesson.videoUrl &&
                    !selectedLesson.externalLink &&
                    (!selectedLesson.attachmentUrls ||
                      selectedLesson.attachmentUrls.length === 0) && (
                      <p className="text-xs text-slate-500">
                        The detailed content for this lesson has not been added yet.
                      </p>
                    )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Select a lesson from the left to start learning.
              </p>
            )}
          </div>

          {/* Quiz */}
          {quiz && selectedLesson && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Lesson Quiz – {quiz.title}
                </h2>
                {quiz.passingScore > 0 && (
                  <p className="text-[11px] text-slate-500">
                    Passing score: {quiz.passingScore.toFixed(0)}%
                  </p>
                )}
              </div>
              {!quiz.questions || quiz.questions.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Questions have not been added to this quiz yet.
                </p>
              ) : (
                <form
                  className="space-y-4 text-xs text-slate-700"
                  onSubmit={e => {
                    e.preventDefault();
                    handleSubmitQuiz();
                  }}
                >
                  {quiz.questions.map(question => {
                    const currentAnswer = quizAnswers[question.id];
                    if (question.questionType === 'true_false') {
                      const value = typeof currentAnswer === 'boolean' ? currentAnswer : false;
                      return (
                        <div key={question.id} className="space-y-1">
                          <p className="font-medium">{question.questionText}</p>
                          <div className="flex gap-4 mt-1">
                            <label className="inline-flex items-center gap-1">
                              <input
                                type="radio"
                                name={question.id}
                                checked={value === true}
                                onChange={() => handleAnswerChange(question.id, true)}
                              />
                              <span>True</span>
                            </label>
                            <label className="inline-flex items-center gap-1">
                              <input
                                type="radio"
                                name={question.id}
                                checked={value === false}
                                onChange={() => handleAnswerChange(question.id, false)}
                              />
                              <span>False</span>
                            </label>
                          </div>
                        </div>
                      );
                    }

                    const selected = Array.isArray(currentAnswer)
                      ? currentAnswer
                      : [];
                    const multiple = question.questionType === 'multiple_choice';
                    return (
                      <div key={question.id} className="space-y-1">
                        <p className="font-medium">{question.questionText}</p>
                        <div className="mt-1 space-y-1">
                          {question.options?.map(option => (
                            <label
                              key={option.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type={multiple ? 'checkbox' : 'radio'}
                                name={question.id}
                                checked={selected.includes(option.id)}
                                onChange={e => {
                                  if (multiple) {
                                    if (e.target.checked) {
                                      handleAnswerChange(question.id, [
                                        ...selected,
                                        option.id,
                                      ]);
                                    } else {
                                      handleAnswerChange(
                                        question.id,
                                        selected.filter(id => id !== option.id)
                                      );
                                    }
                                  } else {
                                    handleAnswerChange(question.id, [option.id]);
                                  }
                                }}
                              />
                              <span>{option.optionText}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="submit"
                    disabled={submittingQuiz}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingQuiz ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>Submit quiz</>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Mark complete */}
          {selectedLesson && (
            <div className="flex justify-end">
              <button
                onClick={markLessonCompleted}
                disabled={isLessonCompleted(selectedLesson.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLessonCompleted(selectedLesson.id) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Lesson completed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mark lesson as completed
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CoursePlayer;

