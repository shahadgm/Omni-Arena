import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import { generateNonogram, generateShikaku, generateClues } from '../utils/puzzleGenerators';
import NonogramBoard from '../components/puzzles/NonogramBoard';
import ShikakuBoard from '../components/puzzles/ShikakuBoard';
import Card from '../components/ui/Card';
import { Trophy } from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';

const MultiPuzzleArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  
  const [puzzles, setPuzzles] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId && !id.startsWith('practice-')) {
      navigate('/dashboard');
      return;
    }

    const initPuzzles = async () => {
      setLoading(true);
      if (id.startsWith('practice-')) {
        // Single puzzle for practice
        let puz = null;
        let type = '';
        if (id.startsWith('practice-nonogram')) {
          type = 'nonogram';
          puz = generateNonogram(id);
        } else {
          type = 'shikaku';
          puz = generateShikaku(id);
        }
        setPuzzles([{ type, data: puz }]);
      } else {
        const t = await dbService.getTournament(id);
        if (!t) {
          navigate('/dashboard');
          return;
        }

        // Support new multi-puzzle format or fallback to legacy single-puzzle format
        if (t.puzzles && Array.isArray(t.puzzles) && t.puzzles.length > 0) {
          const loadedPuzzles = t.puzzles.map((pConfig, index) => {
            if (pConfig.type === 'nonogram') {
              if (pConfig.customGrid) return { type: 'nonogram', data: generateClues(pConfig.customGrid) };
              return { type: 'nonogram', data: generateNonogram(id + index, pConfig.size) };
            } else {
              if (pConfig.customGrid) return { type: 'shikaku', data: { size: pConfig.customGrid.length, grid: pConfig.customGrid } };
              return { type: 'shikaku', data: generateShikaku(id + index, pConfig.size) };
            }
          });
          setPuzzles(loadedPuzzles);
        } else {
          // Legacy support for older tournaments
          let puz = null;
          if (t.gameType === 'nonogram') {
            puz = t.customPuzzle ? generateClues(t.customPuzzle) : generateNonogram(id, t.puzzleSize);
            setPuzzles([{ type: 'nonogram', data: puz }]);
          } else if (t.gameType === 'shikaku') {
            puz = t.customPuzzle ? { size: t.customPuzzle.length, grid: t.customPuzzle } : generateShikaku(id, t.puzzleSize);
            setPuzzles([{ type: 'shikaku', data: puz }]);
          } else {
            navigate('/dashboard');
            return;
          }
        }
      }
      setLoading(false);
    };
    initPuzzles();
  }, [id, navigate, studentId]);

  useEffect(() => {
    let timer;
    if (puzzles.length > 0 && !completed && !loading) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [completed, puzzles.length, loading]);

  const handleSolve = async () => {
    if (currentIdx < puzzles.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Completed all puzzles
      setCompleted(true);
      const score = Math.max(10000 - timeElapsed, 100);
      
      await dbService.saveResult(id, {
        studentId,
        score,
        accuracy: 100,
        timeElapsed,
        progress: 100,
        wpm: 0
      });
      
      setTimeout(() => navigate(`/leaderboard/${id}`), 2000);
    }
  };

  const handleSurrender = () => {
    navigate('/dashboard');
  };

  useAntiCheat(() => {
    if (!completed) {
      setCompleted(true);
      dbService.saveResult(id, {
        studentId,
        score: 0,
        accuracy: 0,
        timeElapsed,
        progress: Math.round((currentIdx / puzzles.length) * 100),
        wpm: 0
      }).then(() => {
        navigate(`/leaderboard/${id}`);
      });
    }
  }, id.startsWith('practice-'));

  if (loading) return <div className="page-wrapper">Loading Puzzles...</div>;

  if (completed) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '500px', width: '100%' }}>
          <Trophy size={64} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Tournament Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Great job, {studentId}!</p>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{timeElapsed}s</div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Redirecting to leaderboard...</p>
        </Card>
      </div>
    );
  }

  const currentPuzzle = puzzles[currentIdx];
  const title = `Puzzle ${currentIdx + 1} of ${puzzles.length} - ${currentPuzzle.type === 'nonogram' ? 'Nonogram' : 'Shikaku'}`;

  if (currentPuzzle.type === 'nonogram') {
    return <NonogramBoard puzzle={currentPuzzle.data} onSolve={handleSolve} timeElapsed={timeElapsed} onSurrender={handleSurrender} title={title} />;
  } else {
    return <ShikakuBoard puzzle={currentPuzzle.data} onSolve={handleSolve} timeElapsed={timeElapsed} onSurrender={handleSurrender} title={title} />;
  }
};

export default MultiPuzzleArena;
