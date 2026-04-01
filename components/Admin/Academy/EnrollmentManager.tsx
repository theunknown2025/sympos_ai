import React, { useEffect, useState } from 'react';
import {
  Users,
  Loader2,
  AlertCircle,
  Database,
  BarChart2,
  User,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { AcademyCourse, AcademyEnrollment } from '../../../types';
import { getUserCourses } from '../../../services/academyCourseService';
import {
  getAllEnrollmentsForOrganizer,
  getCourseEnrollments,
  getCourseCompletionPercentage,
} from '../../../services/academyEnrollmentService';
import { getParticipantNamesByUserIds } from '../../../services/participantProfileService';

type EnrollmentManagerTab = 'database' | 'progress-collective' | 'progress-individual' | 'payment-status';

interface EnrollmentWithCourse extends AcademyEnrollment {
  courseTitle?: string;
  participantName?: string;
  completionPercentage?: number;
}

const EnrollmentManager: React.FC = () => {
  const { currentUser } = useAuth();

  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [courseEnrollments, setCourseEnrollments] = useState<AcademyEnrollment[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [courseCompletionRates, setCourseCompletionRates] = useState<Record<string, number>>({});
  const [individualProgress, setIndividualProgress] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<EnrollmentManagerTab>('database');

  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [currentUser?.id]);

  const loadData = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      setError(null);
      const [userCourses, allEnrollments] = await Promise.all([
        getUserCourses(currentUser.id),
        getAllEnrollmentsForOrganizer(currentUser.id),
      ]);
      setCourses(userCourses);
      const userIds = Array.from(new Set(allEnrollments.map(e => e.participantUserId)));
      const nameMap = await getParticipantNamesByUserIds(userIds);
      setParticipantNames(nameMap);
      const courseMap = new Map(userCourses.map(c => [c.id, c.title]));
      const enriched = allEnrollments.map(e => ({
        ...e,
        courseTitle: courseMap.get(e.courseId) || '—',
        participantName: nameMap[e.participantUserId] || '—',
      }));
      setEnrollments(enriched);
      if (userCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(userCourses[0].id);
      }
    } catch (e: any) {
      console.error('Error loading Enrollment Manager data:', e);
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCourseId) return;
    const loadCourseEnrollments = async () => {
      try {
        const enrols = await getCourseEnrollments(selectedCourseId);
        setCourseEnrollments(enrols);
        const userIds = Array.from(new Set(enrols.map(e => e.participantUserId)));
        const nameMap = await getParticipantNamesByUserIds(userIds);
        setParticipantNames(prev => ({ ...prev, ...nameMap }));
        const rates: Record<string, number> = {};
        for (const e of enrols) {
          try {
            const pct = await getCourseCompletionPercentage(e.id);
            rates[e.id] = pct;
          } catch {
            rates[e.id] = 0;
          }
        }
        setIndividualProgress(rates);
        const avg =
          enrols.length > 0
            ? Object.values(rates).reduce((a, b) => a + b, 0) / enrols.length
            : 0;
        setCourseCompletionRates(prev => ({ ...prev, [selectedCourseId]: avg }));
      } catch (e: any) {
        console.error('Error loading course enrollments:', e);
      }
    };
    loadCourseEnrollments();
  }, [selectedCourseId]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold mb-2">Enrollment Manager</h2>
          <p className="text-sm text-slate-600">
            You need to be signed in to manage enrollments.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'database' as const, label: 'Enrollments Database', icon: Database },
    { id: 'progress-collective' as const, label: 'Progress (Collective)', icon: BarChart2 },
    { id: 'progress-individual' as const, label: 'Progress (Individual)', icon: User },
    { id: 'payment-status' as const, label: 'Payment Status', icon: CreditCard },
  ];

  const collectiveAvg = selectedCourseId
    ? courseCompletionRates[selectedCourseId] ?? 0
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Users className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enrollment Manager</h1>
            <p className="text-sm text-slate-500">
              Database of enrollments, progress tracking, and payment status for paid courses.
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

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 pt-3 pb-0">
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 shrink-0 ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'database' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Database size={16} />
            All Enrollments
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-slate-500">No enrollments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Course</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Participant</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Enrolled</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Last accessed</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{e.courseTitle}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {e.participantName || participantNames[e.participantUserId] || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                            e.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : e.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : e.status === 'failed'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {e.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{e.enrolledAt.toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-slate-500">
                        {e.lastAccessedAt ? e.lastAccessedAt.toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress-collective' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">Select Course</h2>
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                {courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCourseId(c.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 ${
                      selectedCourseId === c.id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <span className="text-sm font-medium truncate">{c.title}</span>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">
                      {enrollments.filter(e => e.courseId === c.id).length} enrolled
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <BarChart2 size={16} />
                Collective Progress
              </h2>
              {selectedCourseId ? (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-800 mb-1">Average completion rate</p>
                    <p className="text-2xl font-bold text-indigo-700">{collectiveAvg.toFixed(1)}%</p>
                    <p className="text-xs text-indigo-600 mt-1">
                      {courseEnrollments.length} enrolled
                      {courseEnrollments.filter(e => e.status === 'completed').length > 0 && (
                        <> • {courseEnrollments.filter(e => e.status === 'completed').length} completed</>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Aggregate completion across all learners in this course.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a course to view collective progress.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'progress-individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">Select Course</h2>
              </div>
              <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
                {courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setSelectedEnrollmentId(null);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${
                      selectedCourseId === c.id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <span className="text-sm font-medium truncate">{c.title}</span>
                  </button>
                ))}
              </div>
              {selectedCourseId && (
                <>
                  <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-semibold text-slate-700">Enrollments</h3>
                  </div>
                  <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-100">
                    {courseEnrollments.map(e => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEnrollmentId(e.id)}
                        className={`w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between ${
                          selectedEnrollmentId === e.id ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <span className="text-xs truncate">
                          {participantNames[e.participantUserId] || '—'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {individualProgress[e.id] !== undefined
                            ? `${individualProgress[e.id].toFixed(0)}%`
                            : '…'}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <User size={16} />
                Individual Progress
              </h2>
              {selectedEnrollmentId ? (
                <div className="space-y-3">
                  {(() => {
                    const e = courseEnrollments.find(x => x.id === selectedEnrollmentId);
                    const pct = individualProgress[selectedEnrollmentId];
                    if (!e) return <p className="text-sm text-slate-500">Loading…</p>;
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">Participant</span>
                          <span className="text-xs">
                            {participantNames[e.participantUserId] || '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">Status</span>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              e.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : e.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            {e.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">Completion</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {pct !== undefined ? `${pct.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                        <div className="pt-2">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: `${pct ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Select a course and an enrollment to view individual progress.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payment-status' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <CreditCard size={16} />
            Payment Status (Paid Courses)
          </h2>
          <div className="p-6 border border-amber-200 bg-amber-50 rounded-lg text-sm text-amber-800">
            <p>
              Payment status for paid courses will appear here once the payment integration is configured.
              Courses can be marked as paid and linked to payment offers in the Payment Manager.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentManager;
