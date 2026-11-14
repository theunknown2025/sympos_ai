export interface OpportunityReportFunnelStep {
  key: string;
  stepIndex: number;
  title: string;
  /** Advanced past this step (or completed beyond it). */
  acceptedCount: number;
  /** Rejected while on this step. */
  rejectedCount: number;
  /** Still in progress at this step. */
  pendingCount: number;
  /** accepted + rejected + pending */
  totalCount: number;
}

export interface OpportunityReportTimePoint {
  date: string;
  label: string;
  count: number;
  cumulative: number;
}

export interface OpportunityReportAcceptanceSlice {
  name: string;
  value: number;
  color: string;
}

export interface OpportunityReportStepAcceptance {
  key: string;
  stepIndex: number;
  title: string;
  advanced: number;
  rejected: number;
  pending: number;
  acceptancePercent: number;
  slices: OpportunityReportAcceptanceSlice[];
}

export interface OpportunityApplicationReportData {
  opportunityTitle: string;
  totalApplications: number;
  periodStart: Date;
  periodEnd: Date;
  periodStartLabel: string;
  periodEndLabel: string;
  funnelSteps: OpportunityReportFunnelStep[];
  applicationsOverTime: OpportunityReportTimePoint[];
  totalAcceptancePercent: number;
  totalAcceptanceSlices: OpportunityReportAcceptanceSlice[];
  stepAcceptance: OpportunityReportStepAcceptance[];
}
