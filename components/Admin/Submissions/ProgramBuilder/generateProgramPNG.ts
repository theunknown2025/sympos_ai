import html2canvas from 'html2canvas';

/**
 * Rasterize the given DOM node (the program preview root) to a PNG download.
 */
export async function generateProgramPNG(exportRoot: HTMLElement, fileName: string): Promise<void> {
  const canvas = await html2canvas(exportRoot, {
    backgroundColor: '#f8fafc',
    scale: 2,
    logging: false,
    useCORS: true,
    windowWidth: exportRoot.scrollWidth,
    windowHeight: exportRoot.scrollHeight,
  });

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not create image'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      },
      'image/png',
      1
    );
  });
}
