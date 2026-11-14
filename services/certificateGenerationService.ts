import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { CertificateTemplate, FormSubmission, Event } from '../types';
import { getCertificateTemplate } from './certificateTemplateService';
import {
  findParticipantAccountCertificateId,
  getCertificate,
  getCertificateQrPdfUrl,
  resolveCertificateQrPdfUrl,
  saveCertificate,
  saveParticipantAccountCertificate,
  type ParticipantAccountCertificate,
} from './certificateService';
import { getFormSubmissionById } from './submissionBadgeService';
import { resolveCertificateFieldValue } from './certificateTemplateFields';

const getFieldValue = (
  submission: FormSubmission,
  fieldName: string,
  event?: Event | null
): string => resolveCertificateFieldValue(fieldName, submission, event);

const generateQRCodeDataURL = async (url: string, size: number): Promise<string> =>
  QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

const templateHasQrCode = (template: CertificateTemplate): boolean =>
  template.elements.some((el) => el.type === 'qr');

export const createCertificatePdfBlob = (
  imageData: string,
  width: number,
  height: number
): Blob => {
  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
  });
  pdf.addImage(imageData, 'PNG', 0, 0, width, height);
  return pdf.output('blob');
};

const waitForImageLoad = (img: HTMLImageElement): Promise<void> =>
  new Promise((resolve, reject) => {
    const finish = () => {
      if (img.naturalWidth > 0) resolve();
      else reject(new Error('Image failed to load'));
    };
    if (img.complete) {
      finish();
      return;
    }
    img.onload = () => finish();
    img.onerror = () => reject(new Error('Image failed to load'));
  });

const waitForContainerImages = async (container: HTMLElement): Promise<void> => {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return;
  await Promise.all(images.map((img) => waitForImageLoad(img).catch(() => undefined)));
};

export const renderCertificateImage = async (
  template: CertificateTemplate,
  submission: FormSubmission,
  certificateUrl?: string,
  event?: Event | null
): Promise<string> => {
  const container = document.createElement('div');
  container.style.width = `${template.width}px`;
  container.style.height = `${template.height}px`;
  container.style.position = 'relative';
  container.style.backgroundColor = '#ffffff';
  container.style.overflow = 'hidden';

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

    if (!template.backgroundImage.startsWith('data:')) {
      await new Promise((resolve) => {
        bgImg.onload = resolve;
        bgImg.onerror = () => resolve(null);
        setTimeout(() => resolve(null), 5000);
      });
    }
  }

  for (const element of template.elements) {
    const elementDiv = document.createElement('div');
    elementDiv.style.position = 'absolute';
    elementDiv.style.left = `${element.x}%`;
    elementDiv.style.top = `${element.y}%`;
    elementDiv.style.transform = 'translate(-50%, -50%)';
    elementDiv.style.zIndex = '10';

    if (element.type === 'qr') {
      if (certificateUrl) {
        try {
          const qrSize = element.fontSize;
          const qrDataUrl = await generateQRCodeDataURL(certificateUrl, qrSize);
          elementDiv.style.width = `${qrSize}px`;
          elementDiv.style.height = `${qrSize}px`;
          elementDiv.style.backgroundImage = `url("${qrDataUrl}")`;
          elementDiv.style.backgroundSize = 'contain';
          elementDiv.style.backgroundPosition = 'center';
          elementDiv.style.backgroundRepeat = 'no-repeat';
          const qrImg = document.createElement('img');
          qrImg.alt = 'Certificate verification QR code';
          qrImg.src = qrDataUrl;
          qrImg.style.width = `${qrSize}px`;
          qrImg.style.height = `${qrSize}px`;
          qrImg.style.display = 'block';
          elementDiv.appendChild(qrImg);
        } catch (err) {
          console.error('Error rendering QR code on certificate:', err);
          elementDiv.style.width = `${element.fontSize}px`;
          elementDiv.style.height = `${element.fontSize}px`;
          elementDiv.style.backgroundColor = '#f3f4f6';
          elementDiv.style.border = '2px dashed #9ca3af';
          elementDiv.textContent = 'QR';
        }
      } else {
        elementDiv.style.width = `${element.fontSize}px`;
        elementDiv.style.height = `${element.fontSize}px`;
        elementDiv.style.backgroundColor = '#f3f4f6';
        elementDiv.style.border = '2px dashed #9ca3af';
        elementDiv.textContent = 'QR';
      }
    } else {
      elementDiv.style.fontSize = `${element.fontSize}px`;
      elementDiv.style.fontFamily = element.fontFamily;
      elementDiv.style.fontWeight = element.fontWeight;
      elementDiv.style.color = element.color;
      elementDiv.style.textAlign = element.textAlign;
      elementDiv.style.whiteSpace = 'nowrap';
      let content = element.content;
        if (element.type === 'field') {
          content = getFieldValue(submission, element.content, event);
        }
      elementDiv.textContent = content;
    }

    container.appendChild(elementDiv);
  }

  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  await waitForContainerImages(container);
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const canvas = await html2canvas(container, {
      width: template.width,
      height: template.height,
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
    });
    const imageData = canvas.toDataURL('image/png', 1.0);
    document.body.removeChild(container);
    return imageData;
  } catch (err) {
    document.body.removeChild(container);
    throw err;
  }
};

export interface GenerateCertificatesBatchOptions {
  userId: string;
  eventId: string;
  event: Event;
  eventName: string;
  templateId: string;
  scopeLabel: 'registration' | 'submission';
  submissions: FormSubmission[];
  onProgress?: (current: number, total: number) => void;
}

export async function generateCertificatesBatch(
  options: GenerateCertificatesBatchOptions
): Promise<void> {
  const { userId, eventId, event, eventName, templateId, scopeLabel, submissions, onProgress } = options;

  const template = await getCertificateTemplate(templateId);
  if (!template) {
    throw new Error('Certificate template not found');
  }

  const hasQRCodes = templateHasQrCode(template);
  const certificateImages: string[] = [];

  for (let i = 0; i < submissions.length; i++) {
    const submission = submissions[i];
    const participantName =
      resolveCertificateFieldValue('name', submission, event) ||
      submission.submittedBy ||
      'Participant';
    const participantEmail =
      submission.generalInfo?.email || (submission.answers['general_email'] as string);

    const certificateId = crypto.randomUUID();
    const qrPdfUrl = resolveCertificateQrPdfUrl(userId, certificateId);
    const imageData = await renderCertificateImage(
      template,
      submission,
      hasQRCodes ? qrPdfUrl : undefined,
      event
    );
    certificateImages.push(imageData);

    try {
      const pdfBlob = createCertificatePdfBlob(imageData, template.width, template.height);
      await saveCertificate(
        userId,
        eventId,
        templateId,
        submission.id,
        imageData,
        participantName,
        participantEmail,
        certificateId,
        pdfBlob
      );
    } catch (err) {
      console.error('Error saving certificate:', err);
    }

    onProgress?.(i + 1, submissions.length);
  }

  if (certificateImages.length === 0) return;

  const pdf = new jsPDF({
    orientation: template.width > template.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [template.width, template.height],
  });
  pdf.addImage(certificateImages[0], 'PNG', 0, 0, template.width, template.height);
  for (let i = 1; i < certificateImages.length; i++) {
    pdf.addPage([template.width, template.height], 'px');
    pdf.addImage(certificateImages[i], 'PNG', 0, 0, template.width, template.height);
  }
  const sanitizedTitle = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  pdf.save(
    `${sanitizedTitle}_${scopeLabel}_certificates_${new Date().toISOString().split('T')[0]}.pdf`
  );
}

export interface AddCertificatesToAccountBatchOptions {
  userId: string;
  eventId: string;
  event: Event;
  templateId: string;
  scope: 'registration' | 'submission';
  submissions: FormSubmission[];
  onProgress?: (current: number, total: number) => void;
}

export interface AddCertificatesToAccountResult {
  added: number;
  skippedNoAccount: number;
}

export async function addCertificatesToParticipantAccountsBatch(
  options: AddCertificatesToAccountBatchOptions
): Promise<AddCertificatesToAccountResult> {
  const { userId, eventId, event, templateId, scope, submissions, onProgress } = options;

  const template = await getCertificateTemplate(templateId);
  if (!template) {
    throw new Error('Certificate template not found');
  }

  const hasQRCodes = templateHasQrCode(template);
  const withAccount = submissions.filter((s) => s.participantUserId);
  const skippedNoAccount = submissions.length - withAccount.length;
  let added = 0;

  for (let i = 0; i < withAccount.length; i++) {
    const submission = withAccount[i];
    const participantUserId = submission.participantUserId!;
    const participantName =
      resolveCertificateFieldValue('name', submission, event) ||
      submission.submittedBy ||
      'Participant';
    const participantEmail =
      submission.generalInfo?.email || (submission.answers['general_email'] as string);

    const existingCertificateId = await findParticipantAccountCertificateId(
      submission.id,
      participantUserId,
      scope
    );
    const certificateId = existingCertificateId || crypto.randomUUID();
    const existingCert = existingCertificateId ? await getCertificate(existingCertificateId) : null;
    const qrPdfUrl = hasQRCodes
      ? resolveCertificateQrPdfUrl(userId, certificateId, existingCert?.certificatePdfUrl)
      : undefined;

    const imageData = await renderCertificateImage(
      template,
      submission,
      qrPdfUrl,
      event
    );

    const pdfBlob = createCertificatePdfBlob(imageData, template.width, template.height);
    await saveParticipantAccountCertificate(
      userId,
      eventId,
      templateId,
      submission.id,
      participantUserId,
      scope,
      imageData,
      participantName,
      participantEmail,
      certificateId,
      pdfBlob
    );

    added += 1;
    onProgress?.(i + 1, withAccount.length);
  }

  return { added, skippedNoAccount };
}

const buildCertificateSubmissionStub = (
  certificate: ParticipantAccountCertificate
): FormSubmission => ({
  id: certificate.participantSubmissionId,
  formId: '',
  eventId: certificate.eventId,
  eventTitle: '',
  userId: certificate.userId,
  participantUserId: certificate.participantUserId,
  submittedBy: certificate.participantName,
  subscriptionType: 'self',
  role: 'Participant',
  generalInfo: {
    name: certificate.participantName,
    email: certificate.participantEmail,
  },
  answers: {
    general_email: certificate.participantEmail || '',
    name: certificate.participantName,
  },
  submittedAt: certificate.createdAt,
});

/**
 * Re-render a participant account certificate with a live QR code (for preview/download).
 */
export async function renderParticipantAccountCertificatePreview(
  certificate: ParticipantAccountCertificate,
  event?: Event | null
): Promise<string> {
  const template = await getCertificateTemplate(certificate.templateId);
  if (!template) {
    throw new Error('Certificate template not found');
  }

  const submission =
    (await getFormSubmissionById(certificate.participantSubmissionId)) ||
    buildCertificateSubmissionStub(certificate);

  const hasQRCodes = templateHasQrCode(template);
  return renderCertificateImage(
    template,
    submission,
    hasQRCodes ? getCertificateQrPdfUrl(certificate) : undefined,
    event
  );
}
