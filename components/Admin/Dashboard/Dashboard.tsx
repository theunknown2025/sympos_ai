import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Users, FileText, CheckCircle, Calendar, DollarSign, 
  ClipboardList, TrendingUp, AlertCircle, Clock, 
  CheckCircle2, Activity, Bell
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserEventsForDashboard } from '../../../services/eventService';
import { getCommitteesForDashboard } from '../../../services/committeeService';
import { getSubmissionsForEvents } from '../../../services/registrationSubmissionService';
import { getDashboardPaymentData } from '../../../services/paymentService';
import { getReviewsForEvents } from '../../../services/reviewService';
import { Event, FormSubmission, PaymentTransaction, ParticipantReview } from '../../../types';

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtext && (
        <p className={`text-xs mt-2 flex items-center gap-1 ${
          subtext.includes('+') ? 'text-green-600' : 
          subtext.includes('-') ? 'text-red-600' : 
          'text-slate-400'
        }`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
          {subtext}
        </p>
      )}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const NotificationCard = ({ type, title, message, time, icon: Icon, color }: any) => (
  <div className="bg-white p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow flex items-start gap-3">
    <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-600 mt-1">{message}</p>
      <p className="text-xs text-slate-400 mt-1">{time}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<FormSubmission[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [paymentCount, setPaymentCount] = useState(0);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [reviews, setReviews] = useState<ParticipantReview[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    closedEvents: 0,
    totalRegistrations: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    acceptedSubmissions: 0,
    rejectedSubmissions: 0,
    totalCommittees: 0,
    totalCommitteeMembers: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    completedRevenue: 0,
    totalReviews: 0,
    completedReviews: 0,
    draftReviews: 0,
  });

  // Chart data
  const [registrationChartData, setRegistrationChartData] = useState<any[]>([]);
  const [submissionStatusData, setSubmissionStatusData] = useState<any[]>([]);
  const [paymentChartData, setPaymentChartData] = useState<any[]>([]);
  const [eventStatusData, setEventStatusData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser?.id) {
      loadDashboardData();
    } else if (currentUser === null) {
      // User is not logged in, stop loading
      setLoading(false);
    }
  }, [currentUser?.id]); // Use id only - prevents reload when Supabase refreshes session on window focus (new object ref, same user)

  const loadDashboardData = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load events, committees, and payment data in parallel (single payment round-trip)
      const [eventsData, committeesData, paymentBundleData] = await Promise.allSettled([
        getUserEventsForDashboard(currentUser.id).catch((err) => {
          console.error('Error loading events:', err);
          return [];
        }),
        getCommitteesForDashboard(currentUser.id).catch((err) => {
          console.error('Error loading committees:', err);
          return [];
        }),
        getDashboardPaymentData(currentUser.id).catch((err) => {
          console.error('Error loading payment data:', err);
          return { paymentCount: 0, transactions: [] as PaymentTransaction[] };
        }),
      ]);

      const events = eventsData.status === 'fulfilled' ? eventsData.value : [];
      const committees = committeesData.status === 'fulfilled' ? committeesData.value : [];
      const paymentBundle =
        paymentBundleData.status === 'fulfilled'
          ? paymentBundleData.value
          : { paymentCount: 0, transactions: [] as PaymentTransaction[] };
      const transactions = paymentBundle.transactions;

      setEvents(events);
      setCommittees(committees);
      setPaymentCount(paymentBundle.paymentCount);
      setTransactions(transactions);

      // Load submissions and reviews for all events in parallel (batched)
      const eventIds = events.map((e) => e.id);

      const [submissionsPack, allReviews] = await Promise.all([
        eventIds.length > 0
          ? getSubmissionsForEvents(eventIds).catch((err) => {
              console.error('Error loading submissions:', err);
              return { submissions: [] as FormSubmission[], formTitlesByFormId: {} as Record<string, string> };
            })
          : Promise.resolve({ submissions: [] as FormSubmission[], formTitlesByFormId: {} as Record<string, string> }),
        eventIds.length > 0
          ? getReviewsForEvents(eventIds).catch((err) => {
              console.error('Error loading reviews:', err);
              return [];
            })
          : Promise.resolve([]),
      ]);

      const { submissions: allSubmissionsRaw, formTitlesByFormId: titlesMap } = submissionsPack;

      // Separate registrations from submissions using form titles (from embed or batch fetch)
      const allSubmissions: FormSubmission[] = [];
      const allRegistrations: FormSubmission[] = [];
      for (const submission of allSubmissionsRaw) {
        const title = titlesMap[submission.formId] || '';
        const titleLower = title.toLowerCase();
        const isSubmissionForm = titleLower.startsWith('sub - ') || 
                                titleLower.startsWith('sub-') || 
                                titleLower.includes('submission') || 
                                titleLower.includes('submit');
        if (isSubmissionForm) {
          allSubmissions.push(submission);
        } else {
          allRegistrations.push(submission);
        }
      }

      setRegistrations(allRegistrations);
      setSubmissions(allSubmissions);
      setReviews(allReviews);

      // Calculate statistics
      const calculatedStats = calculateStatistics(
        events,
        allRegistrations,
        allSubmissions,
        committees,
        paymentBundle.paymentCount,
        transactions,
        allReviews
      );

      // Prepare chart data (pass calculated stats)
      prepareChartData(allRegistrations, allSubmissions, transactions, calculatedStats);

      // Prepare notifications
      prepareNotifications(events, allSubmissions, allRegistrations, transactions);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (
    eventsData: Event[],
    registrationsData: FormSubmission[],
    submissionsData: FormSubmission[],
    committeesData: any[],
    paymentsTotal: number,
    transactionsData: PaymentTransaction[],
    reviewsData: ParticipantReview[]
  ) => {
    // Event statistics
    const totalEvents = eventsData.length;
    const publishedEvents = eventsData.filter(e => e.publishStatus === 'Published').length;
    const draftEvents = eventsData.filter(e => e.publishStatus === 'Draft').length;
    const closedEvents = eventsData.filter(e => e.publishStatus === 'Closed').length;

    // Submission statistics
    const totalSubmissions = submissionsData.length;
    const pendingSubmissions = submissionsData.filter(s => !s.decisionStatus).length;
    const acceptedSubmissions = submissionsData.filter(s => s.decisionStatus === 'accepted').length;
    const rejectedSubmissions = submissionsData.filter(s => s.decisionStatus === 'rejected').length;

    // Committee statistics
    let totalCommitteeMembers = 0;
    for (const committee of committeesData) {
      if (committee.fieldsOfIntervention) {
        for (const field of committee.fieldsOfIntervention) {
          if (field.memberIds) {
            totalCommitteeMembers += field.memberIds.length;
          }
        }
      }
    }

    // Payment statistics
    const totalRevenue = transactionsData
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const pendingRevenue = transactionsData
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const completedRevenue = totalRevenue;

    // Review statistics
    const totalReviews = reviewsData.length;
    const completedReviews = reviewsData.filter(r => r.status === 'completed').length;
    const draftReviews = reviewsData.filter(r => r.status === 'draft').length;

    const statsData = {
      totalEvents,
      publishedEvents,
      draftEvents,
      closedEvents,
      totalRegistrations: registrationsData.length,
      totalSubmissions,
      pendingSubmissions,
      acceptedSubmissions,
      rejectedSubmissions,
      totalCommittees: committeesData.length,
      totalCommitteeMembers,
      totalPayments: paymentsTotal,
      totalRevenue,
      pendingRevenue,
      completedRevenue,
      totalReviews,
      completedReviews,
      draftReviews,
    };
    
    setStats(statsData);
    return statsData;
  };

  const prepareChartData = (
    registrationsData: FormSubmission[],
    submissionsData: FormSubmission[],
    transactionsData: PaymentTransaction[],
    calculatedStats: typeof stats
  ) => {
    const now = new Date();
    const monthBuckets: {
      name: string;
      start: Date;
      registrations: number;
      submissions: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthBuckets.push({
        name: start.toLocaleDateString('en-US', { month: 'short' }),
        start,
        registrations: 0,
        submissions: 0,
      });
    }

    const bucketMonthIndex = (d: Date) => {
      const t = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      return monthBuckets.findIndex((b) => b.start.getTime() === t);
    };

    registrationsData.forEach((reg) => {
      const idx = bucketMonthIndex(new Date(reg.submittedAt));
      if (idx >= 0) monthBuckets[idx].registrations++;
    });
    submissionsData.forEach((sub) => {
      const idx = bucketMonthIndex(new Date(sub.submittedAt));
      if (idx >= 0) monthBuckets[idx].submissions++;
    });

    setRegistrationChartData(
      monthBuckets.map(({ name, registrations, submissions }) => ({
        name,
        registrations,
        submissions,
      }))
    );

    setSubmissionStatusData([
      { name: 'Accepted', value: calculatedStats.acceptedSubmissions, color: '#10b981' },
      { name: 'Rejected', value: calculatedStats.rejectedSubmissions, color: '#ef4444' },
      { name: 'Pending', value: calculatedStats.pendingSubmissions, color: '#f59e0b' },
    ]);

    const paymentMonths = monthBuckets.map((b) => ({ name: b.name, revenue: 0 }));
    transactionsData
      .filter((t) => t.status === 'completed')
      .forEach((trans) => {
        const idx = bucketMonthIndex(new Date(trans.transactionDate));
        if (idx >= 0) paymentMonths[idx].revenue += trans.amount;
      });
    setPaymentChartData(paymentMonths);

    setEventStatusData([
      { name: 'Published', value: calculatedStats.publishedEvents, color: '#10b981' },
      { name: 'Draft', value: calculatedStats.draftEvents, color: '#f59e0b' },
      { name: 'Closed', value: calculatedStats.closedEvents, color: '#6b7280' },
    ]);
  };

  const prepareNotifications = (
    eventsData: Event[],
    submissionsData: FormSubmission[],
    registrationsData: FormSubmission[],
    transactionsData: PaymentTransaction[]
  ) => {
    const notifs: any[] = [];

    // Recent registrations (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRegistrations = registrationsData.filter(r => new Date(r.submittedAt) > oneDayAgo);
    recentRegistrations.slice(0, 3).forEach(reg => {
      notifs.push({
        type: 'registration',
        title: 'New Registration',
        message: `${reg.generalInfo?.name || reg.submittedBy || 'Someone'} registered for ${reg.eventTitle || 'an event'}`,
        time: new Date(reg.submittedAt).toLocaleString(),
        icon: Users,
        color: 'bg-blue-500',
      });
    });

    // Pending submissions
    const pendingSubs = submissionsData.filter(s => !s.decisionStatus).slice(0, 3);
    pendingSubs.forEach(sub => {
      notifs.push({
        type: 'submission',
        title: 'Pending Submission',
        message: `Submission from ${sub.generalInfo?.name || sub.submittedBy || 'Unknown'} needs review`,
        time: new Date(sub.submittedAt).toLocaleString(),
        icon: FileText,
        color: 'bg-amber-500',
      });
    });

    // Upcoming deadlines
    const upcomingDeadlines = eventsData
      .filter(e => {
        if (e.registrationDeadline) {
          const deadline = new Date(e.registrationDeadline);
          const daysUntil = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return daysUntil > 0 && daysUntil <= 7;
        }
        return false;
      })
      .slice(0, 2);
    
    upcomingDeadlines.forEach(event => {
      notifs.push({
        type: 'deadline',
        title: 'Upcoming Deadline',
        message: `Registration deadline for ${event.name} is approaching`,
        time: event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : '',
        icon: Calendar,
        color: 'bg-red-500',
      });
    });

    // Recent payments
    const recentPayments = transactionsData
      .filter(t => t.status === 'completed' && new Date(t.transactionDate) > oneDayAgo)
      .slice(0, 2);
    
    recentPayments.forEach(trans => {
      notifs.push({
        type: 'payment',
        title: 'Payment Received',
        message: `${trans.amount} ${trans.currency} from ${trans.participantName || trans.participantEmail || 'Unknown'}`,
        time: new Date(trans.transactionDate).toLocaleString(),
        icon: DollarSign,
        color: 'bg-green-500',
      });
    });

    // Sort by time (most recent first) and limit to 10
    notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setNotifications(notifs.slice(0, 10));
  };

  const eventProgressCounts = useMemo(() => {
    const regBy = new Map<string, number>();
    for (const r of registrations) {
      regBy.set(r.eventId, (regBy.get(r.eventId) || 0) + 1);
    }
    const subBy = new Map<string, number>();
    for (const s of submissions) {
      subBy.set(s.eventId, (subBy.get(s.eventId) || 0) + 1);
    }
    const revBy = new Map<string, { total: number; completed: number }>();
    for (const r of reviews) {
      const eid = r.eventId;
      if (!revBy.has(eid)) revBy.set(eid, { total: 0, completed: 0 });
      const x = revBy.get(eid)!;
      x.total++;
      if (r.status === 'completed') x.completed++;
    }
    return { regBy, subBy, revBy };
  }, [registrations, submissions, reviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={loadDashboardData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Ensure chart data has at least empty arrays
  const safeRegistrationChartData = registrationChartData.length > 0 ? registrationChartData : [
    { name: 'Jan', registrations: 0, submissions: 0 },
    { name: 'Feb', registrations: 0, submissions: 0 },
    { name: 'Mar', registrations: 0, submissions: 0 },
    { name: 'Apr', registrations: 0, submissions: 0 },
    { name: 'May', registrations: 0, submissions: 0 },
    { name: 'Jun', registrations: 0, submissions: 0 },
  ];
  
  const safeSubmissionStatusData = submissionStatusData.length > 0 ? submissionStatusData : [
    { name: 'Accepted', value: 0, color: '#10b981' },
    { name: 'Rejected', value: 0, color: '#ef4444' },
    { name: 'Pending', value: 0, color: '#f59e0b' },
  ];
  
  const safePaymentChartData = paymentChartData.length > 0 ? paymentChartData : safeRegistrationChartData.map(m => ({ ...m, revenue: 0 }));
  
  const safeEventStatusData = eventStatusData.length > 0 ? eventStatusData : [
    { name: 'Published', value: 0, color: '#10b981' },
    { name: 'Draft', value: 0, color: '#f59e0b' },
    { name: 'Closed', value: 0, color: '#6b7280' },
  ];

  return (
    <div className="h-full w-full overflow-auto">
      <div className="max-w-[1920px] mx-auto space-y-6 animate-fade-in p-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Organizer Dashboard</h1>
          <p className="text-slate-500 mt-2">Comprehensive overview of all your events, registrations, submissions, and activities</p>
        </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Events" 
          value={stats.totalEvents}
          subtext={`${stats.publishedEvents} Published, ${stats.draftEvents} Draft`}
          icon={Calendar} 
          color="bg-blue-500"
          trend={stats.publishedEvents > 0 ? 'up' : undefined}
        />
        <StatCard 
          title="Total Registrations" 
          value={stats.totalRegistrations}
          subtext={safeRegistrationChartData.length > 0 && safeRegistrationChartData[safeRegistrationChartData.length - 1]?.registrations > 0 ? 
            `+${safeRegistrationChartData[safeRegistrationChartData.length - 1]?.registrations || 0} this month` : 
            'No recent activity'}
          icon={Users} 
          color="bg-indigo-500"
          trend={safeRegistrationChartData.length > 0 && safeRegistrationChartData[safeRegistrationChartData.length - 1]?.registrations > 0 ? 'up' : undefined}
        />
        <StatCard 
          title="Submissions Received" 
          value={stats.totalSubmissions}
          subtext={`${stats.pendingSubmissions} Pending Review`}
          icon={FileText} 
          color="bg-purple-500"
        />
        <StatCard 
          title="Reviews Completed" 
          value={stats.completedReviews}
          subtext={`${stats.totalReviews > 0 ? Math.round((stats.completedReviews / stats.totalReviews) * 100) : 0}% Completion Rate`}
          icon={CheckCircle} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Committees" 
          value={stats.totalCommittees}
          subtext={`${stats.totalCommitteeMembers} Total Members`}
          icon={ClipboardList} 
          color="bg-cyan-500"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtext={`$${stats.pendingRevenue.toLocaleString()} Pending`}
          icon={DollarSign} 
          color="bg-green-500"
        />
        <StatCard 
          title="Payment Methods" 
          value={stats.totalPayments}
          subtext={`${transactions.filter(t => t.status === 'completed').length} Completed Transactions`}
          icon={Activity} 
          color="bg-teal-500"
        />
        <StatCard 
          title="Submission Status" 
          value={`${stats.acceptedSubmissions}/${stats.totalSubmissions}`}
          subtext={`${stats.rejectedSubmissions} Rejected, ${stats.pendingSubmissions} Pending`}
          icon={CheckCircle2} 
          color="bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration & Submission Growth */}
        <div key="chart-registration-growth" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Registration & Submission Growth</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeRegistrationChartData}>
                <defs>
                  <linearGradient id="dashboard-colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="dashboard-colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Area 
                  key="registrations"
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#dashboard-colorRegistrations)"
                  strokeWidth={2}
                />
                <Area 
                  key="submissions"
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#dashboard-colorSubmissions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Submission Status Distribution */}
        <div key="chart-submission-status" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Submission Status</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeSubmissionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {safeSubmissionStatusData.map((entry) => (
                    <Cell key={`submission-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Revenue */}
        <div key="chart-payment-revenue" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safePaymentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                />
                <Bar key="revenue" dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Status */}
        <div key="chart-event-status" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Event Status Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeEventStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {safeEventStatusData.map((entry) => (
                    <Cell key={`event-status-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Notifications & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications
            </h3>
            <span className="text-sm text-slate-500">{notifications.length} notifications</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif, index) => (
                <NotificationCard
                  key={`notif-${notif.type}-${notif.time}-${index}`}
                  type={notif.type}
                  title={notif.title}
                  message={notif.message}
                  time={notif.time}
                  icon={notif.icon}
                  color={notif.color}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No recent notifications</p>
            )}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Quick Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Accepted Submissions</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stats.acceptedSubmissions}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-700">Pending Reviews</span>
              </div>
              <span className="text-sm font-bold text-amber-600">{stats.draftReviews}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-slate-700">Completed Revenue</span>
              </div>
              <span className="text-sm font-bold text-green-600">${stats.completedRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">Committee Members</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{stats.totalCommitteeMembers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-slate-700">Pending Submissions</span>
              </div>
              <span className="text-sm font-bold text-red-600">{stats.pendingSubmissions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Progress Overview */}
      {events.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Event Progress Overview</h3>
          <div className="space-y-4">
            {events.slice(0, 5).map(event => {
              const eventRegistrations = eventProgressCounts.regBy.get(event.id) || 0;
              const eventSubmissions = eventProgressCounts.subBy.get(event.id) || 0;
              const rev = eventProgressCounts.revBy.get(event.id);
              const completedEventReviews = rev?.completed ?? 0;
              const eventReviewsTotal = rev?.total ?? 0;

              return (
                <div key={event.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-800">{event.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {event.publishStatus || 'Draft'} • {event.eventType || 'Event'} • {event.eventFormat || 'Format'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.publishStatus === 'Published' ? 'bg-green-100 text-green-700' :
                      event.publishStatus === 'Closed' ? 'bg-gray-100 text-gray-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {event.publishStatus || 'Draft'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-500">Registrations</p>
                      <p className="text-lg font-bold text-slate-800">{eventRegistrations}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Submissions</p>
                      <p className="text-lg font-bold text-slate-800">{eventSubmissions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Reviews</p>
                      <p className="text-lg font-bold text-slate-800">
                        {completedEventReviews}/{eventReviewsTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Committees</p>
                      <p className="text-lg font-bold text-slate-800">
                        {event.committeeIds?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
