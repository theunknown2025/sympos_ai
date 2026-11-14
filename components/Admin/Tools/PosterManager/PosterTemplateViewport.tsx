import React from 'react';
import { posterTemplateScale, type PosterTemplateViewportProps } from './posterTemplateLayout';

const PosterTemplateViewport: React.FC<PosterTemplateViewportProps> = ({
  width,
  height,
  className,
  style,
  children,
}) => {
  const { scale, refW, refH } = posterTemplateScale(width, height);

  return (
    <div className={className} style={{ width, height, overflow: 'hidden', ...style }}>
      <div
        style={{
          width: refW,
          height: refH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PosterTemplateViewport;
