import React, { useRef, useState } from 'react';
import { Plus, Trash2, ImageIcon, User, Upload, Loader2, X } from 'lucide-react';
import type { CommitteePersonLink, ScientificCommitteePerson } from '../../../../types';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { useAuth } from '../../../../hooks/useAuth';
import { uploadImageToStorage } from '../../../../services/storageService';
import { newPersonId } from '../../../../utils/scientificCommitteeUtils';

interface CommitteePersonFieldsProps {
  person: ScientificCommitteePerson;
  onChange: (person: ScientificCommitteePerson) => void;
  compact?: boolean;
}

const CommitteePersonFields: React.FC<CommitteePersonFieldsProps> = ({ person, onChange, compact }) => {
  const { t } = useAdminTranslation('pageBuilder');
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const update = <K extends keyof ScientificCommitteePerson>(field: K, value: ScientificCommitteePerson[K]) => {
    onChange({ ...person, [field]: value });
  };

  const updateLink = (linkId: string, patch: Partial<CommitteePersonLink>) => {
    onChange({
      ...person,
      links: person.links.map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
    });
  };

  const addLink = (type: CommitteePersonLink['type']) => {
    onChange({
      ...person,
      links: [
        ...person.links,
        {
          id: newPersonId(),
          type,
          url: '',
          ...(type === 'other' ? { label: '' } : {}),
        },
      ],
    });
  };

  const removeLink = (linkId: string) => {
    onChange({ ...person, links: person.links.filter((l) => l.id !== linkId) });
  };

  const handlePhotoUpload = async (file: File) => {
    if (!currentUser?.id) {
      setUploadError(t('edCommitteePhotoLoginRequired'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError(t('edCommitteePhotoInvalidType'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t('edCommitteePhotoTooLarge'));
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadImageToStorage(currentUser.id, file, 'landing-page-images');
      update('imageUrl', url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : t('edCommitteePhotoUploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handlePhotoUpload(file);
  };

  const inputClass =
    'w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900';

  const previewSize = compact ? 'w-14 h-14' : 'w-16 h-16';

  return (
    <div className={`space-y-3 ${compact ? '' : 'pt-1'}`}>
      <div className="flex items-start gap-3">
        <div
          className={`${previewSize} rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200`}
        >
          {person.imageUrl ? (
            <img src={person.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={compact ? 22 : 28} className="text-emerald-500" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-xs font-medium text-slate-700">{t('edCommitteePhotoLabel')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
              disabled={uploading || !currentUser?.id}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !currentUser?.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? t('edCommitteePhotoUploading') : t('edCommitteePhotoUpload')}
            </button>
            {person.imageUrl ? (
              <button
                type="button"
                onClick={() => update('imageUrl', '')}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs text-red-500 hover:bg-red-50"
              >
                <X size={13} />
                {t('edCommitteePhotoRemove')}
              </button>
            ) : null}
          </div>
          {uploadError ? <p className="text-[10px] text-red-500">{uploadError}</p> : null}
          {!compact ? (
            <p className="text-[10px] text-slate-400">{t('edCommitteePersonFieldsHint')}</p>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <ImageIcon size={12} className="absolute left-2 top-2.5 text-slate-400" />
        <input
          type="text"
          value={person.imageUrl}
          onChange={(e) => update('imageUrl', e.target.value)}
          placeholder={t('edCommitteePhotoUrlOptional')}
          className={`${inputClass} pl-7`}
        />
      </div>

      <input
        type="text"
        value={person.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder={t('edPlaceholderFullName')}
        className={inputClass}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={person.role}
          onChange={(e) => update('role', e.target.value)}
          placeholder={t('edCommitteePlaceholderRole')}
          className={inputClass}
        />
        <input
          type="text"
          value={person.establishment}
          onChange={(e) => update('establishment', e.target.value)}
          placeholder={t('edCommitteePlaceholderEstablishment')}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="email"
          value={person.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder={t('edCommitteePlaceholderEmail')}
          className={inputClass}
        />
        <input
          type="text"
          value={person.linkedin}
          onChange={(e) => update('linkedin', e.target.value)}
          placeholder={t('edCommitteePlaceholderLinkedin')}
          className={inputClass}
        />
      </div>

      <textarea
        value={person.bio}
        onChange={(e) => update('bio', e.target.value)}
        placeholder={t('edCommitteePlaceholderBio')}
        rows={compact ? 3 : 4}
        className={`${inputClass} resize-y min-h-[72px]`}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-600">{t('edCommitteeOtherLinks')}</span>
          <div className="flex flex-wrap gap-1 justify-end">
            <button
              type="button"
              onClick={() => addLink('orcid')}
              className="text-[10px] px-2 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              + ORCID
            </button>
            <button
              type="button"
              onClick={() => addLink('google_scholar')}
              className="text-[10px] px-2 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              + Google Scholar
            </button>
            <button
              type="button"
              onClick={() => addLink('other')}
              className="text-[10px] px-2 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Plus size={10} className="inline" /> {t('edCommitteeAddLink')}
            </button>
          </div>
        </div>

        {person.links.length === 0 ? (
          <p className="text-[10px] text-slate-400 italic">{t('edCommitteeNoOtherLinks')}</p>
        ) : (
          person.links.map((link) => (
            <div key={link.id} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-1 gap-2">
                {link.type === 'other' ? (
                  <input
                    type="text"
                    value={link.label || ''}
                    onChange={(e) => updateLink(link.id, { label: e.target.value })}
                    placeholder={t('edCommitteeLinkLabel')}
                    className={inputClass}
                  />
                ) : (
                  <span className="text-xs text-slate-500 px-1 py-1.5">
                    {link.type === 'orcid' ? 'ORCID' : 'Google Scholar'}
                  </span>
                )}
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, { url: e.target.value })}
                  placeholder={t('edCommitteeLinkUrl')}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                className="text-slate-400 hover:text-red-500 p-1.5 mt-1"
                aria-label={t('edCommitteeRemoveLink')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommitteePersonFields;
