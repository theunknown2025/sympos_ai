import { Briefcase, GraduationCap, CircleDollarSign, type LucideIcon } from 'lucide-react';
import type { OpportunityKind } from '../types';

export const opportunityKindLabel: Record<OpportunityKind, string> = {
  job: 'Job',
  training: 'Training',
  fund: 'Fund',
};

export const opportunityKindDescription: Record<OpportunityKind, string> = {
  job: 'Open positions, internships, and research roles',
  training: 'Workshops, courses, and professional development programs',
  fund: 'Grants, scholarships, and funding opportunities',
};

export const opportunityKindIcon: Record<OpportunityKind, LucideIcon> = {
  job: Briefcase,
  training: GraduationCap,
  fund: CircleDollarSign,
};

export const OPPORTUNITY_KINDS: OpportunityKind[] = ['job', 'training', 'fund'];
