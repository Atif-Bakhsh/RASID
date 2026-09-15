'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/app-shell/brand-mark';
import { LanguageToggle } from '@/components/app-shell/language-toggle';
import { LegalLinks } from '@/components/app-shell/legal-links';
import { useLocale } from '@/providers/locale-provider';

type LegalSection = { heading: string; content: ReactNode };

const copy = {
  ar: {
    eyebrow: 'RASID / معلومات قانونية',
    review:
      'مسودة لمشروع عرض عام — تحتاج مراجعة قانونية مهنية قبل أي استخدام تجاري.',
    updated: 'آخر تحديث: 15 سبتمبر 2026',
    back: 'العودة إلى تسجيل الدخول',
    privacy: {
      title: 'سياسة الخصوصية',
      intro:
        'تشرح هذه السياسة طريقة تعامل نسخة RASID التجريبية مع البيانات. RASID ليس بنكاً ولا يتصل بحسابات مصرفية، ويجب استخدام بيانات تركيبية أو منقحة فقط.',
      sections: [
        {
          heading: 'البيانات التي تعالجها الخدمة',
          content:
            'قد تعالج الخدمة بريد التسجيل، وتفضيل اللغة والمنطقة الزمنية، والحسابات اليدوية والمعاملات والتصنيفات والميزانيات وتقديرات الالتزامات وبيانات معاينة CSV التي تدخلها. يسجل الخادم أيضاً معرّفات الجلسات وأوقات إنشائها وانتهائها وإلغائها.',
        },
        {
          heading: 'المصادقة والتخزين في المتصفح',
          content:
            'يبقى رمز الوصول في ذاكرة الصفحة فقط. يستخدم التحديث ملف تعريف ارتباط HttpOnly لا يستطيع JavaScript قراءته. لا تحفظ الواجهة رموز المصادقة في localStorage أو sessionStorage.',
        },
        {
          heading: 'الغرض والمشاركة',
          content:
            'تستخدم البيانات لتشغيل خصائص العرض وحماية الجلسات وتشخيص الأعطال. لا توجد مشاركة مع بنوك أو شبكات دفع. قد يعالج مزودو الاستضافة وقاعدة البيانات السجلات اللازمة لتشغيل النسخة المنشورة وفق إعدادات المشغّل وعقودهم.',
        },
        {
          heading: 'الاحتفاظ والتحكم',
          content:
            'لا يتضمن المشروع حالياً جدولة تلقائية لحذف الجلسات المنتهية أو معاينات الاستيراد القديمة، ولا يوفر حذف الحساب ذاتياً. قد يعيد مشغّل العرض ضبط البيانات التركيبية. لا ترفع بيانات مالية حقيقية إلى نسخة عرض عامة.',
        },
        {
          heading: 'الاستفسارات',
          content:
            'استخدم قناة التواصل المنشورة مع هذا المشروع لطلب معلومات عن بيانات نسخة العرض أو حذفها. تعتمد الحقوق والإجراءات الفعلية على جهة الاستضافة والولاية القانونية، ولذلك يلزم تأكيدها قبل الإطلاق التجاري.',
        },
      ] satisfies LegalSection[],
    },
    terms: {
      title: 'الشروط والأحكام',
      intro:
        'تحكم هذه الشروط استخدام نسخة RASID المخصصة للعرض الهندسي ببيانات تجريبية. استخدامك للنسخة المنشورة يعني موافقتك على استخدامها ضمن هذا النطاق المحدود.',
      sections: [
        {
          heading: 'طبيعة الخدمة',
          content:
            'RASID أداة عرض لإدارة بيانات مالية يدوية أو تركيبية. ليس مؤسسة مالية، ولا يقدم خدمات مصرفية أو دفع أو تداول أو استثمار أو نصيحة مالية، ولا تتحقق أرقامه من أرصدة مصرفية فعلية.',
        },
        {
          heading: 'الاستخدام المقبول',
          content:
            'استخدم بيانات تركيبية أو منقحة فقط. لا تدخل بيانات اعتماد مصرفية أو كشوفاً حقيقية أو معلومات شخصية لا تملك حق معالجتها، ولا تحاول تجاوز المصادقة أو حدود الرفع أو إساءة استخدام حساب العرض المشترك.',
        },
        {
          heading: 'دقة البيانات والقرارات',
          content:
            'تعرض الواجهة السجلات والحسابات الوصفية التي توفرها الخدمة، وقد تتغير بيانات العرض أو يعاد ضبطها. لا تعتمد على RASID لاتخاذ قرار مالي أو قانوني أو ضريبي، وراجع المصدر المختص لأي قرار حقيقي.',
        },
        {
          heading: 'التوفر والمسؤولية',
          content:
            'قد تتوقف نسخة العرض أو تتغير دون إشعار، وهي غير مهيأة لتخزين بيانات حقيقية أو تشغيل أعمال حرجة. أي حدود للمسؤولية أو ضمانات قابلة للتنفيذ تحتاج صياغة قانونية مناسبة للمشغّل والولاية قبل استخدام تجاري.',
        },
        {
          heading: 'التغييرات والتواصل',
          content:
            'قد تحدث هذه الشروط مع تطور المشروع. يظهر تاريخ النسخة أعلاه. استخدم قناة التواصل المنشورة مع المشروع لأي استفسار، واطلب مراجعة قانونية قبل نشر الخدمة خارج نطاق العرض الشخصي.',
        },
      ] satisfies LegalSection[],
    },
  },
  en: {
    eyebrow: 'RASID / LEGAL',
    review:
      'Public-demo draft — professional legal review is required before commercial use.',
    updated: 'Last updated: 15 September 2026',
    back: 'Return to sign in',
    privacy: {
      title: 'Privacy Policy',
      intro:
        'This policy explains how the RASID demonstration handles data. RASID is not a bank and does not connect to bank accounts; only synthetic or sanitized data should be used.',
      sections: [
        {
          heading: 'Data the service processes',
          content:
            'The service may process your registration email, locale and time-zone preference, manual accounts, transactions, categories, budgets, obligation estimates, and CSV preview data you submit. The server also records session identifiers and their creation, expiry, and revocation times.',
        },
        {
          heading: 'Authentication and browser storage',
          content:
            'The access token remains in page memory. Refresh uses an HttpOnly cookie that JavaScript cannot read. The frontend does not save authentication tokens in localStorage or sessionStorage.',
        },
        {
          heading: 'Purpose and sharing',
          content:
            'Data is used to operate demo features, protect sessions, and diagnose failures. Nothing is shared with banks or payment networks. Hosting and database providers may process operational records according to the operator’s configuration and their agreements.',
        },
        {
          heading: 'Retention and control',
          content:
            'The project currently has no automatic cleanup schedule for expired sessions or old import previews and no self-service account deletion. The demo operator may reset synthetic data. Do not upload real financial data to a public demo.',
        },
        {
          heading: 'Questions',
          content:
            'Use the contact channel published with this project to ask about the public demo’s data or request deletion. Actual rights and procedures depend on the operator and jurisdiction and must be confirmed before commercial launch.',
        },
      ] satisfies LegalSection[],
    },
    terms: {
      title: 'Terms & Conditions',
      intro:
        'These terms govern use of the RASID engineering demonstration with demo data. By using a published instance, you agree to keep your use within this limited scope.',
      sections: [
        {
          heading: 'Nature of the service',
          content:
            'RASID is a demonstration tool for manual or synthetic financial data. It is not a financial institution and provides no banking, payment, trading, investment, or financial-advice service. Its figures are not verified against real bank balances.',
        },
        {
          heading: 'Acceptable use',
          content:
            'Use only synthetic or sanitized data. Do not enter bank credentials, real statements, or personal information you have no right to process. Do not bypass authentication or upload limits, or misuse a shared demo account.',
        },
        {
          heading: 'Data accuracy and decisions',
          content:
            'The interface displays records and descriptive calculations supplied by the service. Demo data may change or be reset. Do not rely on RASID for financial, legal, or tax decisions; consult an appropriate source for real decisions.',
        },
        {
          heading: 'Availability and liability',
          content:
            'A demo instance may stop or change without notice and is not designed for real data or critical operations. Any enforceable warranty disclaimer or limitation of liability requires operator- and jurisdiction-specific legal drafting before commercial use.',
        },
        {
          heading: 'Changes and contact',
          content:
            'These terms may be updated as the project changes; the version date appears above. Use the contact channel published with the project for questions, and obtain legal review before publishing beyond a personal portfolio demo.',
        },
      ] satisfies LegalSection[],
    },
  },
} as const;

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { locale } = useLocale();
  const t = copy[locale];
  const page = t[kind];
  return (
    <main className="legal-shell" id="main-content">
      <a className="skip-link" href="#legal-title">
        {locale === 'ar' ? 'تخطَّ إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>
      <header className="legal-header">
        <BrandMark />
        <LanguageToggle inverse />
      </header>
      <article className="legal-document">
        <span className="eyebrow">{t.eyebrow}</span>
        <h1 id="legal-title">{page.title}</h1>
        <p className="legal-intro">{page.intro}</p>
        <p className="legal-review" role="note">
          {t.review}
        </p>
        <p className="legal-updated" dir="ltr">
          {t.updated}
        </p>
        <div className="legal-sections">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.content}</p>
            </section>
          ))}
        </div>
        <footer className="legal-footer">
          <LegalLinks />
          <Link href="/login">{t.back}</Link>
        </footer>
      </article>
    </main>
  );
}
