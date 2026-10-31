import React, { useEffect, useState } from 'react';

/**
 * Lightweight, zero-dependency confetti explosion component using CSS particles
 */
const Confetti = ({ count = 65, duration = 3500, onComplete }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#14b8a6'];
    const generated = Array.from({ length: count }, (_, i) => {
      const angle = (Math.random() * 360) * (Math.PI / 180);
      const velocity = 180 + Math.random() * 380;
      return {
        id: i,
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 120, // gravity bias downward
        rotate: Math.random() * 720 - 360,
        scale: 0.6 + Math.random() * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        duration: 1.8 + Math.random() * 1.4,
        delay: Math.random() * 0.2
      };
    });

    setParticles(generated);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [count, duration, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 999999
      }}
    >
      <style>{`
        @keyframes omniConfettiFly {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(0);
          }
          15% {
            opacity: 1;
            transform: translate(calc(var(--tx) * 0.35), calc(var(--ty) * 0.35)) rotate(calc(var(--rot) * 0.2)) scale(var(--s));
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), calc(var(--ty) + 400px)) rotate(var(--rot)) scale(calc(var(--s) * 0.7));
          }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.shape === 'rect' ? '12px' : '9px',
            height: p.shape === 'rect' ? '7px' : '9px',
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            '--tx': `${p.x}px`,
            '--ty': `${p.y}px`,
            '--rot': `${p.rotate}deg`,
            '--s': p.scale,
            animation: `omniConfettiFly ${p.duration}s cubic-bezier(0.25, 1, 0.5, 1) ${p.delay}s forwards`
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
