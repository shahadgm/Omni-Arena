import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Trophy, Zap, Gamepad2, Shield, Lock, User } from 'lucide-react';
import { authService } from '../services/db';

const LandingPage = () => {
  const [tab, setTab] = useState('contestant'); // 'contestant' | 'admin'
  
  // Contestant entry state
  const [contestantId, setContestantId] = useState('');
  
  // Admin login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (authService.isAdmin()) {
      navigate('/admin/dashboard');
    } else if (localStorage.getItem('studentId')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleContestantEnter = (e) => {
    e.preventDefault();
    setError('');
    const cleanId = contestantId.trim();
    if (cleanId.length < 2) {
      setError('Please enter a valid Name or Admission Number (min 2 characters).');
      return;
    }

    // Store student identity for tournament participation
    localStorage.setItem('studentId', cleanId);
    localStorage.setItem('displayName', cleanId);
    localStorage.setItem('user', JSON.stringify({
      username: cleanId,
      displayName: cleanId,
      role: 'student'
    }));
    localStorage.setItem('isAdmin', 'false');
    navigate('/dashboard');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!adminUsername.trim() || !adminPassword) {
      setError('Please enter both admin username and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await authService.login(adminUsername, adminPassword);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Administrator privileges required.');
        authService.logout();
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
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
          Compete in live tournaments, enter private match rooms, and climb the global leaderboards.
        </p>
      </div>

      {/* Main Card */}
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
            onClick={() => { setTab('contestant'); setError(''); }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              background: tab === 'contestant' ? 'var(--accent-primary)' : 'transparent',
              color: tab === 'contestant' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: tab === 'contestant' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
            }}
          >
            <User size={17} /> Contestant
          </button>
          <button
            type="button"
            onClick={() => { setTab('admin'); setError(''); }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              background: tab === 'admin' ? 'var(--accent-primary)' : 'transparent',
              color: tab === 'admin' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: tab === 'admin' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
            }}
          >
            <Shield size={17} /> Admin Login
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

        {tab === 'contestant' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.85rem', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <Gamepad2 size={30} color="var(--accent-primary)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.35rem' }}>Enter the Arena</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Enter your Name or Admission Number to join competitions</p>
            </div>

            <form onSubmit={handleContestantEnter} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Name or Admission Number</label>
                <Input 
                  placeholder="e.g. ADM-12345 or John Doe" 
                  value={contestantId}
                  onChange={(e) => { setContestantId(e.target.value); setError(''); }}
                  autoFocus
                  required
                />
              </div>

              <Button 
                type="submit" 
                style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              >
                Enter Platform <Zap size={18} />
              </Button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.85rem', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <Lock size={30} color="var(--accent-primary)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.35rem' }}>Admin Portal</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Sign in with your administrator credentials</p>
            </div>

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Username</label>
                <Input 
                  placeholder="e.g. admin" 
                  value={adminUsername}
                  onChange={(e) => { setAdminUsername(e.target.value); setError(''); }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setError(''); }}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Authenticating...' : 'Sign In as Admin'} <Zap size={18} />
              </Button>
            </form>
          </div>
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
