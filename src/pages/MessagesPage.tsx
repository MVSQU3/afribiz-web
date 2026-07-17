import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business } from '../lib/types';

interface Conversation {
  businessId: string;
  interlocutorId: string;
  lastMessageAt: string;
  unreadCount: number;
  business: { id: string; title: string; imageUrl: string | null } | null;
  interlocutor: { id: string; firstName: string; lastName: string } | null;
  lastMessagePreview: string | null;
}

export function MessagesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  // Arrivée depuis "Contacter le vendeur" : redirige vers le fil avec le vendeur
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

  if (!conversations) return <p style={{ color: 'var(--color-text-secondary)' }}>{t('common.loading')}</p>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-xl)' }}>{t('nav.messages')}</h1>
      {conversations.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('messages.empty')}</p>
      )}
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {conversations.map((c) => (
          <Link
            key={`${c.businessId}-${c.interlocutorId}`}
            to={`/messages/${c.businessId}/${c.interlocutorId}`}
            className="card"
            style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)', alignItems: 'center' }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                background: c.business?.imageUrl
                  ? `url(${c.business.imageUrl.replace('/upload/', '/upload/w_120,h_120,c_fill,f_auto/')}) center/cover`
                  : 'var(--color-primary-light)',
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.interlocutor ? `${c.interlocutor.firstName} ${c.interlocutor.lastName}` : '—'}
                </strong>
                {c.unreadCount > 0 && (
                  <span
                    style={{
                      background: 'var(--color-primary)',
                      color: '#fff',
                      borderRadius: 'var(--radius-full)',
                      padding: '0 8px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {c.unreadCount}
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.business?.title ?? t('listing.notFound')}
              </p>
              {c.lastMessagePreview && (
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.lastMessagePreview}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
