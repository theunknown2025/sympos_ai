import html2canvas from 'html2canvas';

export async function captureComposedPoster(el: HTMLElement): Promise<string> {
  const canvas = await html2canvas(el, {
    backgroundColor: '#0b1220',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  return await new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not capture composed poster'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read captured poster'));
        reader.readAsDataURL(blob);
      },
      'image/png',
      1,
    );
  });
}
