import React, { useState, useEffect } from 'react';
import { LuMail, LuMapPin, LuX, LuCircleCheck, LuArrowRight } from 'react-icons/lu';

export const MafqoudatNewsletterDialog = ({
  isOpen,
  open,
  onClose,
  onSubscribe,
  onConfirm,
  countriesData,
  currentCountryId,
}) => {
  const visible = isOpen !== undefined ? isOpen : Boolean(open);
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [submitted, setSubmitted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);

  // Auto-dismiss after submission confirmation
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const handleDismiss = () => {
    // Persist confirmation flag so first-visit dialog doesn't re-appear
    try {
      localStorage.setItem('countryConfirmed', 'true');
    } catch (_) {}

    if (onConfirm) {
      // Find Morocco ID if available, or fallback
      let moroccoId = currentCountryId;
      if (countriesData?.entities) {
        const morocco = Object.values(countriesData.entities).find(
          (c) => c?.code && c.code.toUpperCase() === 'MA'
        );
        if (morocco) moroccoId = morocco._id || morocco.id;
      }
      onConfirm(moroccoId);
    }

    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      localStorage.setItem(
        'mafqoudat_newsletter_alert',
        JSON.stringify({
          email,
          city,
          subscribedAt: new Date().toISOString(),
        })
      );
      localStorage.setItem('countryConfirmed', 'true');
    } catch (_) {}

    if (onSubscribe) {
      onSubscribe({ email, city });
    }
    setSubmitted(true);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mafqoudat-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'mafqoudatFadeIn 0.25s ease-out',
        direction: 'ltr',
      }}
    >
      <style>{`
        @keyframes mafqoudatFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mafqoudatScaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '512px',
          padding: '28px',
          overflow: 'hidden',
          backgroundColor: 'rgba(11, 18, 32, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 35px -5px rgba(0, 242, 254, 0.19)',
          animation: 'mafqoudatScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box',
          color: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Specular hairline border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1.5px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.5), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer"
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '28px',
            height: '28px',
            borderRadius: '9999px',
            backgroundColor: closeHovered ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.6)',
            color: closeHovered ? '#ffffff' : '#94a3b8',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.15s ease',
            transform: closeHovered ? 'scale(1.05)' : 'scale(1)',
            padding: 0,
          }}
        >
          <LuX size={16} />
        </button>

        {!submitted ? (
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#00F2FE',
                marginBottom: '6px',
                fontWeight: 600,
              }}
            >
              Plateforme civique nationale • 100% Gratuit & Sécurisé
            </div>

            <h3
              id="mafqoudat-dialog-title"
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '8px',
                marginTop: 0,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
              }}
            >
              Restez alerté des objets retrouvés au Maroc
            </h3>

            <p
              style={{
                fontSize: '12px',
                color: '#cbd5e1',
                marginBottom: '20px',
                marginTop: 0,
                lineHeight: 1.6,
              }}
            >
              Recevez les signalements vérifiés dans votre ville et augmentez vos chances de retrouver vos biens égarés.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Email Input */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#22d3ee', // text-cyan-400
                    pointerEvents: 'none',
                  }}
                >
                  <LuMail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="votre.email@domaine.ma"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', // bg-slate-900/90
                    border: `1px solid ${emailFocused ? '#22d3ee' : '#334155'}`, // border-slate-700 / focus:border-cyan-400
                    borderRadius: '12px',
                    padding: '9px 12px 9px 36px',
                    fontSize: '12px',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(34, 211, 238, 0.15)' : 'none',
                  }}
                />
              </div>

              {/* City Select */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399', // text-emerald-400
                    pointerEvents: 'none',
                  }}
                >
                  <LuMapPin size={16} />
                </div>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setCityFocused(true)}
                  onBlur={() => setCityFocused(false)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: `1px solid ${cityFocused ? '#22d3ee' : '#334155'}`,
                    borderRadius: '12px',
                    padding: '9px 12px 9px 36px',
                    fontSize: '12px',
                    color: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: cityFocused ? '0 0 0 3px rgba(34, 211, 238, 0.15)' : 'none',
                  }}
                >
                  <option value="Casablanca" style={{ backgroundColor: '#0b1220', color: '#ffffff' }}>
                    Casablanca
                  </option>
                  <option value="Rabat - Salé" style={{ backgroundColor: '#0b1220', color: '#ffffff' }}>
                    Rabat - Salé
                  </option>
                  <option value="Marrakech" style={{ backgroundColor: '#0b1220', color: '#ffffff' }}>
                    Marrakech
                  </option>
                  <option value="Tanger" style={{ backgroundColor: '#0b1220', color: '#ffffff' }}>
                    Tanger
                  </option>
                  <option value="Fès" style={{ backgroundColor: '#0b1220', color: '#ffffff' }}>
                    Fès
                  </option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#020617', // text-slate-950
                  backgroundColor: '#00F2FE',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: btnHovered ? 'brightness(1.1)' : 'brightness(1)',
                  transform: btnHovered ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: btnHovered
                    ? '0 12px 24px -4px rgba(0, 242, 254, 0.45)'
                    : '0 8px 18px -4px rgba(0, 242, 254, 0.35)',
                }}
              >
                <span>Activer mes alertes gratuites</span>
                <LuArrowRight size={16} />
              </button>

              <div
                style={{
                  fontSize: '10px',
                  color: '#94a3b8', // text-slate-400
                  textAlign: 'center',
                  lineHeight: 1.4,
                  marginTop: '2px',
                }}
              >
                Zéro spam. Données hébergées en conformité CNDP. Désabonnement à tout instant.
              </div>
            </form>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '16px 0',
              animation: 'mafqoudatFadeIn 0.3s ease-out',
            }}
          >
            <LuCircleCheck
              size={48}
              style={{
                color: '#00F2FE',
                margin: '0 auto 12px auto',
                display: 'block',
              }}
            />
            <h4
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '6px',
                marginTop: 0,
              }}
            >
              Abonnement Confirmé
            </h4>
            <p
              style={{
                fontSize: '12px',
                color: '#cbd5e1',
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              Vos alertes sont actives pour {city}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MafqoudatNewsletterDialog;
