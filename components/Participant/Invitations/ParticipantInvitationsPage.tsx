import React, { useEffect, useState } from 'react';

import {

  Mail,

  CheckCircle2,

  XCircle,

  Clock,

  Loader2,

  AlertCircle,

} from 'lucide-react';

import { useAuth } from '../../../hooks/useAuth';

import { getParticipantInvitationsForUser } from '../../../services/juryMemberService';

import { CommitteeInvitation, InvitationStatus } from '../../../types';

import ParticipantInvitationAccordionItem from './ParticipantInvitationAccordionItem';



const ParticipantInvitationsPage: React.FC = () => {

  const { currentUser } = useAuth();

  const [invitations, setInvitations] = useState<CommitteeInvitation[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');



  useEffect(() => {

    if (currentUser) {

      void loadInvitations();

    }

  }, [currentUser]);



  const loadInvitations = async () => {

    if (!currentUser?.id || !currentUser.email) return;

    try {

      setLoading(true);

      setError('');

      const data = await getParticipantInvitationsForUser(currentUser.id, currentUser.email);

      setInvitations(data);

    } catch (err: unknown) {

      setError(err instanceof Error ? err.message : 'Failed to load invitations');

    } finally {

      setLoading(false);

    }

  };



  if (!currentUser?.email) {

    return (

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">

        Your account has no email address. Invitations are matched to the email you log in with.

      </div>

    );

  }



  if (loading) {

    return (

      <div className="flex flex-col items-center justify-center py-12">

        <Loader2 className="animate-spin text-indigo-600" size={32} />

        <p className="text-slate-500 mt-4">Loading invitations...</p>

      </div>

    );

  }



  if (error) {

    return (

      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">

        <AlertCircle size={20} className="inline mr-2" />

        {error}

        <button

          type="button"

          onClick={() => void loadInvitations()}

          className="block mt-3 text-sm text-red-800 underline"

        >

          Try again

        </button>

      </div>

    );

  }



  const pending = invitations.filter((i) => i.status === InvitationStatus.PENDING);

  const accepted = invitations.filter((i) => i.status === InvitationStatus.ACCEPTED);

  const rejected = invitations.filter((i) => i.status === InvitationStatus.REJECTED);



  const renderAccordion = (invitation: CommitteeInvitation, defaultExpanded = false) => (

    <ParticipantInvitationAccordionItem

      key={invitation.id}

      invitation={invitation}

      authUserId={currentUser!.id}

      authEmail={currentUser!.email!}

      defaultExpanded={defaultExpanded}

      onResponded={loadInvitations}

    />

  );



  return (

    <div className="h-full max-w-4xl">

      <header className="mb-6">

        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">

          <Mail size={32} className="text-indigo-600" />

          Committee Invitations

        </h1>

        <p className="text-slate-500 mt-1 text-sm">

          Click an invitation to expand it, read the full message, and accept or decline.

        </p>

      </header>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">

          <div className="flex items-center justify-between mb-2">

            <h3 className="text-sm font-medium text-amber-700">Pending</h3>

            <Clock className="text-amber-600" size={20} />

          </div>

          <p className="text-2xl font-bold text-amber-900">{pending.length}</p>

        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">

          <div className="flex items-center justify-between mb-2">

            <h3 className="text-sm font-medium text-emerald-700">Accepted</h3>

            <CheckCircle2 className="text-emerald-600" size={20} />

          </div>

          <p className="text-2xl font-bold text-emerald-900">{accepted.length}</p>

        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-5">

          <div className="flex items-center justify-between mb-2">

            <h3 className="text-sm font-medium text-red-700">Declined</h3>

            <XCircle className="text-red-600" size={20} />

          </div>

          <p className="text-2xl font-bold text-red-900">{rejected.length}</p>

        </div>

      </div>



      {pending.length > 0 && (

        <section className="mb-8">

          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending</h2>

          <div className="space-y-3">

            {pending.map((inv, index) => renderAccordion(inv, index === 0))}

          </div>

        </section>

      )}



      {accepted.length > 0 && (

        <section className="mb-8">

          <h2 className="text-lg font-semibold text-slate-900 mb-4">Accepted</h2>

          <div className="space-y-3">{accepted.map((inv) => renderAccordion(inv))}</div>

        </section>

      )}



      {rejected.length > 0 && (

        <section className="mb-8">

          <h2 className="text-lg font-semibold text-slate-900 mb-4">Declined</h2>

          <div className="space-y-3">{rejected.map((inv) => renderAccordion(inv))}</div>

        </section>

      )}



      {invitations.length === 0 && (

        <div className="text-center py-12 text-slate-400">

          <Mail size={48} className="mx-auto mb-4 opacity-20" />

          <p className="font-medium">No invitations</p>

          <p className="text-sm">You have not received any committee invitations yet</p>

        </div>

      )}

    </div>

  );

};



export default ParticipantInvitationsPage;


