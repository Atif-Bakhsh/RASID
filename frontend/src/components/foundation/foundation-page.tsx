'use client';

import { ArrowUpLeft, Braces, KeyRound, LayoutPanelTop } from 'lucide-react';

import { useLocale } from '@/providers/locale-provider';

const foundationCards = [
  { icon: Braces, title: 'apiLabel', description: 'apiDescription' },
  { icon: KeyRound, title: 'authLabel', description: 'authDescription' },
  {
    icon: LayoutPanelTop,
    title: 'interfaceLabel',
    description: 'interfaceDescription',
  },
] as const;

export function FoundationPage() {
  const { messages } = useLocale();

  return (
    <div className="foundation-page">
      <section className="foundation-hero" aria-labelledby="foundation-title">
        <div className="foundation-hero-copy">
          <span className="eyebrow">
            <span aria-hidden="true" />
            {messages.foundationEyebrow}
          </span>
          <h1 id="foundation-title">{messages.foundationTitle}</h1>
          <p>{messages.foundationDescription}</p>
        </div>

        <div className="stage-seal" aria-label={messages.readyLabel}>
          <span className="stage-seal-index" dir="ltr">
            00
          </span>
          <span className="stage-seal-rule" aria-hidden="true" />
          <span>{messages.readyLabel}</span>
        </div>
      </section>

      <section className="foundation-grid" aria-label={messages.stageLabel}>
        {foundationCards.map(({ description, icon: Icon, title }, index) => (
          <article className="foundation-card" key={title}>
            <div className="foundation-card-heading">
              <span className="foundation-card-number" dir="ltr">
                0{index + 1}
              </span>
              <Icon size={23} strokeWidth={1.55} aria-hidden="true" />
            </div>
            <h2>{messages[title]}</h2>
            <p>{messages[description]}</p>
          </article>
        ))}
      </section>

      <section className="review-panel" aria-labelledby="review-title">
        <div className="review-panel-icon" aria-hidden="true">
          <ArrowUpLeft size={27} strokeWidth={1.4} />
        </div>
        <div>
          <span className="review-panel-label" dir="ltr">
            STAGE 00 / REVIEW
          </span>
          <h2 id="review-title">{messages.nextTitle}</h2>
          <p>{messages.nextDescription}</p>
        </div>
        <p className="review-note">{messages.reviewerNote}</p>
      </section>
    </div>
  );
}
