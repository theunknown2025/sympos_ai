import React from 'react';
import { opportunityKindIcon } from '../../../utils/opportunityKindMeta';
import type { OpportunityKind } from '../../../types';

interface OpportunityKindIconProps {
  kind: OpportunityKind;
  size?: number;
  className?: string;
}

const OpportunityKindIcon: React.FC<OpportunityKindIconProps> = ({
  kind,
  size = 20,
  className = '',
}) => {
  const Icon = opportunityKindIcon[kind] ?? opportunityKindIcon.job;
  return <Icon size={size} className={className} aria-hidden />;
};

export default OpportunityKindIcon;
