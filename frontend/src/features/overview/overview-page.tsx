'use client';

import {
  useMutation,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Currency } from '@/lib/api/contracts';
import { ApiClientError } from '@/lib/api/errors';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { overviewMessages } from './messages';
import { overviewQueries, requestAiExplanation } from './queries';
import { formatMoney, monthStatus } from './format';
import type {
  AiInsightExplanation,
  Budgets,
  Insights,
  MonthlyAnalytics,
  MonthScope,
} from './types';

function useCopy() {
  const { locale } = useLocale();
  return { locale, t: overviewMessages[locale] };
}

export function Money({
  value,
  currency,
}: {
  value: string;
  currency: Currency;
}) {
  return (
    <span className="money" dir="ltr">
      {formatMoney(value)} <small>{currency}</small>
    </span>
  );
}

function QuerySection<T>({
  title,
  query,
  children,
}: {
  title: string;
  query: UseQueryResult<T, Error>;
  children: (data: T) => ReactNode;
}) {
  const { t, locale } = useCopy();
  return (
    <section className="overview-section" aria-label={title}>
      <div className="section-heading">
        <h2>{title}</h2>
        {query.isFetching && !query.isPending && (
          <span role="status">{t.updating}</span>
        )}
      </div>
      {query.isError ? (
        <div className="overview-error" role="alert">
          <strong>{t.error}</strong>
          <p>
            {query.error instanceof ApiClientError
              ? query.error.localizedMessage(locale)
              : t.network}
          </p>
          {query.error instanceof ApiClientError && query.error.requestId && (
            <details>
              <summary>{t.reference}</summary>
              <code dir="ltr">{query.error.requestId}</code>
            </details>
          )}
          <button
            type="button"
            className="button button--secondary"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t.retry}
          </button>
        </div>
      ) : query.isPending ? (
        <p className="overview-empty" role="status">
          {t.loading}
        </p>
      ) : (
        children(query.data)
      )}
    </section>
  );
}

function AnalyticsDetailSection({
  title,
  query,
  children,
}: {
  title: string;
  query: UseQueryResult<MonthlyAnalytics, Error>;
  children: (data: MonthlyAnalytics) => ReactNode;
}) {
  const { t } = useCopy();
  return (
    <section className="overview-section" aria-label={title}>
      <div className="section-heading">
        <h2>{title}</h2>
        {query.isFetching && !query.isPending && (
          <span role="status">{t.updating}</span>
        )}
      </div>
      {query.isPending ? (
        <p className="overview-empty" role="status">
          {t.loading}
        </p>
      ) : query.isError ? (
        <p className="overview-empty" role="status">
          {t.periodDetailsUnavailable}
        </p>
      ) : (
        children(query.data)
      )}
    </section>
  );
}

export function MonthlySummary({ data }: { data: MonthlyAnalytics }) {
  const { t } = useCopy();
  return (
    <>
      {data.transactionCount === 0 && (
        <div className="overview-empty" role="status">
          <strong>{t.empty}</strong>
          <p>{t.emptyNote}</p>
        </div>
      )}
      <div className="summary-grid">
        {(
          [
            { label: t.income, value: data.income },
            { label: t.spending, value: data.spending },
            { label: t.net, value: data.net },
          ] as const
        ).map(({ label, value }, index) => (
          <div
            className={`summary-value${index === 2 ? ' summary-value--net' : ''}`}
            key={label}
          >
            <span>{label}</span>
            <strong>
              <Money value={value} currency={data.currency} />
            </strong>
            {index === 2 && <p>{t.netNote}</p>}
          </div>
        ))}
      </div>
      <div className="comparison">
        <div>
          <h3>{t.comparison}</h3>
          <time dateTime={data.comparison.previousMonth} dir="ltr">
            {data.comparison.previousMonth}
          </time>
        </div>
        <dl>
          <div>
            <dt>{t.previousIncome}</dt>
            <dd>
              <Money value={data.comparison.income} currency={data.currency} />
            </dd>
          </div>
          <div>
            <dt>{t.previousSpending}</dt>
            <dd>
              <Money
                value={data.comparison.spending}
                currency={data.currency}
              />
            </dd>
          </div>
          <div>
            <dt>{t.change}</dt>
            <dd>
              <Money
                value={data.comparison.spendingChange}
                currency={data.currency}
              />
              <span className="comparison-percent">
                {data.comparison.spendingChangePercent === null ? (
                  t.noBaseline
                ) : (
                  <bdi dir="ltr">
                    {data.comparison.spendingChangePercent > 0 ? '+' : ''}
                    {data.comparison.spendingChangePercent}%
                  </bdi>
                )}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}

export function CategoryBreakdown({ data }: { data: MonthlyAnalytics }) {
  const { t, locale } = useCopy();
  return (
    <>
      {!data.categories.length ? (
        <p className="overview-empty">{t.noCategories}</p>
      ) : (
        <div
          className="overview-table-wrap"
          role="region"
          aria-label={t.categories}
          tabIndex={0}
        >
          <table className="overview-table">
            <caption className="sr-only">
              {t.categories} — {data.month} / {data.currency}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t.category}</th>
                <th scope="col">{t.count}</th>
                <th scope="col">{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((row) => (
                <tr key={row.categoryId ?? 'uncategorized'}>
                  <th scope="row">
                    {locale === 'ar' ? row.nameAr : row.nameEn}
                  </th>
                  <td>{row.transactionCount}</td>
                  <td>
                    <Money value={row.spending} currency={data.currency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function BudgetOverview({ data }: { data: Budgets }) {
  const { t, locale } = useCopy();
  return (
    <>
      <p className="section-note">{t.budgetNote}</p>
      {!data.data.length ? (
        <p className="overview-empty">{t.noBudgets}</p>
      ) : (
        <div
          className="overview-table-wrap"
          role="region"
          aria-label={t.budgets}
          tabIndex={0}
        >
          <table className="overview-table budget-table">
            <caption className="sr-only">
              {t.budgets} — {data.month} / {data.currency}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t.category}</th>
                <th scope="col">{t.limit}</th>
                <th scope="col">{t.spent}</th>
                <th scope="col">{t.remaining}</th>
                <th scope="col">{t.utilization}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    {locale === 'ar' ? row.nameAr : row.nameEn}
                    <small className={row.isExceeded ? 'budget-exceeded' : ''}>
                      {row.isExceeded ? t.exceeded : t.within}
                    </small>
                  </th>
                  <td>
                    <Money value={row.limitAmount} currency={row.currency} />
                  </td>
                  <td>
                    <Money value={row.spent} currency={row.currency} />
                  </td>
                  <td className={row.isExceeded ? 'budget-exceeded' : ''}>
                    <Money value={row.remaining} currency={row.currency} />
                  </td>
                  <td>
                    <bdi dir="ltr">{row.utilizationPercent}%</bdi>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function ObligationEstimates({ data }: { data: MonthlyAnalytics }) {
  const { t } = useCopy();
  return (
    <>
      <p className="section-note">{t.obligationNote}</p>
      <div className="estimate-total">
        <span>{t.estimateTotal}</span>
        <strong>
          <Money value={data.obligations.total} currency={data.currency} />
        </strong>
      </div>
      {!data.obligations.items.length ? (
        <p className="overview-empty">{t.noObligations}</p>
      ) : (
        <ul className="obligation-list">
          {data.obligations.items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {t.dueDate}:{' '}
                  <time dateTime={item.dueDate} dir="ltr">
                    {item.dueDate}
                  </time>
                </span>
              </div>
              <Money value={item.amount} currency={item.currency} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function InsightList({ data }: { data: Insights }) {
  const { t, locale } = useCopy();
  return (
    <>
      <p className="api-disclaimer" role="note">
        {locale === 'ar' ? data.disclaimerAr : data.disclaimerEn}
      </p>
      {!data.data.length ? (
        <p className="overview-empty">{t.noInsights}</p>
      ) : (
        <div className="insight-list">
          {data.data.map((item, index) => (
            <article
              className={`insight insight--${item.severity}`}
              key={`${item.rule}-${index}`}
            >
              <h3>{locale === 'ar' ? item.titleAr : item.titleEn}</h3>
              <p>{locale === 'ar' ? item.explanationAr : item.explanationEn}</p>
              <details>
                <summary>{t.why}</summary>
                <dl className="insight-facts">
                  <div>
                    <dt>{t.rule}</dt>
                    <dd>
                      <code dir="ltr">{item.rule}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.version}</dt>
                    <dd>{item.version}</dd>
                  </div>
                  {Object.entries(item.facts).map(([key, value]) => (
                    <div key={key}>
                      <dt>{t.facts[key] ?? key}</dt>
                      <dd>
                        <bdi dir="ltr">{value}</bdi>
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function EvidenceValue({
  item,
}: {
  item: AiInsightExplanation['evidence'][number];
}) {
  if (item.unit === 'SAR' || item.unit === 'USD' || item.unit === 'EUR')
    return <Money value={String(item.value)} currency={item.unit} />;
  if (item.unit === 'PERCENT') return <bdi dir="ltr">{item.value}%</bdi>;
  return <bdi dir="ltr">{item.value}</bdi>;
}

export function AiAnalystPanel({ scope }: { scope: MonthScope }) {
  const { t, locale } = useCopy();
  const [question, setQuestion] = useState('');
  const mutation = useMutation({
    mutationFn: (value?: string) =>
      requestAiExplanation(scope, locale, value?.trim() || undefined),
  });
  const result = mutation.data;
  const statusLabel = result
    ? result.status === 'ANSWERED'
      ? t.analystAnswered
      : result.status === 'OUT_OF_SCOPE'
        ? t.analystOutOfScope
        : t.analystInsufficient
    : undefined;
  return (
    <section className="analyst-panel" aria-labelledby="analyst-title">
      <div className="analyst-heading">
        <div>
          <span className="eyebrow">{t.analystEyebrow}</span>
          <h2 id="analyst-title">{t.analystTitle}</h2>
          <p>{t.analystDescription}</p>
        </div>
        <span className="analyst-mark" aria-hidden="true">
          AI / 01
        </span>
      </div>
      <button
        type="button"
        className="button analyst-primary"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(undefined)}
      >
        {mutation.isPending ? t.generating : t.generateBriefing}
      </button>
      <form
        className="analyst-question"
        onSubmit={(event) => {
          event.preventDefault();
          if (question.trim()) mutation.mutate(question);
        }}
      >
        <label htmlFor="analyst-question">{t.analystQuestion}</label>
        <textarea
          id="analyst-question"
          maxLength={300}
          rows={2}
          value={question}
          placeholder={t.analystQuestionPlaceholder}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <div className="analyst-question-actions">
          <small>
            {300 - question.length} {t.charactersRemaining}
          </small>
          <button
            type="submit"
            className="button button--secondary"
            disabled={mutation.isPending || !question.trim()}
          >
            {t.askAnalyst}
          </button>
        </div>
      </form>
      <div aria-live="polite">
        {mutation.isError && (
          <div className="analyst-error" role="alert">
            <strong>{t.analystUnavailable}</strong>
            <p>
              {mutation.error instanceof ApiClientError
                ? mutation.error.localizedMessage(locale)
                : t.network}
            </p>
          </div>
        )}
        {result && (
          <article
            className={`analyst-result analyst-result--${result.status.toLowerCase()}`}
          >
            <header>
              <span>{statusLabel}</span>
              <code dir="ltr">{result.promptVersion}</code>
            </header>
            <p className="analyst-answer">{result.answer}</p>
            <p className="api-disclaimer">
              {locale === 'ar' ? result.disclaimerAr : result.disclaimerEn}
            </p>
            {!!result.evidence.length && (
              <div className="analyst-evidence">
                <div>
                  <h3>{t.analystEvidence}</h3>
                  <p>{t.analystEvidenceNote}</p>
                </div>
                <dl>
                  {result.evidence.map((item) => (
                    <div key={item.id}>
                      <dt>{locale === 'ar' ? item.labelAr : item.labelEn}</dt>
                      <dd>
                        <EvidenceValue item={item} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </article>
        )}
      </div>
    </section>
  );
}

export function OverviewPage() {
  const { t } = useCopy();
  const { session } = useAuth();
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [currency, setCurrency] = useState<Currency>('SAR');
  const scope = { month, currency };
  const userId = session?.user.id ?? '';
  const monthly = useQuery(overviewQueries.monthly(userId, scope));
  const budgets = useQuery(overviewQueries.budgets(userId, scope));
  const insights = useQuery(overviewQueries.insights(userId, scope));
  const validMonth = /^20\d{2}-(0[1-9]|1[0-2])$/.test(month);
  const status = monthStatus(month);
  const fetching =
    monthly.isFetching || budgets.isFetching || insights.isFetching;
  return (
    <div className="overview-page">
      <header className="overview-heading">
        <div>
          <span className="eyebrow">RASID / {t.period}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          disabled={fetching || !validMonth || !userId}
          onClick={() => {
            void monthly.refetch();
            void budgets.refetch();
            void insights.refetch();
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {t.refresh}
        </button>
      </header>
      <div className="overview-filters">
        <div>
          <label htmlFor="overview-month">{t.month}</label>
          <input
            id="overview-month"
            type="month"
            dir="ltr"
            min="2000-01"
            max="2099-12"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            aria-invalid={!validMonth}
            aria-describedby={!validMonth ? 'month-error' : undefined}
          />
        </div>
        <div>
          <label htmlFor="overview-currency">{t.currency}</label>
          <select
            id="overview-currency"
            dir="ltr"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
          >
            {(['SAR', 'USD', 'EUR'] as const).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <p>{t.recordNote}</p>
      </div>
      {!validMonth ? (
        <p id="month-error" role="alert">
          {t.invalidMonth}
        </p>
      ) : (
        <>
          {status !== 'past' && (
            <p className="period-notice" role="note">
              {status === 'current' ? t.incomplete : t.future}
            </p>
          )}
          <QuerySection title={t.period} query={monthly}>
            {(data) => <MonthlySummary data={data} />}
          </QuerySection>
          <div className="overview-columns">
            <div>
              <AnalyticsDetailSection title={t.categories} query={monthly}>
                {(data) => <CategoryBreakdown data={data} />}
              </AnalyticsDetailSection>
              <QuerySection title={t.budgets} query={budgets}>
                {(data) => <BudgetOverview data={data} />}
              </QuerySection>
            </div>
            <div>
              <AnalyticsDetailSection title={t.obligations} query={monthly}>
                {(data) => <ObligationEstimates data={data} />}
              </AnalyticsDetailSection>
              <QuerySection title={t.insights} query={insights}>
                {(data) => <InsightList data={data} />}
              </QuerySection>
            </div>
          </div>
          <AiAnalystPanel
            key={`${month}-${currency}-${t.analystTitle}`}
            scope={scope}
          />
        </>
      )}
    </div>
  );
}
