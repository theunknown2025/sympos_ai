import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { PosterData, PosterSpeaker } from './posterTemplateTypes';

type PosterTemplateFormProps = {
  data: PosterData;
  onChange: (patch: Partial<PosterData>) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs text-slate-600">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass = 'w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm';

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/80 text-left">
        <span className="text-sm font-medium text-slate-800">{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="p-3 space-y-3 border-t border-slate-100">{children}</div>}
    </div>
  );
}

const PosterTemplateForm: React.FC<PosterTemplateFormProps> = ({ data, onChange }) => {
  const [openSection, setOpenSection] = useState('general');

  const toggle = (id: string) => setOpenSection((current) => (current === id ? '' : id));

  const updateSpeaker = (id: string, patch: Partial<PosterSpeaker>) => {
    onChange({
      speakers: data.speakers.map((speaker) => (speaker.id === id ? { ...speaker, ...patch } : speaker)),
    });
  };

  const addSpeaker = () => {
    onChange({
      speakers: [
        ...data.speakers,
        { id: crypto.randomUUID(), name: '', title: '', image: '' },
      ],
    });
  };

  const removeSpeaker = (id: string) => {
    onChange({ speakers: data.speakers.filter((speaker) => speaker.id !== id) });
  };

  const updateTopic = (index: number, value: string) => {
    const topics = [...data.topics];
    topics[index] = value;
    onChange({ topics });
  };

  const addTopic = () => onChange({ topics: [...data.topics, ''] });
  const removeTopic = (index: number) => onChange({ topics: data.topics.filter((_, i) => i !== index) });

  return (
    <div className="space-y-2">
      <Section title="General" open={openSection === 'general'} onToggle={() => toggle('general')}>
        <Field label="Title">
          <input className={inputClass} value={data.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="Subtitle">
          <input className={inputClass} value={data.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} />
        </Field>
        <Field label="Description">
          <textarea className={`${inputClass} min-h-[4rem]`} value={data.description} onChange={(e) => onChange({ description: e.target.value })} />
        </Field>
        <Field label="Organizer">
          <input className={inputClass} value={data.organizer} onChange={(e) => onChange({ organizer: e.target.value })} />
        </Field>
      </Section>

      <Section title="Event details" open={openSection === 'event'} onToggle={() => toggle('event')}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date"><input className={inputClass} value={data.date} onChange={(e) => onChange({ date: e.target.value })} /></Field>
          <Field label="Time"><input className={inputClass} value={data.time} onChange={(e) => onChange({ time: e.target.value })} /></Field>
          <Field label="Location"><input className={inputClass} value={data.location} onChange={(e) => onChange({ location: e.target.value })} /></Field>
          <Field label="Venue"><input className={inputClass} value={data.venueDetails} onChange={(e) => onChange({ venueDetails: e.target.value })} /></Field>
        </div>
      </Section>

      <Section title="Registration" open={openSection === 'registration'} onToggle={() => toggle('registration')}>
        <Field label="Deadline"><input className={inputClass} value={data.registrationDeadline} onChange={(e) => onChange({ registrationDeadline: e.target.value })} /></Field>
        <Field label="Seats"><input className={inputClass} value={data.seatsInfo} onChange={(e) => onChange({ seatsInfo: e.target.value })} /></Field>
        <Field label="Pricing"><input className={inputClass} value={data.pricing} onChange={(e) => onChange({ pricing: e.target.value })} /></Field>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={data.certificate} onChange={(e) => onChange({ certificate: e.target.checked })} className="rounded border-slate-300 text-indigo-600" />
          Certificate included
        </label>
      </Section>

      <Section title="Program" open={openSection === 'program'} onToggle={() => toggle('program')}>
        <Field label="Target audience">
          <textarea className={`${inputClass} min-h-[3rem]`} value={data.targetAudience} onChange={(e) => onChange({ targetAudience: e.target.value })} />
        </Field>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-600">Topics</span>
            <button type="button" onClick={addTopic} className="text-xs text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"><Plus size={12} /> Add</button>
          </div>
          <div className="space-y-2">
            {data.topics.map((topic, index) => (
              <div key={index} className="flex gap-1">
                <input className={inputClass} value={topic} onChange={(e) => updateTopic(index, e.target.value)} />
                <button type="button" onClick={() => removeTopic(index)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Speakers" open={openSection === 'speakers'} onToggle={() => toggle('speakers')}>
        <button type="button" onClick={addSpeaker} className="w-full flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-700 hover:border-indigo-400">
          <Plus size={14} /> Add speaker
        </button>
        {data.speakers.map((speaker) => (
          <div key={speaker.id} className="rounded-lg border border-slate-200 p-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-700">Speaker</span>
              <button type="button" onClick={() => removeSpeaker(speaker.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
            <input className={inputClass} placeholder="Name" value={speaker.name} onChange={(e) => updateSpeaker(speaker.id, { name: e.target.value })} />
            <input className={inputClass} placeholder="Title" value={speaker.title} onChange={(e) => updateSpeaker(speaker.id, { title: e.target.value })} />
            <input className={inputClass} placeholder="Image URL" value={speaker.image} onChange={(e) => updateSpeaker(speaker.id, { image: e.target.value })} />
          </div>
        ))}
      </Section>

      <Section title="Media" open={openSection === 'media'} onToggle={() => toggle('media')}>
        <Field label="Logo URL"><input className={inputClass} value={data.logo} onChange={(e) => onChange({ logo: e.target.value })} /></Field>
        <Field label="Background image URL"><input className={inputClass} value={data.backgroundImage} onChange={(e) => onChange({ backgroundImage: e.target.value })} /></Field>
        <Field label="Theme image URL"><input className={inputClass} value={data.themeImage} onChange={(e) => onChange({ themeImage: e.target.value })} /></Field>
      </Section>

      <Section title="Contact & CTA" open={openSection === 'contact'} onToggle={() => toggle('contact')}>
        <Field label="CTA text"><input className={inputClass} value={data.ctaText} onChange={(e) => onChange({ ctaText: e.target.value })} /></Field>
        <Field label="CTA URL"><input className={inputClass} value={data.ctaUrl} onChange={(e) => onChange({ ctaUrl: e.target.value })} /></Field>
        <Field label="QR label"><input className={inputClass} value={data.qrLabel} onChange={(e) => onChange({ qrLabel: e.target.value })} /></Field>
        <Field label="Email"><input className={inputClass} value={data.contactEmail} onChange={(e) => onChange({ contactEmail: e.target.value })} /></Field>
        <Field label="Phone"><input className={inputClass} value={data.contactPhone} onChange={(e) => onChange({ contactPhone: e.target.value })} /></Field>
        <Field label="Website"><input className={inputClass} value={data.contactWebsite} onChange={(e) => onChange({ contactWebsite: e.target.value })} /></Field>
      </Section>
    </div>
  );
};

export default PosterTemplateForm;
