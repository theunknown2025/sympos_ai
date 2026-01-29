import React, { useState, useEffect } from 'react';
import { CertificateTemplate, FormSubmission } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { getUserLandingPages, SavedLandingPage } from '../../../services/landingPageService';
import { getEventSubmissions } from '../../../services/registrationSubmissionService';
import { getUserCertificateTemplates, getCertificateTemplate } from '../../../services/certificateTemplateService';
import { saveCertificate } from '../../../services/certificateService';
import { supabase, TABLES, STORAGE_BUCKETS } from '../../../supabase';
import GenerateCertificateAction from './GenerateCertificateAction';
import SendCertificateByEmailAction from './SendCertificateByEmailAction';
import AddToAccountAction from './AddToAccountAction';
import SendCertificateEmailModal from './SendCertificateEmailModal';
import { 
  Download, 
  Loader2, 
  CheckSquare, 
  Square, 
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

interface GenerateCertificatesProps {}

const GenerateCertificates: React.FC<GenerateCertificatesProps> = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<SavedLandingPage[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [participants, setParticipants] = useState<FormSubmission[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'internal' | 'external'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadEvents(currentUser.id);
      loadTemplates(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedEventId) {
      loadParticipants();
    } else {
      setParticipants([]);
      setSelectedParticipants(new Set());
    }
  }, [selectedEventId]);

  const loadEvents = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      const userEvents = await getUserLandingPages(userId);
      setEvents(userEvents);
    } catch (err: any) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (userId: string) => {
    try {
      setLoadingTemplates(true);
      const userTemplates = await getUserCertificateTemplates(userId);
      setTemplates(userTemplates);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setError('Failed to load certificate templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadParticipants = async () => {
    if (!selectedEventId) return;
    try {
      setLoadingParticipants(true);
      const submissions = await getEventSubmissions(selectedEventId);
      setParticipants(submissions);
      // Auto-select all participants
      setSelectedParticipants(new Set(submissions.map(s => s.id)));
    } catch (err: any) {
      setError('Failed to load participants');
      console.error(err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredParticipants();
    const filteredIds = new Set(filtered.map(p => p.id));
    const allFilteredSelected = filtered.every(p => selectedParticipants.has(p.id));
    
    if (allFilteredSelected) {
      // Deselect all filtered participants
      setSelectedParticipants(prev => {
        const newSet = new Set(prev);
        filteredIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all filtered participants
      setSelectedParticipants(prev => {
        const newSet = new Set(prev);
        filteredIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  const getParticipantName = (submission: FormSubmission): string => {
    return submission.generalInfo?.name || 
           submission.submittedBy || 
           submission.answers['general_name'] as string || 
           'Participant';
  };

  const isInternalRegistration = (submission: FormSubmission): boolean => {
    return !!submission.participantUserId;
  };

  const getFilteredParticipants = (): FormSubmission[] => {
    if (registrationFilter === 'all') {
      return participants;
    } else if (registrationFilter === 'internal') {
      return participants.filter(p => isInternalRegistration(p));
    } else {
      return participants.filter(p => !isInternalRegistration(p));
    }
  };

  const getFieldValue = (submission: FormSubmission, fieldName: string): string => {
    if (fieldName === 'name') {
      return getParticipantName(submission);
    }
    if (fieldName === 'email') {
      return submission.generalInfo?.email || submission.answers['general_email'] as string || '';
    }
    if (fieldName === 'organization') {
      return submission.generalInfo?.organization || submission.answers['general_organization'] as string || '';
    }
    if (fieldName === 'phone') {
      return submission.generalInfo?.phone || submission.answers['general_phone'] as string || '';
    }
    if (fieldName === 'address') {
      return submission.generalInfo?.address || submission.answers['general_address'] as string || '';
    }
    return submission.answers[fieldName] as string || '';
  };

  const generateQRCodeDataURL = async (url: string, size: number): Promise<string> => {
    try {
      // Generate QR code as data URL directly
      const dataUrl = await QRCode.toDataURL(url, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const generateCertificatePDF = async (
    template: CertificateTemplate,
    submission: FormSubmission,
    certificateUrl?: string
  ): Promise<string> => {
    // Create a temporary container for the certificate
    const container = document.createElement('div');
    container.style.width = `${template.width}px`;
    container.style.height = `${template.height}px`;
    container.style.position = 'relative';
    container.style.backgroundColor = '#ffffff';
    container.style.overflow = 'hidden';
    
    // Handle background image - use img element for better CORS handling
    if (template.backgroundImage) {
      const bgImg = document.createElement('img');
      bgImg.src = template.backgroundImage;
      bgImg.style.position = 'absolute';
      bgImg.style.top = '0';
      bgImg.style.left = '0';
      bgImg.style.width = '100%';
      bgImg.style.height = '100%';
      bgImg.style.objectFit = 'cover';
      bgImg.crossOrigin = 'anonymous';
      container.appendChild(bgImg);
      
      // Wait for image to load if it's a URL (not base64)
      if (!template.backgroundImage.startsWith('data:')) {
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = () => {
            // If image fails to load, continue without it
            console.warn('Background image failed to load, continuing without it');
            resolve(null);
          };
          // Set a timeout to prevent hanging
          setTimeout(() => resolve(null), 5000);
        });
      }
    }
    
    // Add all elements to the container
    for (const element of template.elements) {
      const elementDiv = document.createElement('div');
      elementDiv.style.position = 'absolute';
      elementDiv.style.left = `${element.x}%`;
      elementDiv.style.top = `${element.y}%`;
      elementDiv.style.transform = 'translate(-50%, -50%)';
      elementDiv.style.zIndex = '10';
      
      if (element.type === 'qr') {
        // Generate QR code for this element
        if (certificateUrl) {
          try {
            const qrSize = element.fontSize;
            const qrDataUrl = await generateQRCodeDataURL(certificateUrl, qrSize);
            
            const qrImg = document.createElement('img');
            qrImg.src = qrDataUrl;
            qrImg.style.width = `${qrSize}px`;
            qrImg.style.height = `${qrSize}px`;
            qrImg.style.display = 'block';
            elementDiv.appendChild(qrImg);
          } catch (error) {
            console.error('Error generating QR code:', error);
            // Fallback: show placeholder
            elementDiv.style.width = `${element.fontSize}px`;
            elementDiv.style.height = `${element.fontSize}px`;
            elementDiv.style.backgroundColor = '#f3f4f6';
            elementDiv.style.border = '2px dashed #9ca3af';
            elementDiv.textContent = 'QR';
          }
        } else {
          // No certificate URL yet, show placeholder
          elementDiv.style.width = `${element.fontSize}px`;
          elementDiv.style.height = `${element.fontSize}px`;
          elementDiv.style.backgroundColor = '#f3f4f6';
          elementDiv.style.border = '2px dashed #9ca3af';
          elementDiv.textContent = 'QR';
        }
      } else {
        // Text or field element
        elementDiv.style.fontSize = `${element.fontSize}px`;
        elementDiv.style.fontFamily = element.fontFamily;
        elementDiv.style.fontWeight = element.fontWeight;
        elementDiv.style.color = element.color;
        elementDiv.style.textAlign = element.textAlign;
        elementDiv.style.whiteSpace = 'nowrap';
        
        let content = element.content;
        if (element.type === 'field') {
          content = getFieldValue(submission, element.content);
        }
        
        elementDiv.textContent = content;
      }
      
      container.appendChild(elementDiv);
    }

    // Append to body temporarily (off-screen)
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Convert to canvas using html2canvas
      const canvas = await html2canvas(container, {
        width: template.width,
        height: template.height,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: false, // Don't allow tainted canvas
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Convert canvas to data URL
      const imageData = canvas.toDataURL('image/png', 1.0);
      
      // Clean up
      document.body.removeChild(container);
      
      return imageData;
    } catch (error) {
      document.body.removeChild(container);
      console.error('Error generating certificate:', error);
      throw new Error('Failed to generate certificate. Please ensure the background image is accessible or use an uploaded image instead of a URL.');
    }
  };

  const generateAllCertificates = async () => {
    if (!selectedTemplateId || !selectedEventId || selectedParticipants.size === 0) {
      setError('Please select a template, event, and at least one participant');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setSuccess(false);
      setGeneratedCount(0);

      const template = await getCertificateTemplate(selectedTemplateId);
      if (!template) {
        setError('Template not found');
        return;
      }

      const selectedSubmissions = participants.filter(p => selectedParticipants.has(p.id));
      setTotalCount(selectedSubmissions.length);

      // Check if template has QR codes
      const hasQRCodes = template.elements.some(el => el.type === 'qr');
      
      // Generate all certificate images and store them
      const certificateImages: string[] = [];
      
      for (let i = 0; i < selectedSubmissions.length; i++) {
        const submission = selectedSubmissions[i];
        const participantName = getParticipantName(submission);
        const participantEmail = submission.generalInfo?.email || submission.answers['general_email'] as string;
        
        let certificateUrl: string | undefined;
        
        // If template has QR codes, we need to save the certificate first to get the storage URL
        if (hasQRCodes) {
          // Step 1: Generate a temporary certificate (without QR code) to upload and get storage URL
          const tempImageData = await generateCertificatePDF(template, submission);
          
          // Step 2: Upload the temporary image to get the storage URL
          try {
            // Upload directly to storage to get URL
            const imageBlob = await fetch(tempImageData).then(r => r.blob());
            const file = new File([imageBlob], `certificate-${Date.now()}.png`, { type: 'image/png' });
            
            const fileExt = 'png';
            const fileName = `${currentUser.id}/certificates/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            // Try MEDIA bucket first
            let uploadData: any;
            let bucketId: string;
            let uploadError: any;
            
            try {
              bucketId = STORAGE_BUCKETS.MEDIA;
              const result = await supabase.storage
                .from(bucketId)
                .upload(fileName, file, {
                  cacheControl: '3600',
                  upsert: false
                });
              uploadData = result.data;
              uploadError = result.error;
            } catch (err) {
              // Fallback to GENERAL bucket
              bucketId = STORAGE_BUCKETS.GENERAL;
              const result = await supabase.storage
                .from(bucketId)
                .upload(fileName, file, {
                  cacheControl: '3600',
                  upsert: false
                });
              uploadData = result.data;
              uploadError = result.error;
            }
            
            if (uploadError) {
              throw uploadError;
            }
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucketId)
              .getPublicUrl(uploadData.path);
            
            certificateUrl = urlData.publicUrl;
            
            // Step 3: Generate the final certificate with QR code pointing to storage URL
            const finalImageData = await generateCertificatePDF(template, submission, certificateUrl);
            
            // Step 4: Replace the uploaded image with the final one (with QR code)
            const finalBlob = await fetch(finalImageData).then(r => r.blob());
            const finalFile = new File([finalBlob], `certificate-${Date.now()}.png`, { type: 'image/png' });
            
            await supabase.storage
              .from(bucketId)
              .update(uploadData.path, finalFile, {
                cacheControl: '3600',
                upsert: true
              });
            
            // Step 5: Save certificate record in database
            const certificateId = crypto.randomUUID();
            await supabase
              .from(TABLES.CERTIFICATES)
              .insert({
                id: certificateId,
                user_id: currentUser.id,
                event_id: selectedEventId,
                template_id: selectedTemplateId,
                participant_submission_id: submission.id,
                certificate_image_url: certificateUrl,
                certificate_url: `${window.location.origin}/certificate/${certificateId}`,
                participant_name: participantName,
                participant_email: participantEmail,
                created_at: new Date().toISOString(),
              });
            
            certificateImages.push(finalImageData);
          } catch (err) {
            console.error('Error saving certificate with QR code:', err);
            // If saving fails, generate without QR code
            const imageData = await generateCertificatePDF(template, submission);
            certificateImages.push(imageData);
          }
        } else {
          // No QR codes, generate certificate directly
          const imageData = await generateCertificatePDF(template, submission);
          certificateImages.push(imageData);
          
          // Optionally save certificate even without QR codes
          try {
            await saveCertificate(
              currentUser.id,
              selectedEventId,
              selectedTemplateId,
              submission.id,
              imageData,
              participantName,
              participantEmail
            );
          } catch (err) {
            console.error('Error saving certificate:', err);
            // Continue even if saving fails
          }
        }
        
        setGeneratedCount(i + 1);
      }

      // Combine all certificates into one PDF
      if (certificateImages.length > 0) {
        const pdf = new jsPDF({
          orientation: template.width > template.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [template.width, template.height],
        });

        // Add first certificate
        pdf.addImage(certificateImages[0], 'PNG', 0, 0, template.width, template.height);

        // Add remaining certificates as new pages
        for (let i = 1; i < certificateImages.length; i++) {
          pdf.addPage([template.width, template.height], 'px');
          pdf.addImage(certificateImages[i], 'PNG', 0, 0, template.width, template.height);
        }

        // Download combined PDF
        const eventTitle = events.find(e => e.id === selectedEventId)?.title || 'Certificates';
        const sanitizedTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(`${sanitizedTitle}_certificates_${new Date().toISOString().split('T')[0]}.pdf`);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate certificates');
      console.error(err);
    } finally {
      setGenerating(false);
      setGeneratedCount(0);
      setTotalCount(0);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="h-full flex flex-col p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Generate Certificates</h1>
        <p className="text-slate-500 mt-1 text-sm">Select an event and participants to generate certificates</p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 size={16} />
          <span>Certificates generated and downloaded successfully!</span>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-6">
        {/* Top Row - Action Buttons (Horizontal) */}
        {generating ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
              <p className="text-lg font-semibold text-slate-900 mb-2">Generating Certificates</p>
              <p className="text-3xl font-bold text-indigo-600 mb-1">
                {generatedCount} / {totalCount}
              </p>
              <p className="text-sm text-slate-500">
                {generatedCount === totalCount ? 'Combining PDFs...' : 'Creating certificate PDFs...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GenerateCertificateAction
              onClick={generateAllCertificates}
              disabled={
                !selectedEventId || 
                !selectedTemplateId || 
                selectedParticipants.size === 0 ||
                generating
              }
              selectedCount={selectedParticipants.size}
              generating={generating}
            />
            
              <SendCertificateByEmailAction
                onClick={() => setShowEmailModal(true)}
                disabled={
                  !selectedEventId || 
                  !selectedTemplateId || 
                  selectedParticipants.size === 0
                }
                selectedCount={selectedParticipants.size}
              />
            
            <AddToAccountAction
              onClick={() => {
                // TODO: Implement add to account functionality
                console.log('Add to account clicked');
              }}
              disabled={
                !selectedEventId || 
                !selectedTemplateId || 
                selectedParticipants.size === 0
              }
              selectedCount={selectedParticipants.size}
            />
          </div>
        )}

        {/* Middle Row - Event and Template Selection (Horizontal) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Select Event <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Loading events...</span>
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select an event --</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            )}
            {selectedEvent && (
              <p className="text-xs text-slate-500 mt-2">
                Event: {selectedEvent.title}
              </p>
            )}
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Select Certificate Template <span className="text-red-500">*</span>
            </label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Loading templates...</span>
              </div>
            ) : (
              <>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select a template --</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    No templates available. Create a template first.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom - Participants List (Full Width) */}
        {selectedEventId && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Select Participants
                </label>
                {/* Registration Type Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filter:</span>
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setRegistrationFilter('all')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        registrationFilter === 'all'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setRegistrationFilter('internal')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        registrationFilter === 'internal'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Internal
                    </button>
                    <button
                      onClick={() => setRegistrationFilter('external')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        registrationFilter === 'external'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      External
                    </button>
                  </div>
                </div>
              </div>
              {participants.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {selectedParticipants.size === getFilteredParticipants().length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            {loadingParticipants ? (
              <div className="flex items-center gap-2 text-slate-500 py-8">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Loading participants...</span>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No participants found for this event</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getFilteredParticipants().map(participant => {
                    const isInternal = isInternalRegistration(participant);
                    return (
                      <label
                        key={participant.id}
                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.has(participant.id)}
                          onChange={() => toggleParticipant(participant.id)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">
                              {getParticipantName(participant)}
                            </p>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                isInternal
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {isInternal ? 'Internal' : 'External'}
                            </span>
                          </div>
                          {participant.generalInfo?.email && (
                            <p className="text-xs text-slate-500">{participant.generalInfo.email}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {getFilteredParticipants().length === 0 && participants.length > 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No {registrationFilter === 'internal' ? 'internal' : 'external'} registrations found</p>
                  </div>
                )}
              </>
            )}
            {participants.length > 0 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">
                  {selectedParticipants.size} of {getFilteredParticipants().length} participant(s) selected
                  {registrationFilter !== 'all' && ` (${participants.length} total)`}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Internal: {participants.filter(p => isInternalRegistration(p)).length}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    External: {participants.filter(p => !isInternalRegistration(p)).length}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <SendCertificateEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          participants={participants}
          selectedParticipantIds={selectedParticipants}
          eventId={selectedEventId}
          templateId={selectedTemplateId}
          eventTitle={selectedEvent?.title}
        />
      )}
    </div>
  );
};

export default GenerateCertificates;

