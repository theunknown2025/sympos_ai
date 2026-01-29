import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Plus, Trash2, Loader2, Calendar, MapPin, Search, ExternalLink, Info, FileText, Hash, Users, Building, Globe, Award, ClipboardList, Send, UserCheck, Tag, AlignLeft, Eye, Image, Palette, Layers, Clock, Maximize2, Edit } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserLandingPages } from '../../../services/landingPageService';
import { getUserRegistrationForms } from '../../../services/registrationFormService';
import { getUserEvaluationForms } from '../../../services/evaluationFormService';
import { getUserCertificateTemplates } from '../../../services/certificateTemplateService';
import { getCommittees } from '../../../services/committeeService';
import { getEvent, updateEvent } from '../../../services/eventService';
import { SavedLandingPage } from '../../../services/landingPageService';
import { RegistrationForm, EvaluationForm, Committee, EventPartner, EventDate, EventLink, CertificateTemplate, EventBanner } from '../../../types';
import { supabase, TABLES } from '../../../supabase';
import TextEditorModal from './TextEditorModal';

interface EditEventProps {
  eventId: string;
  onSave: () => void;
  onCancel: () => void;
}

const EditEvent: React.FC<EditEventProps> = ({ eventId, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [fields, setFields] = useState<string[]>([]);
  const [fieldInput, setFieldInput] = useState('');
  const [partners, setPartners] = useState<EventPartner[]>([]);
  const [dates, setDates] = useState<EventDate[]>([]);
  const [location, setLocation] = useState('');
  const [links, setLinks] = useState<EventLink[]>([]);
  const [selectedLandingPageIds, setSelectedLandingPageIds] = useState<string[]>([]);
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<string[]>([]);
  const [selectedRegistrationFormIds, setSelectedRegistrationFormIds] = useState<string[]>([]);
  const [selectedSubmissionFormIds, setSelectedSubmissionFormIds] = useState<string[]>([]);
  const [selectedEvaluationFormIds, setSelectedEvaluationFormIds] = useState<string[]>([]);
  const [selectedCommitteeIds, setSelectedCommitteeIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [landingPages, setLandingPages] = useState<SavedLandingPage[]>([]);
  const [certificates, setCertificates] = useState<CertificateTemplate[]>([]);
  const [registrationForms, setRegistrationForms] = useState<RegistrationForm[]>([]);
  const [evaluationForms, setEvaluationForms] = useState<EvaluationForm[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerSearchResults, setPartnerSearchResults] = useState<{ name: string; entityId?: string }[]>([]);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  
  // Banner configuration
  const [banner, setBanner] = useState<EventBanner>({
    type: 'gradient',
    gradientColors: {
      from: '#4f46e5',
      to: '#7c3aed',
      direction: 'to-r'
    }
  });
  const bannerImageInputRef = useRef<HTMLInputElement>(null);

  // Load event data and related resources
  useEffect(() => {
    if (currentUser && eventId) {
      loadEventData();
    }
  }, [currentUser, eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // Load event data
      const eventData = await getEvent(eventId);
      if (!eventData) {
        throw new Error('Event not found');
      }

      // Pre-populate form fields
      setName(eventData.name || '');
      setDescription(eventData.description || '');
      setKeywords(eventData.keywords || []);
      setFields(eventData.fields || []);
      setPartners(eventData.partners || []);
      setDates(eventData.dates || []);
      setLocation(eventData.location || '');
      setLinks(eventData.links || []);
      setSelectedLandingPageIds(eventData.landingPageIds || []);
      setSelectedCertificateIds(eventData.certificateTemplateIds || []);
      setSelectedRegistrationFormIds(eventData.registrationFormIds || []);
      setSelectedSubmissionFormIds(eventData.submissionFormIds || []);
      setSelectedEvaluationFormIds(eventData.evaluationFormIds || []);
      setSelectedCommitteeIds(eventData.committeeIds || []);
      setBanner(eventData.banner || {
        type: 'gradient',
        gradientColors: {
          from: '#4f46e5',
          to: '#7c3aed',
          direction: 'to-r'
        }
      });

      // Load related resources
      const [pages, certs, forms, evalForms, comms] = await Promise.all([
        getUserLandingPages(currentUser.id),
        getUserCertificateTemplates(currentUser.id),
        getUserRegistrationForms(currentUser.id),
        getUserEvaluationForms(currentUser.id),
        getCommittees(currentUser.id),
      ]);
      
      setLandingPages(pages);
      setCertificates(certs);
      setRegistrationForms(forms);
      setEvaluationForms(evalForms);
      setCommittees(comms);
    } catch (err: any) {
      console.error('Error loading event data:', err);
      setError(err.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  // Search for entities in form submissions
  const searchEntities = async (query: string) => {
    if (!query.trim() || !currentUser?.id) {
      setPartnerSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.FORM_SUBMISSIONS)
        .select('entity_name')
        .eq('user_id', currentUser.id)
        .not('entity_name', 'is', null)
        .ilike('entity_name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      const uniqueEntities = Array.from(
        new Set((data || []).map((d: any) => d.entity_name).filter(Boolean))
      ).map(name => ({ name, entityId: undefined }));

      setPartnerSearchResults(uniqueEntities);
    } catch (err) {
      console.error('Error searching entities:', err);
      setPartnerSearchResults([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchEntities(partnerSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [partnerSearchQuery]);

  const handleKeywordInputChange = (value: string) => {
    setKeywordInput(value);
    
    // Check if comma was just typed
    if (value.endsWith(',')) {
      const keywordToAdd = value.slice(0, -1).trim();
      if (keywordToAdd && !keywords.includes(keywordToAdd)) {
        setKeywords([...keywords, keywordToAdd]);
        setKeywordInput('');
      } else if (keywordToAdd === '') {
        setKeywordInput('');
      }
    }
  };

  const handleAddKeyword = () => {
    const input = keywordInput.trim();
    if (!input) return;

    // Split by comma and process each keyword
    const newKeywords = input
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0 && !keywords.includes(k));

    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleFieldInputChange = (value: string) => {
    setFieldInput(value);
    
    // Check if comma was just typed
    if (value.endsWith(',')) {
      const fieldToAdd = value.slice(0, -1).trim();
      if (fieldToAdd && !fields.includes(fieldToAdd)) {
        setFields([...fields, fieldToAdd]);
        setFieldInput('');
      } else if (fieldToAdd === '') {
        setFieldInput('');
      }
    }
  };

  const handleAddField = () => {
    const input = fieldInput.trim();
    if (!input) return;

    // Split by comma and process each field
    const newFields = input
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0 && !fields.includes(f));

    if (newFields.length > 0) {
      setFields([...fields, ...newFields]);
      setFieldInput('');
    }
  };

  const handleRemoveField = (field: string) => {
    setFields(fields.filter(f => f !== field));
  };

  const handleAddPartner = (partner: { name: string; entityId?: string }) => {
    const newPartner: EventPartner = {
      id: `partner-${Date.now()}`,
      name: partner.name,
      entityId: partner.entityId,
    };
    if (!partners.some(p => p.name === partner.name)) {
      setPartners([...partners, newPartner]);
      setNewPartnerName('');
      setPartnerSearchQuery('');
      setShowPartnersModal(false);
    }
  };

  const handleAddNewPartner = () => {
    if (newPartnerName.trim()) {
      handleAddPartner({ name: newPartnerName.trim() });
    }
  };

  const handleRemovePartner = (partnerId: string) => {
    setPartners(partners.filter(p => p.id !== partnerId));
  };

  const handleAddDate = () => {
    const newDate: EventDate = {
      id: `date-${Date.now()}`,
      startDate: '',
      endDate: '',
    };
    setDates([...dates, newDate]);
  };

  const handleUpdateDate = (dateId: string, field: 'startDate' | 'endDate', value: string) => {
    setDates(dates.map(d => d.id === dateId ? { ...d, [field]: value } : d));
  };

  const handleRemoveDate = (dateId: string) => {
    setDates(dates.filter(d => d.id !== dateId));
  };

  const handleAddLink = () => {
    const newLink: EventLink = {
      id: `link-${Date.now()}`,
      name: '',
      url: '',
    };
    setLinks([...links, newLink]);
  };

  const handleUpdateLink = (linkId: string, field: 'name' | 'url', value: string) => {
    setLinks(links.map(l => l.id === linkId ? { ...l, [field]: value } : l));
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks(links.filter(l => l.id !== linkId));
  };

  const handleAddLandingPage = (landingPageId: string) => {
    if (!selectedLandingPageIds.includes(landingPageId)) {
      setSelectedLandingPageIds([...selectedLandingPageIds, landingPageId]);
    }
  };

  const handleRemoveLandingPage = (landingPageId: string) => {
    setSelectedLandingPageIds(selectedLandingPageIds.filter(id => id !== landingPageId));
  };

  const handleAddCertificate = (certificateId: string) => {
    if (!selectedCertificateIds.includes(certificateId)) {
      setSelectedCertificateIds([...selectedCertificateIds, certificateId]);
    }
  };

  const handleRemoveCertificate = (certificateId: string) => {
    setSelectedCertificateIds(selectedCertificateIds.filter(id => id !== certificateId));
  };

  const handleAddRegistrationForm = (formId: string) => {
    if (!selectedRegistrationFormIds.includes(formId)) {
      setSelectedRegistrationFormIds([...selectedRegistrationFormIds, formId]);
    }
  };

  const handleRemoveRegistrationForm = (formId: string) => {
    setSelectedRegistrationFormIds(selectedRegistrationFormIds.filter(id => id !== formId));
  };

  const handleAddSubmissionForm = (formId: string) => {
    if (!selectedSubmissionFormIds.includes(formId)) {
      setSelectedSubmissionFormIds([...selectedSubmissionFormIds, formId]);
    }
  };

  const handleRemoveSubmissionForm = (formId: string) => {
    setSelectedSubmissionFormIds(selectedSubmissionFormIds.filter(id => id !== formId));
  };

  const handleAddEvaluationForm = (formId: string) => {
    if (!selectedEvaluationFormIds.includes(formId)) {
      setSelectedEvaluationFormIds([...selectedEvaluationFormIds, formId]);
    }
  };

  const handleRemoveEvaluationForm = (formId: string) => {
    setSelectedEvaluationFormIds(selectedEvaluationFormIds.filter(id => id !== formId));
  };

  const handleAddCommittee = (committeeId: string) => {
    if (!selectedCommitteeIds.includes(committeeId)) {
      setSelectedCommitteeIds([...selectedCommitteeIds, committeeId]);
    }
  };

  const handleRemoveCommittee = (committeeId: string) => {
    setSelectedCommitteeIds(selectedCommitteeIds.filter(id => id !== committeeId));
  };

  // Helper function to remove prefix from form title
  const removePrefix = (title: string, prefix: string): string => {
    if (title.startsWith(prefix)) {
      return title.substring(prefix.length).trim();
    }
    return title;
  };

  // Filter forms by prefix
  const registrationFormsFiltered = registrationForms.filter(form => 
    form.title.startsWith('Reg')
  );
  
  const submissionFormsFiltered = registrationForms.filter(form => 
    form.title.startsWith('Sub')
  );

  const evaluationFormsFiltered = evaluationForms.filter(form => 
    form.title.startsWith('Eval')
  );

  const validateEvent = (): boolean => {
    if (!name.trim()) {
      setError('Event name is required');
      return false;
    }
    
    if (!currentUser?.id) {
      setError('User not authenticated');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEvent()) {
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      const eventData = {
        name: name.trim(),
        description: description.trim() || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        fields: fields.length > 0 ? fields : undefined,
        partners: partners.length > 0 ? partners : undefined,
        dates: dates.length > 0 ? dates.filter(d => d.startDate && d.endDate) : undefined,
        location: location.trim() || undefined,
        links: links.length > 0 ? links.filter(l => l.name && l.url) : undefined,
        landingPageIds: selectedLandingPageIds,
        registrationFormIds: selectedRegistrationFormIds,
        submissionFormIds: selectedSubmissionFormIds,
        evaluationFormIds: selectedEvaluationFormIds,
        certificateTemplateIds: selectedCertificateIds,
        committeeIds: selectedCommitteeIds,
        banner: banner,
      };

      await updateEvent(eventId, eventData);
      onSave();
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError(err.message || 'Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!validateEvent()) {
      return;
    }
    setShowPreview(true);
  };

  // Helper function to get banner style
  const getBannerStyle = () => {
    if (!banner) {
      return { background: 'linear-gradient(to right, #4f46e5, #7c3aed)' };
    }
    
    if (banner.type === 'image' && banner.imageUrl) {
      const positionY = banner.imagePositionY !== undefined ? banner.imagePositionY : 50;
      return { 
        backgroundImage: `url(${banner.imageUrl})`,
        backgroundPosition: `center ${positionY}%`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    if (banner.type === 'color' && banner.color) {
      return { backgroundColor: banner.color };
    }
    
    if (banner.type === 'gradient' && banner.gradientColors) {
      const direction = banner.gradientColors.direction === 'to-r' ? 'to right' :
                       banner.gradientColors.direction === 'to-l' ? 'to left' :
                       banner.gradientColors.direction === 'to-b' ? 'to bottom' :
                       banner.gradientColors.direction === 'to-t' ? 'to top' :
                       banner.gradientColors.direction === 'to-br' ? 'to bottom right' :
                       banner.gradientColors.direction === 'to-bl' ? 'to bottom left' :
                       banner.gradientColors.direction === 'to-tr' ? 'to top right' :
                       'to top left';
      return {
        background: `linear-gradient(${direction}, ${banner.gradientColors.from}, ${banner.gradientColors.to})`
      };
    }
    
    return { background: 'linear-gradient(to right, #4f46e5, #7c3aed)' };
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const handleOpenFullScreen = () => {
    // Create a new window with the preview content
    const previewWindow = window.open('', '_blank', 'width=1920,height=1080');
    if (!previewWindow) return;

    // Get banner style as CSS string
    const bannerStyle = getBannerStyle();
    const bannerStyleString = Object.entries(bannerStyle)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
    
    // Get image position for inline style
    const imagePositionY = banner.type === 'image' && banner.imagePositionY !== undefined 
      ? banner.imagePositionY 
      : 50;

    // Generate the preview HTML
    const previewHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Preview - ${name || 'Untitled Event'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div class="min-h-screen bg-slate-50">
          <!-- Banner Section -->
          <div class="relative text-white" style="${bannerStyleString}">
            <div class="absolute inset-0 bg-black opacity-20"></div>
            <div class="relative max-w-7xl mx-auto px-6 py-20">
              <h1 class="text-5xl font-bold mb-4 drop-shadow-lg">${(name || 'Event Name').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
            </div>
          </div>

          <!-- Content Section -->
          <div class="max-w-7xl mx-auto px-6 py-12">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- Main Content -->
              <div class="lg:col-span-2 space-y-8">
                ${description ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="prose max-w-none">
                      <div class="text-slate-700 text-lg leading-relaxed">${description}</div>
                    </div>
                  </section>
                ` : ''}

                ${fields.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-4">
                      <h2 class="text-xl font-semibold text-slate-800">Fields</h2>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      ${fields.map(field => `<span class="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">${field.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`).join('')}
                    </div>
                  </section>
                ` : ''}

                ${keywords.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-4">
                      <h2 class="text-xl font-semibold text-slate-800">Keywords</h2>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      ${keywords.map(keyword => `<span class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">${keyword.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`).join('')}
                    </div>
                  </section>
                ` : ''}

                ${(dates.filter(d => d.startDate && d.endDate).length > 0 || location) ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      ${dates.filter(d => d.startDate && d.endDate).length > 0 ? `
                        <div>
                          <div class="flex items-center gap-2 mb-3">
                            <h2 class="text-xl font-semibold text-slate-800">Event Dates</h2>
                          </div>
                          <div class="space-y-3">
                            ${dates.filter(d => d.startDate && d.endDate).map((dateRange, index) => `
                              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div>
                                  <p class="font-medium text-slate-800">
                                    ${formatDate(dateRange.startDate)}
                                    ${dateRange.endDate && dateRange.endDate !== dateRange.startDate ? ` - ${formatDate(dateRange.endDate)}` : ''}
                                  </p>
                                </div>
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}
                      ${location ? `
                        <div>
                          <div class="flex items-center gap-2 mb-3">
                            <h2 class="text-xl font-semibold text-slate-800">Location</h2>
                          </div>
                          <p class="text-slate-700">${location.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                        </div>
                      ` : ''}
                    </div>
                  </section>
                ` : ''}

                ${partners.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-4">
                      <h2 class="text-xl font-semibold text-slate-800">Partners</h2>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      ${partners.map((partner, index) => `
                        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p class="font-medium text-slate-800">${partner.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                        </div>
                      `).join('')}
                    </div>
                  </section>
                ` : ''}

                ${links.filter(l => l.name && l.url).length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-4">
                      <h2 class="text-xl font-semibold text-slate-800">Links</h2>
                    </div>
                    <div class="space-y-2">
                      ${links.filter(l => l.name && l.url).map((link, index) => `
                        <a href="${link.url.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors">
                          <span class="font-medium text-slate-800 hover:text-indigo-600">${link.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                        </a>
                      `).join('')}
                    </div>
                  </section>
                ` : ''}

                ${selectedCommitteeIds.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-4">
                      <h2 class="text-xl font-semibold text-slate-800">Committees</h2>
                    </div>
                    <div class="space-y-4">
                      ${committees.filter(c => selectedCommitteeIds.includes(c.id)).map((committee) => `
                        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <h3 class="font-semibold text-slate-800 mb-2">${committee.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h3>
                          ${committee.description ? `<p class="text-sm text-slate-600 mb-3">${committee.description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
                          ${committee.fieldsOfIntervention && committee.fieldsOfIntervention.length > 0 ? `
                            <div class="flex flex-wrap gap-2">
                              ${committee.fieldsOfIntervention.map((field, index) => `
                                <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                  ${(typeof field === 'string' ? field : field.name || field).replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                                </span>
                              `).join('')}
                            </div>
                          ` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </section>
                ` : ''}
              </div>

              <!-- Sidebar -->
              <div class="space-y-6">
                ${selectedLandingPageIds.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-3">
                      <h2 class="text-lg font-semibold text-slate-800">Landing Pages</h2>
                    </div>
                    <p class="text-sm text-slate-600">
                      ${selectedLandingPageIds.length} landing page${selectedLandingPageIds.length !== 1 ? 's' : ''} configured
                    </p>
                  </section>
                ` : ''}

                ${selectedRegistrationFormIds.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-3">
                      <h2 class="text-lg font-semibold text-slate-800">Registration Forms</h2>
                    </div>
                    <p class="text-sm text-slate-600">
                      ${selectedRegistrationFormIds.length} form${selectedRegistrationFormIds.length !== 1 ? 's' : ''} configured
                    </p>
                  </section>
                ` : ''}

                ${selectedSubmissionFormIds.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-3">
                      <h2 class="text-lg font-semibold text-slate-800">Submission Forms</h2>
                    </div>
                    <p class="text-sm text-slate-600">
                      ${selectedSubmissionFormIds.length} form${selectedSubmissionFormIds.length !== 1 ? 's' : ''} configured
                    </p>
                  </section>
                ` : ''}

                ${selectedEvaluationFormIds.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-3">
                      <h2 class="text-lg font-semibold text-slate-800">Evaluation Forms</h2>
                    </div>
                    <p class="text-sm text-slate-600">
                      ${selectedEvaluationFormIds.length} form${selectedEvaluationFormIds.length !== 1 ? 's' : ''} configured
                    </p>
                  </section>
                ` : ''}

                ${selectedCertificateIds.length > 0 ? `
                  <section class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center gap-2 mb-3">
                      <h2 class="text-lg font-semibold text-slate-800">Certificates</h2>
                    </div>
                    <p class="text-sm text-slate-600">
                      ${selectedCertificateIds.length} template${selectedCertificateIds.length !== 1 ? 's' : ''} configured
                    </p>
                  </section>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: General Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Info className="text-indigo-600" size={20} />
              General Information
            </h2>
            
            <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Tag className="text-slate-500" size={16} />
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter event name"
                required
              />
            </div>

            {/* Description Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                  <AlignLeft className="text-slate-500" size={16} />
                  Description
                </label>
                <button
                  type="button"
                  onClick={() => setShowTextEditor(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Edit size={14} />
                  Use Text Editor
                </button>
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter event description"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Hash className="text-slate-500" size={16} />
                Keywords
              </label>
              {keywords.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {keywords.map(keyword => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => handleKeywordInputChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add keywords (type comma to add)"
              />
            </div>

            {/* Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Tag className="text-slate-500" size={16} />
                Fields
              </label>
              {fields.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {fields.map(field => (
                    <span
                      key={field}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm"
                    >
                      {field}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={fieldInput}
                onChange={(e) => handleFieldInputChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddField();
                  }
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add fields (type comma to add)"
              />
            </div>

            {/* Partners */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Building className="text-slate-500" size={16} />
                Partners
              </label>
              {partners.length > 0 && (
                <div className="mb-3 space-y-2">
                  {partners.map(partner => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <span className="text-sm font-medium text-slate-700">{partner.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePartner(partner.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowPartnersModal(true)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Partner
              </button>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="text-slate-500" size={16} />
                Dates
              </label>
              {dates.length > 0 && (
                <div className="mb-3 space-y-3">
                  {dates.map(date => (
                    <div
                      key={date.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={date.startDate}
                            onChange={(e) => handleUpdateDate(date.id, 'startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">End Date</label>
                          <input
                            type="date"
                            value={date.endDate}
                            onChange={(e) => handleUpdateDate(date.id, 'endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(date.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors mt-6"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleAddDate}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Date Range
              </button>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="text-slate-500" size={16} />
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter event location"
                />
              </div>
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <ExternalLink className="text-slate-500" size={16} />
                Links
              </label>
              {links.length > 0 && (
                <div className="mb-3 space-y-3">
                  {links.map(link => (
                    <div
                      key={link.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Link Name</label>
                          <input
                            type="text"
                            value={link.name}
                            onChange={(e) => handleUpdateLink(link.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="e.g., Website"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">URL</label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="https://example.com"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(link.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors mt-6"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleAddLink}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Link
              </button>
            </div>
          </div>
          </div>

          {/* Right Column: Organization */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Building className="text-indigo-600" size={20} />
              Organization
            </h2>
            
            <div className="space-y-6">
              {/* Banner Manager */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Layers className="text-slate-500" size={16} />
                  Banner Manager
                </label>
                
                {/* Banner Type Selection */}
                <div className="mb-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBanner({ ...banner, type: 'image' })}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
                        banner.type === 'image'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Image size={14} className="inline mr-1" />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setBanner({ ...banner, type: 'color' })}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
                        banner.type === 'color'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Palette size={14} className="inline mr-1" />
                      Color
                    </button>
                    <button
                      type="button"
                      onClick={() => setBanner({ 
                        ...banner, 
                        type: 'gradient',
                        gradientColors: banner.gradientColors || {
                          from: '#4f46e5',
                          to: '#7c3aed',
                          direction: 'to-r'
                        }
                      })}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
                        banner.type === 'gradient'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Layers size={14} className="inline mr-1" />
                      Gradient
                    </button>
                  </div>
                </div>

                {/* Image Banner */}
                {banner.type === 'image' && (
                  <div className="space-y-3">
                    <input
                      ref={bannerImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const imageUrl = event.target?.result as string;
                            setBanner({ ...banner, imageUrl });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={banner.imageUrl || ''}
                        onChange={(e) => setBanner({ ...banner, imageUrl: e.target.value })}
                        placeholder="Image URL or upload file"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => bannerImageInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                      >
                        Upload
                      </button>
                    </div>
                    {banner.imageUrl && (
                      <div className="space-y-3">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200">
                          <div 
                            className="w-full h-full"
                            style={{
                              backgroundImage: `url(${banner.imageUrl})`,
                              backgroundPosition: `center ${banner.imagePositionY !== undefined ? banner.imagePositionY : 50}%`,
                              backgroundSize: 'cover',
                              backgroundRepeat: 'no-repeat'
                            }}
                          ></div>
                          <button
                            type="button"
                            onClick={() => setBanner({ ...banner, imageUrl: undefined })}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-2">
                            Vertical Position: {banner.imagePositionY !== undefined ? banner.imagePositionY : 50}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={banner.imagePositionY !== undefined ? banner.imagePositionY : 50}
                            onChange={(e) => setBanner({ ...banner, imagePositionY: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Top</span>
                            <span>Center</span>
                            <span>Bottom</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Color Banner */}
                {banner.type === 'color' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={banner.color || '#4f46e5'}
                        onChange={(e) => setBanner({ ...banner, color: e.target.value })}
                        className="w-16 h-10 border border-slate-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={banner.color || '#4f46e5'}
                        onChange={(e) => setBanner({ ...banner, color: e.target.value })}
                        placeholder="#4f46e5"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                    <div 
                      className="w-full h-24 rounded-lg border border-slate-200"
                      style={{ backgroundColor: banner.color || '#4f46e5' }}
                    ></div>
                  </div>
                )}

                {/* Gradient Banner */}
                {banner.type === 'gradient' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">From Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={banner.gradientColors?.from || '#4f46e5'}
                            onChange={(e) => setBanner({
                              ...banner,
                              gradientColors: {
                                ...banner.gradientColors!,
                                from: e.target.value
                              }
                            })}
                            className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={banner.gradientColors?.from || '#4f46e5'}
                            onChange={(e) => setBanner({
                              ...banner,
                              gradientColors: {
                                ...banner.gradientColors!,
                                from: e.target.value
                              }
                            })}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">To Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={banner.gradientColors?.to || '#7c3aed'}
                            onChange={(e) => setBanner({
                              ...banner,
                              gradientColors: {
                                ...banner.gradientColors!,
                                to: e.target.value
                              }
                            })}
                            className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={banner.gradientColors?.to || '#7c3aed'}
                            onChange={(e) => setBanner({
                              ...banner,
                              gradientColors: {
                                ...banner.gradientColors!,
                                to: e.target.value
                              }
                            })}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Direction</label>
                      <select
                        value={banner.gradientColors?.direction || 'to-r'}
                        onChange={(e) => setBanner({
                          ...banner,
                          gradientColors: {
                            ...banner.gradientColors!,
                            direction: e.target.value as any
                          }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="to-r">Left to Right</option>
                        <option value="to-l">Right to Left</option>
                        <option value="to-b">Top to Bottom</option>
                        <option value="to-t">Bottom to Top</option>
                        <option value="to-br">Top Left to Bottom Right</option>
                        <option value="to-bl">Top Right to Bottom Left</option>
                        <option value="to-tr">Bottom Left to Top Right</option>
                        <option value="to-tl">Bottom Right to Top Left</option>
                      </select>
                    </div>
                    <div 
                      className="w-full h-24 rounded-lg border border-slate-200"
                      style={{
                        background: `linear-gradient(${
                          banner.gradientColors?.direction === 'to-r' ? 'to right' :
                          banner.gradientColors?.direction === 'to-l' ? 'to left' :
                          banner.gradientColors?.direction === 'to-b' ? 'to bottom' :
                          banner.gradientColors?.direction === 'to-t' ? 'to top' :
                          banner.gradientColors?.direction === 'to-br' ? 'to bottom right' :
                          banner.gradientColors?.direction === 'to-bl' ? 'to bottom left' :
                          banner.gradientColors?.direction === 'to-tr' ? 'to top right' :
                          'to top left'
                        }, ${banner.gradientColors?.from || '#4f46e5'}, ${banner.gradientColors?.to || '#7c3aed'})`
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Landing Page Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Globe className="text-slate-500" size={16} />
                  Landing Pages
                </label>
                  
                  {selectedLandingPageIds.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {selectedLandingPageIds.map(pageId => {
                        const page = landingPages.find(p => p.id === pageId);
                        return page ? (
                          <div
                            key={pageId}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <span className="text-sm font-medium text-slate-700">{page.title}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLandingPage(pageId)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddLandingPage(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Add a landing page</option>
                      {landingPages
                        .filter(page => !selectedLandingPageIds.includes(page.id))
                        .map(page => (
                          <option key={page.id} value={page.id}>
                            {page.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  {landingPages.length === 0 && (
                    <p className="mt-2 text-sm text-slate-500">
                      No landing pages available. Create one in the Landing Pages section.
                    </p>
                  )}
                </div>

              {/* Certificate Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Award className="text-slate-500" size={16} />
                  Certificates
                </label>
                  
                  {selectedCertificateIds.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {selectedCertificateIds.map(certId => {
                        const cert = certificates.find(c => c.id === certId);
                        return cert ? (
                          <div
                            key={certId}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <span className="text-sm font-medium text-slate-700">{cert.title}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCertificate(certId)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddCertificate(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Add a certificate template</option>
                      {certificates
                        .filter(cert => !selectedCertificateIds.includes(cert.id))
                        .map(cert => (
                          <option key={cert.id} value={cert.id}>
                            {cert.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  {certificates.length === 0 && (
                    <p className="mt-2 text-sm text-slate-500">
                      No certificate templates available. Create one in the Certificates section.
                    </p>
                  )}
                </div>

              {/* Registration Form Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <ClipboardList className="text-slate-500" size={16} />
                  Registration Forms
                </label>
              
              {selectedRegistrationFormIds.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedRegistrationFormIds.map(formId => {
                    const form = registrationForms.find(f => f.id === formId);
                    return form ? (
                      <div
                        key={formId}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {removePrefix(form.title, 'Reg')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRegistrationForm(formId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddRegistrationForm(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Add a registration form</option>
                    {registrationFormsFiltered
                      .filter(form => !selectedRegistrationFormIds.includes(form.id))
                      .map(form => (
                        <option key={form.id} value={form.id}>
                          {removePrefix(form.title, 'Reg')}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Submission Form Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Send className="text-slate-500" size={16} />
                  Submission Forms
                </label>
              
              {selectedSubmissionFormIds.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedSubmissionFormIds.map(formId => {
                    const form = registrationForms.find(f => f.id === formId);
                    return form ? (
                      <div
                        key={formId}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {removePrefix(form.title, 'Sub')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubmissionForm(formId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSubmissionForm(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Add a submission form</option>
                    {submissionFormsFiltered
                      .filter(form => !selectedSubmissionFormIds.includes(form.id))
                      .map(form => (
                        <option key={form.id} value={form.id}>
                          {removePrefix(form.title, 'Sub')}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Evaluation Form Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="text-orange-600" size={16} />
                  Evaluation Forms
                </label>
              
              {selectedEvaluationFormIds.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedEvaluationFormIds.map(formId => {
                    const form = evaluationForms.find(f => f.id === formId);
                    return form ? (
                      <div
                        key={formId}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {removePrefix(form.title, 'Eval')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvaluationForm(formId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddEvaluationForm(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Add an evaluation form</option>
                    {evaluationFormsFiltered
                      .filter(form => !selectedEvaluationFormIds.includes(form.id))
                      .map(form => (
                        <option key={form.id} value={form.id}>
                          {removePrefix(form.title, 'Eval')}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Committee Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <UserCheck className="text-slate-500" size={16} />
                  Committees
                </label>
              
              {selectedCommitteeIds.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedCommitteeIds.map(committeeId => {
                    const committee = committees.find(c => c.id === committeeId);
                    return committee ? (
                      <div
                        key={committeeId}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <span className="text-sm font-medium text-slate-700">{committee.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCommittee(committeeId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddCommittee(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Add a committee</option>
                    {committees
                      .filter(committee => !selectedCommitteeIds.includes(committee.id))
                      .map(committee => (
                        <option key={committee.id} value={committee.id}>
                          {committee.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save size={16} />
                Update Event
              </>
            )}
          </button>
        </div>
      </form>

      {/* Partners Modal */}
      {showPartnersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Add Partner</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowPartnersModal(false);
                    setPartnerSearchQuery('');
                    setNewPartnerName('');
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {/* Search Existing Entities */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search Existing Entities
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={partnerSearchQuery}
                      onChange={(e) => setPartnerSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search entities..."
                    />
                  </div>
                  {partnerSearchResults.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {partnerSearchResults.map((entity, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddPartner(entity)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700"
                        >
                          {entity.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Or Add New */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or add new</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Partner Name
                  </label>
                  <input
                    type="text"
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter partner name"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPartnersModal(false);
                  setPartnerSearchQuery('');
                  setNewPartnerName('');
                }}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewPartner}
                disabled={!newPartnerName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full my-8 flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Event Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenFullScreen}
                  className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Open in full screen"
                  aria-label="Open in full screen"
                >
                  <Maximize2 size={20} />
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  title="Close preview"
                  aria-label="Close preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="min-h-screen bg-slate-50">
                {/* Banner Section */}
                <div className="relative text-white" style={getBannerStyle()}>
                  <div className="absolute inset-0 bg-black opacity-20"></div>
                  <div className="relative max-w-7xl mx-auto px-6 py-20">
                    <h1 className="text-5xl font-bold drop-shadow-lg">{name || 'Event Name'}</h1>
                  </div>
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-6 py-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Description */}
                      {description && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-semibold text-slate-800">Description</h2>
                          </div>
                          <div 
                            className="text-slate-700 leading-relaxed prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: description }}
                          />
                        </section>
                      )}

                      {/* Keywords */}
                      {keywords.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Hash className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-semibold text-slate-800">Keywords</h2>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Fields */}
                      {fields.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Tag className="w-5 h-5 text-purple-600" />
                            <h2 className="text-xl font-semibold text-slate-800">Fields</h2>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {fields.map((field, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Dates */}
                      {dates.filter(d => d.startDate && d.endDate).length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-semibold text-slate-800">Event Dates</h2>
                          </div>
                          <div className="space-y-3">
                            {dates.filter(d => d.startDate && d.endDate).map((dateRange, index) => (
                              <div key={dateRange.id || index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <div>
                                  <p className="font-medium text-slate-800">
                                    {formatDate(dateRange.startDate)}
                                    {dateRange.endDate && dateRange.endDate !== dateRange.startDate && (
                                      <> - {formatDate(dateRange.endDate)}</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Partners */}
                      {partners.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Building className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-semibold text-slate-800">Partners</h2>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {partners.map((partner, index) => (
                              <div
                                key={partner.id || index}
                                className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <p className="font-medium text-slate-800">{partner.name}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Links */}
                      {links.filter(l => l.name && l.url).length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <ExternalLink className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-semibold text-slate-800">Links</h2>
                          </div>
                          <div className="space-y-2">
                            {links.filter(l => l.name && l.url).map((link, index) => (
                              <a
                                key={link.id || index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors group"
                              >
                                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                                <span className="font-medium text-slate-800 group-hover:text-indigo-600">
                                  {link.name}
                                </span>
                              </a>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Committees */}
                      {selectedCommitteeIds.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <UserCheck className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-semibold text-slate-800">Committees</h2>
                          </div>
                          <div className="space-y-4">
                            {committees
                              .filter(c => selectedCommitteeIds.includes(c.id))
                              .map((committee) => (
                                <div key={committee.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                  <h3 className="font-semibold text-slate-800 mb-2">{committee.name}</h3>
                                  {committee.description && (
                                    <p className="text-sm text-slate-600 mb-3">{committee.description}</p>
                                  )}
                                  {committee.fieldsOfIntervention && committee.fieldsOfIntervention.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {committee.fieldsOfIntervention.map((field, index) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                                        >
                                          {field.name || field}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </section>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Location */}
                      {location && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Location</h2>
                          </div>
                          <p className="text-slate-700">{location}</p>
                        </section>
                      )}

                      {/* Landing Pages */}
                      {selectedLandingPageIds.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Landing Pages</h2>
                          </div>
                          <p className="text-sm text-slate-600">
                            {selectedLandingPageIds.length} landing page{selectedLandingPageIds.length !== 1 ? 's' : ''} configured
                          </p>
                        </section>
                      )}

                      {/* Registration Forms */}
                      {selectedRegistrationFormIds.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <ClipboardList className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Registration Forms</h2>
                          </div>
                          <p className="text-sm text-slate-600">
                            {selectedRegistrationFormIds.length} form{selectedRegistrationFormIds.length !== 1 ? 's' : ''} configured
                          </p>
                        </section>
                      )}

                      {/* Submission Forms */}
                      {selectedSubmissionFormIds.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Send className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Submission Forms</h2>
                          </div>
                          <p className="text-sm text-slate-600">
                            {selectedSubmissionFormIds.length} form{selectedSubmissionFormIds.length !== 1 ? 's' : ''} configured
                          </p>
                        </section>
                      )}

                      {/* Evaluation Forms */}
                      {selectedEvaluationFormIds.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-orange-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Evaluation Forms</h2>
                          </div>
                          <p className="text-sm text-slate-600">
                            {selectedEvaluationFormIds.length} form{selectedEvaluationFormIds.length !== 1 ? 's' : ''} configured
                          </p>
                        </section>
                      )}

                      {/* Certificates */}
                      {selectedCertificateIds.length > 0 && (
                        <section className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Award className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Certificates</h2>
                          </div>
                          <p className="text-sm text-slate-600">
                            {selectedCertificateIds.length} template{selectedCertificateIds.length !== 1 ? 's' : ''} configured
                          </p>
                        </section>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor Modal */}
      <TextEditorModal
        isOpen={showTextEditor}
        onClose={() => setShowTextEditor(false)}
        onInsert={(content) => setDescription(content)}
        initialContent={description}
      />
    </div>
  );
};

export default EditEvent;
