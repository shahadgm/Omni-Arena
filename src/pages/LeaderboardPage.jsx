import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { dbService, authService } from '../services/db';
import { Trophy, ArrowLeft, RotateCcw, Search, Award, Eye, EyeOff, Lock, Crown } from 'lucide-react';

const LeaderboardPage = () => {
  const { id } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [gameType, setGameType] = useState('typing');
  const [expandedId, setExpandedId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [retakeInput, setRetakeInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'manage'
  
  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const isAdmin = authService.isAdmin();
  const currentUser = authService.getCurrentUser();
  const isGuest = authService.isGuest();
  const myStudentId = (currentUser?.username || localStorage.getItem('studentId') || '').toLowerCase();
  const isRegisteredCreator = !isGuest && currentUser?.username && typeof tournament?.createdBy === 'string' && !tournament.createdBy.startsWith('guest:') && tournament.createdBy.toLowerCase() === currentUser.username.toLowerCase();
  const isManager = isAdmin || isRegisteredCreator;
  
  // Dynamic hidden state: Only hidden from candidates if hideLeaderboard is true AND user is NOT a manager/host
  const isHidden = !!tournament?.hideLeaderboard && !isManager;

  const handleToggleHideLeaderboard = async () => {
    if (!tournament || !isManager) return;
    const newHide = !tournament.hideLeaderboard;
    const msg = newHide 
      ? "Hide leaderboard from candidates? Candidates will see 'Leaderboard is Hidden' until results are published."
      : "Make leaderboard public to all candidates now?";
    if (!window.confirm(msg)) return;

    try {
      await dbService.updateTournament(id, { hideLeaderboard: newHide });
      setTournament(prev => ({ ...prev, hideLeaderboard: newHide }));
    } catch (err) {
      alert("Error updating leaderboard visibility: " + err.message);
    }
  };

  const handleToggleShowQuizAnswers = async () => {
    if (!tournament || !isManager) return;
    const newShow = !tournament.showQuizAnswers;
    const msg = newShow 
      ? "Reveal correct quiz answers to contestants? Contestants will be able to see the full answer key upon submitting and on the leaderboard."
      : "Hide correct quiz answers from contestants? Contestants will only see their points, with answer keys hidden.";
    if (!window.confirm(msg)) return;

    try {
      await dbService.updateTournament(id, { showQuizAnswers: newShow });
      setTournament(prev => ({ ...prev, showQuizAnswers: newShow }));
    } catch (err) {
      alert("Error updating quiz answer visibility: " + err.message);
    }
  };

  const handleAllowRetake = async (targetStudentId) => {
    let resolvedId = targetStudentId;
    const match = leaderboard.find(e => 
      e.studentId.toLowerCase() === targetStudentId.toLowerCase() ||
      e.studentId.toLowerCase() === `guest:${targetStudentId.toLowerCase()}` ||
      (e.displayName && e.displayName.toLowerCase() === targetStudentId.toLowerCase())
    );
    if (match) {
      resolvedId = match.studentId;
    }

    const plainTarget = resolvedId.replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '');
    if (!window.confirm(`Are you sure you want to give "${plainTarget}" another chance? Their attempt lock will be cleared.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await dbService.allowStudentRetake(id, resolvedId);
      setLeaderboard(prev => prev.filter(e => e.studentId !== resolvedId));
      alert(`Candidate "${plainTarget}" can now join this tournament again!`);
    } catch (err) {
      alert("Error resetting attempt: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualRetake = async (e) => {
    e.preventDefault();
    const targetId = retakeInput.trim();
    if (!targetId) return;
    await handleAllowRetake(targetId);
    setRetakeInput('');
  };

  useEffect(() => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}

    const fetchLeaderboard = async () => {
      setLoading(true);
      const data = await dbService.getLeaderboard(id);
      setLeaderboard(data);
      
      if (id.startsWith('practice-')) {
        const type = id.replace('practice-', '');
        setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Practice Mode`);
        if (id.startsWith('practice-quiz')) setGameType('quiz');
        else if (id.startsWith('practice-nonogram')) setGameType('nonogram');
        else if (id.startsWith('practice-shikaku')) setGameType('shikaku');
        else if (id.startsWith('practice-sudoku')) setGameType('sudoku');
        else if (id.startsWith('practice-map')) setGameType('map');
        else if (id.startsWith('practice-crossword')) setGameType('crossword');
        else setGameType('typing');
      } else {
        const t = await dbService.getTournament(id);
        if (t) {
          setTournament(t);
          setTitle(t.name);
          setGameType(t.gameType || 'typing');
        } else {
          setNotFound(true);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    };
    
    fetchLeaderboard();
  }, [id, isAdmin]);

  const isPuzzle = gameType === 'nonogram' || gameType === 'shikaku' || gameType === 'sudoku' || gameType === 'logic-puzzle';
  const isCrossword = gameType === 'crossword';
  const isQuiz = gameType === 'quiz';
  const isMap = gameType === 'map';

  const handleGrantMarks = async (entryId, questionIndex) => {
    if (!isManager) return;
    
    const entry = leaderboard.find(e => e.id === entryId);
    if (!entry || !entry.quizDetails) return;
    
    const qDetails = [...entry.quizDetails];
    const targetQ = qDetails[questionIndex];
    if (targetQ.isCorrect) return;
    
    if (!window.confirm('Are you sure you want to grant marks for this answer?')) return;
    
    targetQ.isCorrect = true;
    targetQ.pointsAwarded = targetQ.maxPoints;
    
    const newCorrectAnswers = qDetails.filter(q => q.isCorrect).length;
    const newScore = qDetails.reduce((sum, q) => sum + (q.pointsAwarded || 0), 0);
    const totalQuestions = entry.totalQuestions || qDetails.length;
    const newAccuracy = Math.round((newCorrectAnswers / totalQuestions) * 100);
    
    const updatedFields = {
      quizDetails: qDetails,
      correctAnswers: newCorrectAnswers,
      score: newScore,
      accuracy: newAccuracy
    };
    
    try {
      await dbService.updateResult(entryId, updatedFields);
      setLeaderboard(prev => {
        const newBoard = prev.map(e => e.id === entryId ? { ...e, ...updatedFields } : e);
        return newBoard.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
          if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
          return 0;
        });
      });
      alert('Marks granted successfully.');
    } catch (error) {
      alert('Error updating marks: ' + error.message);
    }
  };

  // Filtered and Paginated Leaderboard
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase().trim();
    return leaderboard.filter(e => 
      (e.displayName && e.displayName.toLowerCase().includes(q)) ||
      (e.studentId && e.studentId.toLowerCase().includes(q))
    );
  }, [leaderboard, searchQuery]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const myRankIndex = useMemo(() => {
    if (!myStudentId) return -1;
    return leaderboard.findIndex(e => e.studentId.toLowerCase() === myStudentId);
  }, [leaderboard, myStudentId]);

  const top3 = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  const gridCols = isMap
    ? (isManager ? '60px 1fr 110px 90px 90px 110px' : '60px 1fr 120px 100px 90px')
    : (isQuiz || isCrossword || isPuzzle)
      ? (isManager ? '60px 1fr 90px 90px 80px 80px 110px' : '60px 1fr 100px 90px 90px 80px')
      : (isManager ? '60px 1fr 80px 80px 80px 90px 80px 110px' : '60px 1fr 90px 90px 90px 100px 80px');

  if (notFound) {
    return (
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center', paddingTop: '4rem' }}>
        <Card padding="2.5rem">
          <Trophy size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Tournament Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            The requested tournament does not exist or may have been deleted.
          </p>
          <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} style={{ textDecoration: 'none' }}>
            <Button variant="secondary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Return to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '960px', paddingBottom: '4rem' }}>
      
      {/* Header Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.65rem', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-text)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              {(gameType || 'competition').toUpperCase()} • {isHidden ? 'RESULTS HIDDEN' : `${leaderboard.length} CANDIDATES`}
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
              <Trophy size={32} color="var(--primary)" /> {title || 'Tournament Standings'}
            </h1>
          </div>

          {/* User's Current Rank Chip */}
          {!isHidden && myRankIndex !== -1 && (
            <div style={{ 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: '10px', 
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Award size={24} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>Your Standing</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Rank #{myRankIndex + 1} <span style={{ fontSize: '0.85rem', color: 'var(--primary-text)', fontWeight: '600' }}>({leaderboard[myRankIndex].score} pts)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!id.startsWith('practice-') && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('standings')}
              style={{
                padding: '0.5rem 1rem',
                background: activeTab === 'standings' ? 'var(--surface-2)' : 'transparent',
                border: '1px solid ' + (activeTab === 'standings' ? 'var(--border)' : 'transparent'),
                borderRadius: '8px',
                color: activeTab === 'standings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🏆 Leaderboard Standings
            </button>
            {isManager && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: activeTab === 'manage' ? 'var(--surface-2)' : 'transparent',
                    border: '1px solid ' + (activeTab === 'manage' ? 'var(--border)' : 'transparent'),
                    borderRadius: '8px',
                    color: activeTab === 'manage' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <RotateCcw size={15} /> Candidate Retake Management
                </button>

                <button
                  type="button"
                  onClick={handleToggleHideLeaderboard}
                  style={{
                    padding: '0.5rem 0.85rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: tournament?.hideLeaderboard ? '#eab308' : 'var(--text-secondary)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  title={tournament?.hideLeaderboard ? "Publish leaderboard to candidates" : "Hide leaderboard from candidates"}
                >
                  {tournament?.hideLeaderboard ? <><Eye size={14} /> Publish Standings</> : <><EyeOff size={14} /> Hide Standings</>}
                </button>

                {tournament?.gameType === 'quiz' && (
                  <button
                    type="button"
                    onClick={handleToggleShowQuizAnswers}
                    style={{
                      padding: '0.5rem 0.85rem',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: tournament?.showQuizAnswers ? 'var(--success)' : '#eab308',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                    title={tournament?.showQuizAnswers ? "Hide answer key from contestants" : "Reveal answer key to contestants"}
                  >
                    {tournament?.showQuizAnswers ? <><Eye size={14} /> Answers Revealed</> : <><EyeOff size={14} /> Answers Hidden</>}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MANAGER TAB CONTENT */}
      {activeTab === 'manage' && isManager && !id.startsWith('practice-') && (
        <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>
            Give Candidate Another Chance
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Clear any participant's attempt lock so they can re-enter this tournament and record a new score.
          </p>

          <form onSubmit={handleManualRetake} style={{ display: 'flex', gap: '0.75rem', maxWidth: '450px' }}>
            <Input 
              placeholder="Candidate Name or Admission No..."
              value={retakeInput}
              onChange={(e) => setRetakeInput(e.target.value)}
              style={{ fontSize: '0.9rem', padding: '0.65rem 0.85rem' }}
            />
            <Button type="submit" disabled={actionLoading} style={{ whiteSpace: 'nowrap', padding: '0.65rem 1.1rem' }}>
              Grant Retake
            </Button>
          </form>
        </Card>
      )}

      {/* QUIZ CONTROLS FOR MANAGERS */}
      {activeTab === 'manage' && isManager && tournament?.gameType === 'quiz' && !id.startsWith('practice-') && (
        <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} color="var(--primary-text)" /> Contestant Quiz Answer Key
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '540px', lineHeight: '1.5' }}>
                Control whether contestants can see the correct answers after completing their quiz attempt and on the leaderboard.
              </p>
            </div>
            <Button 
              type="button" 
              onClick={handleToggleShowQuizAnswers}
              variant={tournament?.showQuizAnswers ? "secondary" : "primary"}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {tournament?.showQuizAnswers ? (
                <><EyeOff size={16} /> Hide Answers from Contestants</>
              ) : (
                <><Eye size={16} /> Reveal Answers to Contestants</>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* STANDINGS TAB */}
      {activeTab === 'standings' && (
        <>
          {isHidden ? (
            <Card padding="3rem">
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <EyeOff size={28} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Leaderboard is Hidden</h2>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                  The results and candidate rankings for this tournament have been hidden by the organizer until grading is completed.
                </p>
              </div>
            </Card>
          ) : (
            <div>
              {/* Host Visibility Notice Banner */}
              {tournament?.hideLeaderboard && isManager && (
                <div style={{
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#eab308', fontSize: '0.875rem', fontWeight: '600' }}>
                    <EyeOff size={18} />
                    <span>Leaderboard is hidden from candidates (visible only to you as Host)</span>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={handleToggleHideLeaderboard}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={14} /> Make Public Now
                  </Button>
                </div>
              )}
              {/* Top 3 Podium Cards (when 3+ participants exist and no search filter) */}
              {top3.length >= 3 && !searchQuery && currentPage === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                  {/* 1st Place */}
                  <div style={{ 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)', 
                    borderTop: '4px solid var(--gold)',
                    borderRadius: '12px', 
                    padding: '1.5rem 1.25rem',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px -6px var(--gold-glow)'
                  }}>
                    <div style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '50%', 
                      background: 'var(--gold-glow)', 
                      border: '1.5px solid var(--gold)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 0.65rem' 
                    }}>
                      <Crown size={22} color="var(--gold)" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--gold)', letterSpacing: '0.06em' }}>1ST PLACE</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)' }}>
                      {(top3[0].displayName || top3[0].studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--gold)' }} className="tabular-nums font-mono-numbers">
                      {top3[0].displayScore !== undefined ? top3[0].displayScore : top3[0].score} pts
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Accuracy: {top3[0].accuracy}%
                    </div>
                  </div>

                  {/* 2nd Place */}
                  <div style={{ 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)', 
                    borderTop: '4px solid var(--silver)',
                    borderRadius: '12px', 
                    padding: '1.5rem 1.25rem',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px -6px var(--silver-glow)'
                  }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '50%', 
                      background: 'var(--silver-glow)', 
                      border: '1.5px solid var(--silver)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 0.65rem' 
                    }}>
                      <Award size={22} color="var(--silver)" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--silver)', letterSpacing: '0.06em' }}>2ND PLACE</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)' }}>
                      {(top3[1].displayName || top3[1].studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--silver)' }} className="tabular-nums font-mono-numbers">
                      {top3[1].displayScore !== undefined ? top3[1].displayScore : top3[1].score} pts
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Accuracy: {top3[1].accuracy}%
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div style={{ 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)', 
                    borderTop: '4px solid var(--bronze)',
                    borderRadius: '12px', 
                    padding: '1.5rem 1.25rem',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px -6px var(--bronze-glow)'
                  }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '50%', 
                      background: 'var(--bronze-glow)', 
                      border: '1.5px solid var(--bronze)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 0.65rem' 
                    }}>
                      <Award size={22} color="var(--bronze)" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--bronze)', letterSpacing: '0.06em' }}>3RD PLACE</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)' }}>
                      {(top3[2].displayName || top3[2].studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--bronze)' }} className="tabular-nums font-mono-numbers">
                      {top3[2].displayScore !== undefined ? top3[2].displayScore : top3[2].score} pts
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Accuracy: {top3[2].accuracy}%
                    </div>
                  </div>
                </div>
              )}

              {/* Table Card with Search & Pagination */}
              <Card padding="0">
                {/* Search Bar Bar */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <Input 
                      placeholder="Search participant name or ID..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      style={{ paddingLeft: '2.25rem', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Showing {paginated.length} of {filtered.length} entries
                  </div>
                </div>

                {/* Scrollable Viewport for Mobile & Desktop */}
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ minWidth: isManager ? '740px' : '580px' }}>
                    {/* Table Header */}
                <div style={{ 
                  padding: '0.85rem 1.25rem', 
                  borderBottom: '1px solid var(--border)', 
                  display: 'grid', 
                  gridTemplateColumns: gridCols, 
                  fontWeight: '600', 
                  fontSize: '0.8rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  background: 'var(--surface-2)'
                }}>
                  <div>Rank</div>
                  <div>Candidate</div>
                  {isMap ? (
                    <>
                      <div style={{ textAlign: 'center' }}>Score</div>
                      <div style={{ textAlign: 'center' }}>Time</div>
                      <div style={{ textAlign: 'center' }}>Accuracy</div>
                    </>
                  ) : (isQuiz || isCrossword || isPuzzle) ? (
                    <>
                      <div style={{ textAlign: 'center' }}>Score</div>
                      <div style={{ textAlign: 'center' }}>{isCrossword || isPuzzle ? 'Time' : 'Correct'}</div>
                      <div style={{ textAlign: 'center' }}>Accuracy</div>
                      <div style={{ textAlign: 'center' }}>Progress</div>
                    </>
                  ) : (
                    <>
                      <div style={{ textAlign: 'center' }}>Score</div>
                      <div style={{ textAlign: 'center' }}>WPM</div>
                      <div style={{ textAlign: 'center' }}>Accuracy</div>
                      <div style={{ textAlign: 'center' }}>Chars</div>
                      <div style={{ textAlign: 'center' }}>Progress</div>
                    </>
                  )}
                  {isManager && <div style={{ textAlign: 'right' }}>Actions</div>}
                </div>

                {/* Table Body */}
                {loading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading leaderboard scores...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {searchQuery ? `No candidates found matching "${searchQuery}".` : 'No scores recorded yet. Be the first to compete!'}
                  </div>
                ) : (
                  <div>
                    {paginated.map((entry, idx) => {
                      const absoluteRank = (currentPage - 1) * pageSize + idx + 1;
                      const isMyRow = myStudentId && entry.studentId.toLowerCase() === myStudentId;
                      const canExpand = Boolean(
                        entry.sectionDetails || 
                        (isManager && (entry.quizDetails || entry.mapDetails)) || 
                        (tournament?.showQuizAnswers && isMyRow && entry.quizDetails)
                      );

                      return (
                        <React.Fragment key={entry.id}>
                          <div 
                            style={{ 
                              padding: '0.9rem 1.25rem', 
                              borderBottom: idx < paginated.length - 1 && expandedId !== entry.id ? '1px solid var(--border)' : 'none',
                              display: 'grid', 
                              gridTemplateColumns: gridCols,
                              alignItems: 'center',
                              background: isMyRow ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                              borderLeft: isMyRow ? '4px solid var(--primary)' : '4px solid transparent',
                              transition: 'background-color 0.15s ease',
                              cursor: canExpand ? 'pointer' : 'default',
                              fontSize: '0.95rem'
                            }}
                            onClick={() => {
                              if (canExpand) {
                                setExpandedId(expandedId === entry.id ? null : entry.id);
                              }
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-2)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = isMyRow ? 'rgba(79, 70, 229, 0.08)' : 'transparent'; }}
                          >
                            <div style={{ 
                              fontWeight: '700', 
                              fontSize: '0.95rem',
                              color: absoluteRank === 1 ? 'var(--gold)' : absoluteRank === 2 ? 'var(--silver)' : absoluteRank === 3 ? 'var(--bronze)' : 'var(--text-secondary)'
                            }} className="tabular-nums">
                              #{absoluteRank}
                            </div>

                            <div style={{ fontWeight: isMyRow ? '700' : '500', color: 'var(--text-primary)' }}>
                              {(entry.displayName || entry.studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                              {entry.displayName && entry.studentId && !entry.studentId.startsWith('guest:') && entry.displayName !== entry.studentId && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '0.35rem' }}>
                                  (@{entry.studentId})
                                </span>
                              )}
                              {isMyRow && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'var(--primary)', color: 'white', fontWeight: '700' }}>
                                  YOU
                                </span>
                              )}
                              {isMyRow && isQuiz && tournament?.showQuizAnswers && entry.quizDetails && (
                                <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: '600' }}>
                                  View answers
                                </span>
                              )}
                            </div>

                            {/* Format-Specific Columns */}
                            {isMap ? (
                              <>
                                <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)' }} className="tabular-nums">{entry.score}</div>
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums">{entry.timeElapsed}s</div>
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums">{entry.accuracy}%</div>
                              </>
                            ) : (isQuiz || isCrossword || isPuzzle) ? (
                              <>
                                <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)' }} className="tabular-nums">
                                  {isPuzzle
                                    ? `${entry.displayScore !== undefined ? entry.displayScore : (entry.score > 100000 ? Math.floor(entry.score / 100000) : entry.score)} pts`
                                    : (entry.displayScore !== undefined ? entry.displayScore : entry.score)}
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums">
                                  {isCrossword || isPuzzle ? `${entry.timeElapsed}s` : `${entry.correctAnswers}/${entry.totalQuestions}`}
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums">{entry.accuracy}%</div>
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums">{entry.progress || 0}%</div>
                              </>
                            ) : (
                              <>
                                <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)' }} className="tabular-nums">
                                  {entry.score ? Number(entry.score).toFixed(1) : ((entry.wpm * entry.accuracy) / 100).toFixed(1)}
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums">{entry.wpm}</div>
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums">{entry.accuracy}%</div>
                                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }} className="tabular-nums">{entry.charsTyped || 0}</div>
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums">{entry.progress || 0}%</div>
                              </>
                            )}

                            {/* Manager Actions */}
                            {isManager && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                {!id.startsWith('practice-') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAllowRetake(entry.studentId);
                                    }}
                                    disabled={actionLoading}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: 'var(--danger)',
                                      border: '1px solid rgba(239, 68, 68, 0.25)',
                                      padding: '0.3rem 0.6rem',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                    title="Reset attempt"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Expanded Detail Rows */}
                          {expandedId === entry.id && (
                            <div style={{ padding: '1.25rem', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                              {/* Typing Sections */}
                              {entry.sectionDetails && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                  {entry.sectionDetails.map((sec, sIdx) => (
                                    <div key={sIdx} style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{sec.language || `Part ${sIdx + 1}`}</div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                        Speed: <strong>{sec.wpm} WPM</strong> • Acc: <strong>{sec.accuracy}%</strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Quiz Breakdown: Managers can inspect all, contestants can inspect their own if showQuizAnswers is true */}
                              {entry.quizDetails && (isManager || (tournament?.showQuizAnswers && isMyRow)) && (
                                <div>
                                  <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                    {isManager ? 'Question-by-Question Grading:' : 'Your Quiz Answers & Review:'}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {entry.quizDetails.map((qd, qIdx) => (
                                      <div key={qIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.85rem', flex: 1 }}>
                                          <strong>Q{qIdx + 1}:</strong> {qd.question}
                                          <div style={{ color: qd.isCorrect ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                                            Answer: "{qd.userAnswer}" {qd.isCorrect ? '✓ Correct' : `✗ (Expected: "${qd.correctAnswer}")`}
                                          </div>
                                        </div>
                                        {isManager && !qd.isCorrect && (
                                          <Button onClick={() => handleGrantMarks(entry.id, qIdx)} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                                            Grant Mark
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button 
                      variant="secondary"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                    >
                      ← Previous
                    </Button>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button 
                      variant="secondary"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                    >
                      Next →
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;
