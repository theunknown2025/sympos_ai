import { ConferenceConfig } from '../../../../../types';

/**
 * Design 1: Modern Minimal
 * 
 * A clean, modern design with:
 * - Subtle color palette (indigo, slate, white)
 * - Minimalist hero section with soft gradients
 * - Clean typography with plenty of white space
 * - Simple, elegant card designs
 * - Subtle shadows and borders
 * - Modern glassmorphism effects
 */
export const MODERN_MINIMAL_TEMPLATE: ConferenceConfig = {
  title: 'International Conference on Future Tech 2024',
  date: '2024-06-15',
  location: 'San Francisco, CA',
  description: 'Join leading researchers and innovators to discuss the future of technology. A gathering of minds shaping tomorrow\'s digital landscape.',
  header: {
    showLogo: true,
    showTitle: true,
    showActionButton: true,
    actionButtonText: 'Register Now',
    actionButtonUrl: '#register'
  },
  hero: {
    backgroundImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    showTimer: true,
    overlayOpacity: 50,
    layout: 'center',
    tagline: 'Where Innovation Meets Tomorrow',
    showDate: true,
    showLocation: true,
    buttons: [
      { id: 'btn-1', text: 'Register Now', url: '#register', style: 'primary' },
      { id: 'btn-2', text: 'Learn More', url: '#about', style: 'secondary' }
    ]
  },
  speakers: [
    {
      id: 'spk-1',
      name: 'Dr. Alisha Vance',
      role: 'Head of AI Research, TechCorp',
      bio: 'Pioneering work in large language models and generative AI agents. Named one of the top 50 women in tech.',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      socials: [
        { id: 's1', platform: 'linkedin', url: '#' },
        { id: 's2', platform: 'twitter', url: '#' }
      ]
    },
    {
      id: 'spk-2',
      name: 'Prof. Marcus Webb',
      role: 'Director, Quantum Institute',
      bio: 'Leading researcher in quantum cryptography and post-quantum security protocols. Author of "The Quantum Leap".',
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      socials: [
        { id: 's3', platform: 'website', url: '#' },
        { id: 's4', platform: 'linkedin', url: '#' }
      ]
    },
    {
      id: 'spk-3',
      name: 'Elena Rodriguez',
      role: 'Chief Sustainability Officer, GreenEnergy',
      bio: 'Expert in renewable energy grids and smart city infrastructure. Advocate for sustainable tech policy.',
      imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      socials: [
        { id: 's5', platform: 'linkedin', url: '#' }
      ]
    }
  ],
  committee: [
    {
      id: 'comm-1',
      name: 'Prof. Jonathan Smith',
      role: 'General Chair',
      affiliation: 'Stanford University',
      bio: 'Professor of Computer Science with over 20 years of experience in distributed systems.',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      socials: []
    },
    {
      id: 'comm-2',
      name: 'Dr. Emily Chang',
      role: 'Program Chair',
      affiliation: 'University of Cambridge',
      bio: 'Expert in Human-Computer Interaction and social computing.',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      socials: []
    },
    {
      id: 'comm-3',
      name: 'Dr. Robert Chen',
      role: 'Technical Chair',
      affiliation: 'Google Research',
      bio: 'Lead researcher in machine learning infrastructure.',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      socials: []
    }
  ],
  team: [
    {
      id: 'team-1',
      name: 'Sarah Johnson',
      phone: '+1 (555) 123-4567',
      email: 'sarah.johnson@conference.com',
      function: 'Event Coordinator',
      bio: 'With over 10 years of experience in event management, Sarah ensures every detail of the conference runs smoothly.',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      links: [
        { id: 't1-l1', platform: 'linkedin', url: '#' },
        { id: 't1-l2', platform: 'website', url: '#' }
      ]
    },
    {
      id: 'team-2',
      name: 'Michael Chen',
      phone: '+1 (555) 234-5678',
      email: 'michael.chen@conference.com',
      function: 'Technical Director',
      bio: 'Michael leads the technical infrastructure for the conference, managing everything from web platforms to on-site AV systems.',
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      links: [
        { id: 't2-l1', platform: 'linkedin', url: '#' },
        { id: 't2-l2', platform: 'github', url: '#' }
      ]
    },
    {
      id: 'team-3',
      name: 'Emma Rodriguez',
      phone: '+1 (555) 345-6789',
      email: 'emma.rodriguez@conference.com',
      function: 'Marketing Manager',
      bio: 'Emma brings creative energy to conference promotion and branding. She has successfully marketed over 50 academic and professional events.',
      imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      links: [
        { id: 't3-l1', platform: 'linkedin', url: '#' },
        { id: 't3-l2', platform: 'twitter', url: '#' }
      ]
    }
  ],
  agenda: [
    {
      id: 'day-1',
      label: 'Day 1',
      date: '2024-06-15',
      items: [
        {
          id: 'item-1',
          startTime: '08:00',
          endTime: '09:00',
          title: 'Registration & Breakfast',
          description: 'Pick up your badges and enjoy networking over breakfast.',
          location: 'Main Lobby'
        },
        {
          id: 'item-2',
          startTime: '09:00',
          endTime: '10:30',
          title: 'Opening Keynote: The Future of AI',
          description: 'An in-depth look at generative models and their impact on society.',
          speakerId: 'spk-1',
          location: 'Grand Ballroom'
        },
        {
          id: 'item-3',
          startTime: '11:00',
          endTime: '12:30',
          title: 'Panel Discussion: Ethics in Technology',
          description: 'Leading experts discuss the ethical implications of emerging technologies.',
          location: 'Grand Ballroom'
        }
      ]
    },
    {
      id: 'day-2',
      label: 'Day 2',
      date: '2024-06-16',
      items: [
        {
          id: 'item-4',
          startTime: '10:00',
          endTime: '11:30',
          title: 'Workshop: Quantum Cryptography',
          description: 'Hands-on session with new encryption protocols.',
          speakerId: 'spk-2',
          location: 'Room 204'
        },
        {
          id: 'item-5',
          startTime: '14:00',
          endTime: '15:30',
          title: 'Sustainable Tech Solutions',
          description: 'Exploring renewable energy and smart city technologies.',
          speakerId: 'spk-3',
          location: 'Room 205'
        }
      ]
    }
  ],
  faq: [
    {
      id: 'faq-1',
      question: 'When is the submission deadline?',
      answer: 'The final deadline for paper submissions is May 30th, 2024. Late submissions will not be accepted.',
      icon: 'calendar'
    },
    {
      id: 'faq-2',
      question: 'Are there travel grants for students?',
      answer: 'Yes, we offer a limited number of travel grants for PhD students. Please visit the registration page for more details.',
      icon: 'credit-card'
    },
    {
      id: 'faq-3',
      question: 'Where is the conference venue?',
      answer: 'The event will be held at the Moscone Center, San Francisco. Detailed maps and directions are available in the venue section.',
      icon: 'map-pin'
    },
    {
      id: 'faq-4',
      question: 'What is included in the registration fee?',
      answer: 'Registration includes access to all sessions, workshops, networking events, lunch, and refreshments throughout the conference.',
      icon: 'file-text'
    }
  ],
  contact: {
    showForm: true,
    showMap: true,
    contactPerson: 'Sarah Jenkins (Event Coordinator)',
    email: 'info@futuretech2024.com',
    phone: '+1 (415) 555-0123',
    address: 'Moscone Center, 747 Howard St, San Francisco, CA 94103',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019208272879!2d-122.40326068468164!3d37.7845349797576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808761a660d1%3A0x6b1076f238202d6!2sMoscone%20Center!5e0!3m2!1sen!2sus!4v1647416345678!5m2!1sen!2sus'
  },
  submission: {
    steps: [
      { id: 'step-1', date: 'Jan 15, 2024', title: 'Submissions Open', description: 'The submission portal opens for all tracks. Early submissions are encouraged.' },
      { id: 'step-2', date: 'Mar 30, 2024', title: 'Abstract Deadline', description: 'Final deadline for abstract submissions. No extensions will be granted.' },
      { id: 'step-3', date: 'Apr 20, 2024', title: 'Review Results', description: 'Notification of acceptance or rejection will be sent to all authors.' },
      { id: 'step-4', date: 'May 10, 2024', title: 'Camera Ready', description: 'Final versions of accepted papers must be uploaded.' },
      { id: 'step-5', date: 'Jun 15, 2024', title: 'Conference', description: 'Present your work at the conference!' },
    ],
    buttons: [
      { id: 'sub-btn-1', text: 'Download Template', url: '#template', style: 'secondary' },
      { id: 'sub-btn-2', text: 'Submit Paper', url: '#submit', style: 'primary' }
    ]
  },
  partners: [
    {
      id: 'p-group-1',
      name: 'Platinum Sponsors',
      displayStyle: 'grid',
      partners: [
        { id: 'p1', name: 'Google', logoUrl: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png', link: 'https://google.com' },
        { id: 'p2', name: 'Microsoft', logoUrl: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageMedia/RE1Mu3b?ver=5c31', link: 'https://microsoft.com' },
        { id: 'p3', name: 'Amazon', logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png', link: 'https://amazon.com' }
      ],
      showActionButton: true,
      actionButtonText: 'Become a Sponsor',
      actionButtonUrl: '#contact'
    },
    {
      id: 'p-group-2',
      name: 'Gold Sponsors',
      displayStyle: 'grid',
      partners: [
        { id: 'p4', name: 'IBM', logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/IBM-Logo.png', link: 'https://ibm.com' },
        { id: 'p5', name: 'Oracle', logoUrl: 'https://logos-world.net/wp-content/uploads/2020/09/Oracle-Logo.png', link: 'https://oracle.com' }
      ],
      showActionButton: false
    }
  ],
  pricing: [
    {
      id: 'pr-1',
      name: 'Student Pass',
      price: '199',
      currency: '$',
      features: ['Full Conference Access', 'Workshops Included', 'Lunch & Refreshments', 'Certificate of Attendance'],
      buttonText: 'Buy Student Pass',
      buttonUrl: '#register',
      isSoldOut: false,
      isHighlighted: false
    },
    {
      id: 'pr-2',
      name: 'Standard Pass',
      price: '399',
      currency: '$',
      features: ['Full Conference Access', 'Workshops Included', 'Lunch & Refreshments', 'Certificate of Attendance', 'Gala Dinner Entry', 'Networking Events'],
      buttonText: 'Buy Standard Pass',
      buttonUrl: '#register',
      isSoldOut: false,
      isHighlighted: true
    },
    {
      id: 'pr-3',
      name: 'Early Bird',
      price: '299',
      currency: '$',
      features: ['Full Conference Access', 'Workshops Included', 'Lunch & Refreshments', 'Certificate of Attendance'],
      buttonText: 'Sold Out',
      buttonUrl: '#',
      isSoldOut: true,
      isHighlighted: false
    }
  ],
  imageGroups: [
    {
      id: 'img-group-1',
      name: 'Conference Highlights',
      format: 'catalogue1',
      showNavigation: true,
      images: [
        { id: 'img-1', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { id: 'img-2', url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { id: 'img-3', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
      ]
    }
  ],
  sections: [
    { id: 'sec-1', type: 'hero', title: 'Hero Section', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-2', type: 'about', title: 'About the Conference', content: 'This conference brings together experts...', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-3', type: 'speakers', title: 'Keynote Speakers', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-8', type: 'submission', title: 'Call for Papers', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-6', type: 'committee', title: 'Scientific Committee', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-11', type: 'team', title: 'Meet the Team', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-4', type: 'agenda', title: 'Program Agenda', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-10', type: 'pricing', title: 'Tickets & Registration', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-9', type: 'partners', title: 'Partners & Sponsors', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-5', type: 'faq', title: 'Frequently Asked Questions', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-12', type: 'images', title: 'Gallery', isVisible: true, titleAlignment: 'center' },
    { id: 'sec-7', type: 'contact', title: 'Contact Us', isVisible: true, titleAlignment: 'center' },
  ],
  about: {
    includeImage: true,
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    layout: 'left-right'
  }
};
