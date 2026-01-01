import React, { useState, useEffect } from 'react';
import { CertificateTemplate, FormSubmission } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { getUserLandingPages, SavedLandingPage } from '../../../services/landingPageService';
import { getEventSubmissions } from '../../../services/registrationSubmissionService';
import { getUserCertificateTemplates, getCertificateTemplate } from '../../../services/certificateTemplateService';
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

interface GenerateCertificatesProps {}

const GenerateCertificates: React.FC<GenerateCertificatesProps> = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<SavedLandingPage[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [participants, setParticipants] = useState<FormSubmission[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    if (selectedParticipants.size === participants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(participants.map(p => p.id)));
    }
  };

  const getParticipantName = (submission: FormSubmission): string => {
    return submission.generalInfo?.name || 
           submission.submittedBy || 
           submission.answers['general_name'] as string || 
           'Participant';
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

  const generateCertificatePDF = async (
    template: CertificateTemplate,
    submission: FormSubmission
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
    template.elements.forEach(element => {
      const elementDiv = document.createElement('div');
      elementDiv.style.position = 'absolute';
      elementDiv.style.left = `${element.x}%`;
      elementDiv.style.top = `${element.y}%`;
      elementDiv.style.transform = 'translate(-50%, -50%)';
      elementDiv.style.fontSize = `${element.fontSize}px`;
      elementDiv.style.fontFamily = element.fontFamily;
      elementDiv.style.fontWeight = element.fontWeight;
      elementDiv.style.color = element.color;
      elementDiv.style.textAlign = element.textAlign;
      elementDiv.style.whiteSpace = 'nowrap';
      elementDiv.style.zIndex = '10';
      
      let content = element.content;
      if (element.type === 'field') {
        content = getFieldValue(submission, element.content);
      }
      
      elementDiv.textContent = content;
      container.appendChild(elementDiv);
    });

    // Append to body temporarily (off-screen)
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

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

      // Generate all certificate images
      const certificateImages: string[] = [];
      for (let i = 0; i < selectedSubmissions.length; i++) {
        const submission = selectedSubmissions[i];
        const imageData = await generateCertificatePDF(template, submission);
        certificateImages.push(imageData);
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Selection */}
        <div className="space-y-6">
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

          {/* Participants List */}
          {selectedEventId && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Select Participants
                </label>
                {participants.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {selectedParticipants.size === participants.length ? 'Deselect All' : 'Select All'}
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
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {participants.map(participant => (
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
                        <p className="text-sm font-medium text-slate-900">
                          {getParticipantName(participant)}
                        </p>
                        {participant.generalInfo?.email && (
                          <p className="text-xs text-slate-500">{participant.generalInfo.email}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {participants.length > 0 && (
                <p className="text-xs text-slate-500 mt-3">
                  {selectedParticipants.size} of {participants.length} participant(s) selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Generate */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Generate Certificates</h3>
            
            {generating ? (
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
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Selected:</strong>
                  </p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Event: {selectedEvent?.title || 'None'}</li>
                    <li>• Template: {templates.find(t => t.id === selectedTemplateId)?.title || 'None'}</li>
                    <li>• Participants: {selectedParticipants.size}</li>
                  </ul>
                </div>

                <button
                  onClick={generateAllCertificates}
                  disabled={
                    !selectedEventId || 
                    !selectedTemplateId || 
                    selectedParticipants.size === 0 ||
                    generating
                  }
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <Download size={20} />
                  Generate {selectedParticipants.size > 0 ? `${selectedParticipants.size} ` : ''}Certificate{selectedParticipants.size !== 1 ? 's' : ''}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  All certificates will be combined into a single PDF file
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateCertificates;

