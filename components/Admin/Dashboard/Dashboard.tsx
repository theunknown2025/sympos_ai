import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';
import { Users, FileText, CheckCircle, Calendar } from 'lucide-react';
import { MOCK_REGISTRATIONS_DATA } from '../../../constants';

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtext && <p className={`text-xs mt-2 ${subtext.includes('+') ? 'text-green-600' : 'text-slate-400'}`}>{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Organizer Dashboard</h1>
        <p className="text-slate-500 mt-2">Overview of "International Conference on Future Tech 2024"</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Registrations" 
          value="482" 
          subtext="+12% from last week" 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Submissions Received" 
          value="145" 
          subtext="23 Pending Review" 
          icon={FileText} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Reviews Completed" 
          value="89" 
          subtext="62% Completion Rate" 
          icon={CheckCircle} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Days Until Event" 
          value="42" 
          subtext="June 15, 2024" 
          icon={Calendar} 
          color="bg-amber-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Registration Growth</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_REGISTRATIONS_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Line 
                  type="monotone" 
                  dataKey="attendees" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{r: 4, strokeWidth: 2}} 
                  activeDot={{r: 6}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart / List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Submission Tracks</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical"
                data={[
                  { name: 'AI & ML', value: 45 },
                  { name: 'Bioinfo', value: 30 },
                  { name: 'Energy', value: 25 },
                  { name: 'Ethics', value: 15 },
                  { name: 'Robotics', value: 30 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: '#475569'}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="p-4 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            + Create New Announcement
          </button>
          <button className="p-4 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            + Invite Jury Member
          </button>
          <button className="p-4 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            Download Attendee List (CSV)
          </button>
      </div>
    </div>
  );
};

export default Dashboard;
