import type { Locale } from "@/lib/api/contracts";

export interface Messages {
  productSubtitle: string;
  demoNotice: string;
  switchLanguage: string;
  skipToContent: string;
  navigationLabel: string;
  openNavigation: string;
  closeNavigation: string;
  currentSection: string;
  planned: string;
  overview: string;
  accounts: string;
  transactions: string;
  imports: string;
  budgets: string;
  settings: string;
  foundationEyebrow: string;
  foundationTitle: string;
  foundationDescription: string;
  stageLabel: string;
  readyLabel: string;
  apiLabel: string;
  apiDescription: string;
  authLabel: string;
  authDescription: string;
  interfaceLabel: string;
  interfaceDescription: string;
  nextTitle: string;
  nextDescription: string;
  reviewerNote: string;
}

export const messages: Record<Locale, Messages> = {
  ar: {
    productSubtitle: "وضوح مالي من بيانات تجريبية",
    demoNotice: "بيانات تجريبية فقط — لا يوجد اتصال بالبنوك",
    switchLanguage: "عرض الواجهة بالإنجليزية",
    skipToContent: "تخطَّ إلى المحتوى الرئيسي",
    navigationLabel: "التنقل الرئيسي",
    openNavigation: "افتح قائمة التنقل",
    closeNavigation: "أغلق قائمة التنقل",
    currentSection: "القسم الحالي",
    planned: "لاحقًا",
    overview: "نظرة عامة",
    accounts: "الحسابات",
    transactions: "المعاملات",
    imports: "استيراد CSV",
    budgets: "الميزانيات والالتزامات",
    settings: "الإعدادات والجلسات",
    foundationEyebrow: "المرحلة التأسيسية ٠٠",
    foundationTitle: "مساحة واضحة لفهم أموالك التجريبية.",
    foundationDescription:
      "اكتمل أساس الواجهة: اتجاه عربي أصيل، نظام تصميم دلالي، واتصال منضبط مع واجهة RASID البرمجية الحالية.",
    stageLabel: "الأساس",
    readyLabel: "جاهز للمراجعة",
    apiLabel: "حدود API",
    apiDescription:
      "عميل مركزي يحافظ على القيم المالية كنصوص ويعرض أخطاء الخادم كما هي.",
    authLabel: "بنية الجلسة",
    authDescription:
      "رمز وصول في الذاكرة وتحديث منسّق بين علامات التبويب، دون شاشات دخول بعد.",
    interfaceLabel: "نظام الواجهة",
    interfaceDescription:
      "تخطيط متجاوب، تنقل واضح، وأنماط عربية مستضافة ذاتيًا.",
    nextTitle: "ما التالي؟",
    nextDescription:
      "تتوقف هذه المرحلة هنا. تبدأ شاشات المصادقة فقط بعد مراجعة هذا الأساس.",
    reviewerNote: "لا تعرض هذه الصفحة أرصدة أو معاملات مختلقة.",
  },
  en: {
    productSubtitle: "Financial clarity from demo data",
    demoNotice: "Demo data only — no bank connection",
    switchLanguage: "عرض الواجهة بالعربية",
    skipToContent: "Skip to main content",
    navigationLabel: "Main navigation",
    openNavigation: "Open navigation menu",
    closeNavigation: "Close navigation menu",
    currentSection: "Current section",
    planned: "Planned",
    overview: "Overview",
    accounts: "Accounts",
    transactions: "Transactions",
    imports: "CSV imports",
    budgets: "Budgets & obligations",
    settings: "Settings & sessions",
    foundationEyebrow: "FOUNDATION STAGE 00",
    foundationTitle: "A calm place to understand demo finances.",
    foundationDescription:
      "The interface foundation is ready: native RTL, semantic design tokens, and a disciplined connection to the existing RASID API.",
    stageLabel: "Foundation",
    readyLabel: "Ready for review",
    apiLabel: "API boundary",
    apiDescription:
      "A central client preserves money as strings and presents server failures honestly.",
    authLabel: "Session architecture",
    authDescription:
      "In-memory access tokens and cross-tab refresh coordination, with no sign-in screens yet.",
    interfaceLabel: "Interface system",
    interfaceDescription:
      "Responsive structure, clear navigation, and self-hosted Arabic type.",
    nextTitle: "What comes next?",
    nextDescription:
      "This stage stops here. Authentication screens begin only after this foundation is reviewed.",
    reviewerNote: "This page shows no fabricated balances or transactions.",
  },
};
