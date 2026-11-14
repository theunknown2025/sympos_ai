export type ParticipantDraftStatus = 'pending' | 'has_account' | 'ready' | 'created' | 'sent' | 'failed';

export interface ParticipantDraft {
  id: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  status?: ParticipantDraftStatus;
  errorMessage?: string;
}

export type AccountManagerStep = 'add' | 'validate' | 'approve' | 'send';

export interface ParticipantEmailAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}
