import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, FileText, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Trash2, Eye, Edit2, Download, Image as ImageIcon, X, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getRegistrationSubmissions, deleteFormSubmission } from '../../../services/registrationSubmissionService';
import { FormSubmission, DecisionStatus, ApprovalStatus } from '../../../types';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { getJuryMemberProfile } from '../../../services/juryMemberService';
import { getBadgeForSubmission, ParticipantBadge } from '../../../services/badgeGeneratorService';
import DateRangePicker from '../../Admin/ProjectManagement/Projects/DateRangePicker';
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
  const [badgesMap, setBadgesMap] = useState<Map<string, ParticipantBadge>>(new Map());
  const [previewBadge, setPreviewBadge] = useState<ParticipantBadge | null>(null);
  const [loadingBadges, setLoadingBadges] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all' | 'pending'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      loadRegistrations();
    }
  }, [currentUser]);

  const getStatusBadge = (status?: ApprovalStatus) => {
    // Status shows registration approval status (approvalStatus)
    switch (status) {
      case 'accepted':
        return {
          label: 'Approved',
          icon: CheckCircle2,
          className: 'bg-emerald-100 text-emerald-700',
        };
      case 'reserved':
        return {
          label: 'Approved with Reserve',
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
      
      // Load badges for accepted registrations
      await loadBadgesForRegistrations(registrationSubmissions);
    } catch (err: any) {
      console.error('Error loading registrations:', err);
      setError(err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const loadBadgesForRegistrations = async (registrationList: FormSubmission[]) => {
    // Load badges for all registrations (check if badge exists in database)
    // We check all registrations, not just accepted ones, because badge might exist regardless
    if (registrationList.length === 0) {
      return;
    }

    // Load badges for all registrations in parallel
    const badgePromises = registrationList.map(async (registration) => {
      try {
        setLoadingBadges(prev => new Set(prev).add(registration.id));
        const badge = await getBadgeForSubmission(registration.id);
        if (badge) {
          setBadgesMap(prev => new Map(prev).set(registration.id, badge));
        }
      } catch (err) {
        // If badge doesn't exist, that's fine - just don't add it to the map
        // Only log actual errors (not "not found" errors)
        if (err && typeof err === 'object' && 'code' in err && err.code !== 'PGRST116') {
          console.error(`Error loading badge for registration ${registration.id}:`, err);
        }
      } finally {
        setLoadingBadges(prev => {
          const newSet = new Set(prev);
          newSet.delete(registration.id);
          return newSet;
        });
      }
    });

    await Promise.all(badgePromises);
  };

  const handleDownloadBadge = async (badge: ParticipantBadge) => {
    try {
      // Fetch the badge image
      const response = await fetch(badge.badgeImageUrl);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename from participant name
      const sanitizedName = badge.participantName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileExtension = badge.badgeImageUrl.split('.').pop()?.split('?')[0] || 'png';
      link.download = `${sanitizedName}_badge.${fileExtension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading badge:', err);
      setError('Failed to download badge. Please try again.');
    }
  };

  const handlePreviewBadge = (registrationId: string) => {
    const badge = badgesMap.get(registrationId);
    if (badge) {
      setPreviewBadge(badge);
    }
  };

  // Filter registrations based on search and filters
  const filteredRegistrations = useMemo(() => {
    let filtered = [...registrations];

    // Search by event name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reg =>
        (reg.eventTitle?.toLowerCase().includes(query) || false) ||
        ((reg as any).formTitle?.toLowerCase().includes(query) || false)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // Filter for pending (no approval status)
        filtered = filtered.filter(reg => !reg.approvalStatus);
      } else {
        filtered = filtered.filter(reg => reg.approvalStatus === statusFilter);
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(reg => {
        const regDate = new Date(reg.submittedAt);
        regDate.setHours(0, 0, 0, 0);
        const regDateStr = regDate.toISOString().split('T')[0];
        
        if (startDate && endDate) {
          // Both dates selected - check if registration date is within range
          return regDateStr >= startDate && regDateStr <= endDate;
        } else if (startDate) {
          // Only start date - check if registration date is on or after start date
          return regDateStr >= startDate;
        } else if (endDate) {
          // Only end date - check if registration date is on or before end date
          return regDateStr <= endDate;
        }
        
        return true;
      });
    }

    return filtered;
  }, [registrations, searchQuery, statusFilter, startDate, endDate]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || startDate !== '' || endDate !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
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

      {/* Search and Filters */}
      {registrations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by event name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Filter size={16} />
              <span>Filters</span>
              {showFilters ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Registration Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'all' | 'pending')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="accepted">Approved</option>
                  <option value="reserved">Approved with Reserve</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  Registration Date Range
                </label>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                  allowPastDates={true}
                />
              </div>
            </div>
          )}

          {/* Results Count */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Showing {filteredRegistrations.length} of {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No registrations yet</p>
          <p className="text-sm">You haven't registered for any events yet</p>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-lg">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No registrations found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registration Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registration Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Badge</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRegistrations.map((registration) => {
                // Status shows registration approval status (approvalStatus)
                const registrationStatusBadge = getStatusBadge(registration.approvalStatus);
                const RegistrationStatusIcon = registrationStatusBadge.icon;
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        <span>{new Date(registration.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${registrationStatusBadge.className}`}>
                        <RegistrationStatusIcon size={12} />
                        {registrationStatusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {loadingBadges.has(registration.id) ? (
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                        ) : badgesMap.has(registration.id) ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-600 mr-1">Badge Available</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewBadge(registration.id);
                              }}
                              className="p-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                              title="Preview badge"
                            >
                              <ImageIcon size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const badge = badgesMap.get(registration.id);
                                if (badge) {
                                  handleDownloadBadge(badge);
                                }
                              }}
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Download badge"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No badge</span>
                        )}
                      </div>
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
                          disabled={!!registration.approvalStatus}
                          className="p-1.5 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={registration.approvalStatus ? "Cannot edit - registration has been reviewed" : "Edit registration"}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(registration.id);
                          }}
                          disabled={isDeleting || !!registration.approvalStatus}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={registration.approvalStatus ? "Cannot delete - registration has been reviewed" : "Delete registration"}
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

      {/* Badge Preview Modal */}
      {previewBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Participant Badge</h2>
                <p className="text-sm text-slate-500 mt-1">{previewBadge.participantName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadBadge(previewBadge)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => setPreviewBadge(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Badge Image */}
            <div className="p-6 flex flex-col items-center">
              <div className="bg-slate-50 rounded-lg p-4 w-full flex justify-center">
                <img
                  src={previewBadge.badgeImageUrl}
                  alt={`Badge for ${previewBadge.participantName}`}
                  className="max-w-full h-auto rounded-lg shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-red-600 text-center p-4';
                    errorDiv.textContent = 'Failed to load badge image';
                    target.parentElement?.appendChild(errorDiv);
                  }}
                />
              </div>

              {/* Badge Information */}
              <div className="mt-6 w-full space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  {previewBadge.participantEmail && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                      <p className="text-slate-900">{previewBadge.participantEmail}</p>
                    </div>
                  )}
                  {previewBadge.participantOrganization && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Organization</label>
                      <p className="text-slate-900">{previewBadge.participantOrganization}</p>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Registration Type</label>
                  <p className="text-slate-900 capitalize">{previewBadge.registrationType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registrations;
