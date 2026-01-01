import React, { useState, useEffect } from 'react';
import { ConferenceConfig, HeroButton, Speaker, SocialLink, AgendaDay, AgendaItem, FaqItem, CommitteeMember, ContactConfig, TimelineStep, PartnerGroup, Partner, PricingOffer } from '../../types';
import { INITIAL_CONFERENCE_CONFIG } from '../../constants';
import { 
  Eye, Save, Wand2, Layout, GripVertical, Settings2, Plus, Trash2, 
  Link as LinkIcon, Image as ImageIcon, Clock, AlignCenter, AlignLeft, Type,
  Users, Linkedin, Twitter, Globe, User, ChevronDown, ChevronUp, Calendar, HelpCircle,
  MapPin, Menu as MenuIcon, CreditCard, FileText, Award, Mail, Phone, MessageSquare,
  ArrowRight, ExternalLink, Tag
} from 'lucide-react';
import { generateDescription } from '../../services/geminiService';
import FaqSection from './FaqSection';
import ScientificCommitteeSection from './ScientificCommitteeSection';
import ContactSection from './ContactSection';
import SubmissionSection from './SubmissionSection';
import PartnersSection from './PartnersSection';
import PricingSection from './PricingSection';

const PageBuilder: React.FC = () => {
  const [config, setConfig] = useState<ConferenceConfig>(INITIAL_CONFERENCE_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expandedSpeakerId, setExpandedSpeakerId] = useState<string | null>(null);
  const [expandedCommitteeId, setExpandedCommitteeId] = useState<string | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>('sec-1');
  const [activePreviewDay, setActivePreviewDay] = useState<string>(config.agenda[0]?.id || '');
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedPricingId, setExpandedPricingId] = useState<string | null>(null);

  // Update active preview day if agenda changes and current is invalid
  useEffect(() => {
    if (config.agenda.length > 0 && !config.agenda.find(d => d.id === activePreviewDay)) {
      setActivePreviewDay(config.agenda[0].id);
    }
  }, [config.agenda]);

  // Countdown Logic
  useEffect(() => {
    if (!config.date) return;
    
    const calculateTimeLeft = () => {
      const difference = +new Date(config.date) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft()); // Initial call

    return () => clearInterval(timer);
  }, [config.date]);

  const toggleSection = (id: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s)
    }));
  };

  const toggleAccordion = (id: string) => {
    setExpandedSectionId(expandedSectionId === id ? null : id);
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    const description = await generateDescription(config.title, config.location);
    setConfig(prev => ({
      ...prev,
      description
    }));
    setIsGenerating(false);
  };

  // Hero Actions
  const addHeroButton = () => {
    const newBtn: HeroButton = {
      id: Date.now().toString(),
      text: 'New Action',
      url: '#',
      style: 'secondary'
    };
    setConfig(prev => ({
      ...prev,
      hero: { ...prev.hero, buttons: [...prev.hero.buttons, newBtn] }
    }));
  };

  const removeHeroButton = (id: string) => {
    setConfig(prev => ({
      ...prev,
      hero: { ...prev.hero, buttons: prev.hero.buttons.filter(b => b.id !== id) }
    }));
  };

  const updateHeroButton = (id: string, field: keyof HeroButton, value: string) => {
    setConfig(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        buttons: prev.hero.buttons.map(b => b.id === id ? { ...b, [field]: value } : b)
      }
    }));
  };

  // Partners Actions
  const addPartnerGroup = () => {
    const newGroup: PartnerGroup = {
      id: Date.now().toString(),
      name: 'New Partner Group',
      displayStyle: 'grid',
      partners: [],
      showActionButton: false,
      actionButtonText: 'Become a Partner',
      actionButtonUrl: '#'
    };
    setConfig(prev => ({ ...prev, partners: [...prev.partners, newGroup] }));
    setExpandedGroupId(newGroup.id);
  };

  const removePartnerGroup = (id: string) => {
    setConfig(prev => ({ ...prev, partners: prev.partners.filter(g => g.id !== id) }));
  };

  const updatePartnerGroup = (id: string, field: keyof PartnerGroup, value: any) => {
    setConfig(prev => ({
      ...prev,
      partners: prev.partners.map(g => g.id === id ? { ...g, [field]: value } : g)
    }));
  };

  const addPartnerToGroup = (groupId: string) => {
    const newPartner: Partner = {
      id: Date.now().toString(),
      name: 'New Partner',
      logoUrl: '',
      link: ''
    };
    const group = config.partners.find(g => g.id === groupId);
    if(group) {
      updatePartnerGroup(groupId, 'partners', [...group.partners, newPartner]);
    }
  };

  const removePartnerFromGroup = (groupId: string, partnerId: string) => {
    const group = config.partners.find(g => g.id === groupId);
    if(group) {
      updatePartnerGroup(groupId, 'partners', group.partners.filter(p => p.id !== partnerId));
    }
  };

  const updatePartnerInGroup = (groupId: string, partnerId: string, field: keyof Partner, value: string) => {
    const group = config.partners.find(g => g.id === groupId);
    if(group) {
      const updatedPartners = group.partners.map(p => p.id === partnerId ? { ...p, [field]: value } : p);
      updatePartnerGroup(groupId, 'partners', updatedPartners);
    }
  };

  // Pricing Actions
  const addPricingOffer = () => {
    const newOffer: PricingOffer = {
      id: Date.now().toString(),
      name: 'New Ticket Type',
      price: '0',
      currency: '$',
      features: ['Feature 1', 'Feature 2'],
      buttonText: 'Register Now',
      buttonUrl: '#',
      isSoldOut: false,
      isHighlighted: false
    };
    setConfig(prev => ({ ...prev, pricing: [...prev.pricing, newOffer] }));
    setExpandedPricingId(newOffer.id);
  };

  const removePricingOffer = (id: string) => {
    setConfig(prev => ({ ...prev, pricing: prev.pricing.filter(o => o.id !== id) }));
  };

  const updatePricingOffer = (id: string, field: keyof PricingOffer, value: any) => {
    setConfig(prev => ({
      ...prev,
      pricing: prev.pricing.map(o => o.id === id ? { ...o, [field]: value } : o)
    }));
  };

  const addPricingFeature = (offerId: string) => {
    const offer = config.pricing.find(o => o.id === offerId);
    if(offer) {
      updatePricingOffer(offerId, 'features', [...offer.features, 'New Feature']);
    }
  };

  const removePricingFeature = (offerId: string, index: number) => {
    const offer = config.pricing.find(o => o.id === offerId);
    if(offer) {
      updatePricingOffer(offerId, 'features', offer.features.filter((_, i) => i !== index));
    }
  };

  const updatePricingFeature = (offerId: string, index: number, value: string) => {
    const offer = config.pricing.find(o => o.id === offerId);
    if(offer) {
      const updatedFeatures = [...offer.features];
      updatedFeatures[index] = value;
      updatePricingOffer(offerId, 'features', updatedFeatures);
    }
  };

  // Submission Actions
  const addSubmissionStep = () => {
    const newStep: TimelineStep = {
      id: Date.now().toString(),
      date: 'Date',
      title: 'New Milestone',
      description: 'Description of this step.'
    };
    setConfig(prev => ({
      ...prev,
      submission: { ...prev.submission, steps: [...prev.submission.steps, newStep] }
    }));
    setExpandedStepId(newStep.id);
  };

  const removeSubmissionStep = (id: string) => {
    setConfig(prev => ({
      ...prev,
      submission: { ...prev.submission, steps: prev.submission.steps.filter(s => s.id !== id) }
    }));
  };

  const updateSubmissionStep = (id: string, field: keyof TimelineStep, value: string) => {
    setConfig(prev => ({
      ...prev,
      submission: {
        ...prev.submission,
        steps: prev.submission.steps.map(s => s.id === id ? { ...s, [field]: value } : s)
      }
    }));
  };

  const addSubmissionButton = () => {
    const newBtn: HeroButton = {
      id: Date.now().toString(),
      text: 'Action',
      url: '#',
      style: 'secondary'
    };
    setConfig(prev => ({
      ...prev,
      submission: { ...prev.submission, buttons: [...prev.submission.buttons, newBtn] }
    }));
  };

  const removeSubmissionButton = (id: string) => {
    setConfig(prev => ({
      ...prev,
      submission: { ...prev.submission, buttons: prev.submission.buttons.filter(b => b.id !== id) }
    }));
  };

  const updateSubmissionButton = (id: string, field: keyof HeroButton, value: string) => {
    setConfig(prev => ({
      ...prev,
      submission: {
        ...prev.submission,
        buttons: prev.submission.buttons.map(b => b.id === id ? { ...b, [field]: value } : b)
      }
    }));
  };

  // Speaker Actions
  const addSpeaker = () => {
    const newSpeaker: Speaker = {
      id: Date.now().toString(),
      name: 'New Speaker',
      role: 'Title / Role',
      bio: 'Short biography goes here...',
      imageUrl: '',
      socials: []
    };
    setConfig(prev => ({
      ...prev,
      speakers: [...prev.speakers, newSpeaker]
    }));
    setExpandedSpeakerId(newSpeaker.id);
  };

  const removeSpeaker = (id: string) => {
    setConfig(prev => ({
      ...prev,
      speakers: prev.speakers.filter(s => s.id !== id)
    }));
  };

  const updateSpeaker = (id: string, field: keyof Speaker, value: any) => {
    setConfig(prev => ({
      ...prev,
      speakers: prev.speakers.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const addSocial = (speakerId: string) => {
     const newSocial: SocialLink = {
       id: Date.now().toString(),
       platform: 'linkedin',
       url: '#'
     };
     const speaker = config.speakers.find(s => s.id === speakerId);
     if(speaker) {
       updateSpeaker(speakerId, 'socials', [...speaker.socials, newSocial]);
     }
  };

  const removeSocial = (speakerId: string, socialId: string) => {
    const speaker = config.speakers.find(s => s.id === speakerId);
    if(speaker) {
      updateSpeaker(speakerId, 'socials', speaker.socials.filter(s => s.id !== socialId));
    }
  };

  const updateSocial = (speakerId: string, socialId: string, field: keyof SocialLink, value: string) => {
    const speaker = config.speakers.find(s => s.id === speakerId);
    if(speaker) {
      const updatedSocials = speaker.socials.map(s => s.id === socialId ? { ...s, [field]: value } : s);
      updateSpeaker(speakerId, 'socials', updatedSocials);
    }
  };

  // Committee Actions
  const addCommitteeMember = () => {
    const newMember: CommitteeMember = {
      id: Date.now().toString(),
      name: 'New Member',
      role: 'Role',
      affiliation: 'Affiliation',
      bio: '',
      imageUrl: '',
      socials: []
    };
    setConfig(prev => ({
      ...prev,
      committee: [...prev.committee, newMember]
    }));
    setExpandedCommitteeId(newMember.id);
  };

  const removeCommitteeMember = (id: string) => {
    setConfig(prev => ({
      ...prev,
      committee: prev.committee.filter(c => c.id !== id)
    }));
  };

  const updateCommitteeMember = (id: string, field: keyof CommitteeMember, value: any) => {
    setConfig(prev => ({
      ...prev,
      committee: prev.committee.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const addCommitteeSocial = (memberId: string) => {
     const newSocial: SocialLink = {
       id: Date.now().toString(),
       platform: 'linkedin',
       url: '#'
     };
     const member = config.committee.find(c => c.id === memberId);
     if(member) {
       updateCommitteeMember(memberId, 'socials', [...member.socials, newSocial]);
     }
  };

  const removeCommitteeSocial = (memberId: string, socialId: string) => {
    const member = config.committee.find(c => c.id === memberId);
    if(member) {
      updateCommitteeMember(memberId, 'socials', member.socials.filter(s => s.id !== socialId));
    }
  };

  const updateCommitteeSocial = (memberId: string, socialId: string, field: keyof SocialLink, value: string) => {
    const member = config.committee.find(c => c.id === memberId);
    if(member) {
      const updatedSocials = member.socials.map(s => s.id === socialId ? { ...s, [field]: value } : s);
      updateCommitteeMember(memberId, 'socials', updatedSocials);
    }
  };

  // Agenda Actions
  const addAgendaDay = () => {
    const newDay: AgendaDay = {
      id: Date.now().toString(),
      label: `Day ${config.agenda.length + 1}`,
      date: config.date,
      items: []
    };
    setConfig(prev => ({ ...prev, agenda: [...prev.agenda, newDay] }));
    setExpandedDayId(newDay.id);
  };

  const removeAgendaDay = (id: string) => {
    setConfig(prev => ({ ...prev, agenda: prev.agenda.filter(d => d.id !== id) }));
  };

  const updateAgendaDay = (id: string, field: keyof AgendaDay, value: any) => {
    setConfig(prev => ({
      ...prev,
      agenda: prev.agenda.map(d => d.id === id ? { ...d, [field]: value } : d)
    }));
  };

  const addAgendaItem = (dayId: string) => {
    const newItem: AgendaItem = {
      id: Date.now().toString(),
      startTime: '09:00',
      endTime: '10:00',
      title: 'New Activity',
      description: '',
      location: ''
    };
    const day = config.agenda.find(d => d.id === dayId);
    if(day) {
      updateAgendaDay(dayId, 'items', [...day.items, newItem]);
    }
  };

  const removeAgendaItem = (dayId: string, itemId: string) => {
    const day = config.agenda.find(d => d.id === dayId);
    if(day) {
      updateAgendaDay(dayId, 'items', day.items.filter(i => i.id !== itemId));
    }
  };

  const updateAgendaItem = (dayId: string, itemId: string, field: keyof AgendaItem, value: any) => {
    const day = config.agenda.find(d => d.id === dayId);
    if(day) {
      const updatedItems = day.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
      updateAgendaDay(dayId, 'items', updatedItems);
    }
  };

  // FAQ Actions
  const addFaq = () => {
    const newFaq: FaqItem = {
      id: Date.now().toString(),
      question: 'New Question?',
      answer: 'Enter answer here...',
      icon: 'help'
    };
    setConfig(prev => ({ ...prev, faq: [...prev.faq, newFaq] }));
    setExpandedFaqId(newFaq.id);
  };

  const removeFaq = (id: string) => {
    setConfig(prev => ({ ...prev, faq: prev.faq.filter(f => f.id !== id) }));
  };

  const updateFaq = (id: string, field: keyof FaqItem, value: any) => {
    setConfig(prev => ({
      ...prev,
      faq: prev.faq.map(f => f.id === id ? { ...f, [field]: value } : f)
    }));
  };

  // Contact Actions
  const updateContact = (field: keyof ContactConfig, value: any) => {
     setConfig(prev => ({
       ...prev,
       contact: { ...prev.contact, [field]: value }
     }));
  };

  const getSectionIcon = (type: string) => {
    switch(type) {
      case 'hero': return <Layout size={16} />;
      case 'about': return <Type size={16} />;
      case 'speakers': return <Users size={16} />;
      case 'committee': return <Award size={16} />;
      case 'agenda': return <Calendar size={16} />;
      case 'faq': return <HelpCircle size={16} />;
      case 'contact': return <Mail size={16} />;
      case 'submission': return <FileText size={16} />;
      case 'partners': return <Users size={16} />;
      case 'pricing': return <Tag size={16} />;
      default: return <Layout size={16} />;
    }
  };

  const renderSectionEditor = (type: string) => {
    switch (type) {
      case 'hero':
        return (
          <div className="space-y-4">
            {/* Background & Layout */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2">
                <ImageIcon size={14}/> Background Image
              </label>
              <input 
                type="text" 
                value={config.hero.backgroundImage}
                onChange={(e) => setConfig({...config, hero: {...config.hero, backgroundImage: e.target.value}})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Type size={14}/> Tagline / Subtitle
              </label>
              <input 
                type="text" 
                value={config.hero.tagline}
                onChange={(e) => setConfig({...config, hero: {...config.hero, tagline: e.target.value}})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
                placeholder="e.g. Innovating the Future"
              />
            </div>

            {/* Layout Toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Text Alignment</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setConfig({...config, hero: {...config.hero, layout: 'left'}})}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${config.hero.layout === 'left' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <AlignLeft size={14} /> Left
                </button>
                <button 
                  onClick={() => setConfig({...config, hero: {...config.hero, layout: 'center'}})}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${config.hero.layout === 'center' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <AlignCenter size={14} /> Center
                </button>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Overlay Opacity ({config.hero.overlayOpacity}%)</label>
              <input 
                type="range" 
                min="0" 
                max="90" 
                value={config.hero.overlayOpacity}
                onChange={(e) => setConfig({...config, hero: {...config.hero, overlayOpacity: parseInt(e.target.value)}})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Timer Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Show Timer</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={config.hero.showTimer}
                  onChange={(e) => setConfig({...config, hero: {...config.hero, showTimer: e.target.checked}})}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>

            {/* Buttons */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-slate-700">Action Buttons</label>
                <button onClick={addHeroButton} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {config.hero.buttons.map((btn) => (
                  <div key={btn.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Button</span>
                      <button onClick={() => removeHeroButton(btn.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={btn.text}
                      onChange={(e) => updateHeroButton(btn.id, 'text', e.target.value)}
                      placeholder="Button Text"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <LinkIcon size={12} className="absolute left-2 top-2.5 text-slate-400"/>
                        <input 
                          type="text" 
                          value={btn.url}
                          onChange={(e) => updateHeroButton(btn.id, 'url', e.target.value)}
                          placeholder="#"
                          className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        />
                      </div>
                      <select 
                        value={btn.style}
                        onChange={(e) => updateHeroButton(btn.id, 'style', e.target.value as any)}
                        className="px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                      >
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'about':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">About / Description</label>
              <div className="relative">
                <textarea 
                  value={config.description}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-sm leading-relaxed bg-white text-slate-900"
                />
                <button 
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-medium rounded-md transition-colors"
                >
                  <Wand2 size={14} className={isGenerating ? "animate-spin" : ""} />
                  {isGenerating ? 'Thinking...' : 'AI Write'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'partners':
        return (
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-slate-500">{config.partners.length} Partner Groups</span>
                <button onClick={addPartnerGroup} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                  <Plus size={12} /> Add Group
                </button>
              </div>

              <div className="space-y-4">
                {config.partners.map((group) => (
                  <div key={group.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <div 
                      className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                    >
                      <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                           <Users size={14} />
                         </div>
                         <h5 className="text-sm font-semibold text-slate-800">{group.name || 'Unnamed Group'}</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); removePartnerGroup(group.id); }} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 size={14} />
                        </button>
                        {expandedGroupId === group.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </div>

                    {expandedGroupId === group.id && (
                      <div className="p-4 border-t border-slate-100 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Group Name</label>
                          <input 
                            type="text" 
                            value={group.name}
                            onChange={(e) => updatePartnerGroup(group.id, 'name', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-2">Display Style</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['grid', 'marquee-left', 'marquee-right'].map(style => (
                              <button
                                key={style}
                                onClick={() => updatePartnerGroup(group.id, 'displayStyle', style)}
                                className={`px-2 py-1.5 border rounded text-[10px] font-bold uppercase tracking-tight transition-colors ${
                                  group.displayStyle === style ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                              >
                                {style.replace('-', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-700">Action Button</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={group.showActionButton}
                                  onChange={(e) => updatePartnerGroup(group.id, 'showActionButton', e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                              </label>
                           </div>
                           {group.showActionButton && (
                             <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Button Text"
                                  value={group.actionButtonText}
                                  onChange={(e) => updatePartnerGroup(group.id, 'actionButtonText', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                />
                                <input 
                                  type="text" 
                                  placeholder="URL"
                                  value={group.actionButtonUrl}
                                  onChange={(e) => updatePartnerGroup(group.id, 'actionButtonUrl', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                />
                             </div>
                           )}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                           <div className="flex justify-between items-center mb-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Logos</label>
                              <button onClick={() => addPartnerToGroup(group.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">+ Add Logo</button>
                           </div>
                           <div className="space-y-3">
                              {group.partners.map(partner => (
                                <div key={partner.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 relative">
                                   <button onClick={() => removePartnerFromGroup(group.id, partner.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500">
                                      <Trash2 size={12} />
                                   </button>
                                   <div className="flex gap-3">
                                      <div className="w-12 h-12 rounded border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                         {partner.logoUrl ? <img src={partner.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon size={16} className="text-slate-300" />}
                                      </div>
                                      <div className="flex-1 space-y-1.5">
                                         <input 
                                            type="text" 
                                            value={partner.name}
                                            onChange={(e) => updatePartnerInGroup(group.id, partner.id, 'name', e.target.value)}
                                            placeholder="Partner Name"
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                         />
                                         <input 
                                            type="text" 
                                            value={partner.logoUrl}
                                            onChange={(e) => updatePartnerInGroup(group.id, partner.id, 'logoUrl', e.target.value)}
                                            placeholder="Logo URL"
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                         />
                                         <input 
                                            type="text" 
                                            value={partner.link || ''}
                                            onChange={(e) => updatePartnerInGroup(group.id, partner.id, 'link', e.target.value)}
                                            placeholder="Link (Optional)"
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                         />
                                      </div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500">{config.pricing.length} Pricing Offers</span>
              <button onClick={addPricingOffer} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                <Plus size={12} /> Add Offer
              </button>
            </div>

            <div className="space-y-4">
              {config.pricing.map((offer) => (
                <div key={offer.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div 
                    className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedPricingId(expandedPricingId === offer.id ? null : offer.id)}
                  >
                    <div className="flex items-center gap-3">
                       <div className={`p-1.5 rounded text-white ${offer.isHighlighted ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                         <Tag size={14} />
                       </div>
                       <div>
                         <h5 className="text-sm font-semibold text-slate-800">{offer.name || 'Unnamed Offer'}</h5>
                         <span className="text-xs text-slate-500">{offer.currency}{offer.price}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); removePricingOffer(offer.id); }} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                      {expandedPricingId === offer.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {expandedPricingId === offer.id && (
                    <div className="p-4 border-t border-slate-100 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Offer Name</label>
                          <input 
                            type="text" 
                            value={offer.name}
                            onChange={(e) => updatePricingOffer(offer.id, 'name', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="w-16">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Curr.</label>
                            <input 
                              type="text" 
                              value={offer.currency}
                              onChange={(e) => updatePricingOffer(offer.id, 'currency', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900 text-center"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Price</label>
                            <input 
                              type="text" 
                              value={offer.price}
                              onChange={(e) => updatePricingOffer(offer.id, 'price', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
                           <span className="text-xs font-medium text-slate-700">Highlighted</span>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input 
                               type="checkbox" 
                               className="sr-only peer"
                               checked={offer.isHighlighted}
                               onChange={(e) => updatePricingOffer(offer.id, 'isHighlighted', e.target.checked)}
                             />
                             <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
                           </label>
                         </div>
                         <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
                           <span className="text-xs font-medium text-slate-700">Sold Out</span>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input 
                               type="checkbox" 
                               className="sr-only peer"
                               checked={offer.isSoldOut}
                               onChange={(e) => updatePricingOffer(offer.id, 'isSoldOut', e.target.checked)}
                             />
                             <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-red-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
                           </label>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">Button Text</label>
                           <input 
                             type="text" 
                             value={offer.buttonText}
                             onChange={(e) => updatePricingOffer(offer.id, 'buttonText', e.target.value)}
                             className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">Button URL</label>
                           <input 
                             type="text" 
                             value={offer.buttonUrl}
                             onChange={(e) => updatePricingOffer(offer.id, 'buttonUrl', e.target.value)}
                             className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                           />
                         </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                           <label className="block text-xs font-bold text-slate-500 uppercase">Features</label>
                           <button onClick={() => addPricingFeature(offer.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">+ Add Feature</button>
                        </div>
                        <div className="space-y-2">
                           {offer.features.map((feature, idx) => (
                             <div key={idx} className="flex gap-2">
                               <input 
                                 type="text" 
                                 value={feature}
                                 onChange={(e) => updatePricingFeature(offer.id, idx, e.target.value)}
                                 className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900"
                               />
                               <button onClick={() => removePricingFeature(offer.id, idx)} className="text-slate-300 hover:text-red-500">
                                 <XIcon size={14} />
                               </button>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'submission':
        return (
          <div className="space-y-4">
            {/* Steps Timeline Editor */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-slate-500">{config.submission.steps.length} Timeline Steps</span>
                <button onClick={addSubmissionStep} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                  <Plus size={12} /> Add Step
                </button>
              </div>
              <div className="space-y-3">
                {config.submission.steps.map((step) => (
                  <div key={step.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <div 
                      className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {step.date.split(' ')[0]}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-slate-800 truncate">{step.title || 'New Step'}</p>
                          <p className="text-xs text-slate-500 truncate">{step.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); removeSubmissionStep(step.id); }} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 size={14} />
                        </button>
                        {expandedStepId === step.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </div>

                    {expandedStepId === step.id && (
                      <div className="p-4 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                            <input 
                              type="text" 
                              value={step.date}
                              onChange={(e) => updateSubmissionStep(step.id, 'date', e.target.value)}
                              placeholder="e.g. Jan 15"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                            <input 
                              type="text" 
                              value={step.title}
                              onChange={(e) => updateSubmissionStep(step.id, 'title', e.target.value)}
                              placeholder="e.g. Submissions Open"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                          <textarea 
                            rows={2}
                            value={step.description}
                            onChange={(e) => updateSubmissionStep(step.id, 'description', e.target.value)}
                            placeholder="Details shown on hover..."
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none bg-white text-slate-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons Editor */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-medium text-slate-700">Action Buttons</label>
                <button onClick={addSubmissionButton} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                  <Plus size={12} /> Add Button
                </button>
              </div>
              <div className="space-y-3">
                {config.submission.buttons.map((btn) => (
                  <div key={btn.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Button</span>
                      <button onClick={() => removeSubmissionButton(btn.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        value={btn.text}
                        onChange={(e) => updateSubmissionButton(btn.id, 'text', e.target.value)}
                        placeholder="Label"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                      />
                       <select 
                        value={btn.style}
                        onChange={(e) => updateSubmissionButton(btn.id, 'style', e.target.value as any)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                      >
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                      </select>
                    </div>
                    <input 
                      type="text" 
                      value={btn.url}
                      onChange={(e) => updateSubmissionButton(btn.id, 'url', e.target.value)}
                      placeholder="URL (# or https://)"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'speakers':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{config.speakers.length} Speakers</span>
              <button onClick={addSpeaker} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                <Plus size={12} /> Add Speaker
              </button>
            </div>
            
            <div className="space-y-3">
              {config.speakers.map((speaker) => (
                <div key={speaker.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div 
                    className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedSpeakerId(expandedSpeakerId === speaker.id ? null : speaker.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                          {speaker.imageUrl ? <img src={speaker.imageUrl} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-indigo-400" />}
                      </div>
                      <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-slate-800 truncate">{speaker.name || 'New Speaker'}</p>
                          <p className="text-xs text-slate-500 truncate">{speaker.role || 'No title'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); removeSpeaker(speaker.id); }} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                      {expandedSpeakerId === speaker.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {expandedSpeakerId === speaker.id && (
                    <div className="p-4 border-t border-slate-100 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(speaker.id, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Title / Role</label>
                        <input 
                          type="text" 
                          value={speaker.role}
                          onChange={(e) => updateSpeaker(speaker.id, 'role', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        />
                      </div>
                        <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Photo URL</label>
                        <div className="relative">
                          <ImageIcon size={12} className="absolute left-2 top-2.5 text-slate-400" />
                          <input 
                            type="text" 
                            value={speaker.imageUrl}
                            onChange={(e) => updateSpeaker(speaker.id, 'imageUrl', e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Bio</label>
                        <textarea 
                          rows={3}
                          value={speaker.bio}
                          onChange={(e) => updateSpeaker(speaker.id, 'bio', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none bg-white text-slate-900"
                        />
                      </div>
                      
                      {/* Socials */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-medium text-slate-500">Social Links</label>
                            <button onClick={() => addSocial(speaker.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">+ Link</button>
                        </div>
                        <div className="space-y-2">
                          {speaker.socials.map((social) => (
                            <div key={social.id} className="flex gap-2">
                              <select 
                                value={social.platform}
                                onChange={(e) => updateSocial(speaker.id, social.id, 'platform', e.target.value as any)}
                                className="w-24 px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900 focus:outline-none"
                              >
                                <option value="linkedin">LinkedIn</option>
                                <option value="twitter">Twitter</option>
                                <option value="website">Website</option>
                              </select>
                              <input 
                                type="text" 
                                value={social.url}
                                onChange={(e) => updateSocial(speaker.id, social.id, 'url', e.target.value)}
                                placeholder="URL..."
                                className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                              />
                              <button onClick={() => removeSocial(speaker.id, social.id)} className="text-slate-400 hover:text-red-500">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'committee':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{config.committee.length} Members</span>
              <button onClick={addCommitteeMember} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                <Plus size={12} /> Add Member
              </button>
            </div>
            
            <div className="space-y-3">
              {config.committee.map((member) => (
                <div key={member.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div 
                    className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedCommitteeId(expandedCommitteeId === member.id ? null : member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                          {member.imageUrl ? <img src={member.imageUrl} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-emerald-500" />}
                      </div>
                      <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-slate-800 truncate">{member.name || 'New Member'}</p>
                          <p className="text-xs text-slate-500 truncate">{member.role || 'No title'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); removeCommitteeMember(member.id); }} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                      {expandedCommitteeId === member.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {expandedCommitteeId === member.id && (
                    <div className="p-4 border-t border-slate-100 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={member.name}
                          onChange={(e) => updateCommitteeMember(member.id, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Role (e.g. Chair)</label>
                            <input 
                              type="text" 
                              value={member.role}
                              onChange={(e) => updateCommitteeMember(member.id, 'role', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Affiliation</label>
                            <input 
                              type="text" 
                              value={member.affiliation}
                              onChange={(e) => updateCommitteeMember(member.id, 'affiliation', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                          </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Photo URL</label>
                        <div className="relative">
                          <ImageIcon size={12} className="absolute left-2 top-2.5 text-slate-400" />
                          <input 
                            type="text" 
                            value={member.imageUrl}
                            onChange={(e) => updateCommitteeMember(member.id, 'imageUrl', e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                          />
                        </div>
                      </div>
                      
                      {/* Socials */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-medium text-slate-500">Social Links</label>
                            <button onClick={() => addCommitteeSocial(member.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">+ Link</button>
                        </div>
                        <div className="space-y-2">
                          {member.socials.map((social) => (
                            <div key={social.id} className="flex gap-2">
                              <select 
                                value={social.platform}
                                onChange={(e) => updateCommitteeSocial(member.id, social.id, 'platform', e.target.value as any)}
                                className="w-24 px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900 focus:outline-none"
                              >
                                <option value="linkedin">LinkedIn</option>
                                <option value="twitter">Twitter</option>
                                <option value="website">Website</option>
                              </select>
                              <input 
                                type="text" 
                                value={social.url}
                                onChange={(e) => updateCommitteeSocial(member.id, social.id, 'url', e.target.value)}
                                placeholder="URL..."
                                className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                              />
                              <button onClick={() => removeCommitteeSocial(member.id, social.id)} className="text-slate-400 hover:text-red-500">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'agenda':
        return (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{config.agenda.length} Days Configured</span>
              <button onClick={addAgendaDay} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                <Plus size={12} /> Add Day
              </button>
            </div>

            <div className="space-y-4">
              {config.agenda.map((day) => (
                <div key={day.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                   <div 
                    className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                  >
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800">{day.label}</h5>
                      <span className="text-xs text-slate-500">{day.date} • {day.items.length} Activities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); removeAgendaDay(day.id); }} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                      {expandedDayId === day.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {expandedDayId === day.id && (
                    <div className="p-4 border-t border-slate-100 space-y-4">
                       <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
                            <input 
                              type="text" 
                              value={day.label}
                              onChange={(e) => updateAgendaDay(day.id, 'label', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                            <input 
                              type="date" 
                              value={day.date}
                              onChange={(e) => updateAgendaDay(day.id, 'date', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            />
                          </div>
                       </div>

                       <div>
                          <div className="flex justify-between items-center mb-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase">Activities</label>
                             <button onClick={() => addAgendaItem(day.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">+ Activity</button>
                          </div>
                          <div className="space-y-3">
                             {day.items.map(item => (
                               <div key={item.id} className="bg-white p-3 rounded border border-slate-200 space-y-2 relative group">
                                  <button 
                                    onClick={() => removeAgendaItem(day.id, item.id)} 
                                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                                  >
                                    <XIcon size={14} />
                                  </button>
                                  <div className="flex gap-2 items-center">
                                     <input 
                                        type="time" 
                                        value={item.startTime}
                                        onChange={(e) => updateAgendaItem(day.id, item.id, 'startTime', e.target.value)}
                                        className="w-20 px-1 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                     />
                                     <span className="text-slate-400">-</span>
                                     <input 
                                        type="time" 
                                        value={item.endTime}
                                        onChange={(e) => updateAgendaItem(day.id, item.id, 'endTime', e.target.value)}
                                        className="w-20 px-1 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                     />
                                  </div>
                                  <input 
                                    type="text" 
                                    value={item.title}
                                    onChange={(e) => updateAgendaItem(day.id, item.id, 'title', e.target.value)}
                                    placeholder="Activity Title"
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-medium bg-white text-slate-900"
                                  />
                                  <textarea 
                                     value={item.description}
                                     onChange={(e) => updateAgendaItem(day.id, item.id, 'description', e.target.value)}
                                     placeholder="Description..."
                                     rows={2}
                                     className="w-full px-2 py-1 border border-slate-200 rounded text-xs resize-none bg-white text-slate-900"
                                  />
                                  <div className="flex gap-2">
                                     <select 
                                        value={item.speakerId || ''}
                                        onChange={(e) => updateAgendaItem(day.id, item.id, 'speakerId', e.target.value)}
                                        className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                     >
                                        <option value="">No Speaker</option>
                                        {config.speakers.map(s => (
                                          <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                     </select>
                                     <input 
                                        type="text" 
                                        value={item.location || ''}
                                        onChange={(e) => updateAgendaItem(day.id, item.id, 'location', e.target.value)}
                                        placeholder="Location (Optional)"
                                        className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900"
                                     />
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{config.faq.length} Questions</span>
              <button onClick={addFaq} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
                <Plus size={12} /> Add Question
              </button>
            </div>

            <div className="space-y-3">
              {config.faq.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div 
                    className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedFaqId(expandedFaqId === item.id ? null : item.id)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-500">
                        {item.icon === 'help' && <HelpCircle size={16} />}
                        {item.icon === 'calendar' && <Calendar size={16} />}
                        {item.icon === 'credit-card' && <CreditCard size={16} />}
                        {item.icon === 'map-pin' && <MapPin size={16} />}
                        {item.icon === 'file-text' && <FileText size={16} />}
                        {item.icon === 'users' && <Users size={16} />}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.question || 'New Question'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); removeFaq(item.id); }} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                      {expandedFaqId === item.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {expandedFaqId === item.id && (
                    <div className="p-4 border-t border-slate-100 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Question</label>
                        <input 
                          type="text" 
                          value={item.question}
                          onChange={(e) => updateFaq(item.id, 'question', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Answer</label>
                        <textarea 
                          rows={3}
                          value={item.answer}
                          onChange={(e) => updateFaq(item.id, 'answer', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Icon</label>
                        <div className="flex gap-2">
                           {['help', 'calendar', 'credit-card', 'map-pin', 'file-text', 'users'].map((iconName) => (
                             <button
                               key={iconName}
                               onClick={() => updateFaq(item.id, 'icon', iconName)}
                               className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                                 item.icon === iconName 
                                   ? 'bg-indigo-600 border-indigo-600 text-white' 
                                   : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                               }`}
                             >
                               {iconName === 'help' && <HelpCircle size={14} />}
                               {iconName === 'calendar' && <Calendar size={14} />}
                               {iconName === 'credit-card' && <CreditCard size={14} />}
                               {iconName === 'map-pin' && <MapPin size={14} />}
                               {iconName === 'file-text' && <FileText size={14} />}
                               {iconName === 'users' && <Users size={14} />}
                             </button>
                           ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
             {/* Toggles */}
             <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-2">
                     <MessageSquare size={16} className="text-slate-500" />
                     <span className="text-xs font-medium text-slate-700">Show Form</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       className="sr-only peer"
                       checked={config.contact.showForm}
                       onChange={(e) => updateContact('showForm', e.target.checked)}
                     />
                     <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                   </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-2">
                     <MapPin size={16} className="text-slate-500" />
                     <span className="text-xs font-medium text-slate-700">Show Map</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       className="sr-only peer"
                       checked={config.contact.showMap}
                       onChange={(e) => updateContact('showMap', e.target.checked)}
                     />
                     <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                   </label>
                </div>
             </div>

             {/* Info Fields */}
             <div className="space-y-3 pt-2">
               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                 <div className="relative">
                   <User size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                   <input 
                     type="text" 
                     value={config.contact.contactPerson}
                     onChange={(e) => updateContact('contactPerson', e.target.value)}
                     className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                   />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                 <div className="relative">
                   <Mail size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                   <input 
                     type="text" 
                     value={config.contact.email}
                     onChange={(e) => updateContact('email', e.target.value)}
                     className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                   />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                 <div className="relative">
                   <Phone size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                   <input 
                     type="text" 
                     value={config.contact.phone}
                     onChange={(e) => updateContact('phone', e.target.value)}
                     className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                   />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                 <div className="relative">
                   <MapPin size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                   <input 
                     type="text" 
                     value={config.contact.address}
                     onChange={(e) => updateContact('address', e.target.value)}
                     className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                   />
                 </div>
               </div>
               {config.contact.showMap && (
                 <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Google Maps Embed URL</label>
                   <textarea 
                     rows={3}
                     value={config.contact.mapEmbedUrl}
                     onChange={(e) => updateContact('mapEmbedUrl', e.target.value)}
                     placeholder="Paste iframe src or embed link..."
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-slate-600 bg-white"
                   />
                 </div>
               )}
             </div>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Settings2 size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Configuration for this section is coming soon.</p>
          </div>
        );
    }
  };


  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Landing Page Builder</h1>
          <p className="text-slate-500 mt-1">Design your conference website. Use AI to assist with content.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Eye size={18} /> Preview
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200">
            <Save size={18} /> Publish Changes
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
        {/* Editor Sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Settings2 size={18} /> Editor Controls
            </h3>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto">
            
            {/* General Info (Static Top Block) */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">General Information</h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Conference Title</label>
                <input 
                  type="text" 
                  value={config.title}
                  onChange={(e) => setConfig({...config, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={config.date}
                    onChange={(e) => setConfig({...config, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    value={config.location}
                    onChange={(e) => setConfig({...config, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Header Configuration Accordion */}
            <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${expandedSectionId === 'header-settings' ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border-b border-transparent">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                    onClick={() => toggleAccordion('header-settings')}
                  >
                    <GripVertical size={14} className="text-slate-300 opacity-0" />
                    <div className={`p-1.5 rounded-md border ${expandedSectionId === 'header-settings' ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                        <MenuIcon size={16} />
                    </div>
                    <span className={`font-semibold text-sm ${expandedSectionId === 'header-settings' ? 'text-indigo-900' : 'text-slate-700'}`}>
                      Header & Navigation
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                     <button onClick={() => toggleAccordion('header-settings')} className="text-slate-400 hover:text-indigo-600 transition-colors">
                       {expandedSectionId === 'header-settings' ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                     </button>
                  </div>
              </div>
              {expandedSectionId === 'header-settings' && (
                <div className="p-4 bg-white border-t border-slate-100 animate-fade-in space-y-4">
                   {/* Logo Toggle */}
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Show Logo</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={config.header.showLogo}
                          onChange={(e) => setConfig({...config, header: {...config.header, showLogo: e.target.checked}})}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                      </label>
                   </div>
                   {/* Title Toggle */}
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Show Title</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={config.header.showTitle}
                          onChange={(e) => setConfig({...config, header: {...config.header, showTitle: e.target.checked}})}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                      </label>
                   </div>
                   {/* Action Button */}
                   <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-medium text-slate-700">Show Action Button</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                             type="checkbox" 
                             className="sr-only peer"
                             checked={config.header.showActionButton}
                             onChange={(e) => setConfig({...config, header: {...config.header, showActionButton: e.target.checked}})}
                           />
                           <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                         </label>
                      </div>
                      {config.header.showActionButton && (
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="block text-[10px] font-medium text-slate-500 mb-1">Button Text</label>
                             <input 
                               type="text" 
                               value={config.header.actionButtonText}
                               onChange={(e) => setConfig({...config, header: {...config.header, actionButtonText: e.target.value}})}
                               className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                             />
                           </div>
                           <div>
                             <label className="block text-[10px] font-medium text-slate-500 mb-1">Button Link</label>
                             <input 
                               type="text" 
                               value={config.header.actionButtonUrl}
                               onChange={(e) => setConfig({...config, header: {...config.header, actionButtonUrl: e.target.value}})}
                               className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                             />
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {config.sections.map((section) => (
                 <div key={section.id} className={`border rounded-lg overflow-hidden transition-all duration-200 ${expandedSectionId === section.id ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 bg-white'}`}>
                    {/* Accordion Header */}
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border-b border-transparent">
                       <div 
                         className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                         onClick={() => toggleAccordion(section.id)}
                       >
                          <GripVertical size={14} className="text-slate-300 cursor-move hover:text-slate-500" />
                          <div className={`p-1.5 rounded-md border ${expandedSectionId === section.id ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                             {getSectionIcon(section.type)}
                          </div>
                          <span className={`font-semibold text-sm ${expandedSectionId === section.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {section.title}
                          </span>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          {/* Toggle Switch */}
                          <div className="flex items-center gap-2" title={section.isVisible ? "Section Visible" : "Section Hidden"}>
                              <span className="text-[10px] font-bold text-slate-400 uppercase hidden xl:block">{section.isVisible ? 'ON' : 'OFF'}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={section.isVisible}
                                  onChange={() => toggleSection(section.id)}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                              </label>
                          </div>
                          
                          {/* Expand Chevron */}
                          <button onClick={() => toggleAccordion(section.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                            {expandedSectionId === section.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                          </button>
                       </div>
                    </div>

                    {/* Accordion Body */}
                    {expandedSectionId === section.id && (
                       <div className="p-4 bg-white border-t border-slate-100 animate-fade-in">
                          {renderSectionEditor(section.type)}
                       </div>
                    )}
                 </div>
              ))}
            </div>

          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2 bg-slate-200 rounded-xl overflow-hidden border border-slate-300 flex flex-col shadow-inner">
          <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="mx-auto bg-slate-900 text-slate-400 text-xs px-4 py-1.5 rounded-full w-2/3 text-center border border-slate-700 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              sympose-ai.com/events/future-tech-2024
            </div>
          </div>
          <div className="flex-1 bg-white overflow-y-auto scrollbar-hide relative">
            
            {/* Header / Navigation */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
               <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     {config.header.showLogo && (
                       <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">S</span>
                       </div>
                     )}
                     {config.header.showTitle && (
                       <span className="font-bold text-slate-800 text-lg truncate max-w-[200px] md:max-w-xs">{config.title}</span>
                     )}
                  </div>
                  
                  {/* Desktop Nav */}
                  <div className="hidden md:flex items-center gap-6">
                     {config.sections.filter(s => s.isVisible && s.type !== 'hero').map(section => (
                        <a 
                          key={section.id} 
                          href="#" 
                          className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          {section.title}
                        </a>
                     ))}
                  </div>

                  {/* Action Button */}
                  {config.header.showActionButton && (
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-200">
                      {config.header.actionButtonText}
                    </button>
                  )}
               </div>
            </nav>

            {/* Hero Section */}
            {config.sections.find(s => s.id === 'sec-1' && s.isVisible) && (
              <div className={`relative min-h-[650px] w-full flex flex-col justify-center px-4 md:px-12 lg:px-20 overflow-hidden ${config.hero.layout === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={config.hero.backgroundImage} 
                    className="w-full h-full object-cover transition-transform duration-10000 hover:scale-110" 
                    alt="Conference Hero" 
                  />
                  <div 
                    className="absolute inset-0 bg-slate-900 transition-opacity duration-300" 
                    style={{ opacity: config.hero.overlayOpacity / 100 }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/30"></div>
                </div>

                <div className="relative z-10 w-full max-w-5xl animate-fade-in-up">
                  {/* Badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100 text-sm font-semibold mb-6 backdrop-blur-md ${config.hero.layout === 'center' ? 'mx-auto' : ''}`}>
                    <span>{config.date}</span>
                    <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                    <span>{config.location}</span>
                  </div>

                  {/* Title & Tagline */}
                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-[1.1] tracking-tight drop-shadow-xl">
                    {config.title}
                  </h1>
                  {config.hero.tagline && (
                    <p className="text-xl md:text-2xl text-slate-200 mb-10 font-light max-w-2xl leading-relaxed drop-shadow-md">
                      {config.hero.tagline}
                    </p>
                  )}

                  {/* Timer */}
                  {config.hero.showTimer && (
                    <div className={`flex gap-3 md:gap-5 mb-10 flex-wrap ${config.hero.layout === 'center' ? 'justify-center' : 'justify-start'}`}>
                      {[
                        { val: timeLeft.days, label: 'Days' },
                        { val: timeLeft.hours, label: 'Hours' },
                        { val: timeLeft.minutes, label: 'Minutes' },
                        { val: timeLeft.seconds, label: 'Seconds' }
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-xl p-3 w-16 md:w-20 border border-white/20 shadow-lg ring-1 ring-white/10">
                          <span className="text-xl md:text-2xl font-bold text-white font-mono">{String(item.val).padStart(2, '0')}</span>
                          <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-1">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className={`flex flex-wrap gap-4 ${config.hero.layout === 'center' ? 'justify-center' : 'justify-start'}`}>
                    {config.hero.buttons.map(btn => (
                      <button 
                        key={btn.id}
                        onClick={() => {}}
                        className={`px-8 py-4 rounded-full font-semibold transition-all transform hover:-translate-y-1 active:scale-95 duration-200 flex items-center gap-2 ${
                          btn.style === 'primary' 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/30 border border-indigo-500/50'
                            : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/30 shadow-lg'
                        }`}
                      >
                        {btn.text}
                        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </button>
                    ))}
                    {config.hero.buttons.length === 0 && (
                      <div className="text-white/50 text-sm italic border border-dashed border-white/30 px-6 py-3 rounded-full">
                        No actions configured
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* About Section */}
            {config.sections.find(s => s.id === 'sec-2' && s.isVisible) && (
              <div className="py-24 px-8 max-w-5xl mx-auto">
                <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center tracking-tight">About the Conference</h2>
                <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full mb-12"></div>
                <div className="prose prose-lg prose-indigo mx-auto text-slate-600 leading-relaxed text-justify">
                  <p className="whitespace-pre-wrap">{config.description}</p>
                </div>
              </div>
            )}

            {/* Agenda Section */}
            {config.sections.find(s => s.id === 'sec-4' && s.isVisible) && (
               <div className="py-24 px-8 bg-white">
                 <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                      <h2 className="text-4xl font-bold text-slate-900 mb-4">{config.sections.find(s => s.id === 'sec-4')?.title}</h2>
                      <p className="text-slate-500">Explore our scheduled events and sessions.</p>
                    </div>

                    {/* Day Tabs */}
                    <div className="flex justify-center mb-12 border-b border-slate-200">
                       {config.agenda.map((day) => (
                         <button
                           key={day.id}
                           onClick={() => setActivePreviewDay(day.id)}
                           className={`px-8 py-4 text-sm font-semibold tracking-wide border-b-2 transition-colors ${
                             activePreviewDay === day.id 
                               ? 'border-indigo-600 text-indigo-600' 
                               : 'border-transparent text-slate-500 hover:text-slate-800'
                           }`}
                         >
                           <span className="block text-lg">{day.label}</span>
                           <span className="text-xs font-normal opacity-80">{day.date}</span>
                         </button>
                       ))}
                    </div>

                    {/* Schedule List */}
                    <div className="space-y-6">
                       {config.agenda.find(d => d.id === activePreviewDay)?.items.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((item) => {
                          const speaker = config.speakers.find(s => s.id === item.speakerId);
                          return (
                             <div key={item.id} className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="md:w-32 flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-2 text-slate-500 font-mono text-sm border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 pr-0 md:pr-6">
                                   <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                      <Clock size={14} className="text-indigo-500" />
                                      {item.startTime}
                                   </div>
                                   <div className="hidden md:block w-px h-4 bg-slate-300 ml-1.5"></div>
                                   <div className="pl-0 md:pl-5 opacity-80">{item.endTime}</div>
                                </div>
                                <div className="flex-1">
                                   <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                                   <p className="text-slate-600 leading-relaxed mb-4 text-sm">{item.description}</p>
                                   
                                   <div className="flex flex-wrap gap-4 items-center">
                                      {speaker && (
                                         <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                               {speaker.imageUrl ? <img src={speaker.imageUrl} className="w-full h-full object-cover"/> : <User size={14} className="m-1"/>}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700">{speaker.name}</span>
                                         </div>
                                      )}
                                      {item.location && (
                                         <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <MapPin size={14} />
                                            {item.location}
                                         </div>
                                      )}
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                       {config.agenda.find(d => d.id === activePreviewDay)?.items.length === 0 && (
                          <div className="text-center py-12 text-slate-400">
                             <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                             <p>No activities scheduled for this day yet.</p>
                          </div>
                       )}
                    </div>
                 </div>
               </div>
            )}

            {/* Keynote Speakers Section */}
            {config.sections.find(s => s.id === 'sec-3' && s.isVisible) && (
              <div className="py-24 px-8 bg-slate-50 border-t border-slate-100">
                 <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                      <h2 className="text-4xl font-bold text-slate-900 mb-4">{config.sections.find(s => s.id === 'sec-3')?.title}</h2>
                      <p className="text-slate-500 max-w-2xl mx-auto">Hear from the world's leading minds and industry pioneers.</p>
                    </div>
                    
                    {config.speakers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {config.speakers.map(speaker => (
                          <div key={speaker.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                             <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform">
                               {speaker.imageUrl ? (
                                 <img src={speaker.imageUrl} alt={speaker.name} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                   <User size={48} />
                                 </div>
                               )}
                             </div>
                             <div className="text-center">
                               <h3 className="text-xl font-bold text-slate-900 mb-1">{speaker.name}</h3>
                               <p className="text-indigo-600 font-medium text-sm mb-4">{speaker.role}</p>
                               <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-4">{speaker.bio}</p>
                               
                               <div className="flex justify-center gap-3">
                                 {speaker.socials.map(social => (
                                   <a 
                                     key={social.id} 
                                     href={social.url} 
                                     className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-indigo-600 hover:text-white transition-colors"
                                     target="_blank" rel="noopener noreferrer"
                                   >
                                      {social.platform === 'linkedin' && <Linkedin size={14} />}
                                      {social.platform === 'twitter' && <Twitter size={14} />}
                                      {social.platform === 'website' && <Globe size={14} />}
                                   </a>
                                 ))}
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-48 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                         <Users size={48} className="mb-4 opacity-50"/>
                         <p>No speakers added yet. Use the editor to add speakers.</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {/* Submission Section */}
            {config.sections.find(s => s.id === 'sec-8' && s.isVisible) && (
              <SubmissionSection config={config.submission} title={config.sections.find(s => s.id === 'sec-8')?.title} />
            )}

            {/* Scientific Committee Section */}
            {config.sections.find(s => s.id === 'sec-6' && s.isVisible) && (
              <ScientificCommitteeSection members={config.committee} title={config.sections.find(s => s.id === 'sec-6')?.title} />
            )}

            {/* Pricing Section */}
            {config.sections.find(s => s.id === 'sec-10' && s.isVisible) && (
              <PricingSection offers={config.pricing} title={config.sections.find(s => s.id === 'sec-10')?.title} />
            )}

            {/* Partners Section */}
            {config.sections.find(s => s.id === 'sec-9' && s.isVisible) && (
              <PartnersSection groups={config.partners} title={config.sections.find(s => s.id === 'sec-9')?.title} />
            )}

            {/* FAQ Section */}
            {config.sections.find(s => s.id === 'sec-5' && s.isVisible) && (
              <FaqSection items={config.faq} title={config.sections.find(s => s.id === 'sec-5')?.title} />
            )}

            {/* Contact Section */}
            {config.sections.find(s => s.id === 'sec-7' && s.isVisible) && (
               <ContactSection config={config.contact} title={config.sections.find(s => s.id === 'sec-7')?.title} />
            )}

            {/* Placeholder for other sections */}
            {config.sections.filter(s => s.isVisible && s.id !== 'sec-1' && s.id !== 'sec-2' && s.id !== 'sec-3' && s.id !== 'sec-4' && s.id !== 'sec-5' && s.id !== 'sec-6' && s.id !== 'sec-7' && s.id !== 'sec-8' && s.id !== 'sec-9' && s.id !== 'sec-10').map(s => (
               <div key={s.id} className="py-20 px-8 max-w-6xl mx-auto border-t border-slate-100">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">{s.title}</h2>
                    <span className="text-xs font-mono text-slate-400 uppercase border border-slate-200 px-2 py-1 rounded tracking-wider">
                      {s.type}
                    </span>
                 </div>
                 <div className="h-64 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-3 hover:bg-slate-100 transition-colors">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                      <Layout size={32} className="opacity-50 text-indigo-400" />
                    </div>
                    <span className="font-medium">Dynamic {s.type} Content</span>
                 </div>
               </div>
            ))}

            <footer className="bg-slate-900 text-white py-16 border-t border-slate-800">
              <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
                 <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                      </div>
                      <span className="text-xl font-bold">Sympose AI</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed max-w-sm">
                      Empowering scientific communities with next-generation conference management tools.
                    </p>
                 </div>
                 <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Event Details</h4>
                    <ul className="space-y-3 text-slate-400">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{config.date}</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{config.location}</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{config.title}</li>
                    </ul>
                 </div>
                 <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Quick Links</h4>
                    <ul className="space-y-3 text-slate-400">
                      <li className="hover:text-white cursor-pointer transition-colors">Register Now</li>
                      <li className="hover:text-white cursor-pointer transition-colors">Submit Paper</li>
                      <li className="hover:text-white cursor-pointer transition-colors">Contact Support</li>
                    </ul>
                 </div>
              </div>
              <div className="max-w-6xl mx-auto px-8 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
                © 2024 Sympose AI. All rights reserved.
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
};

const XIcon = ({size, className}:{size: number, className?: string}) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
)

export default PageBuilder;