import type { Opportunity } from '../../../types';

/** Form fields used when creating/editing an opportunity (no ids or timestamps). */
export type OpportunityFormTemplate = Omit<
  Opportunity,
  'id' | 'userId' | 'campusId' | 'createdAt' | 'updatedAt'
>;
