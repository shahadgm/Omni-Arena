import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService, authService } from '../services/db';
import CompetitionArena from './CompetitionArena';
import QuizArena from './QuizArena';
import MultiPuzzleArena from './MultiPuzzleArena';
import MapArena from './MapArena';
import CrosswordArena from './CrosswordArena';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Lock, Key, AlertCircle } from 'lucide-react';

const ArenaRouter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gameType, setGameType] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [tournamentName, setTournamentName] = useState('Tournament');
  const [tournamentObj, setTournamentObj] = useState(null);
  const [isCodeLocked, setIsCodeLocked] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  });
  
  const studentId = localStorage.getItem('studentId');
  const antiCheatKey = `started_${id}_${studentId}`;

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      setIsFullscreen(isFs);
    };
    
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(event => document.addEventListener(event, handleFullscreenChange));
    
    // Set initial state
    handleFullscreenChange();
    
    return () => {
      events.forEach(event => document.removeEventListener(event, handleFullscreenChange));
    };
  }, []);

  useEffect(() => {
    const fetchTournament = async () => {
      if (id.startsWith('practice-')) {
        setTournamentName('Practice Mode');
        if (id.startsWith('practice-quiz')) setGameType('quiz');
        else if (id.startsWith('practice-nonogram')) setGameType('nonogram');
        else if (id.startsWith('practice-shikaku')) setGameType('shikaku');
        else if (id.startsWith('practice-map')) setGameType('map');
        else if (id.startsWith('practice-crossword')) setGameType('crossword');
        else setGameType('typing');
        return;
      }
      
      const t = await dbService.getTournament(id);
      if (t) {
        setTournamentObj(t);
        setGameType(t.gameType || 'typing');
        setTournamentName(t.name);

        if (t.isPrivate) {
          const currentUser = authService.getCurrentUser();
          const isCreator = currentUser && t.createdBy === currentUser.username;
          const isAdmin = authService.isAdmin();
          const isUnlocked = sessionStorage.getItem(`unlocked_${id}`) === 'true';

          if (!isCreator && !isAdmin && !isUnlocked) {
            setIsCodeLocked(true);
            return;
          }
        }
      } else {
        navigate('/dashboard');
        return;
      }

      if (studentId && !id.startsWith('practice-')) {
        const isRetakeAllowed = t.allowedRetakes && Array.isArray(t.allowedRetakes) && t.allowedRetakes.includes(studentId);
        
        if (isRetakeAllowed) {
          // Admin granted candidate another chance: clear local lockout and consume authorization
          localStorage.removeItem(antiCheatKey);
          await dbService.consumeRetake(id, studentId);
        } else {
          const participated = await dbService.hasParticipated(id, studentId);
          if (participated) {
            alert('You have already participated in this tournament! You can only play once.');
            navigate(`/leaderboard/${id}`);
            return;
          }
          
          if (localStorage.getItem(antiCheatKey)) {
            alert('You left the tournament before finishing. Your attempt is void and has been submitted with a score of 0.');
            // Auto-submit 0 score so hasParticipated becomes true for future
            await dbService.saveResult(id, {
              studentId,
              score: 0,
              displayScore: 0,
              accuracy: 0,
              progress: 0,
              abandoned: true,
              timestamp: new Date().toISOString()
            });
            navigate(`/leaderboard/${id}`);
            return;
          }
        }
      }
    };
    fetchTournament();
  }, [id, navigate, studentId, antiCheatKey]);
  
  const handleUnlockCode = (e) => {
    e.preventDefault();
    if (!tournamentObj?.accessCode) {
      setIsCodeLocked(false);
      return;
    }
    if (accessCodeInput.trim().toUpperCase() === tournamentObj.accessCode.trim().toUpperCase()) {
      sessionStorage.setItem(`unlocked_${id}`, 'true');
      setIsCodeLocked(false);
      setAccessCodeError('');
    } else {
      setAccessCodeError('Incorrect tournament code. Please check and try again.');
    }
  };

  const handleStart = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed", err);
    }
    
    if (studentId && !id.startsWith('practice-')) {
      // Mark as started ONLY when they actually click start
      localStorage.setItem(antiCheatKey, 'true');
    }
    setHasStarted(true);
  };

  if (isCodeLocked) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Card style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', marginBottom: '1.25rem' }}>
            <Lock size={32} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Private Tournament</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            <strong>{tournamentName}</strong> is private. Please enter the tournament code to proceed.
          </p>

          <form onSubmit={handleUnlockCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input 
              placeholder="ENTER TOURNAMENT CODE"
              value={accessCodeInput}
              onChange={e => { setAccessCodeInput(e.target.value.toUpperCase()); setAccessCodeError(''); }}
              style={{ fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' }}
              error={accessCodeError}
              autoFocus
              required
            />
            <Button type="submit" style={{ width: '100%', padding: '0.85rem', fontSize: '1.1rem' }}>
              Unlock Tournament
            </Button>
            <button 
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', marginTop: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to Dashboard
            </button>
          </form>
        </Card>
      </div>
    );
  }

  if (!gameType) return <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>Loading...</div>;
  
  if (!hasStarted) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Card style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Ready to begin?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            You are about to enter <strong>{tournamentName}</strong>.
            <br/><br/>
            <strong>Important:</strong> Once you start, you must complete the tournament. Exiting full screen, switching tabs, or leaving the page will automatically submit your score or disqualify you.
          </p>
          <Button onClick={handleStart} style={{ fontSize: '1.25rem', padding: '1rem 2rem', width: '100%' }}>
            Enter Full Screen & Start
          </Button>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', marginTop: '1.5rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cancel and return to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  const renderArena = () => {
    switch(gameType) {
      case 'quiz': return <QuizArena />;
      case 'map': return <MapArena />;
      case 'crossword': return <CrosswordArena />;
      case 'logic-puzzle':
      case 'nonogram': 
      case 'shikaku': return <MultiPuzzleArena />;
      case 'typing':
      default: return <CompetitionArena />;
    }
  };

  return (
    <>
      {!isFullscreen && hasStarted && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'var(--bg-primary)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'var(--error)', fontSize: '2.5rem', marginBottom: '1rem' }}>WARNING!</h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>You have exited Full Screen mode. You must return to Full Screen to continue your test.</p>
          <Button onClick={async () => {
            try {
              const el = document.documentElement;
              if (el.requestFullscreen) {
                await el.requestFullscreen();
              } else if (el.webkitRequestFullscreen) {
                await el.webkitRequestFullscreen();
              } else if (el.msRequestFullscreen) {
                await el.msRequestFullscreen();
              }
            } catch (err) {}
          }} style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}>
            Return to Full Screen
          </Button>
        </div>
      )}
      
      {/* Render the arena but hide it completely if they are not in full screen */}
      <div style={{ display: !isFullscreen && hasStarted ? 'none' : 'flex', width: '100%', flex: 1, flexDirection: 'column' }}>
        {renderArena()}
      </div>
    </>
  );
};

export default ArenaRouter;
