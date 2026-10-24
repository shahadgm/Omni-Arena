import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { dbService, authService } from '../services/db';
import { Trophy, ArrowLeft, Medal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

const LeaderboardPage = () => {
  const { id } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [gameType, setGameType] = useState('typing');
  const [expandedId, setExpandedId] = useState(null);
  const [isHidden, setIsHidden] = useState(false);
  const [retakeInput, setRetakeInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tournament, setTournament] = useState(null);
  
  const isAdmin = authService.isAdmin();
  const currentUser = authService.getCurrentUser();
  const isManager = isAdmin || (tournament && tournament.createdBy && tournament.createdBy.toLowerCase() === (currentUser?.username || '').toLowerCase());

  const handleAllowRetake = async (targetStudentId) => {
    if (!window.confirm(`Are you sure you want to give "${targetStudentId}" another chance? Their current score will be removed from the leaderboard and their attempt lock will be cleared.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await dbService.allowStudentRetake(id, targetStudentId);
      setLeaderboard(prev => prev.filter(e => e.studentId !== targetStudentId));
      alert(`Candidate "${targetStudentId}" can now join this tournament again!`);
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
    // Ensure we are not in fullscreen on the leaderboard
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}

    const fetchLeaderboard = async () => {
      const data = await dbService.getLeaderboard(id);
      setLeaderboard(data);
      
      if (id.startsWith('practice-')) {
        const type = id.replace('practice-', '');
        setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Practice Mode`);
        if (id.startsWith('practice-quiz')) setGameType('quiz');
        else if (id.startsWith('practice-nonogram')) setGameType('nonogram');
        else if (id.startsWith('practice-shikaku')) setGameType('shikaku');
        else if (id.startsWith('practice-map')) setGameType('map');
        else if (id.startsWith('practice-crossword')) setGameType('crossword');
        else setGameType('typing');
      } else {
        const t = await dbService.getTournament(id);
        if (t) {
          setTournament(t);
          setTitle(t.name);
          setGameType(t.gameType || 'typing');
          const isUserCreator = currentUser && t.createdBy && t.createdBy.toLowerCase() === currentUser.username.toLowerCase();
          if (t.hideLeaderboard && !isAdmin && !isUserCreator) {
            setIsHidden(true);
          }
        } else {
          setTitle('Competition');
        }
      }
      setLoading(false);
    };
    
    fetchLeaderboard();
  }, [id, isAdmin]);

  const isPuzzle = gameType === 'nonogram' || gameType === 'shikaku' || gameType === 'logic-puzzle';
  const isCrossword = gameType === 'crossword';
  const isQuiz = gameType === 'quiz';
  const isTyping = gameType === 'typing';
  const isMap = gameType === 'map';

  const handleGrantMarks = async (entryId, questionIndex) => {
    if (!isManager) return;
    
    const entry = leaderboard.find(e => e.id === entryId);
    if (!entry || !entry.quizDetails) return;
    
    const qDetails = [...entry.quizDetails];
    const targetQ = qDetails[questionIndex];
    
    if (targetQ.isCorrect) return; // already correct
    
    if (!window.confirm('Are you sure you want to grant marks for this answer?')) return;
    
    // Update the question
    targetQ.isCorrect = true;
    targetQ.pointsAwarded = targetQ.maxPoints;
    
    // Recalculate totals
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
      // Optimistically update the state
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

  const gridCols = isMap
    ? (isManager ? '80px 1fr 130px 90px 90px 140px' : '80px 1fr 150px 100px 100px 40px')
    : (isQuiz || isCrossword || isPuzzle)
      ? (isManager ? '80px 1fr 90px 90px 90px 90px 140px' : '80px 1fr 100px 100px 100px 100px 40px')
      : (isManager ? '80px 1fr 80px 90px 90px 100px 90px 140px' : '80px 1fr 80px 100px 100px 120px 100px 40px');

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Trophy className="text-gradient" size={40} /> Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>{title}</p>
      </div>

      {isManager && !id.startsWith('practice-') && (
        <Card style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <RotateCcw size={16} color="var(--accent-primary)" /> Candidate Retake Management
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Give any candidate another chance to join this tournament, clearing their attempt lock.
              </p>
            </div>
            <form onSubmit={handleManualRetake} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Student ID / Name..." 
                value={retakeInput}
                onChange={(e) => setRetakeInput(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={actionLoading}
                style={{
                  padding: '0.5rem 0.9rem',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Give Chance
              </button>
            </form>
          </div>
        </Card>
      )}

      {isHidden ? (
        <Card padding="3rem">
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h2 style={{ marginBottom: '1rem' }}>Leaderboard is Hidden</h2>
            <p>The results for this tournament are hidden by the administrator.</p>
          </div>
        </Card>
      ) : (
        <Card padding="0">
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: gridCols, fontWeight: '600', color: 'var(--text-secondary)' }}>
            <div>Rank</div>
            <div>Student</div>
            {isMap ? (
              <>
                <div style={{ textAlign: 'center', color: 'var(--accent-primary)' }}>Score</div>
                <div style={{ textAlign: 'center' }}>Time Elapsed</div>
                <div style={{ textAlign: 'center' }}>Accuracy</div>
              </>
            ) : (isQuiz || isCrossword || isPuzzle) ? (
              <>
                <div style={{ textAlign: 'center', color: 'var(--accent-primary)' }}>Score</div>
                <div style={{ textAlign: 'center' }}>{isCrossword || isPuzzle ? 'Time' : 'Correct'}</div>
                <div style={{ textAlign: 'center' }}>Accuracy</div>
                <div style={{ textAlign: 'center' }}>Progress</div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', color: 'var(--accent-primary)' }}>Score</div>
                <div style={{ textAlign: 'center' }}>Net Speed</div>
                <div style={{ textAlign: 'center' }}>Accuracy</div>
                <div style={{ textAlign: 'center' }}>Chars Typed</div>
                <div style={{ textAlign: 'center' }}>Progress</div>
              </>
            )}
            <div style={{ textAlign: 'right' }}>{isManager ? 'Actions' : ''}</div>
          </div>
          
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading scores...</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No scores yet. Be the first to compete!</div>
          ) : (
            <div>
            {leaderboard.map((entry, idx) => (
              <React.Fragment key={entry.id}>
                <div style={{ 
                  padding: '1.5rem', 
                  borderBottom: idx < leaderboard.length - 1 && expandedId !== entry.id ? '1px solid var(--glass-border)' : 'none',
                  display: 'grid', 
                  gridTemplateColumns: gridCols,
                  alignItems: 'center',
                  background: idx === 0 ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent)' : idx === 1 ? 'linear-gradient(90deg, rgba(192, 192, 192, 0.1), transparent)' : idx === 2 ? 'linear-gradient(90deg, rgba(205, 127, 50, 0.1), transparent)' : 'transparent',
                  transition: 'background 0.2s ease',
                  cursor: (entry.sectionDetails || (isManager && (entry.quizDetails || entry.mapDetails))) ? 'pointer' : 'default'
                }}
                onClick={() => { if (entry.sectionDetails || (isManager && (entry.quizDetails || entry.mapDetails))) setExpandedId(expandedId === entry.id ? null : entry.id); }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.background = idx === 0 ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent)' : idx === 1 ? 'linear-gradient(90deg, rgba(192, 192, 192, 0.1), transparent)' : idx === 2 ? 'linear-gradient(90deg, rgba(205, 127, 50, 0.1), transparent)' : 'transparent'; 
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1.25rem', color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--text-primary)', textShadow: idx < 3 ? '0 0 10px currentColor' : 'none' }}>
                    #{idx + 1}
                    {idx < 3 && <Medal size={20} />}
                  </div>
                  <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>{entry.studentId}</div>
                  
                  {isMap ? (
                    <>
                      <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent-primary)', fontSize: '1.25rem' }}>{entry.score}</div>
                      <div style={{ textAlign: 'center', color: 'var(--success)' }}>{entry.timeElapsed}s</div>
                      <div style={{ textAlign: 'center', color: 'var(--accent-secondary)' }}>{entry.accuracy}%</div>
                    </>
                  ) : (isQuiz || isCrossword || isPuzzle) ? (
                    <>
                      <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent-primary)', fontSize: '1.25rem' }}>
                        {isPuzzle
                          ? `${entry.displayScore !== undefined ? entry.displayScore : (entry.score > 100000 ? Math.floor(entry.score / 100000) : entry.score)} pts`
                          : (entry.displayScore !== undefined ? entry.displayScore : entry.score)}
                      </div>
                      <div style={{ textAlign: 'center', fontWeight: '500', fontSize: '1.1rem' }}>
                        {isCrossword || isPuzzle ? `${entry.timeElapsed}s` : `${entry.correctAnswers}/${entry.totalQuestions}`}
                      </div>
                      <div style={{ textAlign: 'center', color: 'var(--success)' }}>{entry.accuracy}%</div>
                      <div style={{ textAlign: 'center', color: 'var(--accent-secondary)' }}>{entry.progress || 0}%</div>
                    </>
                  ) : (
                    <>
                      <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent-primary)', fontSize: '1.25rem' }}>{entry.score ? Number(entry.score).toFixed(2) : ((entry.wpm * entry.accuracy) / 100).toFixed(2)}</div>
                      <div style={{ textAlign: 'center', fontWeight: '500', fontSize: '1.1rem' }}>{entry.wpm}</div>
                      <div style={{ textAlign: 'center', color: 'var(--success)' }}>{entry.accuracy}%</div>
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{entry.charsTyped || 0}</div>
                      <div style={{ textAlign: 'center', color: 'var(--accent-secondary)' }}>{entry.progress || 0}%</div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--text-tertiary)', alignItems: 'center', gap: '0.5rem' }}>
                    {isManager && !id.startsWith('practice-') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAllowRetake(entry.studentId);
                        }}
                        disabled={actionLoading}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}
                        title={`Give ${entry.studentId} another chance to play`}
                      >
                        <RotateCcw size={12} /> Retake
                      </button>
                    )}
                    {(entry.sectionDetails || (isManager && (entry.quizDetails || entry.mapDetails))) && (expandedId === entry.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
                  </div>
                </div>

                {expandedId === entry.id && entry.sectionDetails && (
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--glass-border)' : 'none' 
                  }}>
                    {isQuiz ? (
                      <>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '1rem',
                          padding: '0.5rem 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem'
                        }}>
                          <div>Section</div>
                          <div style={{ textAlign: 'center' }}>Points</div>
                        </div>
                        {entry.sectionDetails.map((sec, i) => (
                          <div key={i} style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '1rem',
                            padding: '0.75rem 0',
                            borderBottom: i < entry.sectionDetails.length - 1 ? '1px dashed rgba(255,255,255,0.05)' : 'none',
                            alignItems: 'center'
                          }}>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{sec.section}</div>
                            <div style={{ textAlign: 'center', fontWeight: '600', color: 'var(--accent-primary)' }}>{sec.score} / {sec.max}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '150px 1fr 1fr 1fr 1fr', 
                          gap: '1rem',
                          padding: '0.5rem 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem'
                        }}>
                          <div>Language</div>
                          <div style={{ textAlign: 'center' }}>Net Speed</div>
                          <div style={{ textAlign: 'center' }}>Accuracy</div>
                          <div style={{ textAlign: 'center' }}>Progress</div>
                          <div style={{ textAlign: 'center' }}>Section Score</div>
                        </div>
                        {entry.sectionDetails.map((sec, i) => (
                          <div key={i} style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '150px 1fr 1fr 1fr 1fr', 
                            gap: '1rem',
                            padding: '0.75rem 0',
                            borderBottom: i < entry.sectionDetails.length - 1 ? '1px dashed rgba(255,255,255,0.05)' : 'none',
                            alignItems: 'center'
                          }}>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{sec.language}</div>
                            <div style={{ textAlign: 'center' }}>{sec.wpm}</div>
                            <div style={{ textAlign: 'center', color: 'var(--success)' }}>{sec.accuracy}%</div>
                            <div style={{ textAlign: 'center', color: 'var(--accent-secondary)' }}>{sec.progress}%</div>
                            <div style={{ textAlign: 'center', fontWeight: '600', color: 'var(--accent-primary)' }}>{sec.score ? Number(sec.score).toFixed(2) : 0}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {expandedId === entry.id && isManager && entry.quizDetails && (
                  <div style={{ 
                    padding: '1.5rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--glass-border)' : 'none' 
                  }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Contestant's Answers</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {entry.quizDetails.map((q, i) => (
                        <div key={i} style={{ 
                          padding: '1rem',
                          background: 'rgba(255,255,255,0.02)',
                          borderLeft: `3px solid ${q.isCorrect ? 'var(--success)' : 'var(--error)'}`,
                          borderRadius: '0 8px 8px 0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div>
                              {q.section && <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>{q.section}</div>}
                              <div style={{ fontWeight: '600' }}>Q{i+1}: {q.question}</div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: q.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                              {q.pointsAwarded} / {q.maxPoints} pts
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)' }}>User Answer: </span>
                              <span style={{ color: q.isCorrect ? 'var(--success)' : 'var(--error)' }}>{q.userAnswer}</span>
                            </div>
                            {!q.isCorrect && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ color: 'var(--text-tertiary)' }}>Correct Answer: </span>
                                  <span style={{ color: 'var(--success)' }}>{q.correctAnswer}</span>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleGrantMarks(entry.id, i); }}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.75rem',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    color: 'var(--success)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                  }}
                                  onMouseOver={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.2)'}
                                  onMouseOut={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.1)'}
                                >
                                  Override Marks
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {expandedId === entry.id && isManager && entry.mapDetails && (
                  <div style={{ 
                    padding: '1.5rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--glass-border)' : 'none' 
                  }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Contestant's Map Spottings</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {entry.mapDetails.map((loc, i) => (
                        <div key={i} style={{ 
                          padding: '1rem',
                          background: 'rgba(255,255,255,0.02)',
                          borderLeft: `3px solid ${loc.isCorrect ? 'var(--success)' : 'var(--error)'}`,
                          borderRadius: '0 8px 8px 0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ fontWeight: '600' }}>{loc.prompt}</div>
                          <div style={{ fontSize: '0.9rem', color: loc.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                            {loc.isCorrect ? 'Found' : 'Missed'} ({Math.round(loc.distanceKm)} km away)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        </Card>
      )}
    </div>
  );
};

export default LeaderboardPage;
