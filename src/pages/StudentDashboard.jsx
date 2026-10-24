import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { dbService, authService } from '../services/db';
import { 
  Play, Trophy, Clock, Keyboard, Grid, Square, HelpCircle, Lock, 
  Globe, Search, Copy, Check, Key, Plus, Trash2, Edit, Gamepad2,
  Sparkles, ShieldCheck, ArrowRight, X
} from 'lucide-react';

const StudentDashboard = () => {
  const [publicTournaments, setPublicTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Code search state
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser?.displayName || currentUser?.username || localStorage.getItem('studentId');
  const practiceRef = useRef(null);

  const fetchAllTournaments = async () => {
    setLoading(true);
    const data = await dbService.getTournaments();
    const now = new Date();
    
    // 1. Only show public, active tournaments in the public feed
    const activePublic = data.filter(t => !t.isPrivate && new Date(t.startTime) <= now && new Date(t.endTime) >= now);
    setPublicTournaments(activePublic);

    // 2. Fetch tournaments hosted by the current user
    if (currentUser?.username) {
      const userCreated = data.filter(t => t.createdBy && t.createdBy.toLowerCase() === currentUser.username.toLowerCase());
      setMyTournaments(userCreated.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!studentId && !authService.isAuthenticated()) {
      navigate('/');
      return;
    }

    // Ensure we are not in fullscreen on dashboard
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}

    fetchAllTournaments();
  }, [navigate, studentId]);

  const handleSearchCode = async (e) => {
    e?.preventDefault();
    if (!searchCode.trim()) {
      setSearchError('Please enter a tournament code.');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const match = await dbService.getTournamentByCode(searchCode.trim());
      if (match) {
        // Unlock access in session so they can enter without re-typing
        sessionStorage.setItem(`unlocked_${match.id}`, 'true');
        setSearchResult(match);
      } else {
        setSearchError(`No tournament found with code "${searchCode.trim().toUpperCase()}". Please verify the code with the host.`);
      }
    } catch (err) {
      setSearchError('Error searching for tournament: ' + err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoin = async (t) => {
    if (typeof t === 'string') {
      navigate(`/arena/${t}`);
      return;
    }

    if (t.isPrivate) {
      const isCreator = currentUser && t.createdBy === currentUser.username;
      const isAdmin = authService.isAdmin();
      const isUnlocked = sessionStorage.getItem(`unlocked_${t.id}`) === 'true';

      if (!isCreator && !isAdmin && !isUnlocked) {
        const code = window.prompt("This tournament is private. Please enter the tournament access code:");
        if (!code || code.trim().toUpperCase() !== (t.accessCode || '').trim().toUpperCase()) {
          alert("Incorrect tournament code!");
          return;
        }
        sessionStorage.setItem(`unlocked_${t.id}`, 'true');
      }
    }
    navigate(`/arena/${t.id}`);
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteTournament = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      await dbService.deleteTournament(id);
      fetchAllTournaments();
    }
  };

  const practiceModes = {
    typing: [
      { id: 'practice-english', name: 'English Sprint', desc: 'Standard English typing test.' },
      { id: 'practice-arabic', name: 'Arabic Focus', desc: 'Standard Arabic typing test.' },
      { id: 'practice-urdu', name: 'Urdu Focus', desc: 'Standard Urdu typing test.' },
      { id: 'practice-bilingual', name: 'Bilingual Challenge', desc: 'English followed by Arabic.' },
      { id: 'practice-trilingual', name: 'Trilingual Master', desc: 'English, Arabic, and Urdu.' }
    ],
    quiz: [
      { id: 'practice-quiz-gk', name: 'General Knowledge', desc: 'Test your everyday knowledge.' },
      { id: 'practice-quiz-tech', name: 'Tech & Science', desc: 'Questions about programming and space.' }
    ],
    nonogram: [
      { id: 'practice-nonogram-5x5', name: '5x5 Easy', desc: 'A simple 5x5 Nonogram grid.' },
      { id: 'practice-nonogram-10x10', name: '10x10 Medium', desc: 'A challenging 10x10 Nonogram.' },
      { id: 'practice-nonogram-15x15', name: '15x15 Hard', desc: 'A massive 15x15 Nonogram.' }
    ],
    shikaku: [
      { id: 'practice-shikaku-5x5', name: '5x5 Beginner', desc: 'A small Shikaku puzzle to get started.' },
      { id: 'practice-shikaku-7x7', name: '7x7 Intermediate', desc: 'A standard size Shikaku puzzle.' },
      { id: 'practice-shikaku-10x10', name: '10x10 Expert', desc: 'A massive Shikaku puzzle for pros.' }
    ]
  };

  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    { id: 'typing', name: 'Practice Typing', icon: <Keyboard size={36} /> },
    { id: 'nonogram', name: 'Practice Nonogram', icon: <Grid size={36} /> },
    { id: 'shikaku', name: 'Practice Shikaku', icon: <Square size={36} /> },
    { id: 'quiz', name: 'Practice Quizzes', icon: <HelpCircle size={36} /> },
  ];

  return (
    <div className="container" style={{ width: '100%', maxWidth: '1100px', paddingBottom: '5rem' }}>
      
      {/* Top Banner */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '20px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> OmniArena Platform
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Welcome, <span className="text-gradient">{studentId}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Host competitions, enter private match rooms with codes, or compete in live public events.
          </p>
        </div>

        <Button 
          onClick={() => navigate('/tournament/create')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', fontSize: '1rem' }}
        >
          <Plus size={18} /> Host Tournament
        </Button>
      </div>

      {/* Action Cards (Match Room UI Inspired by eFootball/Gaming UI) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        
        {/* Card 1: Create Tournament */}
        <div 
          onClick={() => navigate('/tournament/create')}
          style={{
            background: 'var(--glass-bg)',
            borderRadius: '20px',
            padding: '2rem 1.75rem',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
          }}>
            <Trophy size={30} color="white" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Create Tournament
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, flex: 1, marginBottom: '1.5rem' }}>
            Publish a public match or private room with custom rules, time limit, and game format.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: '600', fontSize: '0.95rem' }}>
            Create Now <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 2: Search & Join Match Room by Code */}
        <div 
          onClick={() => { setShowCodeModal(true); setSearchResult(null); setSearchError(''); }}
          style={{
            background: 'var(--glass-bg)',
            borderRadius: '20px',
            padding: '2rem 1.75rem',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 16px rgba(14, 165, 233, 0.3)'
          }}>
            <Search size={30} color="white" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Join with Code
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, flex: 1, marginBottom: '1.5rem' }}>
            Enter a private Tournament Code to locate and participate in exclusive competitions.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: '600', fontSize: '0.95rem' }}>
            Enter Code <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 3: Solo Practice Hub */}
        <div 
          onClick={() => {
            practiceRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            background: 'var(--glass-bg)',
            borderRadius: '20px',
            padding: '2rem 1.75rem',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #a855f7, #ec4899)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 16px rgba(168, 85, 247, 0.3)'
          }}>
            <Gamepad2 size={30} color="white" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Solo Practice Hub
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, flex: 1, marginBottom: '1.5rem' }}>
            Hone your skills in Typing tests, Quizzes, Nonograms, Crosswords, and Shikaku puzzles.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontWeight: '600', fontSize: '0.95rem' }}>
            Practice Modes <ArrowRight size={16} />
          </div>
        </div>

      </div>

      {/* Code Search Modal / Floating Panel */}
      {showCodeModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <Card style={{ maxWidth: '520px', width: '100%', padding: '2.25rem', position: 'relative' }}>
            <button 
              onClick={() => setShowCodeModal(false)}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: 'none', border: 'none', color: 'var(--text-tertiary)',
                cursor: 'pointer', padding: '0.25rem'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '12px', color: '#38bdf8' }}>
                <Key size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '700' }}>Enter Tournament Code</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Type the code provided by the tournament creator</p>
              </div>
            </div>

            <form onSubmit={handleSearchCode} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Input 
                placeholder="e.g. 749201 or ARENA-102"
                value={searchCode}
                onChange={e => { setSearchCode(e.target.value.toUpperCase()); setSearchError(''); setSearchResult(null); }}
                style={{ fontFamily: 'monospace', fontSize: '1.15rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                autoFocus
                required
              />
              <Button type="submit" disabled={searchLoading} style={{ whiteSpace: 'nowrap' }}>
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </form>

            {searchError && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                background: 'rgba(239, 68, 68, 0.12)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '8px', 
                color: 'var(--error)', 
                fontSize: '0.9rem',
                marginBottom: '1rem'
              }}>
                {searchError}
              </div>
            )}

            {searchResult && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>{searchResult.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Hosted by: <strong>{searchResult.creatorName || searchResult.createdBy || 'Host'}</strong>
                    </p>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.6rem', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: 'var(--success)', 
                    borderRadius: '20px',
                    fontWeight: '600'
                  }}>
                    FOUND
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                  Format: <strong>{searchResult.gameType || 'typing'}</strong> • Time: <strong>{searchResult.timeLimit ? `${searchResult.timeLimit} mins` : 'Unlimited'}</strong>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button onClick={() => { setShowCodeModal(false); handleJoin(searchResult); }} style={{ flex: 1 }}>
                    Enter Arena <Play size={16} />
                  </Button>
                  <Button variant="secondary" onClick={() => { setShowCodeModal(false); navigate(`/leaderboard/${searchResult.id}`); }}>
                    Leaderboard
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Section: Public Tournaments */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Globe className="text-gradient" size={24} /> Public Tournaments
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            Visible to all contestants
          </span>
        </div>
        
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading tournaments...</p>
        ) : publicTournaments.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <Clock size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No public tournaments live right now</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              You can create your own tournament or join a private room with a code above.
            </p>
            <Button onClick={() => navigate('/tournament/create')} style={{ margin: '0 auto' }}>
              <Plus size={16} /> Create Public Tournament
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {publicTournaments.map(t => (
              <Card key={t.id} hoverEffect={true} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    {t.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '4px', fontWeight: '600' }}>
                    LIVE
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Mode: <strong>{t.gameType === 'logic-puzzle' ? 'Logic Puzzles' : (t.gameType || 'typing').charAt(0).toUpperCase() + (t.gameType || 'typing').slice(1)}</strong>
                  {t.creatorName && <span> • By {t.creatorName}</span>}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                  <Button onClick={() => handleJoin(t)} style={{ flex: 1 }}>
                    Join <Play size={16} />
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(`/leaderboard/${t.id}`)}>
                    Leaderboard
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section: My Hosted Tournaments */}
      {myTournaments.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck className="text-gradient" size={24} /> Tournaments Hosted by You
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              Manage your competitions & share codes
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {myTournaments.map(t => (
              <Card key={t.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{t.name}</h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem', 
                    background: t.isPrivate ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                    color: t.isPrivate ? '#c084fc' : '#60a5fa', 
                    borderRadius: '4px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {t.isPrivate ? <><Lock size={12} /> PRIVATE</> : <><Globe size={12} /> PUBLIC</>}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Format: <strong>{t.gameType || 'typing'}</strong>
                </p>

                {t.isPrivate && t.accessCode && (
                  <div style={{ 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    padding: '0.6rem 0.85rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--glass-border)',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-tertiary)', marginRight: '0.5rem' }}>Code:</span>
                      <strong style={{ fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--text-primary)' }}>{t.accessCode}</strong>
                    </div>
                    <button 
                      onClick={() => handleCopyCode(t.accessCode, t.id)}
                      style={{ 
                        background: 'none', border: 'none', color: copiedId === t.id ? 'var(--success)' : 'var(--accent-primary)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600'
                      }}
                      title="Copy Tournament Code"
                    >
                      {copiedId === t.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Button variant="secondary" onClick={() => navigate(`/leaderboard/${t.id}`)} style={{ flex: 1 }}>
                    Leaderboard
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(`/tournament/edit/${t.id}`)} title="Edit Tournament">
                    <Edit size={16} />
                  </Button>
                  <Button variant="danger" onClick={() => handleDeleteTournament(t.id, t.name)} title="Delete Tournament">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section: Solo Practice Hub */}
      <div ref={practiceRef}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Keyboard className="text-gradient" size={24} /> Solo Practice Hub
        </h2>
        
        {!activeCategory ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {categories.map(c => (
              <Card key={c.id} hoverEffect={true} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveCategory(c.id)}>
                <div style={{ margin: '0 auto 1rem', display: 'flex', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  {c.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{c.name}</h3>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <Button variant="secondary" onClick={() => setActiveCategory(null)}>
                ← Back to Categories
              </Button>
            </div>
            
            {activeCategory && practiceModes[activeCategory] && practiceModes[activeCategory].length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {practiceModes[activeCategory].map(m => (
                  <Card key={m.id} hoverEffect={true}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{m.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{m.desc}</p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                      <Button variant="secondary" onClick={() => handleJoin(m.id)} style={{ flex: 1 }}>
                        Practice <Play size={16} />
                      </Button>
                      <Button variant="secondary" onClick={() => navigate(`/leaderboard/${m.id}`)}>
                        Leaderboard
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
               <Card style={{ textAlign: 'center', padding: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{categories.find(c => c.id === activeCategory)?.name}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>This practice mode is currently in development!</p>
               </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
