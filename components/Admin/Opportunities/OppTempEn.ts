import type { OpportunityFormTemplate } from './opportunityFormTemplate';
import { getDefaultOpportunityBanner } from '../../../utils/opportunityBanner';

/**
 * Predefined opportunity template (English) — sample research job posting.
 * Load via “Load EN template” in opportunity management.
 */
export const OPPORTUNITY_TEMPLATE_EN: OpportunityFormTemplate = {
  kind: 'job',
  title: 'Research Engineer — Data Science',
  banner: getDefaultOpportunityBanner('job'),
  attachedFiles: [],
  deadline: '2026-12-31T17:00',
  place: 'Main campus — Building A',
  locationType: 'hybrid',
  complementaryCriteria: [
    { name: 'Annual salary', value: '€45,000 – €55,000' },
    { name: 'Contract type', value: '18-month fixed-term, renewable' },
    { name: 'Working time', value: 'Full-time (35 h/week)' },
    { name: 'Languages', value: 'French (C1), English (B2+)' },
  ],
  description: `<h1>Research Engineer — Data Science</h1>
<p>The <strong>SymposIA</strong> lab is hiring a research engineer to strengthen our team on event analytics and evaluation pipeline projects.</p>
<h2>Key responsibilities</h2>
<ul>
<li>Design and maintain ETL pipelines for submissions and registrations</li>
<li>Work with organizers to define metrics and dashboards</li>
<li>Document procedures and ensure data quality</li>
</ul>
<h2>Profile</h2>
<p>Master’s or PhD in computer science, statistics, or related field. Experience with Python, SQL, and visualization tools. Strong teamwork in a multidisciplinary setting.</p>
<h3>Benefits</h3>
<p>Partial remote work, access to partner conferences, dynamic research environment.</p>`,
  steps: [
    {
      id: 'tpl-en-step-1',
      order: 0,
      name: 'Online application',
      description: 'Application form and CV upload',
      date: '2026-06-01',
      registrationFormId: undefined,
    },
    {
      id: 'tpl-en-step-2',
      order: 1,
      name: 'HR interview',
      description: 'Discussion on motivation and availability',
      date: '2026-06-15',
      registrationFormId: undefined,
    },
    {
      id: 'tpl-en-step-3',
      order: 2,
      name: 'Technical interview',
      description: 'Short data case presentation',
      registrationFormId: undefined,
    },
  ],
  paymentFormId: undefined,
  paymentStepId: undefined,
  publishStatus: 'Draft',
};

export default OPPORTUNITY_TEMPLATE_EN;
