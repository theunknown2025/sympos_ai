import type { CommitteeInvitationAttachment } from '../types';

/** Maps stored invitation files to the shape used in invitation HTML emails. */
export function mapInvitationFilesToEmailLinks(
  files?: CommitteeInvitationAttachment[]
): Array<{ name: string; url: string }> {
  if (!files?.length) return [];
  return files
    .filter((f) => Boolean(f.fileUrl?.trim() && f.fileName?.trim()))
    .map((f) => ({
      name: f.fileName.trim(),
      url: f.fileUrl.trim(),
    }));
}
