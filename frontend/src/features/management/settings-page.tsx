'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ledgerQueries } from '@/features/ledger/queries';
import { ApiErrorNotice, LedgerDialog } from '@/features/ledger/ui';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import {
  createCategory,
  deleteCategory,
  revokeSession,
  updateCategory,
} from './api';
import { CategoryForm } from './forms';
import { categoryPatch } from './helpers';
import { managementMessages } from './messages';
import { managementQueries } from './queries';
import type { CategoryInput, CategoryRecord, SessionRecord } from './types';

type DeleteCategoryState = { kind: 'category'; record: CategoryRecord };
type RevokeState = { kind: 'session'; record: SessionRecord };
type ConfirmState = DeleteCategoryState | RevokeState;

export function SettingsPage() {
  const { locale } = useLocale();
  const t = managementMessages[locale];
  const { session, signOut } = useAuth();
  const userId = session?.user.id ?? '';
  const currentSessionId = session?.sessionId ?? '';
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CategoryRecord | 'new' | null>(null);
  const [confirming, setConfirming] = useState<ConfirmState | null>(null);
  const [notice, setNotice] = useState('');
  const categories = useQuery(ledgerQueries.categories(userId));
  const sessions = useQuery(managementQueries.sessions(userId));
  const shared =
    categories.data?.filter((item) => item.ownerUserId === null) ?? [];
  const privateCategories =
    categories.data?.filter((item) => item.ownerUserId === userId) ?? [];
  const invalidateCategories = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['category-dictionary', userId],
      }),
      queryClient.invalidateQueries({ queryKey: ['budgets', userId] }),
      queryClient.invalidateQueries({ queryKey: ['analytics', userId] }),
      queryClient.invalidateQueries({ queryKey: ['insights', userId] }),
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
      queryClient.invalidateQueries({ queryKey: ['obligations', userId] }),
    ]);
  async function saveCategory(input: CategoryInput) {
    if (editing && editing !== 'new')
      await updateCategory(editing.id, categoryPatch(editing, input));
    else await createCategory(input);
    setEditing(null);
    setNotice(t.categorySaved);
    await invalidateCategories();
  }
  const removeCategory = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      setConfirming(null);
      setNotice(t.categoryDeleted);
      await invalidateCategories();
    },
  });
  const revoke = useMutation({
    mutationFn: revokeSession,
    onSuccess: async (_value, id) => {
      setConfirming(null);
      if (id === currentSessionId) {
        try {
          await signOut();
        } catch {
          /* Local auth state is cleared in finally. */
        }
        return;
      }
      setNotice(t.sessionRevoked);
      await queryClient.invalidateQueries({ queryKey: ['sessions', userId] });
    },
  });
  const categoryName = (category: CategoryRecord) =>
    locale === 'ar' ? category.nameAr : category.nameEn;
  return (
    <div className="management-page settings-page">
      <header className="ledger-page-heading">
        <div>
          <span className="eyebrow">RASID / ACCESS</span>
          <h1>{t.settingsTitle}</h1>
          <p>{t.settingsSubtitle}</p>
        </div>
      </header>
      {notice && (
        <p className="success-notice" role="status">
          {notice}
          <button
            type="button"
            aria-label={t.dismiss}
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </p>
      )}
      <section
        className="management-section"
        aria-labelledby="categories-title"
      >
        <header className="management-section-header">
          <div>
            <h2 id="categories-title">{t.categoriesSection}</h2>
            <p>{t.categoryPermissions}</p>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              setNotice('');
              setEditing('new');
            }}
          >
            <Plus size={18} aria-hidden="true" />
            {t.addCategory}
          </button>
        </header>
        {categories.isPending ? (
          <p className="ledger-state" role="status">
            {t.categoriesLoading}
          </p>
        ) : categories.isError ? (
          <StateError
            error={categories.error}
            retry={() => void categories.refetch()}
          />
        ) : !categories.data.length ? (
          <p className="ledger-state">{t.categoriesEmpty}</p>
        ) : (
          <div className="category-columns">
            <CategoryGroup
              title={t.sharedCategories}
              items={shared}
              allCategories={categories.data}
              badge={t.shared}
              locale={locale}
            />
            <CategoryGroup
              title={t.privateCategories}
              items={privateCategories}
              allCategories={categories.data}
              badge={t.private}
              locale={locale}
              onEdit={(record) => setEditing(record)}
              onDelete={(record) => {
                removeCategory.reset();
                setConfirming({ kind: 'category', record });
              }}
            />
          </div>
        )}
      </section>
      <section className="management-section" aria-labelledby="sessions-title">
        <header className="management-section-header">
          <div>
            <h2 id="sessions-title">{t.sessionsSection}</h2>
            <p>{t.sessionsNote}</p>
          </div>
          <ShieldCheck size={24} aria-hidden="true" />
        </header>
        {sessions.isPending ? (
          <p className="ledger-state" role="status">
            {t.sessionsLoading}
          </p>
        ) : sessions.isError ? (
          <StateError
            error={sessions.error}
            retry={() => void sessions.refetch()}
          />
        ) : !sessions.data.length ? (
          <p className="ledger-state">{t.sessionsEmpty}</p>
        ) : (
          <div className="session-list">
            {sessions.data.map((item) => {
              const current = item.id === currentSessionId;
              return (
                <article
                  className={current ? 'session-row is-current' : 'session-row'}
                  key={item.id}
                >
                  <div className="session-identity">
                    <KeyRound size={18} aria-hidden="true" />
                    <div>
                      <strong>
                        {current ? t.currentSession : t.otherSession}
                      </strong>
                      <code dir="ltr">{item.id}</code>
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>{t.createdAt}</dt>
                      <dd>
                        <time dateTime={item.createdAt} dir="ltr">
                          {item.createdAt}
                        </time>
                      </dd>
                    </div>
                    <div>
                      <dt>{t.expiresAt}</dt>
                      <dd>
                        <time dateTime={item.expiresAt} dir="ltr">
                          {item.expiresAt}
                        </time>
                      </dd>
                    </div>
                    {item.revokedAt && (
                      <div>
                        <dt>{t.revokedAt}</dt>
                        <dd>
                          <time dateTime={item.revokedAt} dir="ltr">
                            {item.revokedAt}
                          </time>
                        </dd>
                      </div>
                    )}
                  </dl>
                  <span
                    className={
                      item.revokedAt
                        ? 'state-label state-label--revoked'
                        : 'state-label state-label--valid'
                    }
                  >
                    {item.revokedAt ? t.revoked : t.valid}
                  </span>
                  {!item.revokedAt && (
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => {
                        revoke.reset();
                        setConfirming({ kind: 'session', record: item });
                      }}
                    >
                      {t.revoke}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      {editing && (
        <LedgerDialog
          title={editing === 'new' ? t.addCategory : t.editCategory}
          closeLabel={t.close}
          onClose={() => setEditing(null)}
        >
          <CategoryForm
            category={editing === 'new' ? undefined : editing}
            categories={categories.data ?? []}
            onCancel={() => setEditing(null)}
            onSubmit={saveCategory}
          />
        </LedgerDialog>
      )}
      {confirming?.kind === 'category' && (
        <LedgerDialog
          title={t.deleteTitle}
          closeLabel={t.close}
          onClose={() => setConfirming(null)}
        >
          <div className="delete-confirm">
            <p>{t.deleteCategoryConfirm}</p>
            <strong>{categoryName(confirming.record)}</strong>
            {removeCategory.isError && (
              <ApiErrorNotice
                error={removeCategory.error}
                locale={locale}
                conflictMessage={t.categoryConflict}
              />
            )}
            <footer className="ledger-form-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setConfirming(null)}
              >
                {t.cancel}
              </button>
              <button
                className="button button--danger"
                type="button"
                disabled={removeCategory.isPending}
                onClick={() => removeCategory.mutate(confirming.record.id)}
              >
                {removeCategory.isPending ? t.deleting : t.confirmDelete}
              </button>
            </footer>
          </div>
        </LedgerDialog>
      )}
      {confirming?.kind === 'session' && (
        <LedgerDialog
          title={t.revokeTitle}
          closeLabel={t.close}
          onClose={() => setConfirming(null)}
        >
          <div className="delete-confirm">
            <p>{t.revokeConfirm}</p>
            <code dir="ltr">{confirming.record.id}</code>
            {revoke.isError && (
              <ApiErrorNotice error={revoke.error} locale={locale} />
            )}
            <footer className="ledger-form-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setConfirming(null)}
              >
                {t.cancel}
              </button>
              <button
                className="button button--danger"
                type="button"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(confirming.record.id)}
              >
                {revoke.isPending ? t.deleting : t.revoke}
              </button>
            </footer>
          </div>
        </LedgerDialog>
      )}
    </div>
  );
}

function CategoryGroup({
  title,
  items,
  allCategories,
  badge,
  locale,
  onEdit,
  onDelete,
}: {
  title: string;
  items: CategoryRecord[];
  allCategories: CategoryRecord[];
  badge: string;
  locale: 'ar' | 'en';
  onEdit?: (item: CategoryRecord) => void;
  onDelete?: (item: CategoryRecord) => void;
}) {
  const t = managementMessages[locale];
  const categoryName = (item: CategoryRecord) =>
    locale === 'ar' ? item.nameAr : item.nameEn;
  return (
    <section className="category-group">
      <header>
        <h3>{title}</h3>
        <span>{items.length}</span>
      </header>
      {!items.length ? (
        <p className="ledger-state">{t.categoriesEmpty}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <span className="category-kind">{badge}</span>
                <strong>{categoryName(item)}</strong>
                <small>{locale === 'ar' ? item.nameEn : item.nameAr}</small>
                {item.parentId && (
                  <small>
                    ↳{' '}
                    {allCategories.find(
                      (candidate) => candidate.id === item.parentId,
                    )
                      ? categoryName(
                          allCategories.find(
                            (candidate) => candidate.id === item.parentId,
                          )!,
                        )
                      : t.unavailableCategory}
                  </small>
                )}
              </div>
              {onEdit && onDelete && (
                <div className="row-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    {t.edit}
                  </button>
                  <button
                    className="text-button text-button--danger"
                    type="button"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    {t.delete}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StateError({ error, retry }: { error: Error; retry: () => void }) {
  const { locale } = useLocale();
  const t = managementMessages[locale];
  return (
    <div className="ledger-state">
      <ApiErrorNotice error={error} locale={locale} />
      <button
        className="button button--secondary"
        type="button"
        onClick={retry}
      >
        {t.retry}
      </button>
    </div>
  );
}
