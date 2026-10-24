import React, { useState, useEffect, useRef } from 'react';
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

  const [puzzleScores, setPuzzleScores] = useState([]);
  const [finalStats, setFinalStats] = useState(null);
  const solvedIndicesRef = useRef(new Set());
  const isSubmitting = useRef(false);

  const handleSolve = async (puzzleScore) => {
    if (solvedIndicesRef.current.has(currentIdx)) return;
    solvedIndicesRef.current.add(currentIdx);

    const currentScore = puzzleScore || { points: 100, accuracy: 100, isComplete: true };
    const updatedScores = [...puzzleScores, currentScore];
    setPuzzleScores(updatedScores);

    if (currentIdx < puzzles.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Completed all puzzles
      if (isSubmitting.current) return;
      isSubmitting.current = true;
      try {
        localStorage.removeItem(`started_${id}_${studentId}`);
      } catch (e) {}

      setCompleted(true);
      const avgPoints = Math.round(updatedScores.reduce((sum, p) => sum + (p.points ?? 100), 0) / puzzles.length);
      const avgAccuracy = Math.round(updatedScores.reduce((sum, p) => sum + (p.accuracy ?? 100), 0) / puzzles.length);
      const score = (avgPoints * 100000) - timeElapsed;
      const displayScore = avgPoints;

      setFinalStats({ points: avgPoints, accuracy: avgAccuracy, time: timeElapsed });
      
      if (!id.startsWith('practice-')) {
        try {
          await dbService.saveResult(id, {
            studentId,
            score,
            displayScore,
            accuracy: avgAccuracy,
            timeElapsed,
            progress: 100,
            puzzleDetails: updatedScores,
            wpm: 0
          });
        } catch (err) {
          console.error('Failed to save puzzle result:', err);
        }
      }
      
      setTimeout(() => navigate(`/leaderboard/${id}`), 2500);
    }
  };

  const handleSurrender = () => {
    navigate('/dashboard');
  };

  useAntiCheat(() => {
    if (!completed && !isSubmitting.current) {
      isSubmitting.current = true;
      try {
        localStorage.removeItem(`started_${id}_${studentId}`);
      } catch (e) {}

      setCompleted(true);
      dbService.saveResult(id, {
        studentId,
        score: 0,
        displayScore: 0,
        accuracy: 0,
        timeElapsed,
        progress: Math.round((currentIdx / (puzzles.length || 1)) * 100),
        wpm: 0
      }).then(() => {
        navigate(`/leaderboard/${id}`);
      }).catch(err => {
        console.error('Failed to save puzzle anti-cheat result:', err);
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
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Great effort, {studentId}!</p>
          <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
              {finalStats?.points ?? 100} <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>/ 100 pts</span>
            </div>
            <div style={{ color: 'var(--success)', fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {finalStats?.accuracy ?? 100}% Accuracy
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
              Time Taken: <strong>{timeElapsed}s</strong>
            </div>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Redirecting to leaderboard...</p>
        </Card>
      </div>
    );
  }

  const currentPuzzle = puzzles[currentIdx];
  if (!currentPuzzle) {
    return <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>Loading next puzzle...</div>;
  }

  const title = `Puzzle ${currentIdx + 1} of ${puzzles.length} - ${currentPuzzle.type === 'nonogram' ? 'Nonogram' : 'Shikaku'}`;

  if (currentPuzzle.type === 'nonogram') {
    return <NonogramBoard key={`nonogram-${currentIdx}`} puzzle={currentPuzzle.data} onSolve={handleSolve} timeElapsed={timeElapsed} onSurrender={handleSurrender} title={title} />;
  } else {
    return <ShikakuBoard key={`shikaku-${currentIdx}`} puzzle={currentPuzzle.data} onSolve={handleSolve} timeElapsed={timeElapsed} onSurrender={handleSurrender} title={title} />;
  }
};

export default MultiPuzzleArena;
