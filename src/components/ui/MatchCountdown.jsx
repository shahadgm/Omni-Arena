import React, { useState, useEffect } from 'react';
import soundEngine from '../../utils/soundEffects';

const MatchCountdown = ({ title = "Get Ready", subtitle = "Position your hands", onReady }) => {
  const [step, setStep] = useState(3); // 3, 2, 1, 0 (START)

  useEffect(() => {
    soundEngine.playCountdownTick();

    const timer1 = setTimeout(() => {
      setStep(2);
      soundEngine.playCountdownTick();
    }, 800);

    const timer2 = setTimeout(() => {
      setStep(1);
      soundEngine.playCountdownTick();
    }, 1600);

    const timer3 = setTimeout(() => {
      setStep(0);
      soundEngine.playCountdownGo();
    }, 2400);

    const timer4 = setTimeout(() => {
      onReady();
    }, 3000);

    const handleKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        soundEngine.playCountdownGo();
        onReady();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onReady]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        userSelect: 'none',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes omniCountPulse {
          0% { transform: scale(0.4); opacity: 0; }
          40% { transform: scale(1.15); opacity: 1; }
          60% { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.9; }
        }
      `}</style>

      <div style={{ fontSize: '1.1rem', letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        {title}
      </div>

      <div
        key={`count-${step}`}
        style={{
          fontSize: step === 0 ? 'clamp(3rem, 9vw, 5.5rem)' : 'clamp(5rem, 15vw, 9rem)',
          fontWeight: '900',
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
          background: step === 0 ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #a855f7, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 35px rgba(99, 102, 241, 0.45))',
          animation: 'omniCountPulse 0.75s cubic-bezier(0.2, 0.9, 0.3, 1) forwards'
        }}
      >
        {step === 0 ? 'START!' : step}
      </div>

      <div style={{ fontSize: '0.95rem', color: 'var(--text-tertiary)', marginTop: '2rem' }}>
        {subtitle} · <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={onReady}>Press Space to Skip</span>
      </div>
    </div>
  );
};

export default MatchCountdown;
