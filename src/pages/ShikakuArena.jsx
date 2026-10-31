import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { AlertModal } from '../components/ui/Modal';
import { dbService } from '../services/db';
import { Trophy, Clock, Square, ArrowLeft } from 'lucide-react';

const COLORS = [
  'rgba(239, 68, 68, 0.4)',   // red
  'rgba(249, 115, 22, 0.4)',  // orange
  'rgba(234, 179, 8, 0.4)',   // yellow
  'rgba(34, 197, 94, 0.4)',   // green
  'rgba(14, 165, 233, 0.4)',  // light blue
  'rgba(59, 130, 246, 0.4)',  // blue
  'rgba(168, 85, 247, 0.4)',  // purple
  'rgba(236, 72, 153, 0.4)'   // pink
];

import { generateShikaku } from '../utils/puzzleGenerators';

const ShikakuArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  
  const [puzzle, setPuzzle] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  const [rects, setRects] = useState([]); // {r1, c1, r2, c2, colorIdx}
  const [drawing, setDrawing] = useState(null); // {r1, c1, r2, c2}
  const [alertModal, setAlertModal] = useState(false);

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }
    
    const initPuzzle = async () => {
      if (id.startsWith('practice-')) {
        setPuzzle(generateShikaku(id));
      } else {
        const t = await dbService.getTournament(id);
        if (t && t.customPuzzle) {
          setPuzzle({ size: t.customPuzzle.length, grid: t.customPuzzle });
        } else {
          setPuzzle(generateShikaku(id, t?.puzzleSize));
        }
      }
    };
    initPuzzle();
  }, [id, navigate, studentId]);

  useEffect(() => {
    let timer;
    if (puzzle && !completed) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [completed, puzzle]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!drawing || completed) return;
      
      const rStart = Math.min(drawing.r1, drawing.r2);
      const rEnd = Math.max(drawing.r1, drawing.r2);
      const cStart = Math.min(drawing.c1, drawing.c2);
      const cEnd = Math.max(drawing.c1, drawing.c2);
      
      const newRect = { r1: rStart, c1: cStart, r2: rEnd, c2: cEnd, colorIdx: rects.length % COLORS.length };
      
      const isOverlapping = (rectA, rectB) => {
        return !(rectA.r2 < rectB.r1 || rectA.r1 > rectB.r2 || rectA.c2 < rectB.c1 || rectA.c1 > rectB.c2);
      };
      
      const isSingleCell = rStart === rEnd && cStart === cEnd;
      const intersecting = rects.filter(r => isOverlapping(r, newRect));
      
      if (isSingleCell && intersecting.length > 0) {
        setRects(prev => prev.filter(r => !isOverlapping(r, newRect)));
      } else {
        setRects(prev => [...prev.filter(r => !isOverlapping(r, newRect)), newRect]);
      }
      
      setDrawing(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [drawing, completed, rects]);

  const handleMouseDown = (r, c) => {
    if (completed) return;
    setDrawing({ r1: r, c1: c, r2: r, c2: c });
  };

  const handleMouseEnter = (r, c) => {
    if (!drawing || completed) return;
    setDrawing({ ...drawing, r2: r, c2: c });
  };

  useEffect(() => {
    if (!puzzle || completed) return;
    
    // Auto-check on every rects change
    let isValid = true;
    
    // 1. Check if all cells are covered
    let coveredCount = 0;
    for (const r of rects) {
      coveredCount += (r.r2 - r.r1 + 1) * (r.c2 - r.c1 + 1);
    }
    if (coveredCount !== puzzle.size * puzzle.size) {
      isValid = false;
    }

    // 2. Check if each rect contains exactly one number equal to its area
    if (isValid) {
      for (const r of rects) {
        let numsInRect = [];
        for (let i = r.r1; i <= r.r2; i++) {
          for (let j = r.c1; j <= r.c2; j++) {
            if (puzzle.grid[i][j] !== null) {
              numsInRect.push(puzzle.grid[i][j]);
            }
          }
        }
        
        const area = (r.r2 - r.r1 + 1) * (r.c2 - r.c1 + 1);
        if (numsInRect.length !== 1 || numsInRect[0] !== area) {
          isValid = false;
          break;
        }
      }
    }

    if (isValid) {
      const finish = async () => {
        setCompleted(true);
        // Faster time = higher score to preserve ascending time sort order mathematically
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
      };
      finish();
    }
  }, [rects, puzzle, completed, id, navigate, studentId, timeElapsed]);

  if (!puzzle) return <div className="page-wrapper">Loading...</div>;

  if (completed) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '500px', width: '100%' }}>
          <Trophy size={64} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Puzzle Solved!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Great job, {studentId}!</p>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{timeElapsed}s</div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Redirecting to leaderboard...</p>
        </Card>
      </div>
    );
  }

  const cellSize = puzzle.size > 7 ? '45px' : '60px';

  // Helper to determine if a cell is in the currently drawing rect
  const isDrawingCell = (r, c) => {
    if (!drawing) return false;
    const rStart = Math.min(drawing.r1, drawing.r2);
    const rEnd = Math.max(drawing.r1, drawing.r2);
    const cStart = Math.min(drawing.c1, drawing.c2);
    const cEnd = Math.max(drawing.c1, drawing.c2);
    return r >= rStart && r <= rEnd && c >= cStart && c <= cEnd;
  };

  // Helper to find which finalized rect a cell belongs to
  const getCellRect = (r, c) => {
    return rects.find(rect => r >= rect.r1 && r <= rect.r2 && c >= rect.c1 && c <= rect.c2);
  };

  const handleDone = () => {
    setAlertModal(true);
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
          <ArrowLeft size={18} /> Surrender
        </button>
        <div style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px' }}>
          {String(Math.floor(timeElapsed / 60)).padStart(2, '0')}:{String(timeElapsed % 60).padStart(2, '0')}
        </div>
      </div>

      <Card style={{ marginBottom: '2rem', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', color: 'white' }}>
          Shikaku Tournament
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem', maxWidth: '450px', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Click and drag to form rectangles. Ensure each rectangle has exactly one number equal to its area.
        </p>
        
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {puzzle.grid.map((row, r) => (
            <div key={`sr-${r}`} style={{ display: 'flex' }}>
              {row.map((val, c) => {
                const cellRect = getCellRect(r, c);
                const isDrawing = isDrawingCell(r, c);
                const bgColor = isDrawing ? 'rgba(59, 130, 246, 0.3)' : (cellRect ? 'rgba(255,255,255,0.05)' : 'transparent');
                
                return (
                  <div 
                    key={`sc-${c}`} 
                    onMouseDown={() => handleMouseDown(r, c)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    style={{ 
                      width: cellSize, height: cellSize, 
                      borderRight: '1px solid rgba(255,255,255,0.15)',
                      borderBottom: '1px solid rgba(255,255,255,0.15)',
                      borderTop: r === 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                      borderLeft: c === 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                      backgroundColor: bgColor,
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      cursor: 'crosshair',
                      fontSize: '1.25rem', fontWeight: 'bold', color: 'white'
                    }}
                  >
                    {val !== null ? val : ''}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Render finalized rects (borders only) */}
          {rects.map((rect, idx) => (
            <div 
              key={`rect-${idx}`}
              style={{
                position: 'absolute',
                top: `calc(${rect.r1} * ${cellSize})`,
                left: `calc(${rect.c1} * ${cellSize})`,
                width: `calc((${rect.c2 - rect.c1 + 1}) * ${cellSize})`,
                height: `calc((${rect.r2 - rect.r1 + 1}) * ${cellSize})`,
                border: '2px solid rgba(255,255,255,0.3)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />
          ))}
        </div>
        
        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
          <Button variant="secondary" onClick={() => setRects([])} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
            Clear All
          </Button>
          <Button onClick={handleDone} style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold' }}>
            Submit Solution
          </Button>
        </div>
      </Card>

      <AlertModal
        isOpen={alertModal}
        onClose={() => setAlertModal(false)}
        title="Keep Solving"
        message="Puzzle is not fully solved yet. Check your outlined rectangles, and keep trying!"
        buttonText="Back to Puzzle"
        variant="warning"
      />
    </div>
  );
};

export default ShikakuArena;
