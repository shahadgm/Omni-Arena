import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import CompetitionArena from './CompetitionArena';
import QuizArena from './QuizArena';
import MultiPuzzleArena from './MultiPuzzleArena';
import MapArena from './MapArena';
import CrosswordArena from './CrosswordArena';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ArenaRouter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gameType, setGameType] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [tournamentName, setTournamentName] = useState('Tournament');
  
  const studentId = localStorage.getItem('studentId');
  const antiCheatKey = `started_${id}_${studentId}`;

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
      
      if (studentId && !id.startsWith('practice-')) {
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
            accuracy: 0,
            progress: 0,
            abandoned: true,
            timestamp: new Date().toISOString()
          });
          navigate(`/leaderboard/${id}`);
          return;
        }
      }

      const t = await dbService.getTournament(id);
      if (t) {
        setGameType(t.gameType || 'typing');
        setTournamentName(t.name);
      } else {
        navigate('/dashboard');
      }
    };
    fetchTournament();
  }, [id, navigate, studentId, antiCheatKey]);
  
  const handleStart = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
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

export default ArenaRouter;
