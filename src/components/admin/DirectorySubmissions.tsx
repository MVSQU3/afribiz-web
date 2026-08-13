import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirectoryStore } from '../../stores/directory.store';
import type { DirectoryStatus } from '../../lib/types';
import { field, errorBox } from '../auth/AuthForm.css';
import { btnSmall, overline } from '../../styles/ui';

const STATUSES: DirectoryStatus[] = ['pending', 'published', 'rejected'];

/**
 * File de modération de l'annuaire.
 *
 * Les propositions publiques arrivent en `pending` et n'apparaissent nulle
 * part tant que personne ne les a relues — c'est ici que ça se passe. Le
 * composant ne parle jamais à `api` : tout passe par `useDirectoryStore`.
 */
export function DirectorySubmissions() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<DirectoryStatus>('pending');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const entries = useDirectoryStore((s) => s.adminEntries);
  const findAll = useDirectoryStore((s) => s.findAll);
  const publish = useDirectoryStore((s) => s.publish);
  const reject = useDirectoryStore((s) => s.reject);
  const remove = useDirectoryStore((s) => s.remove);
  const storeError = useDirectoryStore((s) => s.error);

  useEffect(() => {
    void findAll(status);
  }, [findAll, status]);

  /**
   * Enchaîne une action puis recharge la file.
   *
   * Rechargement plutôt que substitution locale : la liste est filtrée par
   * statut, une entrée publiée doit quitter l'onglet « en attente » au lieu d'y
   * rester avec un libellé qui contredit le filtre.
   */
  const act = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
      await findAll(status);
    } catch {
      setActionError(t('common.error'));
    }
  };

  const dangerBtn = {
    ...btnSmall,
    color: 'var(--color-danger)',
    borderColor: 'var(--color-danger)',
  };

  return (
    <>
      {/* Filtre de statut : segmenté, l'actif en contraste inversé */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            style={{
              ...btnSmall,
              background: status === s ? 'var(--color-text)' : 'transparent',
              color: status === s ? 'var(--color-highlight)' : 'var(--color-text)',
              borderColor: status === s ? 'var(--color-text)' : 'var(--color-divider)',
            }}
          >
            {t(`admin.directory.status.${s}`)}
          </button>
        ))}
      </div>

      {(actionError ?? storeError) && (
        <div style={errorBox}>{actionError ?? t(storeError ?? 'common.error')}</div>
      )}

      {entries.length === 0 && (
        <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>
          {t('admin.directory.empty')}
        </p>
      )}

      {entries.map((entry) => (
        <div key={entry.id} style={{ padding: '13px 0', borderTop: '1px solid var(--color-rule)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800, lineHeight: 1.15 }}>
              {entry.name}
            </p>
            {entry.isVerified && (
              <span
                className="badge"
                style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
              >
                {t('directory.verified')}
              </span>
            )}
          </div>

          <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)' }}>
            {[
              entry.city,
              entry.country,
              t(`directory.categories.${entry.category}`),
              entry.foundedYear,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>

          {/* Le site est la donnée à vérifier en premier : c'est elle qui
              décide si la proposition est sérieuse. */}
          <p style={{ margin: '5px 0 0', fontSize: 'var(--text-xs)' }}>
            <a
              href={entry.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{ color: 'var(--color-accent-700)', fontWeight: 600 }}
            >
              {entry.website}
            </a>
          </p>

          <p
            style={{
              margin: 'var(--space-2) 0 0',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.5,
              color: 'var(--color-neutral-800)',
            }}
          >
            {i18n.language === 'en' ? entry.descriptionEn : entry.descriptionFr}
          </p>

          <p style={{ margin: '5px 0 0', fontSize: '10px', color: 'var(--color-neutral-700)' }}>
            {t('admin.directory.slug')} : {entry.slug}
            {entry.submitterEmail && ` · ${t('admin.directory.submittedBy')} ${entry.submitterEmail}`}
          </p>

          {entry.moderationNote && (
            <p style={{ margin: '5px 0 0', fontSize: '10px', color: 'var(--color-danger)' }}>
              {t('admin.directory.note')} : {entry.moderationNote}
            </p>
          )}

          {rejecting === entry.id ? (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...overline, marginBottom: 5 }}>{t('admin.directory.rejectReason')}</p>
              <textarea
                style={{ ...field, minHeight: 60, resize: 'vertical' }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{
                    ...btnSmall,
                    background: 'var(--color-danger)',
                    color: 'var(--color-bg)',
                    borderColor: 'var(--color-danger)',
                  }}
                  disabled={!note.trim()}
                  onClick={() =>
                    void act(() => reject(entry.id, note)).then(() => {
                      setRejecting(null);
                      setNote('');
                    })
                  }
                >
                  {t('admin.directory.confirmReject')}
                </button>
                <button onClick={() => setRejecting(null)} style={btnSmall}>
                  {t('admin.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {entry.status !== 'published' && (
                <button
                  style={{
                    ...btnSmall,
                    background: 'var(--color-accent)',
                    color: 'var(--color-bg)',
                    borderColor: 'var(--color-accent)',
                  }}
                  onClick={() => void act(() => publish(entry.id))}
                >
                  {t('admin.directory.publish')}
                </button>
              )}
              {entry.status !== 'rejected' && (
                <button onClick={() => setRejecting(entry.id)} style={dangerBtn}>
                  {t('admin.reject')}
                </button>
              )}
              {/* Suppression définitive : réservée aux propositions qu'on ne
                  veut pas garder en trace, un rejet suffit dans le cas courant. */}
              <button
                style={dangerBtn}
                onClick={() => {
                  if (confirm(t('admin.directory.confirmDelete', { name: entry.name }))) {
                    void act(() => remove(entry.id));
                  }
                }}
              >
                {t('admin.directory.delete')}
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
