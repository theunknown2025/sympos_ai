import {
  LayoutDashboard,
  User,
  Bell,
  FileText,
  Calendar,
  ClipboardList,
  Send,
  Award,
  Briefcase,
  Wrench,
  GraduationCap,
  MessageSquare,
  Code,
} from 'lucide-react';
import type { MorchidLanguage, MorchidPageCopy, MorchidTopic } from '../../Admin/Morchid/types';
import { participantMorchidCopyEn, participantMorchidTopicsEn } from './participantMorchidData.en';

export const participantMorchidCopy: Record<MorchidLanguage, MorchidPageCopy> = {
  en: participantMorchidCopyEn,
  fr: {
    title: 'Morchid — Guide participant',
    subtitle: 'Apprenez à utiliser toutes les fonctionnalités disponibles dans votre espace participant.',
    topicGridTitle: 'Fonctionnalités disponibles',
    topicGridHint: 'Sélectionnez un sujet à gauche pour afficher les instructions à droite.',
    guidelinesTitle: 'Guide d\'utilisation',
    stepLabel: 'Étape',
    tipLabel: 'Astuce',
    languageEn: 'English',
    languageFr: 'Français',
    languageAr: 'العربية',
    selectTopicHint: 'Sélectionnez une fonctionnalité dans la liste pour afficher son guide.',
  },
  ar: {
    title: 'مرشد — دليل المشارك',
    subtitle: 'تعرّف على كيفية استخدام جميع الميزات المتاحة في مساحتك كمشارك.',
    topicGridTitle: 'الميزات المتاحة',
    topicGridHint: 'اختر موضوعاً على اليسار لعرض التعليمات على اليمين.',
    guidelinesTitle: 'دليل الاستخدام',
    stepLabel: 'خطوة',
    tipLabel: 'نصيحة',
    languageEn: 'English',
    languageFr: 'Français',
    languageAr: 'العربية',
    selectTopicHint: 'اختر ميزة من القائمة لعرض دليلها.',
  },
};

export const participantMorchidTopics: Record<MorchidLanguage, MorchidTopic[]> = {
  en: participantMorchidTopicsEn,
  fr: [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      color: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      title: 'Tableau de bord',
      shortDescription: 'Votre page d\'accueil participant avec un résumé de votre activité.',
      guidelines: [
        {
          title: 'Naviguer sur le tableau de bord',
          steps: [
            'Connectez-vous et accédez au Tableau de bord depuis la barre latérale.',
            'Consultez vos événements à venir, invitations en attente et notifications.',
            'Utilisez les cartes rapides pour accéder aux sections principales.',
          ],
          tip: 'Complétez votre profil pour faciliter vos inscriptions futures.',
        },
      ],
    },
    {
      id: 'profile',
      icon: User,
      color: 'bg-violet-100',
      iconColor: 'text-violet-600',
      title: 'Mon profil',
      shortDescription: 'Gérer vos informations personnelles et professionnelles.',
      guidelines: [
        {
          title: 'Mettre à jour votre profil',
          steps: [
            'Ouvrez Tableau de bord → Profil.',
            'Renseignez votre nom, affiliation, photo et coordonnées.',
            'Enregistrez les modifications.',
          ],
        },
      ],
    },
    {
      id: 'invitations',
      icon: Bell,
      color: 'bg-rose-100',
      iconColor: 'text-rose-600',
      title: 'Invitations',
      shortDescription: 'Répondre aux invitations du comité scientifique.',
      guidelines: [
        {
          title: 'Accepter ou décliner une invitation',
          steps: [
            'Allez dans Évaluations → Invitations.',
            'Lisez les détails de l\'invitation (événement, rôle, délais).',
            'Cliquez sur Accepter ou Décliner et confirmez votre réponse.',
          ],
          tip: 'Répondez rapidement pour que l\'organisateur puisse planifier les évaluations.',
        },
      ],
    },
    {
      id: 'reviews',
      icon: FileText,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
      title: 'Évaluations',
      shortDescription: 'Évaluer les soumissions qui vous sont assignées.',
      guidelines: [
        {
          title: 'Soumettre une évaluation',
          steps: [
            'Ouvrez Évaluations → Évaluations.',
            'Sélectionnez une soumission assignée.',
            'Remplissez le formulaire d\'évaluation et ajoutez vos commentaires.',
            'Soumettez votre verdict (accepté, révision, refusé).',
          ],
        },
      ],
    },
    {
      id: 'events',
      icon: Calendar,
      color: 'bg-sky-100',
      iconColor: 'text-sky-600',
      title: 'Événements',
      shortDescription: 'Découvrir et suivre les événements auxquels vous participez.',
      guidelines: [
        {
          title: 'Explorer les événements',
          steps: [
            'Accédez à Participations → Événements.',
            'Parcourez vos événements enregistrés, partagés ou sauvegardés.',
            'Cliquez sur un événement pour voir le détail et le pipeline de soumission.',
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
      shortDescription: 'Suivre vos inscriptions aux événements.',
      guidelines: [
        {
          title: 'Gérer vos inscriptions',
          steps: [
            'Ouvrez Participations → Inscriptions.',
            'Consultez le statut de chaque inscription (en attente, acceptée).',
            'Téléchargez votre badge ou certificat d\'inscription si disponible.',
          ],
        },
      ],
    },
    {
      id: 'submissions',
      icon: Send,
      color: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'Soumissions',
      shortDescription: 'Soumettre et suivre vos articles et abstracts.',
      guidelines: [
        {
          title: 'Soumettre un article',
          steps: [
            'Allez dans Participations → Soumissions.',
            'Sélectionnez l\'événement concerné.',
            'Remplissez le formulaire de soumission et joignez vos fichiers.',
            'Soumettez avant la date limite indiquée.',
          ],
          tip: 'Suivez la barre de progression pour connaître l\'état de votre soumission.',
        },
      ],
    },
    {
      id: 'certificates',
      icon: Award,
      color: 'bg-yellow-100',
      iconColor: 'text-yellow-700',
      title: 'Certificats',
      shortDescription: 'Télécharger vos certificats de participation.',
      guidelines: [
        {
          title: 'Obtenir un certificat',
          steps: [
            'Ouvrez Participations → Certificats.',
            'Sélectionnez le certificat disponible.',
            'Téléchargez le PDF ou partagez le lien de vérification.',
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
      shortDescription: 'Postuler aux offres d\'emploi, formations et financements.',
      guidelines: [
        {
          title: 'Candidater à une opportunité',
          steps: [
            'Accédez à Opportunités → Parcourir.',
            'Lisez la description et les critères de l\'offre.',
            'Complétez le formulaire de candidature étape par étape.',
            'Suivez l\'avancement dans Mes candidatures.',
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
      shortDescription: 'LaTeX, CV, profil public et blog.',
      guidelines: [
        {
          title: 'Utiliser les outils participant',
          steps: [
            'Éditeur LaTeX : rédigez vos articles scientifiques en ligne.',
            'CV Builder : créez un CV professionnel exportable.',
            'Profil public : construisez une page web personnelle partageable.',
            'Blog : publiez vos articles et recherches.',
          ],
        },
      ],
    },
    {
      id: 'latex',
      icon: Code,
      color: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      title: 'LaTeX',
      shortDescription: 'Rédiger des documents scientifiques.',
      guidelines: [
        {
          title: 'Créer un document LaTeX',
          steps: [
            'Ouvrez Outils → Éditeur LaTeX.',
            'Choisissez un modèle ou commencez un document vierge.',
            'Compilez et exportez en PDF.',
          ],
        },
      ],
    },
    {
      id: 'academy',
      icon: GraduationCap,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Académie',
      shortDescription: 'Suivre des cours en ligne.',
      guidelines: [
        {
          title: 'Suivre un cours',
          steps: [
            'Accédez à Académie depuis la barre latérale.',
            'Parcourez le catalogue et inscrivez-vous à un cours.',
            'Suivez les leçons et marquez votre progression.',
          ],
        },
      ],
    },
    {
      id: 'messaging',
      icon: MessageSquare,
      color: 'bg-fuchsia-100',
      iconColor: 'text-fuchsia-600',
      title: 'Chat',
      shortDescription: 'Échanger avec les organisateurs et autres participants.',
      guidelines: [
        {
          title: 'Envoyer un message',
          steps: [
            'Ouvrez Chat depuis la barre latérale.',
            'Sélectionnez une conversation ou démarrez-en une nouvelle.',
            'Rédigez votre message et envoyez.',
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
      shortDescription: 'صفحتك الرئيسية كمشارك مع ملخص نشاطك.',
      guidelines: [
        {
          title: 'التنقل في لوحة التحكم',
          steps: [
            'سجّل الدخول وانتقل إلى لوحة التحكم من الشريط الجانبي.',
            'اطّلع على فعالياتك القادمة والدعوات المعلّقة والإشعارات.',
            'استخدم البطاقات السريعة للوصول إلى الأقسام الرئيسية.',
          ],
          tip: 'أكمل ملفك الشخصي لتسهيل تسجيلاتك المستقبلية.',
        },
      ],
    },
    {
      id: 'profile',
      icon: User,
      color: 'bg-violet-100',
      iconColor: 'text-violet-600',
      title: 'ملفي الشخصي',
      shortDescription: 'إدارة معلوماتك الشخصية والمهنية.',
      guidelines: [
        {
          title: 'تحديث ملفك الشخصي',
          steps: [
            'افتح لوحة التحكم → الملف الشخصي.',
            'أدخل اسمك وانتماءك وصورتك وبيانات الاتصال.',
            'احفظ التعديلات.',
          ],
        },
      ],
    },
    {
      id: 'invitations',
      icon: Bell,
      color: 'bg-rose-100',
      iconColor: 'text-rose-600',
      title: 'الدعوات',
      shortDescription: 'الرد على دعوات اللجنة العلمية.',
      guidelines: [
        {
          title: 'قبول أو رفض دعوة',
          steps: [
            'انتقل إلى التقييمات → الدعوات.',
            'اقرأ تفاصيل الدعوة (الفعالية، الدور، المواعيد).',
            'انقر على قبول أو رفض وأكّد ردك.',
          ],
          tip: 'رد بسرعة ليتمكن المنظم من تخطيط التقييمات.',
        },
      ],
    },
    {
      id: 'reviews',
      icon: FileText,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
      title: 'التقييمات',
      shortDescription: 'تقييم المشاركات المسندة إليك.',
      guidelines: [
        {
          title: 'تقديم تقييم',
          steps: [
            'افتح التقييمات → التقييمات.',
            'اختر مشاركة مسندة إليك.',
            'املأ نموذج التقييم وأضف ملاحظاتك.',
            'قدّم حكمك (مقبول، مراجعة، مرفوض).',
          ],
        },
      ],
    },
    {
      id: 'events',
      icon: Calendar,
      color: 'bg-sky-100',
      iconColor: 'text-sky-600',
      title: 'الفعاليات',
      shortDescription: 'اكتشف وتابع الفعاليات التي تشارك فيها.',
      guidelines: [
        {
          title: 'استكشاف الفعاليات',
          steps: [
            'انتقل إلى المشاركات → الفعاليات.',
            'تصفّح فعالياتك المسجّلة أو المشاركة أو المحفوظة.',
            'انقر على فعالية لرؤية التفاصيل ومسار المشاركة.',
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
      shortDescription: 'متابعة تسجيلاتك في الفعاليات.',
      guidelines: [
        {
          title: 'إدارة تسجيلاتك',
          steps: [
            'افتح المشاركات → التسجيلات.',
            'اطّلع على حالة كل تسجيل (قيد الانتظار، مقبول).',
            'حمّل شارتك أو شهادة التسجيل إن وُجدت.',
          ],
        },
      ],
    },
    {
      id: 'submissions',
      icon: Send,
      color: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'المشاركات',
      shortDescription: 'تقديم ومتابعة أوراقك وملخصاتك.',
      guidelines: [
        {
          title: 'تقديم مشاركة',
          steps: [
            'انتقل إلى المشاركات → المشاركات.',
            'اختر الفعالية المعنية.',
            'املأ نموذج المشاركة وأرفق ملفاتك.',
            'قدّم قبل الموعد النهائي المحدد.',
          ],
          tip: 'تابع شريط التقدم لمعرفة حالة مشاركتك.',
        },
      ],
    },
    {
      id: 'certificates',
      icon: Award,
      color: 'bg-yellow-100',
      iconColor: 'text-yellow-700',
      title: 'الشهادات',
      shortDescription: 'تحميل شهادات مشاركتك.',
      guidelines: [
        {
          title: 'الحصول على شهادة',
          steps: [
            'افتح المشاركات → الشهادات.',
            'اختر الشهادة المتاحة.',
            'حمّل ملف PDF أو شارك رابط التحقق.',
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
      shortDescription: 'التقديم على وظائف وتدريبات وتمويل.',
      guidelines: [
        {
          title: 'التقديم على فرصة',
          steps: [
            'انتقل إلى الفرص → تصفح.',
            'اقرأ الوصف ومعايير العرض.',
            'أكمل نموذج التقديم خطوة بخطوة.',
            'تابع التقدم في طلباتي.',
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
      shortDescription: 'LaTeX والسيرة الذاتية والملف العام والمدونة.',
      guidelines: [
        {
          title: 'استخدام أدوات المشارك',
          steps: [
            'محرر LaTeX: اكتب مقالاتك العلمية على الإنترنت.',
            'منشئ السيرة: أنشئ سيرة ذاتية احترافية قابلة للتصدير.',
            'الملف العام: ابنِ صفحة ويب شخصية قابلة للمشاركة.',
            'المدونة: انشر مقالاتك وأبحاثك.',
          ],
        },
      ],
    },
    {
      id: 'latex',
      icon: Code,
      color: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      title: 'LaTeX',
      shortDescription: 'كتابة مستندات علمية.',
      guidelines: [
        {
          title: 'إنشاء مستند LaTeX',
          steps: [
            'افتح الأدوات → محرر LaTeX.',
            'اختر قالباً أو ابدأ مستنداً فارغاً.',
            'جمّع وصدّر بصيغة PDF.',
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
      shortDescription: 'متابعة دورات عبر الإنترنت.',
      guidelines: [
        {
          title: 'متابعة دورة',
          steps: [
            'انتقل إلى الأكاديمية من الشريط الجانبي.',
            'تصفّح الكتالوج وسجّل في دورة.',
            'تابع الدروس وسجّل تقدمك.',
          ],
        },
      ],
    },
    {
      id: 'messaging',
      icon: MessageSquare,
      color: 'bg-fuchsia-100',
      iconColor: 'text-fuchsia-600',
      title: 'الدردشة',
      shortDescription: 'التواصل مع المنظمين والمشاركين الآخرين.',
      guidelines: [
        {
          title: 'إرسال رسالة',
          steps: [
            'افتح الدردشة من الشريط الجانبي.',
            'اختر محادثة أو ابدأ محادثة جديدة.',
            'اكتب رسالتك وأرسلها.',
          ],
        },
      ],
    },
  ],
};
