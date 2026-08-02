import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatPrice, primaryImage, type Business } from '../lib/types';
import { useAuthStore } from '../stores/auth.store';
import { avatar, initials, thumb } from '../styles/ui';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  businessId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export function ConversationPage() {
  const { businessId, interlocutorId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await api.get<Message[]>(
      `/messages/conversations/${businessId}/${interlocutorId}`,
    );
    setMessages(data);
  }, [businessId, interlocutorId]);

  useEffect(() => {
    void load();
    void api
      .get<Business>(`/businesses/${businessId}`)
      .then(({ data }) => setBusiness(data))
      .catch(() => {});
    const timer = setInterval(() => void load(), 15000); // Polling
    return () => clearInterval(timer);
  }, [load, businessId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post('/messages', {
        businessId,
        receiverId: interlocutorId,
        content: draft.trim(),
      });
      setDraft('');
      await load();
    } catch {
      setError(t('common.error'));
    } finally {
      setSending(false);
    }
  };

  // Le nom de l'interlocuteur n'est pas exposé par l'API du fil : on le déduit
  // du vendeur quand c'est lui, sinon on reste sur un libellé neutre.
  const isSeller = business?.seller?.id === interlocutorId;
  const interlocutorName = isSeller ? business?.seller?.firstName : undefined;

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)', paddingBottom: 72 }}>
      {/* En-tête du fil */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px var(--space-4)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <button
          onClick={() => navigate('/messages')}
          style={{ border: 0, background: 'transparent', fontSize: 'var(--text-sm)', fontWeight: 800, padding: 0 }}
          aria-label={t('common.back')}
        >
          ←
        </button>
        <div style={avatar(30)}>{initials(interlocutorName ?? '?')}</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800, lineHeight: 1.1 }}>
            {interlocutorName ?? t('messages.interlocutor')}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t('messages.about')} · {business?.title ?? '…'}
          </p>
        </div>
      </div>

      {/* Rappel de l'annonce */}
      {business && (
        <Link
          to={`/businesses/${business.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px var(--space-4)',
            borderBottom: '2px solid var(--color-divider)',
            background: 'var(--color-surface)',
          }}
        >
          <div style={thumb(primaryImage(business), 52, 40)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {business.title}
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-accent-700)' }}>
              {formatPrice(business.askingPrice, business.country, i18n.language)}
            </p>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-700)',
            }}
          >
            {t('messages.view')}
          </span>
        </Link>
      )}

      {/* Fil : reçus en surface encadrée, envoyés en pavé sombre */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 'var(--space-4)',
          minHeight: '40vh',
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
            {t('messages.startConversation')}
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              style={{
                maxWidth: '78%',
                alignSelf: mine ? 'flex-end' : 'flex-start',
                padding: '10px 12px',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.45,
                background: mine ? 'var(--color-text)' : 'var(--color-surface)',
                color: mine ? 'var(--color-bg)' : 'var(--color-text)',
                border: mine ? '1px solid var(--color-text)' : '1px solid var(--color-rule)',
              }}
            >
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</p>
              <p style={{ margin: 0, fontSize: 10, opacity: 0.7, textAlign: 'right' }}>
                {new Date(m.createdAt).toLocaleString(i18n.language, {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', padding: '0 var(--space-4)' }}>
          {error}
        </p>
      )}

      {/* Zone de saisie fixe */}
      <form
        onSubmit={(e) => void send(e)}
        style={{
          position: 'fixed',
          bottom: 'var(--bottom-nav-height)',
          left: 0,
          right: 0,
          zIndex: 5,
          display: 'flex',
          gap: 8,
          padding: '10px var(--space-4)',
          background: 'var(--color-bg)',
          borderTop: '2px solid var(--color-divider)',
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('messages.placeholder')}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '11px 12px',
            fontFamily: 'inherit',
            fontSize: 'var(--text-sm)',
            background: 'var(--color-surface)',
            border: '2px solid var(--color-divider)',
            borderRadius: 0,
          }}
        />
        <button
          disabled={sending || !draft.trim()}
          style={{
            padding: '11px 14px',
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            border: '2px solid var(--color-accent)',
            opacity: sending || !draft.trim() ? 0.45 : 1,
          }}
        >
          {t('messages.send')}
        </button>
      </form>
    </div>
  );
}
