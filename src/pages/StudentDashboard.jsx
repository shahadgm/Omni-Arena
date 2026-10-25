import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { dbService, authService } from '../services/db';
import { 
  Play, Trophy, Keyboard, Grid, Square, HelpCircle, 
  Globe, Copy, Check, Key, Plus, Trash2, Edit, Gamepad2,
  Sparkles, ShieldCheck, ArrowRight, MapPin, UserPlus
} from 'lucide-react';

const StudentDashboard = () => {
  const [publicTournaments, setPublicTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Inline code search state
  const [searchCode, setSearchCode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isGuest = authService.isGuest();
  const rawStudent = currentUser?.displayName || localStorage.getItem('displayName') || currentUser?.username || localStorage.getItem('studentId') || 'Contestant';
  const studentDisplayName = rawStudent.replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '');
  const practiceRef = useRef(null);

  const fetchAllTournaments = async () => {
    setLoading(true);
    try {
      const data = await dbService.getTournaments();
      const now = new Date();
      
      // 1. Only show public, active tournaments in the live public feed
      const activePublic = data.filter(t => !t.isPrivate && new Date(t.startTime) <= now && new Date(t.endTime) >= now);
      setPublicTournaments(activePublic);

      // 2. Fetch tournaments hosted by the current registered user
      const userCreated = !authService.isGuest() && currentUser?.username
        ? data.filter(t => typeof t.createdBy === 'string' && !t.createdBy.startsWith('guest:') && t.createdBy.toLowerCase() === currentUser.username.toLowerCase())
        : [];
      setMyTournaments(userCreated.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('studentId') && !authService.isAuthenticated()) {
      navigate('/');
      return;
    }

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}

    fetchAllTournaments();
  }, [navigate]);

  const handleSearchCode = async (e) => {
    e?.preventDefault();
    const cleanCode = searchCode.trim().toUpperCase();
    if (!cleanCode) {
      setSearchError('Please enter a tournament code.');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const match = await dbService.getTournamentByCode(cleanCode);
      if (match) {
        sessionStorage.setItem(`unlocked_${match.id}`, 'true');
        setSearchResult(match);
      } else {
        setSearchError(`No tournament found with code "${cleanCode}". Please verify with the host.`);
      }
    } catch (err) {
      setSearchError('Error searching for tournament: ' + err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoin = (target) => {
    if (typeof target === 'string') {
      navigate(`/arena/${target}`);
      return;
    }

    if (target.isPrivate) {
      const isCreator = !authService.isGuest() && currentUser?.username && typeof target.createdBy === 'string' && !target.createdBy.startsWith('guest:') && target.createdBy.toLowerCase() === currentUser.username.toLowerCase();
      const isAdmin = authService.isAdmin();
      const isUnlocked = sessionStorage.getItem(`unlocked_${target.id}`) === 'true';

      if (!isCreator && !isAdmin && !isUnlocked) {
        setSearchCode(target.accessCode || '');
        setSearchError('This tournament requires an access code.');
        return;
      }
    }
    navigate(`/arena/${target.id}`);
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteTournament = async (id, name) => {
    try {
      const tournament = myTournaments.find(t => t.id === id) || await dbService.getTournament(id);
      if (!tournament) {
        alert("Tournament not found.");
        return;
      }

      const isAdmin = authService.isAdmin();
      const isGuest = authService.isGuest();
      const isRegisteredOwner = !isGuest && currentUser?.username && typeof tournament?.createdBy === 'string' && !tournament.createdBy.startsWith('guest:') && tournament.createdBy.toLowerCase() === currentUser.username.toLowerCase();

      if (!isAdmin && !isRegisteredOwner) {
        alert("Only the tournament organizer can delete this tournament.");
        return;
      }

      if (window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
        await dbService.deleteTournament(id);
        fetchAllTournaments();
      }
    } catch (err) {
      alert("Error deleting tournament: " + err.message);
    }
  };

  const practiceList = [
    { id: 'practice-english', name: 'English Typing', format: 'Typing', desc: 'Standard English speed and accuracy sprint.', icon: <Keyboard size={24} /> },
    { id: 'practice-arabic', name: 'Arabic Typing', format: 'Typing', desc: 'Typing test optimized for Arabic typography.', icon: <Keyboard size={24} /> },
    { id: 'practice-urdu', name: 'Urdu Typing', format: 'Typing', desc: 'Typing practice rendered with Nastaliq font.', icon: <Keyboard size={24} /> },
    { id: 'practice-quiz-gk', name: 'General Quiz', format: 'Quiz', desc: 'MCQs & text questions across science and general knowledge.', icon: <HelpCircle size={24} /> },
    { id: 'practice-nonogram-5x5', name: 'Nonogram (5x5)', format: 'Logic', desc: 'Deduce painted picture tiles using row and column clues.', icon: <Grid size={24} /> },
    { id: 'practice-shikaku-5x5', name: 'Shikaku (5x5)', format: 'Logic', desc: 'Partition the grid into rectangles matching numbered areas.', icon: <Square size={24} /> },
    { id: 'practice-crossword', name: 'Crossword Puzzle', format: 'Crossword', desc: 'Fill intersecting across and down words from clues.', icon: <Sparkles size={24} /> },
    { id: 'practice-map', name: 'World Geography Map', format: 'Map', desc: 'Pinpoint world capitals, landmarks, and countries.', icon: <MapPin size={24} /> },
  ];

  return (
    <div className="container" style={{ width: '100%', maxWidth: '1120px', paddingBottom: '4rem' }}>
      
      {/* Header with Inline Code Entry */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1.5rem', 
        marginBottom: '2.5rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: '540px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-text)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            <Sparkles size={14} /> OmniArena Platform
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Welcome back, <span className="text-gradient">{studentDisplayName}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Compete in live tournaments, join private match rooms, or train in solo practice arenas.
          </p>
        </div>

        {/* Inline Code Join Card */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          padding: '1.25rem', 
          minWidth: '320px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={15} color="var(--accent-primary)" /> Have a tournament code?
          </div>
          <form onSubmit={handleSearchCode} style={{ display: 'flex', gap: '0.5rem' }}>
            <Input 
              placeholder="e.g. ABC123" 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
            />
            <Button type="submit" disabled={searchLoading} style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap' }}>
              {searchLoading ? 'Checking...' : 'Join'}
            </Button>
          </form>

          {searchError && (
            <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              • {searchError}
            </div>
          )}

          {searchResult && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {searchResult.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                Format: {searchResult.gameType || 'typing'} • Host: {searchResult.creatorName || searchResult.createdBy || 'Host'}
              </div>
              <Button onClick={() => navigate(`/arena/${searchResult.id}`)} style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}>
                Enter Match Room <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Guest Contestant Notice Banner */}
      {isGuest && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '38px', height: '38px', borderRadius: '10px', 
              background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Guest Contestant: <span style={{ color: 'var(--accent-primary)' }}>{studentDisplayName}</span>
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                You can participate in all tournaments with zero friction. Scores appear on leaderboards, but persistent history & hosting tournaments require an account.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              onClick={() => { authService.logout(); navigate('/?tab=account&mode=register'); }} 
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <UserPlus size={14} /> Create Free Account
            </Button>
          </div>
        </div>
      )}

      {/* SECTION 1: Live Now (Public Tournaments) */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={22} color="var(--accent-primary)" /> Live Competitions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Public tournaments currently active and open to all candidates</p>
          </div>
          <Button onClick={() => navigate('/tournament/create')} variant="secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> Host Tournament
          </Button>
        </div>

        {loading ? (
          <Card style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
            Loading active competitions...
          </Card>
        ) : publicTournaments.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--surface)' }}>
            <Trophy size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.4rem' }}>No Public Competitions Live Right Now</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Have an access code for a private room? Enter it in the box above, host your own tournament, or train in a solo practice arena.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button onClick={() => navigate('/tournament/create')} style={{ fontSize: '0.9rem' }}>
                <Plus size={16} /> Host Competition
              </Button>
              <Button variant="secondary" onClick={() => practiceRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: '0.9rem' }}>
                Solo Practice
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {publicTournaments.map(t => (
              <Card key={t.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '6px', 
                    background: 'var(--surface-2)', 
                    color: 'var(--primary-text)',
                    border: '1px solid var(--border)',
                    letterSpacing: '0.04em'
                  }}>
                    {(t.gameType || 'typing').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)' }}></span> LIVE
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  {t.name}
                </h3>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1 }}>
                  Host: <strong>{t.creatorName || t.createdBy || 'Host'}</strong> • Limit: {t.timeLimit ? `${t.timeLimit} mins` : 'No limit'}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <Button onClick={() => handleJoin(t)} style={{ flex: 1, padding: '0.65rem', fontSize: '0.9rem' }}>
                    Join Arena <Play size={15} />
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(`/leaderboard/${t.id}`)} style={{ padding: '0.65rem 0.85rem' }} title="Standings">
                    <Trophy size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Hosted by You (When Available) */}
      {myTournaments.length > 0 && (
        <div style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--accent-primary)" /> Tournaments Hosted by You
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage your active and private tournaments</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {myTournaments.map(t => (
              <Card key={t.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{t.name}</h3>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.2rem 0.5rem', 
                    background: t.isPrivate ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                    color: t.isPrivate ? '#c084fc' : '#60a5fa', 
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}>
                    {t.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Format: <strong>{t.gameType || 'typing'}</strong>
                </div>

                {t.isPrivate && t.accessCode && (
                  <div style={{ 
                    background: 'var(--surface-2)', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-tertiary)', marginRight: '0.4rem' }}>Code:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: 'var(--text-primary)' }}>{t.accessCode}</strong>
                    </div>
                    <button 
                      onClick={() => handleCopyCode(t.accessCode, t.id)}
                      style={{ 
                        background: 'none', border: 'none', color: copiedId === t.id ? 'var(--success)' : 'var(--primary-text)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600'
                      }}
                      title="Copy Tournament Code"
                    >
                      {copiedId === t.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" onClick={() => navigate(`/leaderboard/${t.id}`)} style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }}>
                    Standings
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(`/tournament/edit/${t.id}`)} style={{ padding: '0.55rem 0.75rem' }} title="Edit">
                    <Edit size={15} />
                  </Button>
                  <Button variant="danger" onClick={() => handleDeleteTournament(t.id, t.name)} style={{ padding: '0.55rem 0.75rem' }} title="Delete">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Solo Practice Hub */}
      <div ref={practiceRef}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gamepad2 size={22} color="var(--accent-primary)" /> Solo Practice Hub
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Unseeded training arenas. Anti-cheat is disabled; hone your speed and skills anytime.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {practiceList.map(item => (
            <Card key={item.id} hoverEffect={true} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--accent-primary)' }}>
                  {item.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{item.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.format}</span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.25rem', flex: 1 }}>
                {item.desc}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <Button onClick={() => handleJoin(item.id)} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                  Train <Play size={14} />
                </Button>
                <Button variant="secondary" onClick={() => navigate(`/leaderboard/${item.id}`)} style={{ padding: '0.6rem 0.8rem' }} title="Practice Standings">
                  <Trophy size={15} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
