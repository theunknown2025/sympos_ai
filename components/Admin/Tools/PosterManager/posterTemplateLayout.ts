import type { CSSProperties, ReactNode } from 'react';

/** Reference design size (A3 at 3 px/mm). All poster formats share the same aspect ratio. */
export const POSTER_REF_WIDTH = 891;
export const POSTER_REF_HEIGHT = 1260;

export function posterTemplateScale(width: number, height: number) {
  const scale = width / POSTER_REF_WIDTH;
  return { scale, refW: POSTER_REF_WIDTH, refH: POSTER_REF_HEIGHT };
}

export type PosterTemplateViewportProps = {
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};
