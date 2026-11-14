import type { SavedProgram } from '../../../services/programService';
import { captureSavedProgramAsPNG } from '../../Admin/Submissions/ProgramBuilder/captureProgramLayoutPNG';

/**
 * Downloads one PNG per conference day (same layout as organizer export).
 * Small delay between files so the browser can start each download reliably.
 */
export async function downloadPublishedProgramAllDaysPng(program: SavedProgram): Promise<void> {
  const numDays = Math.max(1, program.config?.numDays ?? 1);
  for (let day = 0; day < numDays; day++) {
    await captureSavedProgramAsPNG(program, day);
    await new Promise((r) => setTimeout(r, 400));
  }
}
