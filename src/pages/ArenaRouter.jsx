import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import CompetitionArena from './CompetitionArena';
import QuizArena from './QuizArena';
import MultiPuzzleArena from './MultiPuzzleArena';
import MapArena from './MapArena';
import CrosswordArena from './CrosswordArena';

const ArenaRouter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gameType, setGameType] = useState(null);
  
  useEffect(() => {
    const fetchTournament = async () => {
      if (id.startsWith('practice-')) {
        if (id.startsWith('practice-quiz')) setGameType('quiz');
        else if (id.startsWith('practice-nonogram')) setGameType('nonogram');
        else if (id.startsWith('practice-shikaku')) setGameType('shikaku');
        else if (id.startsWith('practice-map')) setGameType('map');
        else if (id.startsWith('practice-crossword')) setGameType('crossword');
        else setGameType('typing');
        return;
      }
      
      const studentId = localStorage.getItem('studentId');
      if (studentId && !id.startsWith('practice-')) {
        const participated = await dbService.hasParticipated(id, studentId);
        if (participated) {
          alert('You have already participated in this tournament! You can only play once.');
          navigate(`/leaderboard/${id}`);
          return;
        }
        
        const antiCheatKey = `started_${id}_${studentId}`;
        
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
        
        // Mark as started
        localStorage.setItem(antiCheatKey, 'true');
      }

      const t = await dbService.getTournament(id);
      if (t) {
        setGameType(t.gameType || 'typing');
      } else {
        navigate('/dashboard');
      }
    };
    fetchTournament();
  }, [id, navigate]);
  
  if (!gameType) return <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>Loading...</div>;
  
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
