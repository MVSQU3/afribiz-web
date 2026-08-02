import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { errorBox, noticeBox, btnPrimary } from '../styles/ui';

/**
 * Désinscription d'une alerte depuis un email.
 *
 * Accessible sans compte : le lecteur d'un email n'est pas nécessairement
 * connecté sur ce terminal, et exiger une connexion pour se désinscrire est
 * une pratique déloyale — c'est le jeton du lien qui fait autorité.
 */
export function UnsubscribeAlertPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token');
  // L'absence de jeton se sait dès le premier rendu : inutile de passer par un
  // effet, qui déclencherait un rendu en cascade pour rien.
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>(
    token ? 'pending' : 'error',
  );
  // Le montage double du mode strict enverrait deux requêtes ; sans effet de
  // bord visible ici, mais autant ne pas doubler l'appel.
  const sent = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (sent.current) return;
    sent.current = true;

    void api
      .post('/saved-searches/unsubscribe', null, { params: { token } })
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: 'var(--space-4) 0' }}>
      <h1 style={{ fontSize: 'var(--text-xl)' }}>{t('unsubscribe.title')}</h1>

      {status === 'pending' && (
        <p style={{ color: 'var(--color-neutral-700)' }}>{t('common.loading')}</p>
      )}

      {status === 'done' && (
        <>
          <div style={noticeBox}>{t('unsubscribe.done')}</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginTop: 'var(--space-4)' }}>
            {t('unsubscribe.manageHint')}
          </p>
        </>
      )}

      {status === 'error' && <div style={errorBox}>{t('unsubscribe.error')}</div>}

      <Link to="/search" style={{ ...btnPrimary, display: 'flex', marginTop: 'var(--space-4)' }}>
        {t('unsubscribe.backToSearch')}
      </Link>
    </div>
  );
}
