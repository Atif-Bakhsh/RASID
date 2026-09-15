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
  overview: string;
  accounts: string;
  transactions: string;
  imports: string;
  budgets: string;
  settings: string;
  privacy: string;
  terms: string;
  legalNavigation: string;
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
  logoutAction: string;
  loggingOut: string;
  logoutFailed: string;
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
    overview: 'نظرة عامة',
    accounts: 'الحسابات',
    transactions: 'المعاملات',
    imports: 'استيراد CSV',
    budgets: 'الميزانيات والالتزامات',
    settings: 'الإعدادات والجلسات',
    privacy: 'سياسة الخصوصية',
    terms: 'الشروط والأحكام',
    legalNavigation: 'روابط قانونية',
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
    logoutAction: 'تسجيل الخروج',
    loggingOut: 'جارٍ تسجيل الخروج…',
    logoutFailed:
      'تعذر تأكيد تسجيل الخروج لدى الخادم. مُسحت الجلسة المحلية لحمايتك، وقد تعود الجلسة عند استعادة الاتصال.',
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
    overview: 'Overview',
    accounts: 'Accounts',
    transactions: 'Transactions',
    imports: 'CSV imports',
    budgets: 'Budgets & obligations',
    settings: 'Settings & sessions',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    legalNavigation: 'Legal links',
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
    logoutAction: 'Sign out',
    loggingOut: 'Signing out…',
    logoutFailed:
      'Server-side sign-out could not be confirmed. The local session was cleared for your safety, but it may return when the connection is restored.',
  },
};
