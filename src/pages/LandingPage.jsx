import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Trophy, Zap, Gamepad2, Shield, Lock, User, AlertCircle, UserPlus } from 'lucide-react';
import { authService } from '../services/db';

const LandingPage = () => {
  const [tab, setTab] = useState('contestant'); // 'contestant' | 'account'
  const [accountMode, setAccountMode] = useState('login'); // 'login' | 'register'
  
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
        <h1 className="hero-title">
          Welcome to <br />
          <span className="text-gradient">OmniArena</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Compete in live tournaments, join private rooms with a code, and sharpen your skills.
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
              Want to host tournaments and save your competition history?{' '}
              <button
                type="button"
                onClick={() => { setTab('account'); setAccountMode('register'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-text)', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                Create an Organizer Account
              </button>
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

      {/* Features Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '3.5rem', width: '100%' }}>
        {[
          { icon: <Gamepad2 style={{ color: 'var(--primary-text)' }} size={24} />, title: '5 Diverse Disciplines', desc: 'Typing, Quiz, Nonograms, Shikaku, Crosswords, and Geography Maps.' },
          { icon: <Lock style={{ color: 'var(--primary-text)' }} size={24} />, title: 'Instant Private Rooms', desc: 'Generate tournament codes for classroom drills or private competitions.' },
          { icon: <Trophy style={{ color: 'var(--gold)' }} size={24} />, title: 'Live Medals & Podiums', desc: 'Real-time scoring, live leaderboards, and instant results verification.' },
        ].map((feature, idx) => (
          <div key={idx} style={{ 
            textAlign: 'center', 
            padding: '1.75rem 1.25rem', 
            background: 'var(--surface-2)', 
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', width: '48px', height: '48px', margin: '0 auto 1rem', alignItems: 'center', borderRadius: '10px' }}>
              {feature.icon}
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: '600' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;