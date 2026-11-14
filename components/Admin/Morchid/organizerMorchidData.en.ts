import {
  LayoutDashboard,
  Calendar,
  Globe,
  FileText,
  ClipboardList,
  Send,
  Users,
  BarChart3,
  Presentation,
  Award,
  Briefcase,
  GraduationCap,
  Wrench,
  MessageSquare,
  CreditCard,
  FolderKanban,
} from 'lucide-react';
import type { MorchidPageCopy, MorchidTopic } from './types';

export const organizerMorchidCopyEn: MorchidPageCopy = {
  title: 'Morchid — Organizer Guide',
  subtitle: 'Learn how to use every module of the Sympos-ia platform.',
  topicGridTitle: 'Platform modules',
  topicGridHint: 'Select a module on the left to view step-by-step instructions on the right.',
  guidelinesTitle: 'Step-by-step instructions',
  stepLabel: 'Step',
  tipLabel: 'Tip',
  languageEn: 'English',
  languageFr: 'Français',
  languageAr: 'العربية',
  selectTopicHint: 'Select a module from the list to view its guide.',
};

export const organizerMorchidTopicsEn: MorchidTopic[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    color: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    title: 'Dashboard',
    shortDescription: 'Overview of your events and key metrics at a glance.',
    guidelines: [{
      title: 'Explore your workspace',
      steps: [
        'Open Dashboard from the sidebar.',
        'Review stats: registrations, submissions, and recent activity.',
        'Use shortcuts to jump to frequently used sections.',
      ],
      tip: 'Switch to focused event mode to see data for a single event only.',
    }],
  },
  {
    id: 'events',
    icon: Calendar,
    color: 'bg-violet-100',
    iconColor: 'text-violet-600',
    title: 'Events',
    shortDescription: 'Create, publish, and manage your conferences.',
    guidelines: [
      {
        title: 'Create an event',
        steps: [
          'Go to Event Management → New Event.',
          'Enter title, dates, location, and linked forms.',
          'Attach registration and submission forms.',
          'Publish the event to make it visible to participants.',
        ],
        tip: 'Check deadlines before publishing to avoid late registrations.',
      },
      {
        title: 'Edit or preview',
        steps: [
          'Select the event from the list.',
          'Use Edit to update information.',
          'Click Preview to see the public page.',
        ],
      },
    ],
  },
  {
    id: 'landing-pages',
    icon: Globe,
    color: 'bg-sky-100',
    iconColor: 'text-sky-600',
    title: 'Landing Pages',
    shortDescription: 'Build showcase pages for your events.',
    guidelines: [{
      title: 'Create a landing page',
      steps: [
        'Open Tools → Landing Page Builder.',
        'Click New Page and choose a template.',
        'Customize sections: hero, program, speakers, submissions.',
        'Publish and share the public link.',
      ],
      tip: 'Link the page to an event to sync dates automatically.',
    }],
  },
  {
    id: 'forms',
    icon: FileText,
    color: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Forms',
    shortDescription: 'Custom registration and submission forms.',
    guidelines: [{
      title: 'Build a form',
      steps: [
        'Go to Tools → Form Builder.',
        'Add fields: text, choice, files, dates.',
        'Set required fields and validations.',
        'Save and link the form to an event.',
      ],
    }],
  },
  {
    id: 'registrations',
    icon: ClipboardList,
    color: 'bg-teal-100',
    iconColor: 'text-teal-600',
    title: 'Registrations',
    shortDescription: 'Track and validate participant registrations.',
    guidelines: [
      {
        title: 'Manage registrations',
        steps: [
          'Open Registrations → Registration List.',
          'Filter by status: pending, accepted, rejected.',
          'Export the list or send bulk emails.',
        ],
      },
      {
        title: 'Check-in',
        steps: [
          'Go to Registrations → Check-in.',
          'Scan the badge QR code or search by name.',
          'Confirm participant attendance.',
        ],
        tip: 'Generate badges before event day to speed up check-in.',
      },
    ],
  },
  {
    id: 'submissions',
    icon: Send,
    color: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Submissions',
    shortDescription: 'Receive, evaluate, and track submitted papers.',
    guidelines: [
      {
        title: 'Manage received submissions',
        steps: [
          'Open Submissions → Manage Submissions.',
          'View submissions by status and event.',
          'Assign reviewers or change status (accepted, revision, rejected).',
        ],
      },
      {
        title: 'Committee and reports',
        steps: [
          'Invite committee members via Manage Committee.',
          'Track progress in Follow Up and Reporting.',
          'Generate the final program with Program Builder.',
        ],
      },
    ],
  },
  {
    id: 'committee',
    icon: Users,
    color: 'bg-rose-100',
    iconColor: 'text-rose-600',
    title: 'Committee',
    shortDescription: 'Invite and coordinate reviewers.',
    guidelines: [{
      title: 'Invite reviewers',
      steps: [
        'Go to Submissions → Manage Committee.',
        'Add a member with their professional email.',
        'Send the invitation and track responses.',
        'Assign submissions to each member.',
      ],
      tip: 'Reviewers receive participant access to respond to invitations.',
    }],
  },
  {
    id: 'reporting',
    icon: BarChart3,
    color: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    title: 'Reporting',
    shortDescription: 'Statistics and tracking dashboards.',
    guidelines: [{
      title: 'Analyze data',
      steps: [
        'Open Submissions → Reporting.',
        'View acceptance and deadline charts.',
        'Export data for your scientific committees.',
      ],
    }],
  },
  {
    id: 'program',
    icon: Presentation,
    color: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Program',
    shortDescription: 'Build and export the scientific program.',
    guidelines: [{
      title: 'Generate the program',
      steps: [
        'Go to Program Builder.',
        'Organize sessions by day and room.',
        'Add color legends and export as PDF.',
      ],
    }],
  },
  {
    id: 'certificates',
    icon: Award,
    color: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Certificates',
    shortDescription: 'Templates and certificate generation.',
    guidelines: [{
      title: 'Create and distribute',
      steps: [
        'Create a template in Certificates → Manage Templates.',
        'Set dynamic fields (name, event, date).',
        'Generate certificates for registrations or accepted submissions.',
        'Send the download link to participants.',
      ],
    }],
  },
  {
    id: 'opportunities',
    icon: Briefcase,
    color: 'bg-lime-100',
    iconColor: 'text-lime-700',
    title: 'Opportunities',
    shortDescription: 'Job offers, training, and funding.',
    guidelines: [{
      title: 'Publish an opportunity',
      steps: [
        'Open Opportunities → New Opportunity.',
        'Write the description, criteria, and process steps.',
        'Publish and track received applications.',
      ],
    }],
  },
  {
    id: 'academy',
    icon: GraduationCap,
    color: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Academy LMS',
    shortDescription: 'Online courses, enrollments, and payments.',
    guidelines: [{
      title: 'Manage courses',
      steps: [
        'Create a course in Academy → Course Manager.',
        'Add chapters, lessons, and multimedia content.',
        'Configure enrollments and pricing.',
      ],
    }],
  },
  {
    id: 'tools',
    icon: Wrench,
    color: 'bg-slate-100',
    iconColor: 'text-slate-600',
    title: 'Tools',
    shortDescription: 'Files, emailer, blogs, and presenter.',
    guidelines: [{
      title: 'Use the tools',
      steps: [
        'Files: store documents and shared attachments.',
        'Emailer: create campaigns for participants and committee.',
        'Blogs & Presenter: publish content and slides.',
      ],
    }],
  },
  {
    id: 'messaging',
    icon: MessageSquare,
    color: 'bg-fuchsia-100',
    iconColor: 'text-fuchsia-600',
    title: 'Messaging',
    shortDescription: 'Communicate with participants and your team.',
    guidelines: [{
      title: 'Send messages',
      steps: [
        'Open Messaging from the sidebar.',
        'Select a contact or start a conversation.',
        'Attach files if needed.',
      ],
    }],
  },
  {
    id: 'payments',
    icon: CreditCard,
    color: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Payments',
    shortDescription: 'Offers, tracking, and invoice generation.',
    guidelines: [{
      title: 'Configure payments',
      steps: [
        'Enter your details in Payments → Payment Information.',
        'Create an offer with price and conditions.',
        'Track received payments and generate documents.',
      ],
    }],
  },
  {
    id: 'projects',
    icon: FolderKanban,
    color: 'bg-stone-100',
    iconColor: 'text-stone-600',
    title: 'Projects',
    shortDescription: 'Project management and team follow-up.',
    guidelines: [{
      title: 'Organize a project',
      steps: [
        'Add personnel in Project Management → Personnel.',
        'Create a project with milestones and tasks.',
        'Track progress in Follow Up.',
      ],
    }],
  },
];
