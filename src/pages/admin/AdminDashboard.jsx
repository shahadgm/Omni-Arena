import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { dbService, authService } from '../../services/db';
import { 
  Settings, Plus, Users, Calendar, Keyboard, Edit, Trash2, 
  RotateCcw, Square, MapPin, Hash, Lock, Search, Copy, Check, Eye, EyeOff, Filter,
  MessageSquare, Star, Bug, Lightbulb
} from 'lucide-react';

const AdminDashboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'upcoming' | 'ended'
  const [revealedCodes, setRevealedCodes] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('typing');
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const navigate = useNavigate();

  const fetchTournaments = async () => {
    const data = await dbService.getTournaments();
    // Sort by start time descending
    setTournaments(data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
    setLoading(false);
  };

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    const data = await dbService.getFeedbackList();
    setFeedbackList(data);
    setFeedbackLoading(false);
  };

  useEffect(() => {
    if (!authService.isAdmin()) {
      navigate(authService.isAuthenticated() ? '/dashboard' : '/');
      return;
    }
    fetchTournaments();
    fetchFeedback();
  }, [navigate]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
      try {
        await dbService.deleteTournament(id);
        fetchTournaments();
      } catch (err) {
        alert("Failed to delete tournament: " + err.message);
      }
    }
  };

  const handleResetLeaderboard = async (id, name) => {
    if (window.confirm(`Are you sure you want to reset the leaderboard for "${name}"? All candidate scores and submissions will be wiped.`)) {
      try {
        await dbService.resetLeaderboard(id);
        alert(`Leaderboard for "${name}" has been reset.`);
      } catch (err) {
        alert("Failed to reset leaderboard: " + err.message);
      }
    }
  };

  const toggleRevealCode = (id) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (id, code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatus = (startStr, endStr) => {
    const now = new Date();
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (now >= start && now <= end) {
      return { label: 'LIVE', color: 'var(--success)', bg: 'rgba(52, 211, 153, 0.12)' };
    } else if (now < start) {
      return { label: 'SCHEDULED', color: 'var(--warning)', bg: 'rgba(251, 191, 36, 0.12)' };
    }
    return { label: 'ENDED', color: 'var(--text-tertiary)', bg: 'var(--surface-2)' };
  };

  const tabs = [
    { id: 'typing', label: 'Typing' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'logic-puzzle', label: 'Logic Puzzles' },
    { id: 'map', label: 'Map Spotting' },
    { id: 'crossword', label: 'Crossword' },
    { id: 'practice', label: 'Practice Hub' },
    { id: 'feedback', label: 'Feedback & Reports' }
  ];

  const practiceModes = [
    { id: 'practice-english', name: 'English Sprint (Typing)', desc: 'Standard English typing test.' },
    { id: 'practice-arabic', name: 'Arabic Focus (Typing)', desc: 'Standard Arabic typing test.' },
    { id: 'practice-urdu', name: 'Urdu Focus (Typing)', desc: 'Standard Urdu typing test.' },
    { id: 'practice-bilingual', name: 'Bilingual Challenge (Typing)', desc: 'English followed by Arabic.' },
    { id: 'practice-trilingual', name: 'Trilingual Master (Typing)', desc: 'English, Arabic, and Urdu.' },
    { id: 'practice-quiz-gk', name: 'General Knowledge (Quiz)', desc: 'Mock quiz practice.' },
    { id: 'practice-quiz-tech', name: 'Tech & Science (Quiz)', desc: 'Mock quiz practice.' },
    { id: 'practice-nonogram-5x5', name: '5x5 Easy (Nonogram)', desc: 'Random 5x5 generation.' },
    { id: 'practice-nonogram-10x10', name: '10x10 Medium (Nonogram)', desc: 'Random 10x10 generation.' },
    { id: 'practice-shikaku-5x5', name: '5x5 Beginner (Shikaku)', desc: 'Practice Shikaku.' },
    { id: 'practice-map', name: 'World Geography (Map)', desc: 'Map spotting practice.' },
    { id: 'practice-crossword', name: 'Cryptic Crossword', desc: 'Crossword puzzle practice.' }
  ];

  const renderTournamentSection = (gameTypes, icon, title) => {
    const typesArray = Array.isArray(gameTypes) ? gameTypes : [gameTypes];
    let list = tournaments.filter(t => typesArray.includes(t.gameType || 'typing'));

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.accessCode && t.accessCode.toLowerCase().includes(q)) ||
        (t.creatorName && t.creatorName.toLowerCase().includes(q))
      );
    }

    // Apply Status Filter
    if (statusFilter !== 'all') {
      const now = new Date();
      list = list.filter(t => {
        const start = new Date(t.startTime);
        const end = new Date(t.endTime);
        if (statusFilter === 'active') return now >= start && now <= end;
        if (statusFilter === 'upcoming') return now < start;
        if (statusFilter === 'ended') return now > end;
        return true;
      });
    }

    return (
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {React.cloneElement(icon, { color: 'var(--primary-text)', size: 20 })}
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0 }}>{title}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{list.length} tournament{list.length === 1 ? '' : 's'} displayed</span>
            </div>
          </div>
        </div>

        <Card padding="0" style={{ overflow: 'hidden' }}>
          <div style={{ 
            padding: '0.875rem 1.25rem', 
            background: 'var(--surface-2)', 
            borderBottom: '1px solid var(--border)', 
            display: 'grid', 
            gridTemplateColumns: 'minmax(220px, 2.5fr) minmax(110px, 1fr) minmax(140px, 1.2fr) minmax(240px, 2fr)', 
            fontWeight: '600', 
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)' 
          }}>
            <div>Tournament / Code</div>
            <div>Status</div>
            <div>Schedule</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>
          
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
              Loading tournament list...
            </div>
          ) : list.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Calendar size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 0.75rem', opacity: 0.7 }} />
              <p style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--text)' }}>No matching tournaments</p>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters or search terms.' : `No tournaments created for this format yet.`}
              </p>
            </div>
          ) : (
            <div>
              {list.map((t, idx) => {
                const status = getStatus(t.startTime, t.endTime);
                const start = new Date(t.startTime);
                const isRevealed = revealedCodes[t.id];
                const isCopied = copiedId === t.id;

                return (
                  <div 
                    key={t.id} 
                    style={{ 
                      padding: '1rem 1.25rem', 
                      borderBottom: idx < list.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'grid', 
                      gridTemplateColumns: 'minmax(220px, 2.5fr) minmax(110px, 1fr) minmax(140px, 1.2fr) minmax(240px, 2fr)',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.9rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {t.name}
                        {t.isPrivate ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}>
                            <Lock size={12} style={{ color: 'var(--primary-text)' }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', letterSpacing: '0.04em' }}>
                              {isRevealed ? t.accessCode : '••••••'}
                            </span>
                            <button 
                              type="button"
                              onClick={() => toggleRevealCode(t.id)} 
                              title={isRevealed ? "Hide code" : "Reveal code"}
                              style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}
                            >
                              {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => handleCopyCode(t.id, t.accessCode, e)} 
                              title="Copy code"
                              style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: isCopied ? 'var(--success)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                            >
                              {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>
                            Public
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                        ID: {t.id.slice(0, 10)}... {t.creatorName ? `• Host: ${t.creatorName}` : ''}
                      </div>
                    </div>

                    <div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        padding: '0.25rem 0.6rem', 
                        background: status.bg, 
                        color: status.color, 
                        borderRadius: '6px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.35rem',
                        letterSpacing: '0.03em'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color }}></span>
                        {status.label}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', fontVariantNumeric: 'tabular-nums' }}>
                      <div>{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button 
                        variant="secondary" 
                        onClick={() => navigate(`/leaderboard/${t.id}`)} 
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Users size={14} /> Standings
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => navigate(`/admin/tournament/edit/${t.id}`)} 
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Edit size={14} /> Edit
                      </Button>
                      <button 
                        type="button"
                        onClick={() => handleResetLeaderboard(t.id, t.name)} 
                        title="Clear Leaderboard"
                        style={{ 
                          padding: '0.35rem 0.5rem', 
                          background: 'transparent', 
                          border: '1px solid var(--border)', 
                          borderRadius: '8px', 
                          color: 'var(--warning)', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(t.id, t.name)} 
                        title="Delete Tournament"
                        style={{ 
                          padding: '0.35rem 0.5rem', 
                          background: 'transparent', 
                          border: '1px solid var(--border)', 
                          borderRadius: '8px', 
                          color: 'var(--danger)', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem', paddingBottom: '4rem' }}>
      <style>{`
        .admin-tab-btn {
          padding: 0.65rem 1.25rem;
          color: var(--text-secondary);
          border: none;
          background: transparent;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .admin-tab-btn:hover {
          color: var(--text);
        }
        .admin-tab-btn.active {
          color: var(--primary-text);
          border-bottom: 2px solid var(--primary);
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700' }}>
            <Settings style={{ color: 'var(--primary-text)' }} size={32} /> Master Admin Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.35rem', marginBottom: 0 }}>
            Create tournaments, oversee live competitions, and inspect leaderboards.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/tournament/create')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> New Tournament
        </Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)', overflowX: 'auto', paddingBottom: '1px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Status Filters (for tournaments) */}
      {activeTab !== 'practice' && activeTab !== 'feedback' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search tournament name, code, host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter size={14} /> Status:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Live' },
              { id: 'upcoming', label: 'Scheduled' },
              { id: 'ended', label: 'Ended' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: statusFilter === s.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: statusFilter === s.id ? 'var(--primary)' : 'var(--surface-2)',
                  color: statusFilter === s.id ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'typing' && renderTournamentSection('typing', <Keyboard size={20} />, 'Typing Competitions')}
      {activeTab === 'quiz' && renderTournamentSection('quiz', <Calendar size={20} />, 'Quiz Competitions')}
      {activeTab === 'logic-puzzle' && renderTournamentSection(['logic-puzzle', 'nonogram', 'shikaku'], <Square size={20} />, 'Logic Puzzle Competitions')}
      {activeTab === 'map' && renderTournamentSection('map', <MapPin size={20} />, 'Map Spotting Competitions')}
      {activeTab === 'crossword' && renderTournamentSection('crossword', <Hash size={20} />, 'Crossword Competitions')}

      {activeTab === 'practice' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <Keyboard color="var(--primary-text)" size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0 }}>Practice Standings</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Inspect permanent global practice leaderboards</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {practiceModes.map(m => (
              <Card key={m.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--text)', fontWeight: '600' }}>{m.name}</h3>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>{m.desc}</p>
                </div>
                <Button 
                  variant="secondary"
                  onClick={() => navigate(`/leaderboard/${m.id}`)} 
                  style={{ width: '100%', marginTop: '1.25rem', fontWeight: '600', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Users size={14} /> View Leaderboard
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <MessageSquare color="var(--primary-text)" size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0 }}>Feedback & Community Reports</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  User bug tickets, improvement suggestions, and platform reviews
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={fetchFeedback}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={14} /> Refresh
            </Button>
          </div>

          {/* Stats Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <Card padding="1.25rem" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Total Submissions</span>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)', marginTop: '0.25rem' }}>{feedbackList.length}</div>
            </Card>

            <Card padding="1.25rem" style={{ borderLeft: '4px solid var(--error)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Bug size={14} color="var(--error)" /> Bug Reports
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--error)', marginTop: '0.25rem' }}>
                {feedbackList.filter(f => f.type === 'bug').length}
              </div>
            </Card>

            <Card padding="1.25rem" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lightbulb size={14} color="#8b5cf6" /> Suggestions
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#8b5cf6', marginTop: '0.25rem' }}>
                {feedbackList.filter(f => f.type === 'suggestion').length}
              </div>
            </Card>

            <Card padding="1.25rem" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Star size={14} color="#f59e0b" /> Avg Platform Rating
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.25rem' }}>
                {(() => {
                  const revs = feedbackList.filter(f => f.type === 'review' && f.rating);
                  if (revs.length === 0) return 'No reviews';
                  const avg = revs.reduce((sum, r) => sum + r.rating, 0) / revs.length;
                  return `★ ${avg.toFixed(1)} / 5`;
                })()}
              </div>
            </Card>
          </div>

          {/* Feedback Filter Bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text"
                placeholder="Search feedback message, user, or category..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Filter size={14} /> Type:
              </span>
              {[
                { id: 'all', label: `All (${feedbackList.length})` },
                { id: 'bug', label: `Bugs (${feedbackList.filter(f => f.type === 'bug').length})` },
                { id: 'suggestion', label: `Suggestions (${feedbackList.filter(f => f.type === 'suggestion').length})` },
                { id: 'review', label: `Reviews (${feedbackList.filter(f => f.type === 'review').length})` }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setFeedbackTypeFilter(s.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: feedbackTypeFilter === s.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: feedbackTypeFilter === s.id ? 'var(--primary)' : 'var(--surface-2)',
                    color: feedbackTypeFilter === s.id ? '#FFFFFF' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Items List */}
          {feedbackLoading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
              Loading feedback submissions...
            </div>
          ) : (() => {
            const filteredFeedback = feedbackList.filter(fb => {
              if (feedbackTypeFilter !== 'all' && fb.type !== feedbackTypeFilter) {
                return false;
              }
              if (feedbackSearch.trim()) {
                const q = feedbackSearch.toLowerCase();
                const matchTitle = (fb.title || '').toLowerCase().includes(q);
                const matchMessage = (fb.message || '').toLowerCase().includes(q);
                const matchUser = (fb.displayName || '').toLowerCase().includes(q);
                const matchCat = (fb.category || '').toLowerCase().includes(q);
                return matchTitle || matchMessage || matchUser || matchCat;
              }
              return true;
            });

            if (filteredFeedback.length === 0) {
              return (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <MessageSquare size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 0.75rem', opacity: 0.7 }} />
                  <p style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--text)' }}>No feedback items found</p>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    {feedbackSearch || feedbackTypeFilter !== 'all' ? 'Try adjusting your search terms or filter.' : 'No feedback or reports have been submitted yet.'}
                  </p>
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredFeedback.map(fb => (
                  <Card key={fb.id} padding="1.25rem" style={{ border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {/* Type Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: fb.type === 'bug' ? 'rgba(239, 68, 68, 0.15)' : fb.type === 'suggestion' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: fb.type === 'bug' ? 'var(--error)' : fb.type === 'suggestion' ? '#8b5cf6' : '#f59e0b',
                          border: `1px solid ${fb.type === 'bug' ? 'rgba(239, 68, 68, 0.3)' : fb.type === 'suggestion' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {fb.type === 'bug' && <Bug size={12} />}
                          {fb.type === 'suggestion' && <Lightbulb size={12} />}
                          {fb.type === 'review' && <Star size={12} />}
                          {fb.type}
                        </span>

                        {/* Category Badge */}
                        {fb.category && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.55rem' }}>
                            {fb.category}
                          </span>
                        )}

                        {/* Star Rating if Review */}
                        {fb.type === 'review' && fb.rating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star 
                                key={star} 
                                size={14} 
                                fill={star <= fb.rating ? '#f59e0b' : 'transparent'} 
                                color={star <= fb.rating ? '#f59e0b' : 'var(--text-tertiary)'} 
                              />
                            ))}
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b', marginLeft: '0.35rem' }}>
                              {fb.rating}/5
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date'}
                      </div>
                    </div>

                    {fb.title && (
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text)', margin: '0 0 0.5rem 0' }}>
                        {fb.title}
                      </h3>
                    )}

                    <p style={{ color: 'var(--text-primary)', fontSize: '0.925rem', lineHeight: '1.5', margin: '0 0 0.85rem 0', whiteSpace: 'pre-wrap' }}>
                      {fb.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      <div>
                        Submitted by: <strong style={{ color: 'var(--text-secondary)' }}>{fb.displayName || 'Anonymous'}</strong>
                        {fb.submittedBy && fb.submittedBy !== 'anonymous' && (
                          <span style={{ opacity: 0.7, marginLeft: '0.35rem' }}>({fb.submittedBy})</span>
                        )}
                      </div>
                      {fb.deviceInfo && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fb.deviceInfo}>
                          {fb.deviceInfo}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
