import { createRoot } from 'react-dom/client';
import ProgramFinalLayout from './ProgramFinalLayout';
import { generateProgramPNG } from './generateProgramPNG';
import type { SavedProgram } from '../../../../services/programService';
import { buildProgramPdfParams } from './programExportMeta';

/**
 * Renders the program document off-screen and downloads a PNG (list view / quick export).
 */
export async function captureSavedProgramAsPNG(program: SavedProgram, dayIndex: number): Promise<void> {
  const params = buildProgramPdfParams(program, dayIndex);
  const dayCards = program.cards.filter((c) => c.dayIndex === dayIndex);

  const exportId = `program-export-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-20000px;top:0;width:min(1100px,100vw);z-index:-1;pointer-events:none;';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <ProgramFinalLayout
      id={exportId}
      title={params.programTitle}
      subtitle={params.programSubtitle}
      description={params.programDescription}
      dateRangeLabel={params.dateRangeLabel}
      selectedDay={dayIndex}
      numDays={program.config.numDays}
      dayDateLabel={params.dayDateLabel}
      scheduleHoursLabel={params.scheduleHoursLabel}
      venues={program.venues}
      timeSlots={params.timeSlots}
      cards={dayCards}
      config={program.config}
    />
  );

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const el = document.getElementById(exportId);
  if (!el) {
    root.unmount();
    document.body.removeChild(container);
    throw new Error('Export root not found');
  }

  try {
    await generateProgramPNG(el, `${params.fileName.replace(/\.pdf$/i, '')}.png`);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
