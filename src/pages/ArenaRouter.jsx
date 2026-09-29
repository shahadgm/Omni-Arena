import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import CompetitionArena from './CompetitionArena';
import QuizArena from './QuizArena';
import MultiPuzzleArena from './MultiPuzzleArena';
import MapArena from './MapArena';

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
        else setGameType('typing');
        return;
      }
      
      const studentId = localStorage.getItem('studentId');
      if (studentId) {
        const participated = await dbService.hasParticipated(id, studentId);
        if (participated) {
          alert('You have already participated in this tournament! You can only play once.');
          navigate(`/leaderboard/${id}`);
          return;
        }
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
    case 'logic-puzzle':
    case 'nonogram': 
    case 'shikaku': return <MultiPuzzleArena />;
    case 'typing':
    default: return <CompetitionArena />;
  }
};

export default ArenaRouter;
