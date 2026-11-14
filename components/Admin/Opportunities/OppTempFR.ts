import type { OpportunityFormTemplate } from './opportunityFormTemplate';
import { getDefaultOpportunityBanner } from '../../../utils/opportunityBanner';

/**
 * Modèle d'opportunité prédéfini (français) — poste de recherche type emploi.
 * Utiliser via « Charger le modèle FR » dans la gestion des opportunités.
 */
export const OPPORTUNITY_TEMPLATE_FR: OpportunityFormTemplate = {
  kind: 'job',
  title: 'Ingénieur·e de recherche — Sciences des données',
  banner: getDefaultOpportunityBanner('job'),
  attachedFiles: [],
  deadline: '2026-12-31T17:00',
  place: 'Campus principal — Bâtiment A',
  locationType: 'hybrid',
  complementaryCriteria: [
    { name: 'Salaire annuel', value: '45 000 € – 55 000 €' },
    { name: 'Type de contrat', value: 'CDD 18 mois, renouvelable' },
    { name: 'Temps de travail', value: 'Temps plein (35 h)' },
    { name: 'Langues', value: 'Français (C1), Anglais (B2+)' },
  ],
  description: `<h1>Ingénieur·e de recherche — Sciences des données</h1>
<p>Le laboratoire <strong>SymposIA</strong> recrute un·e ingénieur·e de recherche pour renforcer son équipe sur les projets d'analyse de données événementielles et de pipelines d'évaluation.</p>
<h2>Missions principales</h2>
<ul>
<li>Concevoir et maintenir des pipelines ETL pour les soumissions et inscriptions</li>
<li>Collaborer avec les organisateurs pour définir des indicateurs et tableaux de bord</li>
<li>Documenter les procédures et assurer la qualité des jeux de données</li>
</ul>
<h2>Profil recherché</h2>
<p>Master ou doctorat en informatique, statistiques ou domaine connexe. Expérience avec Python, SQL et outils de visualisation. Capacité à travailler en équipe pluridisciplinaire.</p>
<h3>Avantages</h3>
<p>Télétravail partiel, accès aux conférences partenaires, environnement de recherche dynamique.</p>`,
  steps: [
    {
      id: 'tpl-fr-step-1',
      order: 0,
      name: 'Candidature en ligne',
      description: 'Formulaire de candidature et CV',
      date: '2026-06-01',
      registrationFormId: undefined,
    },
    {
      id: 'tpl-fr-step-2',
      order: 1,
      name: 'Entretien RH',
      description: 'Échange sur motivation et disponibilités',
      date: '2026-06-15',
      registrationFormId: undefined,
    },
    {
      id: 'tpl-fr-step-3',
      order: 2,
      name: 'Entretien technique',
      description: 'Présentation d’un cas pratique data',
      registrationFormId: undefined,
    },
  ],
  paymentFormId: undefined,
  paymentStepId: undefined,
  publishStatus: 'Draft',
};

export default OPPORTUNITY_TEMPLATE_FR;
