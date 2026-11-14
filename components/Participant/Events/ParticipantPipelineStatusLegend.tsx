import React from 'react';

/**
 * Explains pipeline step colors shown to participants (green / blue / yellow).
 */
const ParticipantPipelineStatusLegend: React.FC = () => (
  <div
    className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600"
    aria-label="Step status legend"
  >
    <span className="font-medium text-slate-500 uppercase tracking-wide">Legend</span>
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm bg-green-600 shrink-0" aria-hidden />
      <span>Complete</span>
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm bg-blue-600 shrink-0" aria-hidden />
      <span>In progress — your action</span>
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm bg-amber-400 border border-amber-500 shrink-0" aria-hidden />
      <span>Waiting for organizer</span>
    </span>
  </div>
);

export default ParticipantPipelineStatusLegend;
