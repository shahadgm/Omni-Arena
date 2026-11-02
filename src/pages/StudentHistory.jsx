import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService, authService } from '../services/db';
import { Clock, ArrowLeft, Trophy, UserPlus, LogIn } from 'lucide-react';

const StudentHistory = () => {
  const isGuest = authService.isGuest();
  const [history, setHistory] = useState([]);
  const [tournamentsMap, setTournamentsMap] = useState({});
  const [loading, setLoading] = useState(!isGuest);
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  const currentUser = authService.getCurrentUser();
  const displayName = currentUser?.displayName || 'Contestant';

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }

    if (isGuest) {
      return;
    }

    const fetchHistory = async () => {
      try {
        const [data, tournaments] = await Promise.all([
          dbService.getStudentHistory(studentId),
          dbService.getTournaments()
        ]);
        const map = {};
        tournaments.forEach(t => { 
          map[t.id] = {
            name: t.name,
            gameType: t.gameType || 'typing'
          }; 
        });
        setTournamentsMap(map);
        setHistory(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate, studentId, isGuest]);

  const getFormatLabel = (entry) => {
    const tInfo = tournamentsMap[entry.competitionId];
    if (tInfo?.gameType) {
      const type = tInfo.gameType;
      if (type === 'typing') return 'Typing';
      if (type === 'quiz') return 'Quiz';
      if (type === 'logic-puzzle') return 'Logic Puzzle';
      if (type === 'crossword') return 'Crossword';
      if (type === 'map') return 'Map Spotting';
      return type;
    }
    if (entry.competitionId.startsWith('practice-')) {
      const pName = entry.competitionId.replace('practice-', '');
      return `${pName.charAt(0).toUpperCase() + pName.slice(1)} Practice`;
    }
    if (entry.wpm !== undefined) return 'Typing';
    if (entry.puzzlesSolved !== undefined) return 'Logic Puzzle';
    if (entry.wordsFound !== undefined) return 'Crossword';
    return 'Competition';
  };

  const getTournamentTitle = (entry) => {
    const tInfo = tournamentsMap[entry.competitionId];
    if (tInfo?.name) return tInfo.name;
    if (entry.competitionId.startsWith('practice-')) {
      const pName = entry.competitionId.replace('practice-', '').replace(/-[0-9]+m$/, '');
      const drillLabel = entry.drillMinutes ? ` (${entry.drillMinutes}m Drill)` : '';
      return `${pName.charAt(0).toUpperCase() + pName.slice(1)}${drillLabel} Solo Practice`;
    }
    return `Match #${entry.competitionId.slice(0, 6)}`;
  };

  const getScoreDisplay = (entry) => {
    if (entry.abandoned) return { main: '0.0', sub: 'Abandoned', isDanger: true };
    if (entry.displayScore !== undefined) return { main: `${entry.displayScore}`, sub: 'pts' };
    if (entry.score !== undefined && !entry.wpm) return { main: `${entry.score}`, sub: 'pts' };
    if (entry.wpm !== undefined) {
      const net = ((entry.wpm * (entry.accuracy || 0)) / 100).toFixed(1);
      return { main: net, sub: 'Net WPM' };
    }
    return { main: `${entry.score || 0}`, sub: 'pts' };
  };

  if (isGuest) {
    return (
      <div className="container" style={{ maxWidth: '640px', margin: '2rem auto', padding: '1rem' }}>
        <Link 
          to="/dashboard" 
          style={{ 
            color: 'var(--text-secondary)', 
            textDecoration: 'none', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          <ArrowLeft size={16} /> Back to Tournaments
        </Link>

        <Card padding="2.75rem 2rem" style={{ textAlign: 'center', border: '1px solid var(--border)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Clock size={32} style={{ color: 'var(--primary-text)' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
            Tournament History is Saved for Registered Accounts
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '480px', margin: '0 auto 1.75rem' }}>
            You are currently competing as guest contestant <strong>{displayName}</strong>. Your scores are posted to live tournament leaderboards, but persistent history, WPM tracking, and performance analytics are only saved for registered accounts.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              onClick={() => { authService.logout(); navigate('/?tab=account&mode=register'); }} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
            >
              <UserPlus size={16} /> Create Free Account
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => { authService.logout(); navigate('/?tab=account&mode=login'); }} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
            >
              <LogIn size={16} /> Log In
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/dashboard')}
              style={{ fontSize: '0.9rem' }}
            >
              Browse Tournaments
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          to="/dashboard" 
          style={{ 
            color: 'var(--text-secondary)', 
            textDecoration: 'none', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '1rem',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontWeight: '700' }}>
              <Clock style={{ color: 'var(--primary-text)' }} size={32} /> Competition History
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.4rem', marginBottom: 0 }}>
              Performance summary across your tournament matches and practice drills.
            </p>
          </div>
          {history.length > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <Trophy size={16} style={{ color: 'var(--gold)' }} />
              <span><strong>{history.length}</strong> total matches</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <Card style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span>Loading match history...</span>
          </div>
        </Card>
      ) : history.length === 0 ? (
        <Card style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              background: 'var(--surface-2)', 
              border: '1px solid var(--border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--text-secondary)' 
            }}>
              <Clock size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.35rem' }}>No match records yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                Jump into an active tournament or sharpen your skills in the Solo Practice Hub. Your scores will appear here automatically.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/dashboard')} style={{ marginTop: '0.5rem' }}>
              Browse Tournaments
            </Button>
          </div>
        </Card>
      ) : (
        <Card padding="0" style={{ overflow: 'hidden' }}>
          {/* Desktop Table View */}
          <div className="desktop-history-table" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '640px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: '0.825rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Competition / Match</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: '600' }}>Format</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: '600', textAlign: 'right' }}>Score</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Key Metrics</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, idx) => {
                  const score = getScoreDisplay(entry);
                  const isLast = idx === history.length - 1;
                  return (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.95rem' }}>
                          {getTournamentTitle(entry)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                          ID: {entry.competitionId.slice(0, 14)}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          fontSize: '0.775rem',
                          fontWeight: '600',
                          color: 'var(--text-secondary)'
                        }}>
                          {getFormatLabel(entry)}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(entry.date).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          fontVariantNumeric: 'tabular-nums',
                          color: score.isDanger ? 'var(--danger)' : 'var(--primary-text)'
                        }}>
                          {score.main}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>
                          {score.sub}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.75rem', justifyContent: 'flex-end', fontSize: '0.825rem', fontVariantNumeric: 'tabular-nums' }}>
                          {entry.wpm !== undefined && (
                            <span title="Raw WPM">
                              <span style={{ color: 'var(--text-tertiary)' }}>Raw: </span>
                              <strong>{entry.wpm}</strong>
                            </span>
                          )}
                          {entry.accuracy !== undefined && (
                            <span title="Accuracy" style={{ color: 'var(--success)' }}>
                              <strong>{entry.accuracy}%</strong>
                            </span>
                          )}
                          {entry.correctAnswers !== undefined && (
                            <span title="Correct Answers">
                              <span style={{ color: 'var(--text-tertiary)' }}>Correct: </span>
                              <strong>{entry.correctAnswers}</strong>
                            </span>
                          )}
                          {entry.puzzlesSolved !== undefined && (
                            <span title="Puzzles Solved">
                              <span style={{ color: 'var(--text-tertiary)' }}>Solved: </span>
                              <strong>{entry.puzzlesSolved}</strong>
                            </span>
                          )}
                          {entry.progress !== undefined && (
                            <span title="Completion Progress" style={{ color: 'var(--text-secondary)' }}>
                              {entry.progress}%
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentHistory;
