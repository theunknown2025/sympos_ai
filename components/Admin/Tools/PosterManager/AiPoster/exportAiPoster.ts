import jsPDF from 'jspdf';

export async function downloadAiPosterPng(imageDataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = imageDataUrl;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadAiPosterPdf(
  imageDataUrl: string,
  fileName: string,
  widthMm: number,
  heightMm: number,
) {
  const pdf = new jsPDF({
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
  });
  pdf.addImage(imageDataUrl, 'PNG', 0, 0, widthMm, heightMm);
  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}

const SAVE_KEY = 'sympos-ai-poster-draft';

export function saveAiPosterDraft(payload: unknown) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadAiPosterDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
