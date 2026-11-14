import type { Opportunity, OpportunityApplication } from '../../../../types';
import { sortedOpportunitySteps } from '../../../../services/opportunityService';
import type { OpportunityApplicationReportData } from './types';

const COLORS = {
  completed: '#10b981',
  rejected: '#ef4444',
  inProgress: '#6366f1',
  advanced: '#22c55e',
  pending: '#94a3b8',
};

function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildApplicationsOverTime(
  opportunity: Opportunity,
  applications: OpportunityApplication[]
): OpportunityApplicationReportData['applicationsOverTime'] {
  const start = startOfDay(opportunity.createdAt);
  const end = startOfDay(
    opportunity.deadline ? new Date(opportunity.deadline) : new Date()
  );
  if (end.getTime() < start.getTime()) {
    end.setTime(start.getTime());
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const spanDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / dayMs) + 1);
  const bucketDays = spanDays > 60 ? 7 : spanDays > 28 ? 3 : 1;

  const buckets = new Map<string, number>();
  for (const app of applications) {
    const t = startOfDay(app.createdAt).getTime();
    if (t < start.getTime() || t > end.getTime() + dayMs) continue;
    const offset = Math.floor((t - start.getTime()) / dayMs / bucketDays);
    const bucketStart = new Date(start.getTime() + offset * bucketDays * dayMs);
    const key = bucketStart.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const points: OpportunityApplicationReportData['applicationsOverTime'] = [];
  let cumulative = 0;
  for (let t = start.getTime(); t <= end.getTime(); t += bucketDays * dayMs) {
    const d = new Date(t);
    const key = d.toISOString().slice(0, 10);
    const count = buckets.get(key) ?? 0;
    cumulative += count;
    points.push({
      date: key,
      label: formatShortDate(d),
      count,
      cumulative,
    });
  }

  if (points.length === 0) {
    points.push({
      date: start.toISOString().slice(0, 10),
      label: formatShortDate(start),
      count: 0,
      cumulative: 0,
    });
  }

  return points;
}

function buildStepAcceptance(
  opportunity: Opportunity,
  applications: OpportunityApplication[]
): OpportunityApplicationReportData['stepAcceptance'] {
  const steps = sortedOpportunitySteps(opportunity);
  return steps.map((step, stepIndex) => {
    let advanced = 0;
    let rejected = 0;
    let pending = 0;

    for (const app of applications) {
      if (app.status === 'rejected') {
        const at = app.rejectedAtStepIndex ?? app.currentStepIndex;
        if (at === stepIndex) rejected++;
        else if (at > stepIndex || app.currentStepIndex > stepIndex) advanced++;
        else if (app.currentStepIndex === stepIndex) pending++;
      } else if (app.status === 'completed') {
        advanced++;
      } else if (app.currentStepIndex > stepIndex) {
        advanced++;
      } else if (app.currentStepIndex === stepIndex) {
        pending++;
      }
    }

    const decided = advanced + rejected;
    const acceptancePercent = decided > 0 ? Math.round((advanced / decided) * 100) : 0;

    const slices: OpportunityApplicationReportData['stepAcceptance'][0]['slices'] = [];
    if (advanced > 0) slices.push({ name: 'Advanced', value: advanced, color: COLORS.advanced });
    if (rejected > 0) slices.push({ name: 'Rejected', value: rejected, color: COLORS.rejected });
    if (pending > 0) slices.push({ name: 'Pending', value: pending, color: COLORS.pending });
    if (slices.length === 0) slices.push({ name: 'No data', value: 1, color: COLORS.pending });

    return {
      key: `step-${stepIndex}`,
      stepIndex,
      title: step.name.trim() || `Step ${stepIndex + 1}`,
      advanced,
      rejected,
      pending,
      acceptancePercent,
      slices,
    };
  });
}

export function buildOpportunityApplicationReport(
  opportunity: Opportunity,
  applications: OpportunityApplication[]
): OpportunityApplicationReportData {
  const stepAcceptance = buildStepAcceptance(opportunity, applications);

  const funnelSteps = stepAcceptance.map((step) => ({
    key: step.key,
    stepIndex: step.stepIndex,
    title: step.title,
    acceptedCount: step.advanced,
    rejectedCount: step.rejected,
    pendingCount: step.pending,
    totalCount: step.advanced + step.rejected + step.pending,
  }));

  const completed = applications.filter((a) => a.status === 'completed').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;
  const inProgress = applications.filter((a) => a.status === 'in_progress').length;
  const decided = completed + rejected;
  const totalAcceptancePercent =
    decided > 0 ? Math.round((completed / decided) * 100) : completed > 0 ? 100 : 0;

  const totalAcceptanceSlices: OpportunityApplicationReportData['totalAcceptanceSlices'] = [];
  if (completed > 0) {
    totalAcceptanceSlices.push({ name: 'Accepted', value: completed, color: COLORS.completed });
  }
  if (rejected > 0) {
    totalAcceptanceSlices.push({ name: 'Rejected', value: rejected, color: COLORS.rejected });
  }
  if (inProgress > 0) {
    totalAcceptanceSlices.push({ name: 'In progress', value: inProgress, color: COLORS.inProgress });
  }
  if (totalAcceptanceSlices.length === 0) {
    totalAcceptanceSlices.push({ name: 'No applications', value: 1, color: COLORS.pending });
  }

  const periodStart = opportunity.createdAt;
  const periodEnd = opportunity.deadline ? new Date(opportunity.deadline) : new Date();

  return {
    opportunityTitle: opportunity.title,
    totalApplications: applications.length,
    periodStart,
    periodEnd,
    periodStartLabel: formatShortDate(periodStart),
    periodEndLabel: formatShortDate(periodEnd),
    funnelSteps,
    applicationsOverTime: buildApplicationsOverTime(opportunity, applications),
    totalAcceptancePercent,
    totalAcceptanceSlices,
    stepAcceptance,
  };
}
