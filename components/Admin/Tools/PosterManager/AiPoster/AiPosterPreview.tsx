import React from 'react';
import type { AiPosterGeneralInfo, AiPosterResult } from './types';

type AiPosterPreviewProps = {
  info: AiPosterGeneralInfo;
  result: AiPosterResult | null;
  width: number;
  height: number;
};

/** Empty until the final generated poster is ready. */
const AiPosterPreview: React.FC<AiPosterPreviewProps> = ({ info, result, width, height }) => {
  if (!result?.imageDataUrl) {
    return <div style={{ width, height }} className="bg-white" aria-hidden />;
  }

  return (
    <img
      src={result.imageDataUrl}
      alt={info.title || 'AI poster'}
      width={width}
      height={height}
      className="block h-full w-full object-cover"
      draggable={false}
    />
  );
};

export default AiPosterPreview;
