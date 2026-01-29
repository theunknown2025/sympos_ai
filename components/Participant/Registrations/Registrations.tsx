import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Trash2, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getRegistrationSubmissions, deleteFormSubmission } from '../../../services/registrationSubmissionService';
import { FormSubmission, DecisionStatus } from '../../../types';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { getJuryMemberProfile } from '../../../services/juryMemberService';
import EditRegistration from './EditRegistration';
import PreviewRegistration from './PreviewRegistration';

const Registrations: React.FC = () => {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<FormSubmission | null>(null);
  const [previewRegistration, setPreviewRegistration] = useState<FormSubmission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      loadRegistrations();
    }
  }, [currentUser]);

  const getStatusBadge = (status?: DecisionStatus) => {
    switch (status) {
      case 'accepted':
        return {
          label: 'Accepted',
          icon: CheckCircle2,
          className: 'bg-emerald-100 text-emerald-700',
        };
      case 'reserved':
        return {
          label: 'Reserved',
          icon: Clock,
          className: 'bg-amber-100 text-amber-700',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          icon: XCircle,
          className: 'bg-red-100 text-red-700',
        };
      default:
        return {
          label: 'Pending',
          icon: AlertCircle,
          className: 'bg-slate-100 text-slate-600',
        };
    }
  };

  const loadRegistrations = async () => {
    if (!currentUser?.email || !currentUser?.id) return;

    try {
      setLoading(true);
      setError('');
      
      // Get jury member profile to get their email
      let juryMemberEmail: string | undefined;
      try {
        const juryProfile = await getJuryMemberProfile(currentUser.id);
        if (juryProfile) {
          juryMemberEmail = juryProfile.email;
        }
      } catch (err) {
        console.error('Error loading jury member profile:', err);
      }
      
      // Load all registration submissions for the current user by email(s)
      const allSubmissions = await getRegistrationSubmissions(
        currentUser.email,
        currentUser.id,
        juryMemberEmail
      );
      
      // Filter to only registration forms (not submission forms)
      // We'll check the form title to determine if it's a registration or submission
      const registrationSubmissions = [];
      for (const submission of allSubmissions) {
        try {
          const form = await getRegistrationForm(submission.formId);
          if (form) {
            const titleLower = form.title.toLowerCase();
            const isSubmissionForm = titleLower.startsWith('sub - ') || titleLower.startsWith('sub-') || 
                                     titleLower.includes('submission') || titleLower.includes('submit');
            if (!isSubmissionForm) {
              registrationSubmissions.push({
                ...submission,
                formTitle: form.title,
              });
            }
          }
        } catch (err) {
          // If form not found, skip this submission
          console.error('Error loading form:', err);
        }
      }
      
      setRegistrations(registrationSubmissions);
    } catch (err: any) {
      console.error('Error loading registrations:', err);
      setError(err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (registrationId: string) => {
    if (!window.confirm('Are you sure you want to delete this registration? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(registrationId);
      await deleteFormSubmission(registrationId);
      await loadRegistrations();
    } catch (err: any) {
      console.error('Error deleting registration:', err);
      setError(err.message || 'Failed to delete registration');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading registrations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-medium">Error loading registrations</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileText size={32} className="text-indigo-600" />
          My Registrations
        </h1>
        <p className="text-slate-500 mt-1 text-sm">View and manage your event registrations</p>
      </header>

      {registrations.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No registrations yet</p>
          <p className="text-sm">You haven't registered for any events yet</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registration Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Badge Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {registrations.map((registration) => {
                const statusBadge = getStatusBadge(registration.decisionStatus);
                const StatusIcon = statusBadge.icon;
                const isDeleting = deletingId === registration.id;
                
                return (
                  <tr
                    key={registration.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {registration.eventTitle || 'Event Registration'}
                      </div>
                      {(registration as any).formTitle && (
                        <div className="text-xs text-slate-500 mt-1">
                          {(registration as any).formTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        <span>{new Date(registration.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{statusBadge.label}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusBadge.className}`}>
                        <StatusIcon size={12} />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewRegistration(registration);
                          }}
                          className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                          title="Preview registration"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRegistration(registration);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
                          title="Edit registration"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(registration.id);
                          }}
                          disabled={isDeleting}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete registration"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Registration Modal */}
      {previewRegistration && (
        <PreviewRegistration
          submission={previewRegistration}
          onClose={() => setPreviewRegistration(null)}
          onEdit={() => {
            setPreviewRegistration(null);
            setSelectedRegistration(previewRegistration);
          }}
        />
      )}

      {/* Edit Registration Modal */}
      {selectedRegistration && (
        <EditRegistration
          submission={selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          onSuccess={() => {
            setSelectedRegistration(null);
            loadRegistrations();
          }}
          onDelete={() => {
            setSelectedRegistration(null);
            loadRegistrations();
          }}
        />
      )}
    </div>
  );
};

export default Registrations;
