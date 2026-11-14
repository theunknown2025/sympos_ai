import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, UserCheck } from 'lucide-react';
import { CertificateTemplate, Event, FormSubmission } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { getEventSubmissions } from '../../../services/registrationSubmissionService';
import { getUserCertificateTemplates } from '../../../services/certificateTemplateService';
import {
  filterApprovedRegistrationSubmissions,
  getEventCertificateTemplateIds,
} from '../../../services/certificateGeneratorUtils';
import {
  addCertificatesToParticipantAccountsBatch,
  generateCertificatesBatch,
} from '../../../services/certificateGenerationService';
import CertificateLinkedTemplates from './CertificateLinkedTemplates';
import CertificateRecipientList, { type RegistrationFilter } from './CertificateRecipientList';
import GenerateCertificateAction from './GenerateCertificateAction';
import SendCertificateByEmailAction from './SendCertificateByEmailAction';
import AddToAccountAction from './AddToAccountAction';
import SendCertificateEmailModal from './SendCertificateEmailModal';

interface GenerateRegistrationCertificatesProps {
  event: Event;
}

const GenerateRegistrationCertificates: React.FC<GenerateRegistrationCertificatesProps> = ({
  event,
}) => {
  const { currentUser } = useAuth();
  const [allTemplates, setAllTemplates] = useState<CertificateTemplate[]>([]);
  const [participants, setParticipants] = useState<FormSubmission[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationFilter>('all');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [addingToAccount, setAddingToAccount] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const linkedTemplates = useMemo(() => {
    const ids = new Set(getEventCertificateTemplateIds(event, 'registration'));
    return allTemplates.filter((t) => ids.has(t.id));
  }, [event, allTemplates]);

  const primaryTemplateId = linkedTemplates[0]?.id || '';

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      setError('');
      const [templates, submissions] = await Promise.all([
        getUserCertificateTemplates(currentUser.id),
        getEventSubmissions(event.id),
      ]);
      setAllTemplates(templates);
      const approved = filterApprovedRegistrationSubmissions(event, submissions);
      setParticipants(approved);
      setSelectedIds(new Set(approved.map((s) => s.id)));
    } catch (err) {
      console.error(err);
      setError('Failed to load registration certificate data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, event]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const isInternalRegistration = (submission: FormSubmission) => !!submission.participantUserId;

  const filteredParticipants = useMemo(() => {
    if (registrationFilter === 'all') return participants;
    if (registrationFilter === 'internal') {
      return participants.filter((p) => isInternalRegistration(p));
    }
    return participants.filter((p) => !isInternalRegistration(p));
  }, [participants, registrationFilter]);

  const selectedCount = filteredParticipants.filter((p) => selectedIds.has(p.id)).length;

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const ids = filteredParticipants.map((p) => p.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleAddToAccount = async () => {
    if (!primaryTemplateId || !currentUser?.id || selectedCount === 0) {
      setError('Select at least one participant with an internal account.');
      return;
    }

    const selectedSubmissions = filteredParticipants.filter((p) => selectedIds.has(p.id));
    const withAccount = selectedSubmissions.filter((p) => p.participantUserId);

    if (withAccount.length === 0) {
      setError(
        'None of the selected registrants have a Sympos.ia participant account. Only internal registrations can receive certificates in their account.'
      );
      return;
    }

    try {
      setAddingToAccount(true);
      setError('');
      setSuccessMessage('');
      setGeneratedCount(0);
      setTotalCount(withAccount.length);

      const result = await addCertificatesToParticipantAccountsBatch({
        userId: currentUser.id,
        eventId: event.id,
        event,
        templateId: primaryTemplateId,
        scope: 'registration',
        submissions: selectedSubmissions,
        onProgress: (current, total) => {
          setGeneratedCount(current);
          setTotalCount(total);
        },
      });

      if (result.added === 0) {
        setError('No certificates added. Selected registrants do not have participant accounts.');
      } else {
        const skippedMsg =
          result.skippedNoAccount > 0
            ? ` ${result.skippedNoAccount} skipped (no participant account).`
            : '';
        setSuccessMessage(
          `Added ${result.added} certificate${result.added !== 1 ? 's' : ''} to participant accounts (Participations → Certificates).${skippedMsg}`
        );
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add certificates to accounts');
    } finally {
      setAddingToAccount(false);
      setGeneratedCount(0);
      setTotalCount(0);
    }
  };

  const handleGenerate = async () => {
    if (!primaryTemplateId || !currentUser?.id || selectedCount === 0) {
      setError('Select at least one participant. A certificate template must be configured on the event.');
      return;
    }

    const selectedSubmissions = filteredParticipants.filter((p) => selectedIds.has(p.id));

    try {
      setGenerating(true);
      setError('');
      setSuccessMessage('');
      setGeneratedCount(0);
      setTotalCount(selectedSubmissions.length);

      await generateCertificatesBatch({
        userId: currentUser.id,
        eventId: event.id,
        event,
        eventName: event.name,
        templateId: primaryTemplateId,
        scopeLabel: 'registration',
        submissions: selectedSubmissions,
        onProgress: (current, total) => {
          setGeneratedCount(current);
          setTotalCount(total);
        },
      });

      setSuccessMessage('Registration certificates generated and downloaded successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate certificates');
    } finally {
      setGenerating(false);
      setGeneratedCount(0);
      setTotalCount(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-50">
          <UserCheck className="text-emerald-600" size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Registration certificates</h2>
          <p className="text-sm text-slate-500">
            Generate certificates for approved registrants using templates configured on this event.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {(generating || addingToAccount) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
          <p className="text-lg font-semibold text-slate-900 mb-2">
            {addingToAccount ? 'Adding registration certificates to accounts' : 'Generating registration certificates'}
          </p>
          <p className="text-3xl font-bold text-indigo-600">
            {generatedCount} / {totalCount}
          </p>
        </div>
      )}

      {!generating && !addingToAccount && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">Certificate template on event</p>
            <CertificateLinkedTemplates
              templates={linkedTemplates}
              missingMessage="No registration certificate template is linked to this event. Add one in Event → Tools → Registration."
            />
          </div>

          <CertificateRecipientList
            variant="registration"
            participants={participants}
            selectedParticipants={selectedIds}
            onToggleParticipant={toggleParticipant}
            onToggleSelectAll={toggleSelectAll}
            loading={loading}
            emptyMessage="No approved registrations for this event yet."
            registrationFilter={registrationFilter}
            onRegistrationFilterChange={setRegistrationFilter}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GenerateCertificateAction
              onClick={() => void handleGenerate()}
              disabled={!primaryTemplateId || selectedCount === 0}
              selectedCount={selectedCount}
              generating={generating}
            />
            <SendCertificateByEmailAction
              onClick={() => setShowEmailModal(true)}
              disabled={!primaryTemplateId || selectedCount === 0}
              selectedCount={selectedCount}
            />
            <AddToAccountAction
              onClick={() => void handleAddToAccount()}
              disabled={!primaryTemplateId || selectedCount === 0}
              selectedCount={selectedCount}
              adding={addingToAccount}
            />
          </div>
        </>
      )}

      {showEmailModal && primaryTemplateId && (
        <SendCertificateEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          participants={participants}
          selectedParticipantIds={selectedIds}
          eventId={event.id}
          templateId={primaryTemplateId}
          eventTitle={event.name}
        />
      )}
    </div>
  );
};

export default GenerateRegistrationCertificates;
