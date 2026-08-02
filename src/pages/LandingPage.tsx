import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COUNTRIES, SECTORS } from '../lib/types';
import { useAppStore } from '../stores/app.store';
import { useAuthStore } from '../stores/auth.store';

/**
 * Page marketing, hors Layout : elle a son propre en-tête et son propre pied,
 * et n'affiche ni le bottom nav ni le bandeau d'état de l'app.
 *
 * Le template d'origine est dessiné en desktop large ; ici la grille se replie
 * en une colonne sous 900px puis 620px, via `clamp()` et des media queries
 * portées par une balise <style> locale (le projet n'a pas de fichier CSS par
 * composant — voir la convention dans CLAUDE.md).
 *
 * Les compteurs restent des placeholders « — » : l'API n'expose pas encore
 * d'endpoint de statistiques publiques.
 */

const DEVISES: Record<string, string> = {
  CI: 'XOF', SN: 'XOF', BJ: 'XOF', TG: 'XOF', NG: 'NGN', GH: 'GHS',
};

const STAT_KEYS = ['listings', 'countries', 'sellers', 'buyers'] as const;
const STEP_KEYS = ['1', '2', '3'] as const;
const TRUST_KEYS = ['listings', 'moderation', 'sellers'] as const;
const FAQ_KEYS = ['free', 'verify', 'commission', 'currency', 'account', 'delay'] as const;
const PLAN_KEYS = ['standard', 'featured', 'support'] as const;

const section: CSSProperties = {
  borderBottom: '2px solid var(--color-divider)',
  padding: 'clamp(36px, 6vw, 60px) clamp(16px, 4vw, 48px)',
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(30px, 5vw, 48px)',
  letterSpacing: '-0.035em',
  lineHeight: 1,
};

const kicker: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
};

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage } = useAppStore();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <style>{`
        .lp-hero { display: grid; grid-template-columns: 1.35fr 1fr; }
        .lp-hero > aside { border-left: 2px solid var(--color-divider); }
        .lp-4 { display: grid; grid-template-columns: repeat(4, 1fr); }
        .lp-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
        .lp-6 { display: grid; grid-template-columns: repeat(6, 1fr); }
        .lp-faq { display: grid; grid-template-columns: 1fr 1.6fr; }
        .lp-faq > div:first-child { border-right: 2px solid var(--color-divider); }
        .lp-news { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: end; }
        .lp-footer-cols { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 40px; }
        .lp-nav-links { display: flex; gap: 28px; }
        @media (max-width: 900px) {
          .lp-hero, .lp-faq, .lp-news, .lp-3 { grid-template-columns: 1fr; }
          .lp-hero > aside { border-left: 0; border-top: 2px solid var(--color-divider); }
          .lp-faq > div:first-child { border-right: 0; border-bottom: 2px solid var(--color-divider); }
          .lp-4, .lp-6 { grid-template-columns: repeat(2, 1fr); }
          .lp-footer-cols { grid-template-columns: 1fr 1fr; gap: 28px; }
          .lp-news { gap: 24px; }
          .lp-nav-links { display: none; }
        }
        @media (max-width: 620px) {
          .lp-4, .lp-6 { grid-template-columns: 1fr; }
          .lp-footer-cols { grid-template-columns: 1fr; }
        }
        .lp-cell { border-right: 1px solid var(--color-rule); border-bottom: 1px solid var(--color-rule); }
      `}</style>

      {/* ------------------------------ En-tête ------------------------------ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--color-bg)',
          borderBottom: '2px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(12px, 3vw, 40px)',
          padding: '16px clamp(16px, 4vw, 48px)',
        }}
      >
        <Link to="/landing" className="wordmark" style={{ fontSize: 24, marginRight: 'auto' }}>
          {t('app.name')}
        </Link>
        <nav
          className="lp-nav-links"
          style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          <a href="#comment" style={{ color: 'var(--color-accent-700)' }}>{t('landing.nav.how')}</a>
          <a href="#pays" style={{ color: 'var(--color-accent-700)' }}>{t('landing.nav.countries')}</a>
          <a href="#tarifs" style={{ color: 'var(--color-accent-700)' }}>{t('landing.nav.pricing')}</a>
          <a href="#faq" style={{ color: 'var(--color-accent-700)' }}>{t('landing.nav.faq')}</a>
        </nav>
        <div style={{ display: 'flex', border: '2px solid var(--color-divider)' }}>
          {(['fr', 'en'] as const).map((lng, i) => (
            <button
              key={lng}
              onClick={() => setLanguage(lng)}
              style={{
                padding: '7px 11px',
                fontSize: 11,
                fontWeight: language === lng ? 800 : 600,
                letterSpacing: '0.06em',
                border: 0,
                borderLeft: i === 0 ? 0 : '1px solid var(--color-rule)',
                background: language === lng ? 'var(--color-text)' : 'transparent',
                color: language === lng ? 'var(--color-highlight)' : 'var(--color-text)',
              }}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
        <Link
          to={user ? '/dashboard' : '/login'}
          style={{
            padding: '9px 14px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: '2px solid var(--color-divider)',
          }}
        >
          {user ? t('nav.dashboard') : t('nav.login')}
        </Link>
        <Link
          to="/sell"
          style={{
            padding: '9px 14px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
          }}
        >
          {t('home.sellCta')}
        </Link>
      </header>

      {/* -------------------------------- Hero ------------------------------- */}
      <section className="lp-hero" style={{ borderBottom: '2px solid var(--color-divider)' }}>
        <div style={{ padding: 'clamp(36px, 6vw, 72px) clamp(16px, 4vw, 48px) clamp(32px, 5vw, 56px)' }}>
          <p style={{ ...kicker, marginBottom: 22 }}>{t('landing.hero.kicker')}</p>
          <h1
            style={{
              margin: '0 0 20px',
              fontSize: 'clamp(40px, 8vw, 82px)',
              letterSpacing: '-0.045em',
              lineHeight: 0.94,
              textWrap: 'balance',
            }}
          >
            {t('landing.hero.title')}
          </h1>
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.45,
              color: 'var(--color-neutral-800)',
              maxWidth: '56ch',
              marginBottom: 32,
            }}
          >
            {t('landing.hero.subtitle')}
          </p>
          <form onSubmit={onSearch} style={{ display: 'flex', border: '2px solid var(--color-divider)', maxWidth: 660 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '16px 18px',
                fontFamily: 'inherit',
                fontSize: 16,
                background: 'var(--color-surface)',
                border: 0,
                borderRadius: 0,
              }}
            />
            <button
              type="submit"
              style={{
                padding: '16px clamp(16px, 3vw, 26px)',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
                border: 0,
              }}
            >
              {t('landing.hero.cta')}
            </button>
          </form>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {SECTORS.map((s) => (
              <Link
                key={s}
                to={`/search?sector=${s}`}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  border: '1px solid var(--color-divider)',
                }}
              >
                {t(`sectors.${s}`)}
              </Link>
            ))}
          </div>
        </div>

        {/* Colonne vendeur — le champ lime, plat */}
        <aside
          style={{
            background: 'var(--color-highlight)',
            padding: 'clamp(32px, 5vw, 56px) clamp(16px, 3vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div>
            <p style={{ ...kicker, color: 'var(--color-accent-700)', marginBottom: 16 }}>
              {t('landing.seller.kicker')}
            </p>
            <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(28px, 4vw, 38px)', letterSpacing: '-0.03em', lineHeight: 1.02 }}>
              {t('landing.seller.title')}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--color-accent-800)', margin: 0 }}>
              {t('landing.seller.body')}
            </p>
          </div>
          <div>
            <Link
              to="/sell"
              style={{
                display: 'block',
                padding: '18px 22px',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'var(--color-text)',
                color: 'var(--color-highlight)',
                marginBottom: 12,
              }}
            >
              {t('landing.seller.cta')}
            </Link>
            <p style={{ fontSize: 12, color: 'var(--color-accent-700)', margin: 0 }}>
              {t('landing.seller.note')}
            </p>
          </div>
        </aside>
      </section>

      {/* ------------------------------ Chiffres ----------------------------- */}
      <section className="lp-4" style={{ borderBottom: '2px solid var(--color-divider)' }}>
        {STAT_KEYS.map((key) => (
          <div key={key} className="lp-cell" style={{ padding: '34px clamp(16px, 3vw, 32px)' }}>
            <p
              style={{
                margin: 0,
                fontSize: 'clamp(40px, 6vw, 56px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: 'var(--color-accent)',
              }}
            >
              {key === 'countries' ? COUNTRIES.length : '—'}
            </p>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {t(`landing.stats.${key}.label`)}
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.06em',
                color: 'var(--color-neutral-600)',
              }}
            >
              {t(`landing.stats.${key}.note`)}
            </p>
          </div>
        ))}
      </section>

      {/* --------------------------- Comment ça marche ----------------------- */}
      <section id="comment" style={section}>
        <h2 style={{ ...sectionTitle, marginBottom: 36 }}>{t('landing.how.title')}</h2>
        <div className="lp-3" style={{ borderTop: '2px solid var(--color-divider)' }}>
          {STEP_KEYS.map((n) => (
            <div key={n} className="lp-cell" style={{ padding: '28px clamp(16px, 3vw, 28px) 32px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--color-accent)' }}>
                0{n}
              </p>
              <h3 style={{ margin: '0 0 10px', fontSize: 'clamp(21px, 3vw, 26px)', letterSpacing: '-0.025em', lineHeight: 1.08 }}>
                {t(`landing.how.step${n}.title`)}
              </h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--color-neutral-800)' }}>
                {t(`landing.how.step${n}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ Confiance ---------------------------- */}
      <section
        style={{
          ...section,
          background: 'var(--color-text)',
          color: 'var(--color-bg)',
        }}
      >
        <p style={{ ...kicker, color: 'var(--color-accent-2)', marginBottom: 26 }}>
          {t('landing.trust.kicker')}
        </p>
        <div className="lp-3" style={{ borderTop: '2px solid var(--color-accent-2)' }}>
          {TRUST_KEYS.map((key) => (
            <div key={key} style={{ padding: '26px clamp(16px, 3vw, 26px) 0 0' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 'clamp(20px, 3vw, 24px)', letterSpacing: '-0.02em' }}>
                {t(`landing.trust.${key}.title`)}
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--color-neutral-300)' }}>
                {t(`landing.trust.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- Pays ------------------------------- */}
      <section id="pays" style={section}>
        <h2 style={{ ...sectionTitle, marginBottom: 12 }}>{t('landing.countries.title')}</h2>
        <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', maxWidth: '42ch', marginBottom: 32 }}>
          {t('landing.countries.subtitle')}
        </p>
        <div className="lp-6" style={{ borderTop: '2px solid var(--color-divider)' }}>
          {COUNTRIES.map((c) => (
            <div key={c} className="lp-cell" style={{ padding: '24px 20px 26px' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--color-accent-2)' }}>
                {c}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {t(`countries.${c}`)}
              </p>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-neutral-700)',
                }}
              >
                {DEVISES[c]}
              </p>
              <Link
                to={`/search?country=${c}`}
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent-700)',
                }}
              >
                {t('landing.countries.explore')} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------- Tarifs ------------------------------ */}
      <section id="tarifs" style={section}>
        <h2 style={{ ...sectionTitle, marginBottom: 12 }}>{t('landing.pricing.title')}</h2>
        <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', maxWidth: '44ch', marginBottom: 32 }}>
          {t('landing.pricing.subtitle')}
        </p>
        <div className="lp-3" style={{ border: '2px solid var(--color-divider)' }}>
          {PLAN_KEYS.map((plan, i) => {
            const featured = plan === 'featured';
            return (
              <div
                key={plan}
                style={{
                  padding: '30px clamp(16px, 3vw, 28px) 32px',
                  borderRight: i === PLAN_KEYS.length - 1 ? undefined : '2px solid var(--color-divider)',
                  background: featured ? 'var(--color-highlight)' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: featured ? 'var(--color-accent-700)' : 'var(--color-accent)',
                  }}
                >
                  {t(`landing.pricing.${plan}.name`)}
                </p>
                <p style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 46px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {plan === 'standard' ? t('landing.pricing.free') : '—'}
                </p>
                {plan !== 'standard' && (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      color: featured ? 'var(--color-accent-700)' : 'var(--color-neutral-600)',
                    }}
                  >
                    {t('landing.pricing.tbd')}
                  </p>
                )}
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: featured ? 'var(--color-accent-800)' : 'var(--color-neutral-800)',
                    flex: 1,
                  }}
                >
                  {t(`landing.pricing.${plan}.body`)}
                </p>
                {plan === 'standard' ? (
                  <Link
                    to="/sell"
                    style={{
                      padding: '14px 16px',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      border: '2px solid var(--color-divider)',
                      textAlign: 'center',
                    }}
                  >
                    {t(`landing.pricing.${plan}.cta`)}
                  </Link>
                ) : (
                  <a
                    href={`mailto:${t('landing.contactEmail')}`}
                    style={{
                      padding: '14px 16px',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      background: featured ? 'var(--color-text)' : undefined,
                      color: featured ? 'var(--color-highlight)' : undefined,
                      border: featured ? '2px solid var(--color-text)' : '2px solid var(--color-divider)',
                    }}
                  >
                    {t(`landing.pricing.${plan}.cta`)}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* --------------------------------- FAQ ------------------------------- */}
      <section id="faq" className="lp-faq" style={{ borderBottom: '2px solid var(--color-divider)' }}>
        <div style={{ padding: 'clamp(36px, 6vw, 60px) clamp(16px, 3vw, 40px) clamp(32px, 5vw, 56px) clamp(16px, 4vw, 48px)' }}>
          <h2 style={{ ...sectionTitle, marginBottom: 12 }}>{t('landing.faq.title')}</h2>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--color-neutral-700)', margin: 0 }}>
            {t('landing.faq.contact')}{' '}
            <a href={`mailto:${t('landing.contactEmail')}`} style={{ color: 'var(--color-accent-700)', fontWeight: 600 }}>
              {t('landing.contactEmail')}
            </a>
          </p>
        </div>
        <div>
          {FAQ_KEYS.map((key) => (
            <div key={key} style={{ padding: '22px clamp(16px, 4vw, 48px) 24px', borderBottom: '1px solid var(--color-rule)' }}>
              <h3 style={{ margin: '0 0 7px', fontSize: 20, letterSpacing: '-0.015em' }}>
                {t(`landing.faq.${key}.q`)}
              </h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--color-neutral-800)', maxWidth: '78ch' }}>
                {t(`landing.faq.${key}.a`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- Appel à l'inscription ------------------- */}
      <section
        className="lp-news"
        style={{
          borderBottom: '2px solid var(--color-divider)',
          background: 'var(--color-accent)',
          color: 'var(--color-bg)',
          padding: 'clamp(32px, 5vw, 56px) clamp(16px, 4vw, 48px)',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 4.5vw, 44px)', letterSpacing: '-0.035em', lineHeight: 1.02 }}>
            {t('landing.cta.title')}
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--color-accent-2-200)', maxWidth: '52ch' }}>
            {t('landing.cta.body')}
          </p>
        </div>
        <div>
          <Link
            to="/register"
            style={{
              display: 'block',
              padding: '18px 24px',
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: 'var(--color-highlight)',
              color: 'var(--color-text)',
              textAlign: 'center',
            }}
          >
            {t('auth.register')}
          </Link>
          <p style={{ fontSize: 12, color: 'var(--color-accent-2-200)', margin: '10px 0 0' }}>
            {t('landing.cta.note')}
          </p>
        </div>
      </section>

      {/* -------------------------------- Pied ------------------------------- */}
      <footer
        style={{
          background: 'var(--color-text)',
          color: 'var(--color-bg)',
          padding: 'clamp(32px, 5vw, 56px) clamp(16px, 4vw, 48px) 32px',
        }}
      >
        <div className="lp-footer-cols" style={{ paddingBottom: 36, borderBottom: '1px solid var(--color-neutral-700)' }}>
          <div>
            <p className="wordmark" style={{ fontSize: 32, marginBottom: 10 }}>
              {t('app.name')}
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--color-neutral-300)', maxWidth: '34ch', margin: 0 }}>
              {t('landing.footer.about')}
            </p>
          </div>
          <div>
            <p style={{ ...kicker, fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-accent-2)', marginBottom: 14 }}>
              {t('landing.footer.buy')}
            </p>
            <p style={{ fontSize: 14, lineHeight: 2, color: 'var(--color-neutral-300)', margin: 0 }}>
              <Link to="/search">{t('landing.footer.explore')}</Link>
              <br />
              <Link to="/search">{t('search.sector')}</Link>
              <br />
              <a href="#pays">{t('landing.nav.countries')}</a>
            </p>
          </div>
          <div>
            <p style={{ ...kicker, fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-accent-2)', marginBottom: 14 }}>
              {t('landing.footer.sell')}
            </p>
            <p style={{ fontSize: 14, lineHeight: 2, color: 'var(--color-neutral-300)', margin: 0 }}>
              <Link to="/sell">{t('home.sellCta')}</Link>
              <br />
              <a href="#tarifs">{t('landing.nav.pricing')}</a>
              <br />
              <a href="#comment">{t('landing.nav.how')}</a>
            </p>
          </div>
          <div>
            <p style={{ ...kicker, fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-accent-2)', marginBottom: 14 }}>
              {t('app.name')}
            </p>
            <p style={{ fontSize: 14, lineHeight: 2, color: 'var(--color-neutral-300)', margin: 0 }}>
              <a href={`mailto:${t('landing.contactEmail')}`}>{t('landing.footer.contact')}</a>
              <br />
              <a href="#faq">{t('landing.nav.faq')}</a>
              <br />
              <Link to="/">{t('landing.footer.openApp')}</Link>
            </p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 22,
            fontSize: 12,
            color: 'var(--color-neutral-500)',
          }}
        >
          <p style={{ margin: 0 }}>{t('landing.footer.legal', { year: new Date().getFullYear() })}</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <button
              onClick={() => setLanguage('fr')}
              style={{ border: 0, background: 'transparent', color: 'inherit', font: 'inherit', padding: 0 }}
            >
              Français
            </button>
            <button
              onClick={() => setLanguage('en')}
              style={{ border: 0, background: 'transparent', color: 'inherit', font: 'inherit', padding: 0 }}
            >
              English
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
