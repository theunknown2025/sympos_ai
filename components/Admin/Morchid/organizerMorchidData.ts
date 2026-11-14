import {
  LayoutDashboard,
  Calendar,
  Globe,
  FileText,
  ClipboardList,
  CheckSquare,
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
import type { MorchidLanguage, MorchidPageCopy, MorchidTopic } from './types';
import { organizerMorchidCopyEn, organizerMorchidTopicsEn } from './organizerMorchidData.en';

export const organizerMorchidCopy: Record<MorchidLanguage, MorchidPageCopy> = {
  en: organizerMorchidCopyEn,
  fr: {
    title: 'Morchid — Guide organisateur',
    subtitle: 'Découvrez comment utiliser chaque module de la plateforme Sympos-ia.',
    topicGridTitle: 'Modules de la plateforme',
    topicGridHint: 'Sélectionnez un module à gauche pour afficher les instructions à droite.',
    guidelinesTitle: 'Instructions pas à pas',
    stepLabel: 'Étape',
    tipLabel: 'Astuce',
    languageEn: 'English',
    languageFr: 'Français',
    languageAr: 'العربية',
    selectTopicHint: 'Sélectionnez un module dans la liste pour afficher son guide.',
  },
  ar: {
    title: 'مرشد — دليل المنظم',
    subtitle: 'تعرّف على كيفية استخدام كل مكوّن من مكوّنات منصة Sympos-ia.',
    topicGridTitle: 'مكوّنات المنصة',
    topicGridHint: 'اختر مكوّناً على اليسار لعرض الإرشادات على اليمين.',
    guidelinesTitle: 'تعليمات خطوة بخطوة',
    stepLabel: 'خطوة',
    tipLabel: 'نصيحة',
    languageEn: 'English',
    languageFr: 'Français',
    languageAr: 'العربية',
    selectTopicHint: 'اختر مكوّناً من القائمة لعرض دليله.',
  },
};

export const organizerMorchidTopics: Record<MorchidLanguage, MorchidTopic[]> = {
  en: organizerMorchidTopicsEn,
  fr: [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      color: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      title: 'Tableau de bord',
      shortDescription: 'Vue d\'ensemble de vos événements et indicateurs clés.',
      guidelines: [
        {
          title: 'Consulter votre espace',
          steps: [
            'Ouvrez le menu Tableau de bord depuis la barre latérale.',
            'Consultez les statistiques : inscriptions, soumissions et activité récente.',
            'Utilisez les raccourcis pour accéder rapidement aux sections fréquentes.',
          ],
          tip: 'Passez en mode « événement focalisé » pour ne voir que les données d\'un seul événement.',
        },
      ],
    },
    {
      id: 'events',
      icon: Calendar,
      color: 'bg-violet-100',
      iconColor: 'text-violet-600',
      title: 'Événements',
      shortDescription: 'Créer, publier et gérer vos conférences.',
      guidelines: [
        {
          title: 'Créer un événement',
          steps: [
            'Allez dans Gestion d\'événements → Nouvel événement.',
            'Renseignez le titre, les dates, le lieu et les formulaires liés.',
            'Associez les formulaires d\'inscription et de soumission.',
            'Publiez l\'événement pour le rendre visible aux participants.',
          ],
          tip: 'Vérifiez les dates limites avant publication pour éviter les inscriptions tardives.',
        },
        {
          title: 'Modifier ou prévisualiser',
          steps: [
            'Sélectionnez l\'événement dans la liste.',
            'Utilisez Modifier pour mettre à jour les informations.',
            'Cliquez sur Aperçu pour voir la page publique.',
          ],
        },
      ],
    },
    {
      id: 'landing-pages',
      icon: Globe,
      color: 'bg-sky-100',
      iconColor: 'text-sky-600',
      title: 'Pages d\'accueil',
      shortDescription: 'Construire des pages vitrine pour vos événements.',
      guidelines: [
        {
          title: 'Créer une landing page',
          steps: [
            'Ouvrez Outils → Pages d\'accueil.',
            'Cliquez sur Nouvelle page et choisissez un modèle.',
            'Personnalisez les sections : héros, programme, intervenants, soumissions.',
            'Publiez et partagez le lien public.',
          ],
          tip: 'Liez la page à un événement pour synchroniser automatiquement les dates.',
        },
      ],
    },
    {
      id: 'forms',
      icon: FileText,
      color: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      title: 'Formulaires',
      shortDescription: 'Formulaires d\'inscription et de soumission personnalisés.',
      guidelines: [
        {
          title: 'Construire un formulaire',
          steps: [
            'Accédez à Outils → Formulaires.',
            'Ajoutez des champs : texte, choix, fichiers, dates.',
            'Définissez les champs obligatoires et les validations.',
            'Enregistrez et associez le formulaire à un événement.',
          ],
        },
      ],
    },
    {
      id: 'registrations',
      icon: ClipboardList,
      color: 'bg-teal-100',
      iconColor: 'text-teal-600',
      title: 'Inscriptions',
      shortDescription: 'Suivre et valider les inscriptions des participants.',
      guidelines: [
        {
          title: 'Gérer les inscriptions',
          steps: [
            'Ouvrez Inscriptions → Liste des inscriptions.',
            'Filtrez par statut : en attente, acceptée, refusée.',
            'Exportez la liste ou envoyez des e-mails groupés.',
          ],
        },
        {
          title: 'Pointage (Check-in)',
          steps: [
            'Allez dans Inscriptions → Pointage.',
            'Scannez le QR code du badge ou recherchez par nom.',
            'Confirmez la présence du participant.',
          ],
          tip: 'Générez les badges avant le jour J pour accélérer le check-in.',
        },
      ],
    },
    {
      id: 'submissions',
      icon: Send,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
      title: 'Soumissions',
      shortDescription: 'Recevoir, évaluer et suivre les articles soumis.',
      guidelines: [
        {
          title: 'Gérer les soumissions reçues',
          steps: [
            'Ouvrez Soumissions → Gérer les soumissions.',
            'Consultez les soumissions par statut et par événement.',
            'Attribuez des évaluateurs ou changez le statut (accepté, révision, refusé).',
          ],
        },
        {
          title: 'Comité et rapports',
          steps: [
            'Invitez les membres du comité via Gérer le comité.',
            'Suivez l\'avancement dans Suivi et Rapports.',
            'Générez le programme final avec le Générateur de programme.',
          ],
        },
      ],
    },
    {
      id: 'committee',
      icon: Users,
      color: 'bg-rose-100',
      iconColor: 'text-rose-600',
      title: 'Comité',
      shortDescription: 'Inviter et coordonner les évaluateurs.',
      guidelines: [
        {
          title: 'Inviter des évaluateurs',
          steps: [
            'Allez dans Soumissions → Gérer le comité.',
            'Ajoutez un membre avec son e-mail professionnel.',
            'Envoyez l\'invitation et suivez les réponses.',
            'Assignez des soumissions à chaque membre.',
          ],
          tip: 'Les évaluateurs reçoivent un accès participant pour répondre aux invitations.',
        },
      ],
    },
    {
      id: 'reporting',
      icon: BarChart3,
      color: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      title: 'Rapports',
      shortDescription: 'Statistiques et tableaux de suivi.',
      guidelines: [
        {
          title: 'Analyser les données',
          steps: [
            'Ouvrez Soumissions → Rapports.',
            'Consultez les graphiques d\'acceptation et de délais.',
            'Exportez les données pour vos comités scientifiques.',
          ],
        },
      ],
    },
    {
      id: 'program',
      icon: Presentation,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: 'Programme',
      shortDescription: 'Construire et exporter le programme scientifique.',
      guidelines: [
        {
          title: 'Générer le programme',
          steps: [
            'Accédez au Générateur de programme.',
            'Organisez les sessions par jour et salle.',
            'Ajoutez les légendes de couleur et exportez en PDF.',
          ],
        },
      ],
    },
    {
      id: 'certificates',
      icon: Award,
      color: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'Certificats',
      shortDescription: 'Modèles et génération de certificats.',
      guidelines: [
        {
          title: 'Créer et distribuer',
          steps: [
            'Créez un modèle dans Certificats → Modèles.',
            'Définissez les champs dynamiques (nom, événement, date).',
            'Générez les certificats pour les inscriptions ou soumissions acceptées.',
            'Envoyez le lien de téléchargement aux participants.',
          ],
        },
      ],
    },
    {
      id: 'opportunities',
      icon: Briefcase,
      color: 'bg-lime-100',
      iconColor: 'text-lime-700',
      title: 'Opportunités',
      shortDescription: 'Offres d\'emploi, formations et financements.',
      guidelines: [
        {
          title: 'Publier une opportunité',
          steps: [
            'Ouvrez Opportunités → Nouvelle opportunité.',
            'Rédigez la description, les critères et les étapes du processus.',
            'Publiez et suivez les candidatures reçues.',
          ],
        },
      ],
    },
    {
      id: 'academy',
      icon: GraduationCap,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Académie LMS',
      shortDescription: 'Cours en ligne, inscriptions et paiements.',
      guidelines: [
        {
          title: 'Gérer les cours',
          steps: [
            'Créez un cours dans Académie → Gestion des cours.',
            'Ajoutez des chapitres, leçons et contenus multimédias.',
            'Configurez les inscriptions et les tarifs.',
          ],
        },
      ],
    },
    {
      id: 'tools',
      icon: Wrench,
      color: 'bg-slate-100',
      iconColor: 'text-slate-600',
      title: 'Outils',
      shortDescription: 'Fichiers, e-mailer, blogs et présentateur.',
      guidelines: [
        {
          title: 'Utiliser les outils',
          steps: [
            'Fichiers : stockez documents et pièces jointes partagées.',
            'Emailer : créez des campagnes pour participants et comité.',
            'Blogs et Présentateur : publiez du contenu et des diapositives.',
          ],
        },
      ],
    },
    {
      id: 'messaging',
      icon: MessageSquare,
      color: 'bg-fuchsia-100',
      iconColor: 'text-fuchsia-600',
      title: 'Messagerie',
      shortDescription: 'Communiquer avec participants et équipe.',
      guidelines: [
        {
          title: 'Envoyer des messages',
          steps: [
            'Ouvrez Messagerie depuis la barre latérale.',
            'Sélectionnez un contact ou créez une conversation.',
            'Joignez des fichiers si nécessaire.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      icon: CreditCard,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'Paiements',
      shortDescription: 'Offres, suivi et génération de factures.',
      guidelines: [
        {
          title: 'Configurer les paiements',
          steps: [
            'Renseignez vos informations dans Paiements → Infos paiement.',
            'Créez une offre avec tarif et conditions.',
            'Suivez les paiements reçus et générez les documents.',
          ],
        },
      ],
    },
    {
      id: 'projects',
      icon: FolderKanban,
      color: 'bg-stone-100',
      iconColor: 'text-stone-600',
      title: 'Projets',
      shortDescription: 'Gestion de projet et suivi d\'équipe.',
      guidelines: [
        {
          title: 'Organiser un projet',
          steps: [
            'Ajoutez le personnel dans Gestion de projet → Personnel.',
            'Créez un projet avec jalons et tâches.',
            'Suivez l\'avancement dans Suivi.',
          ],
        },
      ],
    },
  ],
  ar: [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      color: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      title: 'لوحة التحكم',
      shortDescription: 'نظرة عامة على فعالياتك ومؤشراتك الرئيسية.',
      guidelines: [
        {
          title: 'استعراض مساحتك',
          steps: [
            'افتح قائمة لوحة التحكم من الشريط الجانبي.',
            'اطّلع على الإحصائيات: التسجيلات والمشاركات والنشاط الأخير.',
            'استخدم الاختصارات للوصول السريع إلى الأقسام الأكثر استخداماً.',
          ],
          tip: 'فعّل وضع «الفعالية المركّزة» لعرض بيانات فعالية واحدة فقط.',
        },
      ],
    },
    {
      id: 'events',
      icon: Calendar,
      color: 'bg-violet-100',
      iconColor: 'text-violet-600',
      title: 'الفعاليات',
      shortDescription: 'إنشاء ونشر وإدارة مؤتمراتك.',
      guidelines: [
        {
          title: 'إنشاء فعالية',
          steps: [
            'انتقل إلى إدارة الفعاليات → فعالية جديدة.',
            'أدخل العنوان والتواريخ والمكان والنماذج المرتبطة.',
            'اربط نماذج التسجيل والمشاركة.',
            'انشر الفعالية لجعلها مرئية للمشاركين.',
          ],
          tip: 'تحقق من المواعيد النهائية قبل النشر لتجنب التسجيلات المتأخرة.',
        },
        {
          title: 'تعديل أو معاينة',
          steps: [
            'اختر الفعالية من القائمة.',
            'استخدم تعديل لتحديث المعلومات.',
            'انقر على معاينة لرؤية الصفحة العامة.',
          ],
        },
      ],
    },
    {
      id: 'landing-pages',
      icon: Globe,
      color: 'bg-sky-100',
      iconColor: 'text-sky-600',
      title: 'صفحات الهبوط',
      shortDescription: 'بناء صفحات عرض لفعالياتك.',
      guidelines: [
        {
          title: 'إنشاء صفحة هبوط',
          steps: [
            'افتح الأدوات → صفحات الهبوط.',
            'انقر على صفحة جديدة واختر قالباً.',
            'خصّص الأقسام: البطل، البرنامج، المتحدثون، المشاركات.',
            'انشر وشارك الرابط العام.',
          ],
          tip: 'اربط الصفحة بفعالية لمزامنة التواريخ تلقائياً.',
        },
      ],
    },
    {
      id: 'forms',
      icon: FileText,
      color: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      title: 'النماذج',
      shortDescription: 'نماذج تسجيل ومشاركة مخصصة.',
      guidelines: [
        {
          title: 'بناء نموذج',
          steps: [
            'انتقل إلى الأدوات → النماذج.',
            'أضف حقولاً: نص، اختيار، ملفات، تواريخ.',
            'حدد الحقول الإلزامية وقواعد التحقق.',
            'احفظ واربط النموذج بفعالية.',
          ],
        },
      ],
    },
    {
      id: 'registrations',
      icon: ClipboardList,
      color: 'bg-teal-100',
      iconColor: 'text-teal-600',
      title: 'التسجيلات',
      shortDescription: 'متابعة والتحقق من تسجيلات المشاركين.',
      guidelines: [
        {
          title: 'إدارة التسجيلات',
          steps: [
            'افتح التسجيلات → قائمة التسجيلات.',
            'صفِّ حسب الحالة: قيد الانتظار، مقبول، مرفوض.',
            'صدّر القائمة أو أرسل رسائل جماعية.',
          ],
        },
        {
          title: 'تسجيل الحضور',
          steps: [
            'انتقل إلى التسجيلات → تسجيل الحضور.',
            'امسح رمز QR للشارة أو ابحث بالاسم.',
            'أكّد حضور المشارك.',
          ],
          tip: 'أنشئ الشارات قبل يوم الفعالية لتسريع تسجيل الحضور.',
        },
      ],
    },
    {
      id: 'submissions',
      icon: Send,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
      title: 'المشاركات',
      shortDescription: 'استقبال وتقييم ومتابعة الأوراق المقدّمة.',
      guidelines: [
        {
          title: 'إدارة المشاركات الواردة',
          steps: [
            'افتح المشاركات → إدارة المشاركات.',
            'اطّلع على المشاركات حسب الحالة والفعالية.',
            'عيّن مقيّمين أو غيّر الحالة (مقبول، مراجعة، مرفوض).',
          ],
        },
        {
          title: 'اللجنة والتقارير',
          steps: [
            'ادعُ أعضاء اللجنة عبر إدارة اللجنة.',
            'تابع التقدم في المتابعة والتقارير.',
            'أنشئ البرنامج النهائي بمولّد البرنامج.',
          ],
        },
      ],
    },
    {
      id: 'committee',
      icon: Users,
      color: 'bg-rose-100',
      iconColor: 'text-rose-600',
      title: 'اللجنة',
      shortDescription: 'دعوة وتنسيق المقيّمين.',
      guidelines: [
        {
          title: 'دعوة المقيّمين',
          steps: [
            'انتقل إلى المشاركات → إدارة اللجنة.',
            'أضف عضواً ببريده الإلكتروني المهني.',
            'أرسل الدعوة وتابع الردود.',
            'عيّن مشاركات لكل عضو.',
          ],
          tip: 'يتلقى المقيّمون وصولاً كمشارك للرد على الدعوات.',
        },
      ],
    },
    {
      id: 'reporting',
      icon: BarChart3,
      color: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      title: 'التقارير',
      shortDescription: 'إحصائيات وجداول متابعة.',
      guidelines: [
        {
          title: 'تحليل البيانات',
          steps: [
            'افتح المشاركات → التقارير.',
            'اطّلع على رسوم القبول والمواعيد.',
            'صدّر البيانات للجانك العلمية.',
          ],
        },
      ],
    },
    {
      id: 'program',
      icon: Presentation,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: 'البرنامج',
      shortDescription: 'بناء وتصدير البرنامج العلمي.',
      guidelines: [
        {
          title: 'إنشاء البرنامج',
          steps: [
            'انتقل إلى مولّد البرنامج.',
            'رتّب الجلسات حسب اليوم والقاعة.',
            'أضف مفاتيح الألوان وصدّر بصيغة PDF.',
          ],
        },
      ],
    },
    {
      id: 'certificates',
      icon: Award,
      color: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'الشهادات',
      shortDescription: 'قوالب وإنشاء الشهادات.',
      guidelines: [
        {
          title: 'إنشاء وتوزيع',
          steps: [
            'أنشئ قالباً في الشهادات → القوالب.',
            'حدد الحقول الديناميكية (الاسم، الفعالية، التاريخ).',
            'أنشئ الشهادات للتسجيلات أو المشاركات المقبولة.',
            'أرسل رابط التحميل للمشاركين.',
          ],
        },
      ],
    },
    {
      id: 'opportunities',
      icon: Briefcase,
      color: 'bg-lime-100',
      iconColor: 'text-lime-700',
      title: 'الفرص',
      shortDescription: 'وظائف وتدريبات وتمويل.',
      guidelines: [
        {
          title: 'نشر فرصة',
          steps: [
            'افتح الفرص → فرصة جديدة.',
            'اكتب الوصف والمعايير ومراحل العملية.',
            'انشر وتابع الطلبات الواردة.',
          ],
        },
      ],
    },
    {
      id: 'academy',
      icon: GraduationCap,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'الأكاديمية',
      shortDescription: 'دورات وتسجيلات ومدفوعات.',
      guidelines: [
        {
          title: 'إدارة الدورات',
          steps: [
            'أنشئ دورة في الأكاديمية → إدارة الدورات.',
            'أضف فصولاً ودروساً ومحتوى وسائط.',
            'اضبط التسجيلات والأسعار.',
          ],
        },
      ],
    },
    {
      id: 'tools',
      icon: Wrench,
      color: 'bg-slate-100',
      iconColor: 'text-slate-600',
      title: 'الأدوات',
      shortDescription: 'ملفات ومراسلة ومدونات وعروض.',
      guidelines: [
        {
          title: 'استخدام الأدوات',
          steps: [
            'الملفات: خزّن المستندات والمرفقات المشتركة.',
            'المراسلة: أنشئ حملات للمشاركين واللجنة.',
            'المدونات والعروض: انشر محتوى وشرائح.',
          ],
        },
      ],
    },
    {
      id: 'messaging',
      icon: MessageSquare,
      color: 'bg-fuchsia-100',
      iconColor: 'text-fuchsia-600',
      title: 'الرسائل',
      shortDescription: 'التواصل مع المشاركين والفريق.',
      guidelines: [
        {
          title: 'إرسال رسائل',
          steps: [
            'افتح الرسائل من الشريط الجانبي.',
            'اختر جهة اتصال أو أنشئ محادثة.',
            'أرفق ملفات عند الحاجة.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      icon: CreditCard,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'المدفوعات',
      shortDescription: 'عروض ومتابعة وفواتير.',
      guidelines: [
        {
          title: 'إعداد المدفوعات',
          steps: [
            'أدخل معلوماتك في المدفوعات → معلومات الدفع.',
            'أنشئ عرضاً بالسعر والشروط.',
            'تابع المدفوعات الواردة وأنشئ المستندات.',
          ],
        },
      ],
    },
    {
      id: 'projects',
      icon: FolderKanban,
      color: 'bg-stone-100',
      iconColor: 'text-stone-600',
      title: 'المشاريع',
      shortDescription: 'إدارة المشاريع ومتابعة الفريق.',
      guidelines: [
        {
          title: 'تنظيم مشروع',
          steps: [
            'أضف الموظفين في إدارة المشاريع → الموظفون.',
            'أنشئ مشروعاً بمعالم ومهام.',
            'تابع التقدم في المتابعة.',
          ],
        },
      ],
    },
  ],
};
