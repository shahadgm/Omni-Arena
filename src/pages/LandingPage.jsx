import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Trophy, Zap, Keyboard, Gamepad2 } from 'lucide-react';

const LandingPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEnter = (e) => {
    e.preventDefault();
    if (identifier.trim().length < 3) {
      setError('Please enter a valid Name or Admission Number (min 3 chars)');
      return;
    }
    // Store student identity in localStorage for the session
    localStorage.setItem('studentId', identifier.trim());
    navigate('/dashboard');
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1000px', minHeight: '80vh', justifyContent: 'center' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: -1 }}></div>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1.1, fontWeight: '800', letterSpacing: '-0.02em' }}>
          Welcome to <br />
          <span className="text-gradient">OmniArena</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          The ultimate digital tournament platform. Compete in Typing, Quizzes, Nonograms, and Shikaku to climb the global leaderboard.
        </p>
      </div>

      {/* Main Login Card */}
      <Card style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '2.5rem', 
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        background: 'rgba(20, 20, 31, 0.7)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <Gamepad2 size={32} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: '700' }}>Enter the Arena</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>Please enter your Name or Admission Number to begin</p>
        </div>
        
        <form onSubmit={handleEnter} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Student ID</label>
            <Input 
              placeholder="e.g. ADM-12345 or John Doe" 
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
              error={error}
              autoFocus
              style={{ padding: '1rem', fontSize: '1.1rem' }}
            />
          </div>
          <Button type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            Enter Platform <Zap size={20} />
          </Button>
        </form>
      </Card>

      {/* Features Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginTop: '5rem', width: '100%' }}>
        {[
          { icon: <Gamepad2 className="text-gradient" size={28} />, title: 'Multiple Modes', desc: 'Compete in Typing, Quizzes, Nonograms, and Shikaku.' },
          { icon: <Zap className="text-gradient" size={28} />, title: 'Instant Scoring', desc: 'Real-time grading, validation, and dynamic scoring formulas.' },
          { icon: <Trophy className="text-gradient" size={28} />, title: 'Live Tournaments', desc: 'Join active competitions and rank up on the leaderboard.' },
        ].map((feature, idx) => (
          <div key={idx} style={{ 
            textAlign: 'center', 
            padding: '2rem 1.5rem', 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.03)'
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
