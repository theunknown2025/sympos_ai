import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  List,
  Trash2,
  Loader2,
  Save,
  Send,
  Pencil,
  AlignLeft,
  Pin,
  Eye,
  Globe,
} from 'lucide-react';
import { useAdminTranslation } from '../../../i18n/admin/hooks/useAdminTranslation';
import OpportunityPublishModal from './OpportunityPublishModal';
import {
  DEFAULT_OPPORTUNITY_STEPS_SECTION_TITLE,
  resolveOpportunityStepsSectionTitle,
} from '../../../utils/opportunityStepsSectionTitle';
import { useAuth } from '../../../hooks/useAuth';
import InlineRichTextEditor from '../EventManagement/InlineRichTextEditor';
import OpportunityPreviewPanel from './OpportunityPreviewPanel';
import OpportunityFilesUpload from './OpportunityFilesUpload';
import { OPPORTUNITY_TEMPLATE_FR } from './OppTempFR';
import { OPPORTUNITY_TEMPLATE_EN } from './OppTempEn';
import type { OpportunityFormTemplate } from './opportunityFormTemplate';
import OpportunityBannerEditor from './OpportunityBannerEditor';
import { bannerForKindChange, getDefaultOpportunityBanner } from '../../../utils/opportunityBanner';
import OpportunityKindIcon from './OpportunityKindIcon';
import {
  opportunityKindDescription,
  opportunityKindLabel,
  OPPORTUNITY_KINDS,
} from '../../../utils/opportunityKindMeta';
import {
  getUserRegistrationForms,
  inferRegistrationFormCategory,
} from '../../../services/registrationFormService';
import {
  getOrganizerOpportunities,
  saveOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from '../../../services/opportunityService';
import type {
  Opportunity,
  OpportunityComplementaryCriterion,
  OpportunityKind,
  OpportunityLocationType,
  OpportunityStep,
  RegistrationForm,
} from '../../../types';

const emptyForm = (): Omit<Opportunity, 'id' | 'userId' | 'campusId' | 'createdAt' | 'updatedAt'> => ({
  kind: 'job',
  title: '',
  banner: getDefaultOpportunityBanner('job'),
  attachedFiles: [],
  deadline: '',
  place: '',
  locationType: 'in_house',
  complementaryCriteria: [],
  description: '',
  steps: [],
  paymentFormId: undefined,
  paymentStepId: undefined,
  publishStatus: 'Draft',
});

const OpportunityManage: React.FC = () => {
  const { t } = useAdminTranslation('opportunityManagement');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'new' | 'list'>('new');
  const [publishingOpportunity, setPublishingOpportunity] = useState<Opportunity | null>(null);
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [myOpportunities, setMyOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [editingStepsSectionTitle, setEditingStepsSectionTitle] = useState(false);
  const [stepsSectionTitleDraft, setStepsSectionTitleDraft] = useState(
    DEFAULT_OPPORTUNITY_STEPS_SECTION_TITLE
  );

  const registrationForms = forms.filter(
    (f) => inferRegistrationFormCategory(f) === 'registration'
  );
  const paymentForms = forms.filter((f) => inferRegistrationFormCategory(f) === 'payment');

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [f, o] = await Promise.all([
        getUserRegistrationForms(currentUser.id),
        getOrganizerOpportunities(currentUser.id),
      ]);
      setForms(f);
      setMyOpportunities(o);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentUser]);

  const addCriterion = () => {
    setForm((prev) => ({
      ...prev,
      complementaryCriteria: [...prev.complementaryCriteria, { name: '', value: '' }],
    }));
  };

  const updateCriterion = (index: number, patch: Partial<OpportunityComplementaryCriterion>) => {
    setForm((prev) => {
      const next = [...prev.complementaryCriteria];
      next[index] = { ...next[index], ...patch };
      return { ...prev, complementaryCriteria: next };
    });
  };

  const removeCriterion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      complementaryCriteria: prev.complementaryCriteria.filter((_, i) => i !== index),
    }));
  };

  const addStep = () => {
    const order = form.steps.length;
    const step: OpportunityStep = {
      id: crypto.randomUUID(),
      order,
      name: '',
      description: '',
      registrationFormId: undefined,
    };
    setForm((prev) => ({ ...prev, steps: [...prev.steps, step] }));
  };

  const updateStep = (id: string, patch: Partial<OpportunityStep>) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const removeStep = (id: string) => {
    setForm((prev) => {
      const steps = prev.steps
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i }));
      const paymentStepId =
        prev.paymentStepId === id ? undefined : prev.paymentStepId;
      return { ...prev, steps, paymentStepId };
    });
  };

  const validate = (): boolean => {
    if (!form.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (form.paymentFormId && !form.paymentStepId) {
      setError('Select which step is the payment step');
      return false;
    }
    if (form.paymentStepId && !form.paymentFormId) {
      setError('Select a payment form when designating a payment step');
      return false;
    }
    setError('');
    return true;
  };

  const handleSave = async (publish: boolean) => {
    if (!currentUser || !validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        publishStatus: publish ? ('Published' as const) : form.publishStatus,
        complementaryCriteria: form.complementaryCriteria.filter(
          (c) => c.name.trim() || c.value.trim()
        ),
        steps: form.steps.map((s, i) => ({ ...s, order: i })),
      };
      if (editingId) {
        await updateOpportunity(editingId, currentUser.id, payload);
      } else {
        const id = await saveOpportunity(currentUser.id, payload);
        setEditingId(id);
      }
      await load();
      if (publish) setTab('list');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (opp: Opportunity) => {
    setEditingId(opp.id);
    setForm({
      kind: opp.kind,
      title: opp.title,
      banner: opp.banner ?? getDefaultOpportunityBanner(opp.kind),
      attachedFiles: [...(opp.attachedFiles || [])],
      deadline: opp.deadline ? opp.deadline.slice(0, 16) : '',
      place: opp.place || '',
      locationType: opp.locationType,
      complementaryCriteria: [...opp.complementaryCriteria],
      description: opp.description || '',
      steps: [...opp.steps],
      stepsSectionTitle: opp.stepsSectionTitle,
      paymentFormId: opp.paymentFormId,
      paymentStepId: opp.paymentStepId,
      publishStatus: opp.publishStatus,
    });
    setTab('new');
  };

  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setEditingStepsSectionTitle(false);
    setTab('new');
  };

  const commitStepsSectionTitle = () => {
    const next = stepsSectionTitleDraft.trim() || DEFAULT_OPPORTUNITY_STEPS_SECTION_TITLE;
    setForm((p) => ({
      ...p,
      stepsSectionTitle:
        next === DEFAULT_OPPORTUNITY_STEPS_SECTION_TITLE ? undefined : next,
    }));
    setEditingStepsSectionTitle(false);
  };

  const cancelStepsSectionTitleEdit = () => {
    setStepsSectionTitleDraft(resolveOpportunityStepsSectionTitle(form.stepsSectionTitle));
    setEditingStepsSectionTitle(false);
  };

  const beginStepsSectionTitleEdit = () => {
    setStepsSectionTitleDraft(resolveOpportunityStepsSectionTitle(form.stepsSectionTitle));
    setEditingStepsSectionTitle(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentUser || !confirm(t('deleteConfirm'))) return;
    await deleteOpportunity(id, currentUser.id);
    if (editingId === id) startNew();
    await load();
  };

  const hasFormContent = () =>
    Boolean(
      form.title.trim() ||
        form.description?.trim() ||
        form.place?.trim() ||
        form.deadline ||
        form.attachedFiles.length > 0 ||
        form.complementaryCriteria.some((c) => c.name.trim() || c.value.trim()) ||
        form.steps.length > 0
    );

  const applyTemplate = (template: OpportunityFormTemplate) => {
    if (hasFormContent() && !confirm('Replace current content with this template?')) return;
    setForm({
      ...template,
      steps: template.steps.map((s, i) => ({
        ...s,
        id: crypto.randomUUID(),
        order: i,
      })),
      complementaryCriteria: template.complementaryCriteria.map((c) => ({ ...c })),
      attachedFiles: [],
    });
    setError('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('pageTitle')}</h1>
        <p className="text-slate-500 mt-2">{t('subtitle')}</p>
      </header>

      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setTab('new')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              tab === 'new'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus size={16} />
              {t('tabNewOpportunity')}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTab('list')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              tab === 'list'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <List size={16} />
              {t('tabListOpportunities')}
            </div>
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {tab === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-indigo-600" />
            </div>
          ) : myOpportunities.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No opportunities yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myOpportunities.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{o.title}</td>
                    <td className="p-3 capitalize">{o.kind}</td>
                    <td className="p-3">{o.publishStatus}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/opportunities/preview/${o.id}`)
                          }
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={t('previewOpportunity')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPublishingOpportunity(o)}
                          className={`p-2 rounded-lg transition-colors ${
                            o.publishStatus === 'Published'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                          title={t('publishPublicly')}
                        >
                          <Globe size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(o)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('editOpportunityAction')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(o.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('deleteOpportunity')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="p-4 border-t">
            <button
              type="button"
              onClick={startNew}
              className="text-sm text-indigo-600 font-medium"
            >
              + Create new
            </button>
          </div>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 w-full max-w-[1600px] items-start">
          {/* Editor — single container, original field order */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? t('editOpportunity') : t('tabNewOpportunity')}
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate(OPPORTUNITY_TEMPLATE_FR)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Load FR template
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate(OPPORTUNITY_TEMPLATE_EN)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Load EN template
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <div className="grid grid-cols-3 gap-3 w-full">
                {OPPORTUNITY_KINDS.map((k) => (
                  <label
                    key={k}
                    className={`flex flex-col items-center text-center gap-2 w-full px-3 py-5 min-h-[8.5rem] rounded-xl border-2 cursor-pointer transition-colors ${
                      form.kind === k
                        ? 'border-indigo-500 bg-indigo-50/80 ring-1 ring-indigo-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kind"
                      className="sr-only"
                      checked={form.kind === k}
                      onChange={() =>
                        setForm((p) => ({
                          ...p,
                          kind: k,
                          banner: bannerForKindChange(k, p.banner),
                        }))
                      }
                    />
                    <span
                      className={`flex shrink-0 items-center justify-center w-14 h-14 rounded-xl ${
                        form.kind === k
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <OpportunityKindIcon kind={k} size={28} />
                    </span>
                    <span className="flex flex-col gap-1 min-w-0 w-full">
                      <span
                        className={`text-base font-semibold leading-tight ${
                          form.kind === k ? 'text-indigo-900' : 'text-slate-900'
                        }`}
                      >
                        {opportunityKindLabel[k]}
                      </span>
                      <span className="text-xs font-normal text-slate-500 leading-snug px-1">
                        {opportunityKindDescription[k]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Field label="Title" required>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </Field>

            {currentUser && (
              <OpportunityBannerEditor
                userId={currentUser.id}
                kind={form.kind}
                title={form.title}
                banner={form.banner}
                onChange={(banner) => setForm((p) => ({ ...p, banner }))}
                disabled={saving}
              />
            )}

            {currentUser && (
              <OpportunityFilesUpload
                userId={currentUser.id}
                files={form.attachedFiles}
                onChange={(attachedFiles) => setForm((p) => ({ ...p, attachedFiles }))}
                storagePrefix={editingId || 'draft'}
                disabled={saving}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Deadline">
                <input
                  type="datetime-local"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={form.deadline}
                  onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                />
              </Field>
              <Field label="Place">
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={form.place}
                  onChange={(e) => setForm((p) => ({ ...p, place: e.target.value }))}
                />
              </Field>
            </div>

            <Field label="Location type">
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.locationType}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    locationType: e.target.value as OpportunityLocationType,
                  }))
                }
              >
                <option value="in_house">In house</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Complementary criteria</span>
                <button
                  type="button"
                  onClick={addCriterion}
                  className="text-sm text-indigo-600 flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {form.complementaryCriteria.map((c, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    placeholder="Name (e.g. salary)"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={c.name}
                    onChange={(e) => updateCriterion(i, { name: e.target.value })}
                  />
                  <input
                    placeholder="Value (e.g. 300 to 500)"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={c.value}
                    onChange={(e) => updateCriterion(i, { value: e.target.value })}
                  />
                  <button type="button" onClick={() => removeCriterion(i)} className="text-red-500 p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <AlignLeft className="text-slate-500 shrink-0" size={16} />
                Description
              </label>
              <InlineRichTextEditor
                value={form.description || ''}
                onChange={(description) => setForm((p) => ({ ...p, description }))}
                editorHeight={320}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {editingStepsSectionTitle ? (
                    <input
                      type="text"
                      autoFocus
                      className="text-lg font-semibold text-slate-900 border border-indigo-300 rounded-lg px-2 py-1 w-full max-w-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={stepsSectionTitleDraft}
                      onChange={(e) => setStepsSectionTitleDraft(e.target.value)}
                      onBlur={commitStepsSectionTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitStepsSectionTitle();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelStepsSectionTitleEdit();
                        }
                      }}
                      aria-label="Section title"
                    />
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-slate-900 truncate">
                        {resolveOpportunityStepsSectionTitle(form.stepsSectionTitle)}
                      </h2>
                      <button
                        type="button"
                        onClick={beginStepsSectionTitleEdit}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                        title="Rename section"
                        aria-label="Rename section"
                      >
                        <Pin size={16} />
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addStep}
                  className="text-sm text-indigo-600 flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} /> Add step
                </button>
              </div>
              {form.steps.map((step) => (
                <div key={step.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Step {step.order + 1}</span>
                    <button type="button" onClick={() => removeStep(step.id)} className="text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    placeholder="Step name"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={step.name}
                    onChange={(e) => updateStep(step.id, { name: e.target.value })}
                  />
                  <textarea
                    placeholder="Step description"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    value={step.description || ''}
                    onChange={(e) => updateStep(step.id, { description: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Step date <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        value={
                          step.date && step.date.length >= 10
                            ? step.date.slice(0, 10)
                            : step.date || ''
                        }
                        onChange={(e) =>
                          updateStep(step.id, {
                            date: e.target.value || undefined,
                          })
                        }
                      />
                      {step.date ? (
                        <button
                          type="button"
                          onClick={() => updateStep(step.id, { date: undefined })}
                          className="text-xs text-slate-500 hover:text-slate-800 shrink-0"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={step.registrationFormId || ''}
                    onChange={(e) =>
                      updateStep(step.id, {
                        registrationFormId: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">Registration form (optional)</option>
                    {registrationForms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <Field label="Payment form">
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={form.paymentFormId || ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      paymentFormId: e.target.value || undefined,
                      paymentStepId: e.target.value ? p.paymentStepId : undefined,
                    }))
                  }
                >
                  <option value="">None</option>
                  {paymentForms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </Field>
              {form.paymentFormId && form.steps.length > 0 && (
                <Field label="Payment step">
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.paymentStepId || ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, paymentStepId: e.target.value || undefined }))
                    }
                  >
                    <option value="">Select step</option>
                    {form.steps.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || `Step ${s.order + 1}`}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publish
              </button>
              {editingId && (
                <button type="button" onClick={startNew} className="text-sm text-slate-600 px-4">
                  Cancel edit
                </button>
              )}
            </div>
          </div>

          {/* Preview — single container */}
          <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <OpportunityPreviewPanel opportunity={form} className="min-h-[min(32rem,70vh)]" />
          </div>
        </div>
        </>
      )}

      {publishingOpportunity && currentUser && (
        <OpportunityPublishModal
          opportunity={publishingOpportunity}
          organizerUserId={currentUser.id}
          onClose={() => setPublishingOpportunity(null)}
          onPublished={(slug) => {
            setMyOpportunities((prev) =>
              prev.map((o) =>
                o.id === publishingOpportunity.id
                  ? { ...o, publishStatus: 'Published', publicSlug: slug }
                  : o
              )
            );
            setPublishingOpportunity((prev) =>
              prev ? { ...prev, publishStatus: 'Published', publicSlug: slug } : null
            );
          }}
        />
      )}
      </div>
    </div>
  );
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default OpportunityManage;
