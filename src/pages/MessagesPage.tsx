import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business } from '../lib/types';
import { avatar, initials } from '../styles/ui';

interface Conversation {
  businessId: string;
  interlocutorId: string;
  lastMessageAt: string;
  unreadCount: number;
  business: { id: string; title: string; imageUrl: string | null } | null;
  interlocutor: { id: string; firstName: string; lastName: string } | null;
  lastMessagePreview: string | null;
}

/** Horodatage court d'une conversation : heure aujourd'hui, sinon âge en jours. */
function shortTime(iso: string, locale: string): string {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (days < 7) return `${days} j`;
  return `${Math.floor(days / 7)} sem`;
}

export function MessagesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  // Arrivée depuis « Contacter le vendeur » : ouvre le fil avec le vendeur
  const businessParam = params.get('business');
  useEffect(() => {
    if (!businessParam) return;
    void api.get<Business>(`/businesses/${businessParam}`).then(({ data }) => {
      if (data.seller) {
        navigate(`/messages/${data.id}/${data.seller.id}`, { replace: true });
      }
    });
  }, [businessParam, navigate]);

  const load = useCallback(async () => {
    const { data } = await api.get<Conversation[]>('/messages/conversations');
    setConversations(data);
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 20000); // Polling léger
    return () => clearInterval(timer);
  }, [load]);

  if (!conversations) {
    return <p style={{ color: 'var(--color-neutral-700)' }}>{t('common.loading')}</p>;
  }

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{t('nav.messages')}</h1>
      </div>

      {conversations.length === 0 && (
        <p style={{ padding: 'var(--space-4)', color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>
          {t('messages.empty')}
        </p>
      )}

      {conversations.map((c) => (
        <Link
          key={`${c.businessId}-${c.interlocutorId}`}
          to={`/messages/${c.businessId}/${c.interlocutorId}`}
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            padding: '13px var(--space-4)',
            borderBottom: '1px solid var(--color-rule)',
            alignItems: 'flex-start',
          }}
        >
          <div style={avatar(36)}>
            {initials(c.interlocutor?.firstName, c.interlocutor?.lastName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 800,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.interlocutor ? `${c.interlocutor.firstName} ${c.interlocutor.lastName}` : '—'}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--color-neutral-700)', flex: 'none' }}>
                {shortTime(c.lastMessageAt, i18n.language)}
              </p>
            </div>
            <p
              style={{
                margin: '2px 0 3px',
                fontSize: 10,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.business?.title ?? t('listing.notFound')}
            </p>
            {c.lastMessagePreview && (
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-neutral-700)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.lastMessagePreview}
              </p>
            )}
          </div>
          {/* Non-lu : un carré plein, jamais une pastille ronde */}
          {c.unreadCount > 0 && (
            <span
              style={{
                width: 9,
                height: 9,
                flex: 'none',
                marginTop: 6,
                background: 'var(--color-accent)',
              }}
            />
          )}
        </Link>
      ))}
    </div>
  );
}
