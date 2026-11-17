import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Trophy, Zap, Gamepad2, Shield, Lock, User, AlertCircle, UserPlus, Keyboard, HelpCircle, MapPin, Sparkles, Grid, ChevronDown, CheckCircle2, Globe, Compass } from 'lucide-react';
import { authService } from '../services/db';

const FAQS = [
  {
    q: 'What is Omni Arena?',
    a: 'Omni Arena is a free online multi-format educational and esports competition platform. It combines live speed typing sprints, interactive geography map quizzes, daily crosswords, trivia quizzes, and spatial logic puzzles in a unified arena with real-time leaderboards and anti-cheat telemetry.'
  },
  {
    q: 'Where can I find the official Omni Arena website?',
    a: 'The official Omni Arena website and online application is hosted at https://omni-arena.vercel.app/. You can access all practice arenas, daily challenges, and live tournaments directly in your web browser with no download or installation required.'
  },
  {
    q: 'What can I do on the Omni Arena platform?',
    a: 'On Omni Arena, contestants can compete in 60-second speed typing sprints across English, Arabic, and Nastaliq Urdu; master geography on interactive vector maps of India and the world; solve daily crossword grids and Sudoku number puzzles; and join or host private tournaments with live Olympic podiums.'
  },
  {
    q: 'Is Omni Arena free to play online?',
    a: 'Yes, Omni Arena is 100% free to access and play online. Contestants can jump straight into practice arenas as a guest or create a free profile to track personal best WPM records, accuracy scores, and tournament history.'
  },
  {
    q: 'How do I host a private competition or tournament on Omni Arena?',
    a: 'Educators, classroom teachers, and event organizers can create custom tournaments on Omni Arena through the Organizer Portal. You can select custom challenge disciplines, configure time limits, and generate an instant PIN code for contestants to join with automated anti-cheat monitoring.'
  }
];

const LandingPage = () => {
  const [tab, setTab] = useState('contestant'); // 'contestant' | 'account'
  const [accountMode, setAccountMode] = useState('login'); // 'login' | 'register'
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (idx) => setOpenFaq(prev => prev === idx ? null : idx);
  
  // Contestant entry state
  const [contestantId, setContestantId] = useState('');
  
  // Account login/register state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse URL params e.g. /?tab=account&mode=register
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'account') {
      setTab('account');
      if (params.get('mode') === 'register') {
        setAccountMode('register');
      } else if (params.get('mode') === 'login') {
        setAccountMode('login');
      }
    }

    if (authService.isAdmin()) {
      navigate('/admin/dashboard');
    } else if (localStorage.getItem('studentId')) {
      navigate('/dashboard');
    }
  }, [navigate, location.search]);

  const handleContestantEnter = async (e) => {
    e.preventDefault();
    setError('');
    const cleanId = contestantId.trim();
    if (cleanId.length < 2) {
      setError('Please enter a valid Name or Admission Number (min 2 characters).');
      return;
    }

    setLoading(true);
    try {
      // Check if this candidate is banned or suspended
      const banCheck = await authService.checkUserBanStatus(cleanId);
      if (banCheck.isBanned) {
        setError(`Access Denied: Contestant "${cleanId}" is permanently banned. (${banCheck.reason})`);
        setLoading(false);
        return;
      }
      if (banCheck.isSuspended) {
        const untilStr = new Date(banCheck.suspendedUntil).toLocaleString();
        setError(`Access Restricted: Contestant "${cleanId}" is suspended until ${untilStr}. (${banCheck.reason})`);
        setLoading(false);
        return;
      }

      // Block names that match an existing account username
      const exists = await authService.checkUsernameExists(cleanId);
      if (exists) {
        setError('This name belongs to a registered account. Please switch to Organizer Portal to log in.');
        setLoading(false);
        return;
      }

      // Save contestant with device token so names don't collide
      authService.setGuestContestant(cleanId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error entering arena as contestant.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (accountMode === 'login') {
        if (!username.trim() || !password) {
          setError('Please enter both username and password.');
          setLoading(false);
          return;
        }
        const user = await authService.login(username.trim(), password);
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Register Mode
        if (!username.trim() || !password) {
          setError('Please enter both username and password.');
          setLoading(false);
          return;
        }
        await authService.register(username.trim(), password, displayName.trim());
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1000px', minHeight: '80vh', justifyContent: 'center', padding: '2rem 1rem' }}>
      <style>{`
        .hero-title {
          font-size: clamp(2.25rem, 6vw, 3.75rem);
          line-height: 1.15;
          margin-bottom: 1rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
      `}</style>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.35rem 0.85rem', 
          borderRadius: '20px', 
          background: 'rgba(99, 102, 241, 0.1)', 
          border: '1px solid rgba(99, 102, 241, 0.25)', 
          marginBottom: '1rem',
          fontSize: '0.85rem',
          color: 'var(--primary-text)',
          fontWeight: '600'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></span>
          Omni Arena Official Platform • Multi-Format Competitions
        </div>
        <h1 className="hero-title" style={{ fontFamily: 'var(--font-display)' }}>
          Compete, Solve &amp; Win in <br />
          <span className="text-gradient">Omni Arena</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
          Welcome to the official <strong>Omni Arena</strong> online platform. Join live multiplayer speed typing sprints, interactive India and world geography map challenges, crosswords, and logic puzzles.
        </p>
      </div>

      {/* Main Card */}
      <Card style={{ 
        width: '100%', 
        maxWidth: '460px', 
        padding: '2rem', 
        position: 'relative'
      }}>
        {/* Tab switch header */}
        <div 
          role="tablist" 
          aria-label="Arena Entry Mode"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            backgroundColor: 'var(--surface-2)', 
            padding: '0.35rem', 
            borderRadius: '10px', 
            marginBottom: '1.75rem',
            border: '1px solid var(--border)'
          }}
        >
          <button
            type="button"
            role="tab"
            id="contestant-tab"
            aria-selected={tab === 'contestant'}
            aria-controls="contestant-panel"
            onClick={() => { setTab('contestant'); setError(''); }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '7px',
              border: 'none',
              background: tab === 'contestant' ? 'var(--primary)' : 'transparent',
              color: tab === 'contestant' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={16} /> Contestant
          </button>
          <button
            type="button"
            role="tab"
            id="account-tab"
            aria-selected={tab === 'account'}
            aria-controls="account-panel"
            onClick={() => { setTab('account'); setError(''); }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '7px',
              border: 'none',
              background: tab === 'account' ? 'var(--primary)' : 'transparent',
              color: tab === 'account' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={16} /> Organizer Portal
          </button>
        </div>

        {error && (
          <div 
            role="alert"
            style={{ 
              padding: '0.75rem 1rem', 
              background: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid var(--danger)', 
              borderRadius: '8px', 
              color: 'var(--danger)', 
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {tab === 'contestant' ? (
          <div role="tabpanel" id="contestant-panel" aria-labelledby="contestant-tab">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <Gamepad2 size={28} style={{ color: 'var(--primary-text)' }} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.35rem' }}>Enter as Contestant</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                No password required. Enter your Name or Admission Number to join live tournaments.
              </p>
            </div>

            <form onSubmit={handleContestantEnter} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="contestant-input" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Name or Admission Number
                </label>
                <Input 
                  id="contestant-input"
                  placeholder="e.g. ADM-1029 or Alex Johnson" 
                  value={contestantId}
                  onChange={(e) => { setContestantId(e.target.value); setError(''); }}
                  autoFocus
                  required
                />
              </div>

              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                Enter Platform <Zap size={18} />
              </Button>
            </form>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-tertiary)' }}>
              Want to host tournaments or save your competition history?
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--surface)'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--surface-2)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Sign in with Google
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('account'); setAccountMode('register'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-text)', fontWeight: '600', cursor: 'pointer', padding: '0.35rem 0' }}
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div role="tabpanel" id="account-panel" aria-labelledby="account-tab">
            {/* Account Mode Sub-Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => { setAccountMode('login'); setError(''); }}
                style={{
                  background: accountMode === 'login' ? 'var(--surface-2)' : 'transparent',
                  border: '1px solid ' + (accountMode === 'login' ? 'var(--border)' : 'transparent'),
                  borderRadius: '6px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: accountMode === 'login' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer'
                }}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setAccountMode('register'); setError(''); }}
                style={{
                  background: accountMode === 'register' ? 'var(--surface-2)' : 'transparent',
                  border: '1px solid ' + (accountMode === 'register' ? 'var(--border)' : 'transparent'),
                  borderRadius: '6px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: accountMode === 'register' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer'
                }}
              >
                Create Account
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                {accountMode === 'login' ? <Lock size={26} style={{ color: 'var(--primary-text)' }} /> : <UserPlus size={26} style={{ color: 'var(--primary-text)' }} />}
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                {accountMode === 'login' ? 'Organizer / Admin Login' : 'Create Organizer Account'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                {accountMode === 'login' 
                  ? 'Sign in to host competitions and manage leaderboards.' 
                  : 'Host tournaments, save your test history, and grade candidates.'}
              </p>
            </div>

            {/* Google One-Click Auth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s ease',
                marginBottom: '1.25rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--surface)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--surface-2)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{accountMode === 'login' ? 'Sign In with Google' : 'Sign Up with Google'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span>or use username & password</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label htmlFor="account-username" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Username
                </label>
                <Input 
                  id="account-username"
                  placeholder="e.g. host_john" 
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  autoFocus
                  required
                />
              </div>

              {accountMode === 'register' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor="account-display-name" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Display Name
                  </label>
                  <Input 
                    id="account-display-name"
                    placeholder="e.g. Professor John or John Doe" 
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label htmlFor="account-password" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <Input 
                  id="account-password"
                  type="password"
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
              </div>

              <Button 
                type="submit" 
                variant="primary"
                disabled={loading} 
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Processing...' : (accountMode === 'login' ? 'Sign In' : 'Register Account')} <Zap size={18} />
              </Button>
            </form>
          </div>
        )}
      </Card>

      {/* 5 Disciplines Showcase Section */}
      <div style={{ marginTop: '4rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '0.4rem' }}>
            5 Competitive Disciplines
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Challenge your reflexes, intellect, and problem-solving skills across multiple arena formats.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[
            { 
              badgeClass: 'badge-disc-typing', 
              badgeText: 'Speed Typing', 
              icon: <Keyboard size={22} color="var(--disc-typing)" />, 
              title: 'Typing Sprint', 
              desc: 'English, Arabic, and Nastaliq Urdu speed drills with live WPM and accuracy metrics.' 
            },
            { 
              badgeClass: 'badge-disc-quiz', 
              badgeText: 'Live Quiz', 
              icon: <HelpCircle size={22} color="var(--disc-quiz)" />, 
              title: 'Knowledge Arena', 
              desc: 'High-speed timed MCQs and text trivia questions with automated host grading.' 
            },
            { 
              badgeClass: 'badge-disc-map', 
              badgeText: 'Geography', 
              icon: <MapPin size={22} color="var(--disc-map)" />, 
              title: 'World Map Trivia', 
              desc: 'Interactive world map challenge to pinpoint countries, capitals, and global flags.' 
            },
            { 
              badgeClass: 'badge-disc-crossword', 
              badgeText: 'Crossword', 
              icon: <Sparkles size={22} color="var(--disc-crossword)" />, 
              title: 'Word Grids', 
              desc: 'Intersecting clue grids that test vocabulary and rapid deductive pattern recognition.' 
            },
            { 
              badgeClass: 'badge-disc-puzzle', 
              badgeText: 'Logic Puzzles', 
              icon: <Grid size={22} color="var(--disc-puzzle)" />, 
              title: 'Nonograms & Shikaku', 
              desc: 'Spatial logic puzzles: deduce painted picture cells and partition geometric rectangles.' 
            },
          ].map((item, idx) => (
            <Card key={idx} hoverEffect={true} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '10px', 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {item.icon}
                </div>
                <span className={`badge-disc ${item.badgeClass}`}>{item.badgeText}</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Trust & Architecture Strip */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.25rem', 
        marginTop: '2.5rem', 
        marginBottom: '2rem',
        width: '100%',
        padding: '1.5rem',
        background: 'var(--surface-2)',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Lock size={20} color="var(--primary-text)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Private Tournament Codes</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Instant PINs for classroom drills and private tournaments</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Trophy size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Live Olympic Podiums</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Real-time scoreboard ranking and instant medal results</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={20} color="var(--success)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Anti-Cheat Telemetry</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tab-switch and clipboard guard for integrity</div>
          </div>
        </div>
      </div>

      {/* Brand Authority: What is Omni Arena? */}
      <section style={{ marginTop: '3.5rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.3rem 0.8rem', 
            borderRadius: '999px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.25)', 
            fontSize: '0.8rem', 
            color: 'var(--primary-text)', 
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            Official Platform Overview
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>
            What is Omni Arena?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
            <strong>Omni Arena</strong> is an educational and esports competition platform engineered to test speed, knowledge, and problem-solving. Whether you are practicing 60-second multilingual typing drills, exploring interactive vector maps of India and the world, or solving daily crossword grids and Sudoku puzzles, Omni Arena provides a unified browser arena with instant feedback and live rankings.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <Card style={{ padding: '1.5rem', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Zero-Install Web App</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Access Omni Arena instantly on any desktop, laptop, tablet, or smartphone without downloading apps or plugins. Built with lightweight vector SVGs and ultra-responsive layouts.
            </p>
          </Card>

          <Card style={{ padding: '1.5rem', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Multi-Discipline Competitions</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Move seamlessly between speed typing in English, Arabic, and Urdu; state-by-state geography identification; crossword word puzzles; and 9x9 Sudoku and Nonogram logic games.
            </p>
          </Card>

          <Card style={{ padding: '1.5rem', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏫</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Classroom &amp; Esports Ready</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Teachers and organizers can spin up custom tournaments with instant 4-digit PINs. Automated anti-cheat telemetry safeguards fairness for official school competitions.
            </p>
          </Card>
        </div>
      </section>

      {/* Brand FAQ Section */}
      <section style={{ marginTop: '4rem', marginBottom: '2.5rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.3rem 0.8rem', 
            borderRadius: '999px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.25)', 
            fontSize: '0.8rem', 
            color: 'var(--success)', 
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            Got Questions?
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            Frequently Asked Questions About Omni Arena
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Everything you need to know about the official Omni Arena platform, features, and online tournaments.
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: '700',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ 
                    color: 'var(--primary-text)', 
                    transform: isOpen ? 'rotate(180deg)' : 'none', 
                    transition: 'transform 0.2s ease', 
                    display: 'flex',
                    fontSize: '0.8rem' 
                  }}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div style={{ 
                    padding: '0 1.25rem 1.25rem', 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.92rem', 
                    lineHeight: 1.6, 
                    borderTop: '1px solid rgba(255,255,255,0.05)', 
                    paddingTop: '0.85rem' 
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;