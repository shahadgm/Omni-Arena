import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import { Trophy, Check, Share2, Clock, Target, Sparkles, X } from 'lucide-react';
import soundEngine from '../../utils/soundEffects';

const ShareCardModal = ({
  isOpen,
  onClose,
  gameTitle = "OmniArena Challenge",
  timeElapsed = 0,
  accuracy = 100,
  score = 100,
  extraStats = [],
  onContinue
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  let rank = 'Contender';
  let rankColor = 'var(--text-secondary)';
  if (accuracy >= 98 && timeElapsed < 300) {
    rank = 'Grandmaster';
    rankColor = '#f59e0b';
  } else if (accuracy >= 90) {
    rank = 'Expert';
    rankColor = '#a855f7';
  } else if (accuracy >= 75) {
    rank = 'Challenger';
    rankColor = '#06b6d4';
  }

  const shareText = `🏆 OmniArena Tournament Result\n🎮 ${gameTitle}\n⏱️ Time: ${timeFormatted} · 🎯 Accuracy: ${accuracy}% · ⭐ Score: ${score}\n🏅 Rank: ${rank}\nPlay live on https://omni-arena.vercel.app`;

  const handleCopy = async () => {
    soundEngine.playClick();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <Card
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2.25rem 1.75rem',
          borderRadius: '20px',
          border: '1.5px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65)',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex'
          }}
        >
          <X size={18} />
        </button>

        {/* Victory Icon Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1.5px solid var(--primary)',
            color: 'var(--primary)',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px var(--primary-glow)'
          }}
        >
          <Trophy size={32} />
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
          Victory Achieved!
        </h2>
        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {gameTitle}
        </div>

        {/* Rank Badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '0.35rem 1rem',
            borderRadius: '20px',
            background: 'var(--surface-2)',
            border: `1px solid ${rankColor}`,
            color: rankColor,
            fontWeight: 'bold',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}
        >
          ★ {rank} Rank
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ background: 'var(--surface-2)', padding: '0.85rem 0.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <Clock size={12} /> Time
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {timeFormatted}
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '0.85rem 0.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <Target size={12} /> Accuracy
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
              {accuracy}%
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '0.85rem 0.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <Sparkles size={12} /> Points
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              {score}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '0.85rem 1rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: copied ? 'var(--success)' : 'var(--primary)',
              transition: 'all 0.15s ease'
            }}
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? 'Share Card Copied!' : 'Copy Results Share Card'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onContinue || onClose}
            style={{ padding: '0.75rem 1rem' }}
          >
            Continue to Leaderboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ShareCardModal;
