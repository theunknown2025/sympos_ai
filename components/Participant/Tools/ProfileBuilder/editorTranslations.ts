/**
 * Translation utility for editor labels, placeholders, and text based on language code
 */

type LanguageCode = 'en' | 'fr' | 'ar';

export interface EditorTranslations {
  // General Info
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  organization: string;
  position: string;
  bio: string;
  links: string;
  addLink: string;
  platform: string;
  url: string;
  remove: string;
  
  // Education
  education: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  present: string;
  
  // Experiences
  experience: string;
  company: string;
  description: string;
  
  // Publications
  publication: string;
  pubTitle: string;
  authors: string;
  publisher: string;
  date: string;
  
  // Certifications
  certification: string;
  name: string;
  issuer: string;
  credentialId: string;
  credentialUrl: string;
  
  // Media
  mediaItem: string;
  mediaTitle: string;
  mediaType: string;
  image: string;
  video: string;
  
  // Blog
  blogPost: string;
  postTitle: string;
  content: string;
  postUrl: string;
  
  // Profile
  profileContent: string;
  profileSummary: string;
  
  // Common
  add: string;
  delete: string;
  save: string;
  cancel: string;
  optional: string;
}

const englishTranslations: EditorTranslations = {
  firstName: 'First Name',
  lastName: 'Last Name',
  title: 'Title',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  organization: 'Organization',
  position: 'Position',
  bio: 'Bio',
  links: 'Links',
  addLink: 'Add Link',
  platform: 'Platform',
  url: 'URL',
  remove: 'Remove',
  education: 'Education',
  institution: 'Institution',
  degree: 'Degree',
  field: 'Field',
  startDate: 'Start Date',
  endDate: 'End Date',
  present: 'Present',
  experience: 'Experience',
  company: 'Company',
  description: 'Description',
  publication: 'Publication',
  pubTitle: 'Title',
  authors: 'Authors',
  publisher: 'Publisher',
  date: 'Date',
  certification: 'Certification',
  name: 'Name',
  issuer: 'Issuer',
  credentialId: 'Credential ID',
  credentialUrl: 'Credential URL',
  mediaItem: 'Media Item',
  mediaTitle: 'Title',
  mediaType: 'Type',
  image: 'Image',
  video: 'Video',
  blogPost: 'Blog Post',
  postTitle: 'Title',
  content: 'Content',
  postUrl: 'URL',
  profileContent: 'Content',
  profileSummary: 'Profile Summary',
  add: 'Add',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  optional: 'Optional',
};

const frenchTranslations: EditorTranslations = {
  firstName: 'Prénom',
  lastName: 'Nom de famille',
  title: 'Titre',
  email: 'Email',
  phone: 'Téléphone',
  address: 'Adresse',
  organization: 'Organisation',
  position: 'Poste',
  bio: 'Biographie',
  links: 'Liens',
  addLink: 'Ajouter un lien',
  platform: 'Plateforme',
  url: 'URL',
  remove: 'Supprimer',
  education: 'Éducation',
  institution: 'Institution',
  degree: 'Diplôme',
  field: 'Domaine',
  startDate: 'Date de début',
  endDate: 'Date de fin',
  present: 'Présent',
  experience: 'Expérience',
  company: 'Entreprise',
  description: 'Description',
  publication: 'Publication',
  pubTitle: 'Titre',
  authors: 'Auteurs',
  publisher: 'Éditeur',
  date: 'Date',
  certification: 'Certification',
  name: 'Nom',
  issuer: 'Émetteur',
  credentialId: 'ID de certificat',
  credentialUrl: 'URL du certificat',
  mediaItem: 'Élément média',
  mediaTitle: 'Titre',
  mediaType: 'Type',
  image: 'Image',
  video: 'Vidéo',
  blogPost: 'Article de blog',
  postTitle: 'Titre',
  content: 'Contenu',
  postUrl: 'URL',
  profileContent: 'Contenu',
  profileSummary: 'Résumé du profil',
  add: 'Ajouter',
  delete: 'Supprimer',
  save: 'Enregistrer',
  cancel: 'Annuler',
  optional: 'Optionnel',
};

const arabicTranslations: EditorTranslations = {
  firstName: 'الاسم الأول',
  lastName: 'اسم العائلة',
  title: 'اللقب',
  email: 'البريد الإلكتروني',
  phone: 'الهاتف',
  address: 'العنوان',
  organization: 'المنظمة',
  position: 'المنصب',
  bio: 'السيرة الذاتية',
  links: 'الروابط',
  addLink: 'إضافة رابط',
  platform: 'المنصة',
  url: 'الرابط',
  remove: 'حذف',
  education: 'التعليم',
  institution: 'المؤسسة',
  degree: 'الدرجة',
  field: 'المجال',
  startDate: 'تاريخ البدء',
  endDate: 'تاريخ الانتهاء',
  present: 'حاضر',
  experience: 'الخبرة',
  company: 'الشركة',
  description: 'الوصف',
  publication: 'المنشور',
  pubTitle: 'العنوان',
  authors: 'المؤلفون',
  publisher: 'الناشر',
  date: 'التاريخ',
  certification: 'الشهادة',
  name: 'الاسم',
  issuer: 'المصدر',
  credentialId: 'معرف الشهادة',
  credentialUrl: 'رابط الشهادة',
  mediaItem: 'عنصر الوسائط',
  mediaTitle: 'العنوان',
  mediaType: 'النوع',
  image: 'صورة',
  video: 'فيديو',
  blogPost: 'مقال المدونة',
  postTitle: 'العنوان',
  content: 'المحتوى',
  postUrl: 'الرابط',
  profileContent: 'المحتوى',
  profileSummary: 'ملخص الملف الشخصي',
  add: 'إضافة',
  delete: 'حذف',
  save: 'حفظ',
  cancel: 'إلغاء',
  optional: 'اختياري',
};

export const getEditorTranslations = (language: LanguageCode = 'en'): EditorTranslations => {
  switch (language) {
    case 'fr':
      return frenchTranslations;
    case 'ar':
      return arabicTranslations;
    default:
      return englishTranslations;
  }
};

// Platform translations
export const getPlatformOptions = (language: LanguageCode = 'en') => {
  const platforms = {
    en: [
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'github', label: 'GitHub' },
      { value: 'google-scholar', label: 'Google Scholar' },
      { value: 'orcid', label: 'ORCID' },
      { value: 'researchgate', label: 'ResearchGate' },
      { value: 'website', label: 'Personal Website' },
      { value: 'twitter', label: 'Twitter/X' },
      { value: 'other', label: 'Other' },
    ],
    fr: [
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'github', label: 'GitHub' },
      { value: 'google-scholar', label: 'Google Scholar' },
      { value: 'orcid', label: 'ORCID' },
      { value: 'researchgate', label: 'ResearchGate' },
      { value: 'website', label: 'Site Web Personnel' },
      { value: 'twitter', label: 'Twitter/X' },
      { value: 'other', label: 'Autre' },
    ],
    ar: [
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'github', label: 'GitHub' },
      { value: 'google-scholar', label: 'Google Scholar' },
      { value: 'orcid', label: 'ORCID' },
      { value: 'researchgate', label: 'ResearchGate' },
      { value: 'website', label: 'الموقع الشخصي' },
      { value: 'twitter', label: 'Twitter/X' },
      { value: 'other', label: 'أخرى' },
    ],
  };
  return platforms[language] || platforms.en;
};
