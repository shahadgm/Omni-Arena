import { useEffect, useState, useRef } from 'react';

// In-built themed modal overlay for anti-cheat warnings (replaces browser alert popups)
const showThemedAntiCheatAlert = ({ title, message, isFinal, onAcknowledge }) => {
  const existing = document.getElementById('omni-anticheat-modal');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'omni-anticheat-modal';
  Object.assign(backdrop.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    backdropFilter: 'blur(8px)',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.25rem',
    animation: 'fadeIn 0.15s ease-out'
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    maxWidth: '460px',
    width: '100%',
    padding: '2rem 1.75rem',
    borderRadius: '16px',
    border: '1.5px solid var(--danger)',
    boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
    background: 'var(--surface)',
    textAlign: 'center',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)'
  });

  const iconCircle = document.createElement('div');
  iconCircle.innerHTML = '⚠️';
  Object.assign(iconCircle.style, {
    fontSize: '2rem',
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem'
  });

  const h3 = document.createElement('h3');
  h3.textContent = title;
  Object.assign(h3.style, {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 0.65rem 0'
  });

  const p = document.createElement('p');
  p.textContent = message;
  Object.assign(p.style, {
    fontSize: '0.925rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.55',
    margin: '0 0 1.75rem 0'
  });

  const btn = document.createElement('button');
  btn.textContent = isFinal ? 'Auto-Submit Now' : 'I Understand & Return to Match';
  Object.assign(btn.style, {
    background: isFinal ? 'var(--danger)' : 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.85rem 1.5rem',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  });

  btn.onclick = () => {
    backdrop.remove();
    if (onAcknowledge) onAcknowledge();
  };

  card.appendChild(iconCircle);
  card.appendChild(h3);
  card.appendChild(p);
  card.appendChild(btn);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
};

export const useAntiCheat = (onViolation, isPractice) => {
  const [strikes, setStrikes] = useState(0);
  const callbackRef = useRef(onViolation);

  useEffect(() => {
    callbackRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    if (isPractice) return;

    let isProcessingViolation = false;
    let lastViolationTime = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('You left the tab or minimized the window.');
      }
    };

    const handleBlur = () => {
      if (isProcessingViolation) return;
      if (Date.now() - lastViolationTime < 2500) return;
      handleViolation('You clicked outside the tournament window.');
    };

    const handleViolation = (reason) => {
      const now = Date.now();
      if (isProcessingViolation || now - lastViolationTime < 2500) return;
      
      isProcessingViolation = true;
      lastViolationTime = now;

      setStrikes(prev => {
        const newStrikes = prev + 1;
        
        window.removeEventListener('blur', handleBlur);

        if (newStrikes >= 3) {
          showThemedAntiCheatAlert({
            title: 'Anti-Cheat Violation (3/3)',
            message: `${reason} Maximum strikes reached. Your tournament attempt is being auto-submitted.`,
            isFinal: true,
            onAcknowledge: () => {
              if (callbackRef.current) callbackRef.current();
            }
          });
        } else {
          showThemedAntiCheatAlert({
            title: `Anti-Cheat Warning (${newStrikes}/3)`,
            message: `${reason} If you accumulate 3 strikes, your test will be terminated and auto-submitted.`,
            isFinal: false,
            onAcknowledge: () => {
              setTimeout(() => {
                isProcessingViolation = false;
                window.addEventListener('blur', handleBlur);
              }, 1000);
            }
          });
        }
        return newStrikes;
      });
    };

    const isMobile = typeof navigator !== 'undefined' && (
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    );

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (!isMobile) {
      window.addEventListener('blur', handleBlur);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (!isMobile) {
        window.removeEventListener('blur', handleBlur);
      }
      const existing = document.getElementById('omni-anticheat-modal');
      if (existing) existing.remove();
    };
  }, [isPractice]);

  return strikes;
};
