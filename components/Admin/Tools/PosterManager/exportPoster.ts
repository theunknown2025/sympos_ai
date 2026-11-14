import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function hideExportChrome(root: ParentNode) {
  root.querySelectorAll('[data-poster-export-hide]').forEach((node) => {
    (node as HTMLElement).style.visibility = 'hidden';
  });
}

async function capturePosterCanvas(pageEl: HTMLElement) {
  return html2canvas(pageEl, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
    onclone: (doc) => {
      const page = doc.querySelector('[data-poster-page]');
      if (page) hideExportChrome(page);
    },
  });
}

export async function exportPosterPng(pageEl: HTMLElement, fileName: string) {
  const canvas = await capturePosterCanvas(pageEl);
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not create PNG'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      },
      'image/png',
      1,
    );
  });
}

export async function exportPosterPdf(
  pageEl: HTMLElement,
  fileName: string,
  widthMm: number,
  heightMm: number,
) {
  const canvas = await capturePosterCanvas(pageEl);
  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
  });
  pdf.addImage(imageData, 'PNG', 0, 0, widthMm, heightMm);
  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}
