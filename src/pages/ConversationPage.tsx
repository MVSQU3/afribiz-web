import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business } from '../lib/types';
import { useAuthStore } from '../stores/auth.store';

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
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await api.get<Message[]>(`/messages/conversations/${businessId}/${interlocutorId}`);
    setMessages(data);
  }, [businessId, interlocutorId]);

  useEffect(() => {
    void load();
    void api.get<Business>(`/businesses/${businessId}`).then(({ data }) => setBusiness(data)).catch(() => {});
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

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - var(--header-height) - var(--bottom-nav-height) - 32px)' }}>
      {/* Contexte du listing en en-tête */}
      {business && (
        <Link
          to={`/businesses/${business.id}`}
          className="card"
          style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
        >
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{t('messages.about')}</span>
          <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{business.title}</strong>
        </Link>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>{t('messages.startConversation')}</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: mine ? 'var(--color-primary)' : 'var(--color-surface)',
                color: mine ? '#fff' : 'inherit',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-2) var(--space-3)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</p>
              <p style={{ margin: 0, fontSize: 10, opacity: 0.7, textAlign: 'right' }}>
                {new Date(m.createdAt).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</p>}
      <form onSubmit={(e) => void send(e)} style={{ display: 'flex', gap: 'var(--space-2)', position: 'sticky', bottom: 'calc(var(--bottom-nav-height) + var(--space-2))', zIndex: 5, background: 'var(--color-bg)', padding: 'var(--space-2) 0', marginTop: 'var(--space-2)' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('messages.placeholder')}
          style={{
            flex: 1,
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-base)',
            background: 'var(--color-surface)',
          }}
        />
        <button className="btn-primary" disabled={sending || !draft.trim()}>
          {t('messages.send')}
        </button>
      </form>
    </div>
  );
}
