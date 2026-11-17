import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  Keyboard, Trophy, Zap, Shield, Sparkles, Award, 
  BarChart3, Clock, Languages, ChevronRight, Lock
} from 'lucide-react';
import { authService } from '../services/db';

const TypingLanding = () => {
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const startPlaying = (targetPath = '/arena/practice-english-1m') => {
    const isLoggedIn = !!localStorage.getItem('studentId') || authService.isAuthenticated();
    if (isLoggedIn) {
      navigate(targetPath);
    } else {
      // Auto-assign clean guest contestant for zero-friction instant play
      const finalName = `Typist-${Math.floor(1000 + Math.random() * 9000)}`;
      authService.setGuestContestant(finalName);
      navigate(targetPath);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const finalName = guestName.trim() || `Typist-${Math.floor(1000 + Math.random() * 9000)}`;
    authService.setGuestContestant(finalName);
    setShowNameModal(false);
    navigate(pendingAction || '/arena/practice-english-1m');
  };

  return (
    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Omni Arena Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: 'var(--disc-typing)', fontWeight: '600' }}>Speed Typing Arena</span>
      </nav>

      {/* Hero Section */}
      <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '24px',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          marginBottom: '1.25rem',
          color: 'var(--disc-typing)',
          fontSize: '0.85rem',
          fontWeight: '700',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <Keyboard size={16} /> Omni Arena Live Multiplayer Typing Sprints
        </div>

        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: 'clamp(2rem, 5vw, 3.25rem)', 
          fontWeight: '800', 
          lineHeight: '1.15', 
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          Free Online <span style={{ color: 'var(--disc-typing)' }}>Speed Typing Competition</span> — Omni Arena
        </h1>

        <p style={{ 
          fontSize: '1.15rem', 
          color: 'var(--text-secondary)', 
          maxWidth: '720px', 
          margin: '0 auto 2rem auto', 
          lineHeight: 1.6 
        }}>
          Race against live opponents or beat your personal best on the official Omni Arena platform. Support for English, Arabic, and Nastaliq Urdu with millisecond WPM accuracy, live anti-cheat, and Olympic podium rankings.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Button 
            variant="primary" 
            onClick={() => startPlaying('/arena/practice-english-1m')}
            style={{ 
              padding: '0.85rem 1.75rem', 
              fontSize: '1.05rem', 
              fontWeight: '700', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              backgroundColor: 'var(--disc-typing)',
              borderColor: 'var(--disc-typing)',
              color: '#000000'
            }}
          >
            Start 60-Second Sprint <Zap size={18} />
          </Button>

          <Button 
            variant="secondary" 
            onClick={() => {
              const el = document.getElementById('benchmarks-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: '600' }}
          >
            WPM Benchmarks <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      {/* 3 Core Strengths of Typing Arena */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Built for Competitive Esports &amp; Classroom Drills
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Everything you need for serious speed drills, accurate error metrics, and private classroom competitions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[
            {
              icon: <BarChart3 size={24} color="var(--disc-typing)" />,
              title: 'Live Net & Raw WPM Engine',
              desc: 'Calculates words per minute using the international 5-keystroke standard, taking into account precision error rates and consistency.'
            },
            {
              icon: <Languages size={24} color="#8B5CF6" />,
              title: 'English, Arabic & Nastaliq Urdu',
              desc: 'First-class multilingual support with authentic right-to-left cursor physics, Nastaliq ligature shaping, and curated native corpuses.'
            },
            {
              icon: <Shield size={24} color="var(--success)" />,
              title: 'Anti-Cheat Telemetry Guard',
              desc: 'Monitors blur events, tab switches, and unauthorized clipboard injections to ensure 100% fair leaderboard integrity.'
            },
            {
              icon: <Trophy size={24} color="var(--gold)" />,
              title: 'Real-Time Olympic Podiums',
              desc: 'Watch the live scoreboard dynamically reorder as typists finish, awarding Gold, Silver, and Bronze medals.'
            },
            {
              icon: <Lock size={24} color="var(--primary-text)" />,
              title: 'Private Room PIN Codes',
              desc: 'Teachers and organizers can host private tournaments in seconds. Students enter with a 6-digit PIN with zero password barriers.'
            },
            {
              icon: <Clock size={24} color="var(--disc-typing)" />,
              title: 'Multi-Duration Sprints',
              desc: 'Choose 30s, 60s, or 120s sprint challenges, or test endurance with full-length literary and historical passages.'
            }
          ].map((item, idx) => (
            <Card key={idx} hoverEffect={true} style={{ padding: '1.75rem', height: '100%' }}>
              <div style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '12px', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.25rem' 
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                {item.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Multilingual Corpus Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Native Multilingual Typing Arenas
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Full typographical precision tailored for global typists and cultural competitions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <Card hoverEffect={true} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🇬🇧</span>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>English Pro Drills</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>QWERTY, Dvorak &amp; Colemak</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem', flex: 1 }}>
              Curated tech vocabulary, classic literature quotes, commonly misspelled words, and punctuation drills designed to push beyond 100+ WPM.
            </p>
            <Button 
              variant="secondary" 
              onClick={() => startPlaying('/arena/practice-english-1m')}
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.9rem', fontWeight: '700' }}
            >
              Start English Sprint <ChevronRight size={16} />
            </Button>
          </Card>

          <Card hoverEffect={true} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🇸🇦</span>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Arabic Speed Sprints</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>العربية الفصحى والكلاسيكية</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem', flex: 1 }}>
              Native RTL typography with accurate diacritic recognition, tashkeel handling, and historical Islamic prose drills for typing mastery.
            </p>
            <Button 
              variant="secondary" 
              onClick={() => startPlaying('/arena/practice-arabic-1m')}
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.9rem', fontWeight: '700' }}
            >
              Start Arabic Sprint <ChevronRight size={16} />
            </Button>
          </Card>

          <Card hoverEffect={true} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🇵🇰</span>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Nastaliq Urdu Drills</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>اردو نستعلیق اسپیڈ ٹیسٹ</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem', flex: 1 }}>
              Authentic Urdu keyboard mapping, Nastaliq ligature rendering, and classic Urdu literature passages for competitive speed events.
            </p>
            <Button 
              variant="secondary" 
              onClick={() => startPlaying('/arena/practice-urdu-1m')}
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.9rem', fontWeight: '700' }}
            >
              Start Urdu Sprint <ChevronRight size={16} />
            </Button>
          </Card>
        </div>
      </section>

      {/* Typing Speed Benchmarks Table */}
      <section id="benchmarks-section" style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Typing Speed Tiers &amp; WPM Benchmarks
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            How does your typing speed compare to the global competitive standard?
          </p>
        </div>

        <div style={{ overflowX: 'auto', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <th style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>Tier Rank</th>
                <th style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>WPM Range</th>
                <th style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>Accuracy Goal</th>
                <th style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>Skill Classification</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rank: '🥇 Olympic Grandmaster', wpm: '110+ WPM', acc: '98%+', desc: 'Top 1% global competitive esports speed.' },
                { rank: '🥈 Master Typist', wpm: '85 - 109 WPM', acc: '96%+', desc: 'Professional transcription & programmer speed.' },
                { rank: '🥉 Advanced Pro', wpm: '65 - 84 WPM', acc: '95%+', desc: 'Fast, fluent touch typing without looking down.' },
                { rank: '⚡ Intermediate', wpm: '45 - 64 WPM', acc: '92%+', desc: 'Above average office & student speed.' },
                { rank: '🌱 Novice Learner', wpm: '20 - 44 WPM', acc: '90%+', desc: 'Building muscle memory and finger positioning.' }
              ].map((tier, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{tier.rank}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--disc-typing)', fontWeight: '700' }}>{tier.wpm}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--success)' }}>{tier.acc}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>{tier.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SEO Frequently Asked Questions Section */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '2rem' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '850px', margin: '0 auto' }}>
          {[
            {
              q: 'How does OmniArena calculate WPM (Words Per Minute)?',
              a: 'WPM is computed using the global standardized formula: (Characters Typed / 5) divided by Elapsed Minutes. Incorrect entries are subtracted to generate your verified Net WPM.'
            },
            {
              q: 'Can I practice typing without signing up or downloading software?',
              a: 'Yes! OmniArena is browser-native and requires zero download or account creation. Simply enter a display name and jump into a typing sprint in seconds.'
            },
            {
              q: 'How does the anti-cheat system work in live typing tournaments?',
              a: 'Our platform tracks browser blur events, tab switching, copy-paste attempts, and human keystroke cadence to ensure all leaderboard times are legitimate and earned.'
            },
            {
              q: 'How do I host a private typing tournament for my students or team?',
              a: 'Sign up for a free Organizer account, click "Host Tournament", select Speed Typing, choose your text duration, and share the generated 6-digit room PIN with your candidates.'
            }
          ].map((faq, idx) => (
            <Card key={idx} style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {faq.q}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                {faq.a}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem 2rem', 
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.15))',
        border: '1px solid var(--border)',
        borderRadius: '16px'
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          Ready to Test Your Keystroke Speed?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Join real-time speed typing competitions, beat your personal records, and climb the podium.
        </p>
        <Button 
          variant="primary" 
          onClick={() => startPlaying('/arena/practice-english-1m')}
          style={{ 
            padding: '0.9rem 2rem', 
            fontSize: '1.05rem', 
            fontWeight: '700',
            backgroundColor: 'var(--disc-typing)',
            borderColor: 'var(--disc-typing)',
            color: '#000000'
          }}
        >
          Play Free Typing Competition <Zap size={18} style={{ marginLeft: '0.4rem' }} />
        </Button>
      </div>

      {/* Guest Name Modal if not logged in */}
      {showNameModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <Card style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>Enter Typing Arena</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Choose a display name to enter the typing sprint leaderboard.
            </p>
            <form onSubmit={handleGuestSubmit}>
              <input
                type="text"
                placeholder="e.g. SwiftKeys or Sam"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  marginBottom: '1rem'
                }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowNameModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--disc-typing)', borderColor: 'var(--disc-typing)', color: '#000' }}>
                  Start Typing
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "OmniArena Speed Typing Competition",
          "url": "https://omni-arena.vercel.app/typing",
          "applicationCategory": "GameApplication",
          "operatingSystem": "All modern web browsers",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Live real-time multiplayer speed typing sprints",
            "Multilingual typing in English, Arabic, and Nastaliq Urdu",
            "Standardized WPM and accuracy metrics calculation",
            "Anti-cheat telemetry with tab-switch guard",
            "Live Olympic podiums and instant medal rankings"
          ]
        })
      }} />
    </div>
  );
};

export default TypingLanding;
