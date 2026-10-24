import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Trophy, Zap, Keyboard, Gamepad2, UserPlus, LogIn, Lock, User, Sparkles } from 'lucide-react';
import { authService } from '../services/db';

const LandingPage = () => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (authService.isAdmin()) {
      navigate('/admin/dashboard');
    } else if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!loginUsername.trim() || !loginPassword) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await authService.login(loginUsername, loginPassword);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regUsername.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.register(regUsername, regPassword, regDisplayName);
      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        if (user && user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1000px', minHeight: '80vh', justifyContent: 'center', padding: '2rem 1rem' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0) 70%)', zIndex: -1 }}></div>
        <h1 style={{ fontSize: '3.75rem', marginBottom: '1rem', lineHeight: 1.1, fontWeight: '800', letterSpacing: '-0.02em' }}>
          Welcome to <br />
          <span className="text-gradient">OmniArena</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
          Compete in live tournaments, host your own public or private competitions, and climb the global leaderboards.
        </p>
      </div>

      {/* Main Auth Card */}
      <Card style={{ 
        width: '100%', 
        maxWidth: '460px', 
        padding: '2rem 2.25rem', 
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
        background: 'var(--glass-bg)'
      }}>
        {/* Tab switch header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          backgroundColor: 'rgba(0, 0, 0, 0.25)', 
          padding: '0.35rem', 
          borderRadius: '12px', 
          marginBottom: '1.75rem',
          border: '1px solid var(--glass-border)'
        }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              background: tab === 'login' ? 'var(--accent-primary)' : 'transparent',
              color: tab === 'login' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: tab === 'login' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
            }}
          >
            <LogIn size={17} /> Log In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              background: tab === 'register' ? 'var(--accent-primary)' : 'transparent',
              color: tab === 'register' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: tab === 'register' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
            }}
          >
            <UserPlus size={17} /> Create Account
          </button>
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px', 
            color: 'var(--error)', 
            fontSize: '0.9rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>•</span> {error}
          </div>
        )}

        {successMsg && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: 'rgba(16, 185, 129, 0.12)', 
            border: '1px solid rgba(16, 185, 129, 0.3)', 
            borderRadius: '8px', 
            color: 'var(--success)', 
            fontSize: '0.9rem',
            marginBottom: '1.25rem'
          }}>
            {successMsg}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Username or Student ID</label>
              <Input 
                placeholder="e.g. alex24 or ADM-102" 
                value={loginUsername}
                onChange={(e) => { setLoginUsername(e.target.value); setError(''); }}
                autoFocus
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
              <Input 
                type="password"
                placeholder="••••••••" 
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? 'Logging in...' : 'Enter Arena'} <Zap size={18} />
            </Button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setTab('register')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Don't have an account? Sign up now
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Display Name</label>
              <Input 
                placeholder="e.g. Alex Morgan" 
                value={regDisplayName}
                onChange={(e) => { setRegDisplayName(e.target.value); setError(''); }}
                autoFocus
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Username / Student ID</label>
              <Input 
                placeholder="e.g. alex24 (min 3 chars)" 
                value={regUsername}
                onChange={(e) => { setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, '')); setError(''); }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
              <Input 
                type="password"
                placeholder="Min 4 characters" 
                value={regPassword}
                onChange={(e) => { setRegPassword(e.target.value); setError(''); }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Confirm Password</label>
              <Input 
                type="password"
                placeholder="Repeat password" 
                value={regConfirmPassword}
                onChange={(e) => { setRegConfirmPassword(e.target.value); setError(''); }}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? 'Creating Account...' : 'Create Account & Enter'} <Sparkles size={18} />
            </Button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setTab('login')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Already have an account? Log in
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Features Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginTop: '4rem', width: '100%' }}>
        {[
          { icon: <Gamepad2 className="text-gradient" size={28} />, title: 'Multiple Game Modes', desc: 'Compete in Typing, Quizzes, Nonograms, Crosswords, and Shikaku.' },
          { icon: <Lock className="text-gradient" size={28} />, title: 'Public & Private Arenas', desc: 'Create private tournaments with custom access codes or public matches.' },
          { icon: <Trophy className="text-gradient" size={28} />, title: 'Live Leaderboards', desc: 'Real-time ranking, anti-cheat protection, and dynamic scoring.' },
        ].map((feature, idx) => (
          <div key={idx} style={{ 
            textAlign: 'center', 
            padding: '2rem 1.5rem', 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', width: '60px', height: '60px', margin: '0 auto 1.25rem', alignItems: 'center', borderRadius: '12px' }}>
              {feature.icon}
            </div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.15rem', fontWeight: '600' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
