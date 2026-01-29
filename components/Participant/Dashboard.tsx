import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getJuryMemberProfile, getJuryMemberInvitations, getJuryMemberEvents } from '../../services/juryMemberService';
import { JuryMember, CommitteeInvitation, InvitationStatus, EventAttendance } from '../../types';
import { useNavigate } from 'react-router-dom';
import { getRoutePath } from '../../routes';
import { ViewState } from '../../types';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<JuryMember | null>(null);
  const [invitations, setInvitations] = useState<CommitteeInvitation[]>([]);
  const [events, setEvents] = useState<EventAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');

      // Load profile first to get jury member ID
      const profileData = await getJuryMemberProfile(currentUser.id);
      setProfile(profileData);

      if (profileData) {
        // Load invitations and events
        const [invitationsData, eventsData] = await Promise.all([
          getJuryMemberInvitations(profileData.id),
          getJuryMemberEvents(profileData.id),
        ]);
        setInvitations(invitationsData);
        setEvents(eventsData);
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === InvitationStatus.PENDING
  );
  const acceptedInvitations = invitations.filter(
    (inv) => inv.status === InvitationStatus.ACCEPTED
  );
  const confirmedEvents = events.filter((ev) => ev.attendanceConfirmed);

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <User size={32} className="text-indigo-600" />
          Participant Dashboard
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your profile, invitations, and event attendance</p>
      </header>

      {/* Profile Status */}
      {!profile ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Profile Not Created</h3>
              <p className="text-sm text-amber-700 mb-4">
                Please create your profile to start receiving invitations and managing events.
              </p>
              <button
                onClick={() => navigate(getRoutePath(ViewState.JURY_PROFILE))}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {profile.title ? `${profile.title} ` : ''}
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{profile.email}</p>
              {profile.affiliation?.institution && (
                <p className="text-sm text-slate-600 mt-1">{profile.affiliation.institution}</p>
              )}
            </div>
            <button
              onClick={() => navigate(getRoutePath(ViewState.JURY_PROFILE))}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Pending Invitations</h3>
            <Clock className="text-amber-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingInvitations.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Accepted Invitations</h3>
            <CheckCircle2 className="text-emerald-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900">{acceptedInvitations.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Confirmed Events</h3>
            <Calendar className="text-indigo-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900">{confirmedEvents.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => navigate(getRoutePath(ViewState.JURY_PROFILE))}
          className="bg-white border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors text-left"
        >
          <User className="text-indigo-600 mb-3" size={24} />
          <h3 className="font-semibold text-slate-900 mb-1">Manage Profile</h3>
          <p className="text-sm text-slate-500">Update your personal and professional information</p>
        </button>

        <button
          onClick={() => navigate(getRoutePath(ViewState.JURY_INVITATIONS))}
          className="bg-white border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors text-left"
        >
          <Mail className="text-indigo-600 mb-3" size={24} />
          <h3 className="font-semibold text-slate-900 mb-1">View Invitations</h3>
          <p className="text-sm text-slate-500">
            {pendingInvitations.length > 0
              ? `${pendingInvitations.length} pending invitation${pendingInvitations.length !== 1 ? 's' : ''}`
              : 'View and respond to committee invitations'}
          </p>
        </button>

        <button
          onClick={() => navigate(getRoutePath(ViewState.JURY_EVENTS))}
          className="bg-white border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors text-left"
        >
          <Calendar className="text-indigo-600 mb-3" size={24} />
          <h3 className="font-semibold text-slate-900 mb-1">Browse Events</h3>
          <p className="text-sm text-slate-500">View events and confirm your attendance</p>
        </button>
      </div>

      {/* Recent Activity */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Invitations</h2>
          <div className="space-y-3">
            {pendingInvitations.slice(0, 3).map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900">{invitation.committeeName}</p>
                  {invitation.fieldOfInterventionName && (
                    <p className="text-sm text-slate-500">Field: {invitation.fieldOfInterventionName}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    Received: {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => navigate(getRoutePath(ViewState.JURY_INVITATIONS))}
                  className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Respond
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

