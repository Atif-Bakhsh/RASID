import type { Locale } from '@/lib/api/contracts';

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
  authenticationStage: string;
  sessionStatus: string;
  authEyebrow: string;
  authWelcomeTitle: string;
  authWelcomeDescription: string;
  authPromiseOne: string;
  authPromiseTwo: string;
  authPromiseThree: string;
  loginTitle: string;
  loginDescription: string;
  registerTitle: string;
  registerDescription: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordHint: string;
  timezoneLabel: string;
  timezoneHint: string;
  showPassword: string;
  hidePassword: string;
  loginAction: string;
  loggingIn: string;
  registerAction: string;
  registering: string;
  noAccount: string;
  haveAccount: string;
  goToRegister: string;
  goToLogin: string;
  demoAccountTitle: string;
  demoAccountDescription: string;
  useDemoAccount: string;
  demoCredentialsFilled: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordLength: string;
  timezoneRequired: string;
  invalidCredentialsTitle: string;
  emailConflictTitle: string;
  validationErrorTitle: string;
  rateLimitedTitle: string;
  backendUnavailableTitle: string;
  unexpectedErrorTitle: string;
  retryAfter: string;
  requestReference: string;
  copyRequestId: string;
  copiedRequestId: string;
  restoringSession: string;
  restoringSessionDescription: string;
  redirecting: string;
  unavailableSessionTitle: string;
  unavailableSessionDescription: string;
  retryConnection: string;
  sessionReadyEyebrow: string;
  sessionReadyTitle: string;
  sessionReadyDescription: string;
  signedInAs: string;
  sessionIdentifier: string;
  sessionSecurityTitle: string;
  sessionSecurityDescription: string;
  logoutAction: string;
  loggingOut: string;
  logoutFailed: string;
  dashboardPending: string;
}

export const messages: Record<Locale, Messages> = {
  ar: {
    productSubtitle: 'وضوح مالي من بيانات تجريبية',
    demoNotice: 'بيانات تجريبية فقط — لا يوجد اتصال بالبنوك',
    switchLanguage: 'عرض الواجهة بالإنجليزية',
    skipToContent: 'تخطَّ إلى المحتوى الرئيسي',
    navigationLabel: 'التنقل الرئيسي',
    openNavigation: 'افتح قائمة التنقل',
    closeNavigation: 'أغلق قائمة التنقل',
    currentSection: 'القسم الحالي',
    planned: 'لاحقًا',
    overview: 'نظرة عامة',
    accounts: 'الحسابات',
    transactions: 'المعاملات',
    imports: 'استيراد CSV',
    budgets: 'الميزانيات والالتزامات',
    settings: 'الإعدادات والجلسات',
    foundationEyebrow: 'المرحلة التأسيسية ٠٠',
    foundationTitle: 'مساحة واضحة لفهم أموالك التجريبية.',
    foundationDescription:
      'اكتمل أساس الواجهة: اتجاه عربي أصيل، نظام تصميم دلالي، واتصال منضبط مع واجهة RASID البرمجية الحالية.',
    stageLabel: 'الأساس',
    readyLabel: 'جاهز للمراجعة',
    apiLabel: 'حدود API',
    apiDescription:
      'عميل مركزي يحافظ على القيم المالية كنصوص ويعرض أخطاء الخادم كما هي.',
    authLabel: 'بنية الجلسة',
    authDescription:
      'رمز وصول في الذاكرة وتحديث منسّق بين علامات التبويب، دون شاشات دخول بعد.',
    interfaceLabel: 'نظام الواجهة',
    interfaceDescription:
      'تخطيط متجاوب، تنقل واضح، وأنماط عربية مستضافة ذاتيًا.',
    nextTitle: 'ما التالي؟',
    nextDescription:
      'تتوقف هذه المرحلة هنا. تبدأ شاشات المصادقة فقط بعد مراجعة هذا الأساس.',
    reviewerNote: 'لا تعرض هذه الصفحة أرصدة أو معاملات مختلقة.',
    authenticationStage: 'المصادقة',
    sessionStatus: 'حالة الجلسة',
    authEyebrow: 'دخول آمن إلى العرض التجريبي',
    authWelcomeTitle: 'وضوح يبدأ من جلسة موثوقة.',
    authWelcomeDescription:
      'سجّل الدخول إلى RASID لعرض بيانات مالية تركيبية أو يدوية فقط. لا نطلب بيانات بنك، ولا نتصل بأي حساب مصرفي.',
    authPromiseOne: 'رمز الوصول يبقى في ذاكرة الصفحة فقط',
    authPromiseTwo: 'ملف تعريف الارتباط للتحديث محمي من JavaScript',
    authPromiseThree: 'تزامن آمن للجلسة بين علامات التبويب',
    loginTitle: 'مرحباً بعودتك',
    loginDescription: 'أدخل بيانات حساب RASID التجريبي للمتابعة.',
    registerTitle: 'أنشئ مساحة تجريبية',
    registerDescription: 'حسابك مخصص لبيانات تركيبية أو منقحة يدوياً فقط.',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'name@example.test',
    passwordLabel: 'كلمة المرور',
    passwordHint: 'من 12 إلى 128 حرفاً.',
    timezoneLabel: 'المنطقة الزمنية',
    timezoneHint: 'اسم منطقة IANA، مثل Asia/Riyadh.',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    loginAction: 'تسجيل الدخول',
    loggingIn: 'جارٍ تسجيل الدخول…',
    registerAction: 'إنشاء الحساب',
    registering: 'جارٍ إنشاء الحساب…',
    noAccount: 'ليس لديك حساب؟',
    haveAccount: 'لديك حساب بالفعل؟',
    goToRegister: 'أنشئ حساباً تجريبياً',
    goToLogin: 'عد إلى تسجيل الدخول',
    demoAccountTitle: 'حساب العرض التركيبي',
    demoAccountDescription:
      'بيانات دخول عامة للتجربة المحلية؛ لا تستخدمها لأي بيانات حقيقية.',
    useDemoAccount: 'استخدم بيانات العرض',
    demoCredentialsFilled: 'أُضيفت بيانات حساب العرض إلى النموذج.',
    emailRequired: 'أدخل البريد الإلكتروني.',
    emailInvalid: 'أدخل بريداً إلكترونياً صالحاً.',
    passwordRequired: 'أدخل كلمة المرور.',
    passwordLength: 'يجب أن تتكون كلمة المرور من 12 إلى 128 حرفاً.',
    timezoneRequired: 'أدخل منطقة زمنية صالحة.',
    invalidCredentialsTitle: 'تعذر تسجيل الدخول',
    emailConflictTitle: 'البريد مستخدم بالفعل',
    validationErrorTitle: 'راجع البيانات المدخلة',
    rateLimitedTitle: 'محاولات كثيرة خلال وقت قصير',
    backendUnavailableTitle: 'خدمة RASID غير متاحة الآن',
    unexpectedErrorTitle: 'تعذر إكمال الطلب',
    retryAfter: 'يمكنك المحاولة مجدداً بعد: {value}',
    requestReference: 'مرجع الطلب',
    copyRequestId: 'نسخ مرجع الطلب',
    copiedRequestId: 'تم نسخ المرجع',
    restoringSession: 'نتحقق من جلستك…',
    restoringSessionDescription: 'يتم طلب تحديث واحد آمن قبل تحديد وجهتك.',
    redirecting: 'جارٍ نقلك إلى الوجهة الصحيحة…',
    unavailableSessionTitle: 'تعذر التحقق من الجلسة',
    unavailableSessionDescription:
      'لم نتمكن من الوصول إلى واجهة RASID. هذه ليست حالة تسجيل خروج مؤكدة.',
    retryConnection: 'إعادة المحاولة',
    sessionReadyEyebrow: 'المرحلة ٠١ — المصادقة',
    sessionReadyTitle: 'جلستك جاهزة.',
    sessionReadyDescription:
      'اكتمل تسجيل الدخول واستعادة الجلسة والحماية. تتوقف هذه المرحلة هنا قبل بناء النظرة العامة.',
    signedInAs: 'مسجّل باسم',
    sessionIdentifier: 'معرّف الجلسة',
    sessionSecurityTitle: 'ما الذي تحفظه الواجهة؟',
    sessionSecurityDescription:
      'رمز الوصول موجود في الذاكرة فقط، ورمز التحديث لا يمر عبر JavaScript. لا تُحفظ الرموز في التخزين المحلي أو تخزين الجلسة.',
    logoutAction: 'تسجيل الخروج',
    loggingOut: 'جارٍ تسجيل الخروج…',
    logoutFailed:
      'تعذر تأكيد تسجيل الخروج لدى الخادم. مُسحت الجلسة المحلية لحمايتك، وقد تعود الجلسة عند استعادة الاتصال.',
    dashboardPending: 'النظرة العامة تنتظر موافقتك على هذه المرحلة.',
  },
  en: {
    productSubtitle: 'Financial clarity from demo data',
    demoNotice: 'Demo data only — no bank connection',
    switchLanguage: 'عرض الواجهة بالعربية',
    skipToContent: 'Skip to main content',
    navigationLabel: 'Main navigation',
    openNavigation: 'Open navigation menu',
    closeNavigation: 'Close navigation menu',
    currentSection: 'Current section',
    planned: 'Planned',
    overview: 'Overview',
    accounts: 'Accounts',
    transactions: 'Transactions',
    imports: 'CSV imports',
    budgets: 'Budgets & obligations',
    settings: 'Settings & sessions',
    foundationEyebrow: 'FOUNDATION STAGE 00',
    foundationTitle: 'A calm place to understand demo finances.',
    foundationDescription:
      'The interface foundation is ready: native RTL, semantic design tokens, and a disciplined connection to the existing RASID API.',
    stageLabel: 'Foundation',
    readyLabel: 'Ready for review',
    apiLabel: 'API boundary',
    apiDescription:
      'A central client preserves money as strings and presents server failures honestly.',
    authLabel: 'Session architecture',
    authDescription:
      'In-memory access tokens and cross-tab refresh coordination, with no sign-in screens yet.',
    interfaceLabel: 'Interface system',
    interfaceDescription:
      'Responsive structure, clear navigation, and self-hosted Arabic type.',
    nextTitle: 'What comes next?',
    nextDescription:
      'This stage stops here. Authentication screens begin only after this foundation is reviewed.',
    reviewerNote: 'This page shows no fabricated balances or transactions.',
    authenticationStage: 'Authentication',
    sessionStatus: 'Session status',
    authEyebrow: 'Secure entry to the demo',
    authWelcomeTitle: 'Clarity starts with a trusted session.',
    authWelcomeDescription:
      'Sign in to RASID to work only with synthetic or manually sanitized financial data. We never ask for bank credentials or connect to a bank.',
    authPromiseOne: 'The access token stays in page memory only',
    authPromiseTwo: 'The refresh cookie is hidden from JavaScript',
    authPromiseThree: 'Session refresh is coordinated across tabs',
    loginTitle: 'Welcome back',
    loginDescription: 'Enter your RASID demo account details to continue.',
    registerTitle: 'Create a demo workspace',
    registerDescription:
      'Your account is only for synthetic or manually sanitized data.',
    emailLabel: 'Email address',
    emailPlaceholder: 'name@example.test',
    passwordLabel: 'Password',
    passwordHint: '12 to 128 characters.',
    timezoneLabel: 'Time zone',
    timezoneHint: 'An IANA time zone, such as Asia/Riyadh.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    loginAction: 'Sign in',
    loggingIn: 'Signing in…',
    registerAction: 'Create account',
    registering: 'Creating account…',
    noAccount: 'New to RASID?',
    haveAccount: 'Already have an account?',
    goToRegister: 'Create a demo account',
    goToLogin: 'Return to sign in',
    demoAccountTitle: 'Synthetic demo account',
    demoAccountDescription:
      'Public credentials for the local demo; never use them for real data.',
    useDemoAccount: 'Use demo credentials',
    demoCredentialsFilled: 'Demo credentials were added to the form.',
    emailRequired: 'Enter your email address.',
    emailInvalid: 'Enter a valid email address.',
    passwordRequired: 'Enter your password.',
    passwordLength: 'Password must be between 12 and 128 characters.',
    timezoneRequired: 'Enter a valid time zone.',
    invalidCredentialsTitle: 'Sign-in unsuccessful',
    emailConflictTitle: 'Email already in use',
    validationErrorTitle: 'Review the entered details',
    rateLimitedTitle: 'Too many attempts in a short time',
    backendUnavailableTitle: 'RASID is currently unavailable',
    unexpectedErrorTitle: 'The request could not be completed',
    retryAfter: 'You can try again after: {value}',
    requestReference: 'Request reference',
    copyRequestId: 'Copy request reference',
    copiedRequestId: 'Reference copied',
    restoringSession: 'Checking your session…',
    restoringSessionDescription:
      'One safe refresh request runs before choosing your destination.',
    redirecting: 'Taking you to the right place…',
    unavailableSessionTitle: 'Session check unavailable',
    unavailableSessionDescription:
      'The RASID API could not be reached. This is not a confirmed sign-out.',
    retryConnection: 'Try again',
    sessionReadyEyebrow: 'STAGE 01 — AUTHENTICATION',
    sessionReadyTitle: 'Your session is ready.',
    sessionReadyDescription:
      'Sign-in, restoration, and route protection are complete. This stage stops before the Overview is built.',
    signedInAs: 'Signed in as',
    sessionIdentifier: 'Session ID',
    sessionSecurityTitle: 'What does the interface keep?',
    sessionSecurityDescription:
      'The access token exists only in memory, and the refresh token never passes through JavaScript. No token is written to local or session storage.',
    logoutAction: 'Sign out',
    loggingOut: 'Signing out…',
    logoutFailed:
      'Server-side sign-out could not be confirmed. The local session was cleared for your safety, but it may return when the connection is restored.',
    dashboardPending:
      'The Overview is waiting for your approval of this stage.',
  },
};
