import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { dbService, authService } from '../../services/db';
import { Settings, Plus, Users, Calendar, Keyboard, Edit, Trash2, RotateCcw, Square, MapPin, Hash, Lock } from 'lucide-react';

const AdminDashboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTournaments = async () => {
    const data = await dbService.getTournaments();
    // Sort by start time descending
    setTournaments(data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
    setLoading(false);
  };

  useEffect(() => {
    if (!authService.isAdmin()) {
      navigate('/admin/login');
      return;
    }
    fetchTournaments();
  }, [navigate]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete its leaderboard.`)) {
      await dbService.deleteTournament(id);
      fetchTournaments(); // Refresh list
    }
  };

  const handleResetLeaderboard = async (id, name) => {
    if (window.confirm(`Are you sure you want to completely clear the leaderboard for "${name}"? This action cannot be undone.`)) {
      await dbService.resetLeaderboard(id);
      alert(`Leaderboard for "${name}" has been cleared.`);
    }
  };

  const renderTournamentSection = (gameTypes, icon, title) => {
    const typesArray = Array.isArray(gameTypes) ? gameTypes : [gameTypes];
    const list = tournaments.filter(t => typesArray.includes(t.gameType || 'typing'));
    
    return (
      <div key={typesArray[0]} style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            {React.cloneElement(icon, { color: 'var(--text-secondary)', size: 20 })}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{title}</h2>
        </div>

        <Card padding="0" style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ 
            padding: '1rem 1.5rem', 
            background: 'rgba(0,0,0,0.2)', 
            borderBottom: '1px solid var(--glass-border)', 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1fr 1fr auto', 
            fontWeight: '600', 
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-tertiary)' 
          }}>
            <div>Tournament Name</div>
            <div>Format</div>
            <div>Status</div>
            <div>Start Date</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>
          
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RotateCcw size={24} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
              Loading tournaments...
            </div>
          ) : list.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Calendar size={24} opacity={0.5} />
              </div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No active tournaments</p>
              <p style={{ fontSize: '0.9rem' }}>You haven't created any {title.toLowerCase()} yet.</p>
            </div>
          ) : (
            <div>
              {list.map((t, idx) => {
                const now = new Date();
                const start = new Date(t.startTime);
                const end = new Date(t.endTime);
                let status = 'UPCOMING';
                let statusColor = 'var(--warning)';
                let statusBg = 'rgba(234, 179, 8, 0.1)';
                
                if (now >= start && now <= end) {
                  status = 'ACTIVE';
                  statusColor = 'var(--success)';
                  statusBg = 'rgba(34, 197, 94, 0.1)';
                } else if (now > end) {
                  status = 'ENDED';
                  statusColor = 'var(--text-tertiary)';
                  statusBg = 'rgba(255,255,255,0.05)';
                }

                return (
                  <div key={t.id} className="tournament-row" style={{ 
                    padding: '1.25rem 1.5rem', 
                    borderBottom: idx < list.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {t.name}
                        {t.isPrivate && (
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Lock size={12} /> {t.accessCode}
                          </span>
                        )}
                        {t.creatorName && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
                            by {t.creatorName}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>ID: {t.id.slice(0, 8)}...</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                        {t.gameType === 'logic-puzzle' ? 'Logic Puzzles' : (t.gameType ? t.gameType.charAt(0).toUpperCase() + t.gameType.slice(1) : 'Typing')}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.35rem 0.75rem', background: statusBg, color: statusColor, borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }}></span>
                        {status}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column' }}>
                      <span>{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Button variant="secondary" onClick={() => navigate(`/leaderboard/${t.id}`)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none' }} title="View Leaderboard">
                        <Users size={16} color="var(--text-primary)" />
                      </Button>
                      <Button variant="secondary" onClick={() => handleResetLeaderboard(t.id, t.name)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none' }} title="Reset Leaderboard">
                        <RotateCcw size={16} color="var(--warning)" />
                      </Button>
                      <Button variant="secondary" onClick={() => navigate(`/admin/tournament/edit/${t.id}`)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none' }} title="Edit">
                        <Edit size={16} color="var(--accent-primary)" />
                      </Button>
                      <Button variant="secondary" onClick={() => handleDelete(t.id, t.name)} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none' }} title="Delete">
                        <Trash2 size={16} color="var(--error)" />
                      </Button>
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

  const [activeTab, setActiveTab] = useState('typing');

  const tabs = [
    { id: 'typing', label: 'Typing' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'logic-puzzle', label: 'Logic Puzzles' },
    { id: 'map', label: 'Map Spotting' },
    { id: 'crossword', label: 'Crossword' },
    { id: 'practice', label: 'Practice' }
  ];

  const now = new Date();
  const activeCount = tournaments.filter(t => new Date(t.startTime) <= now && new Date(t.endTime) >= now).length;
  const upcomingCount = tournaments.filter(t => new Date(t.startTime) > now).length;

  return (
    <div className="container" style={{ maxWidth: '1100px', paddingBottom: '4rem' }}>
      <style>{`
        .admin-tab {
          padding: 0.75rem 1.5rem;
          color: var(--text-secondary);
          border: none;
          background: transparent;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .admin-tab:hover {
          color: var(--text-primary);
        }
        .admin-tab.active {
          color: var(--accent-primary);
          border-bottom: 2px solid var(--accent-primary);
        }
        .tournament-row {
          transition: background 0.2s;
        }
        .tournament-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        @media (max-width: 768px) {
          .admin-header-flex {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .admin-stats-flex {
            width: 100%;
            justify-content: space-between;
            margin-top: 1rem;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Settings className="text-gradient" size={40} /> Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage tournaments and view leaderboards.</p>
        </div>
        <Button onClick={() => navigate('/admin/tournament/create')}>
          <Plus size={18} /> New Tournament
        </Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', overflowX: 'auto', paddingBottom: '2px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'typing' && renderTournamentSection('typing', <Keyboard size={24} />, 'Typing Tournaments')}
      {activeTab === 'quiz' && renderTournamentSection('quiz', <Calendar size={24} />, 'Quiz Tournaments')}
      {activeTab === 'logic-puzzle' && renderTournamentSection(['logic-puzzle', 'nonogram', 'shikaku'], <Square size={24} />, 'Logic Puzzle Tournaments')}
      {activeTab === 'map' && renderTournamentSection('map', <MapPin size={24} />, 'Map Spotting Tournaments')}
      {activeTab === 'crossword' && renderTournamentSection('crossword', <Hash size={24} />, 'Crossword Tournaments')}

      {activeTab === 'practice' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <Keyboard color="var(--text-secondary)" size={20} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Practice Leaderboards</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {practiceModes.map(m => (
              <Card key={m.id} hoverEffect={true} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>{m.name}</h3>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', lineHeight: '1.4' }}>{m.desc}</p>
                </div>
                <Button onClick={() => navigate(`/leaderboard/${m.id}`)} style={{ width: '100%', marginTop: '1.5rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: '600' }}>
                  <Users size={16} /> View Standings
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
