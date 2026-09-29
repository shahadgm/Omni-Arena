import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
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

const mulberry32 = (a) => {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}


const generateShikaku = (idStr, sizeOverride = null) => {
  let size = 7; // default for tournaments
  if (idStr.includes('5x5')) size = 5;
  if (idStr.includes('10x10')) size = 10;
  if (idStr.includes('7x7')) size = 7;
  
  if (sizeOverride) {
    if (sizeOverride.includes('5x5')) size = 5;
    else if (sizeOverride.includes('10x10')) size = 10;
    else if (sizeOverride.includes('15x15')) size = 15;
    else size = parseInt(sizeOverride.split('x')[0]) || 7;
  }

  // Use truly random for practice (new puzzle every time), but seeded for tournaments (fairness)
  const isPractice = idStr.startsWith('practice-');
  const rand = isPractice ? Math.random : mulberry32(hashString(idStr));
  
  let rects = [{ r1: 0, c1: 0, r2: size - 1, c2: size - 1 }];
  const targetRects = Math.floor((size * size) / 3.5); 
  
  let attempts = 0;
  while (rects.length < targetRects && attempts < 1000) {
    attempts++;
    const idx = Math.floor(rand() * rects.length);
    const rect = rects[idx];
    
    const w = rect.c2 - rect.c1 + 1;
    const h = rect.r2 - rect.r1 + 1;
    
    // To prevent 1x1 rects (area=1), if we split, both resulting rects must have area >= 2
    const minHPart = w === 1 ? 2 : 1;
    const canSplitHoriz = h >= minHPart * 2;

    const minWPart = h === 1 ? 2 : 1;
    const canSplitVert = w >= minWPart * 2;
    
    if (!canSplitHoriz && !canSplitVert) continue;
    
    let splitHoriz = false;
    if (canSplitHoriz && !canSplitVert) splitHoriz = true;
    else if (!canSplitHoriz && canSplitVert) splitHoriz = false;
    else {
      // Favor splitting the longer side
      if (w > h) splitHoriz = false;
      else if (h > w) splitHoriz = true;
      else splitHoriz = rand() > 0.5;
    }
    
    if (splitHoriz) {
      // Split horizontally
      const h1 = minHPart + Math.floor(rand() * (h - 2 * minHPart + 1));
      const splitR = rect.r1 + h1 - 1;
      const rect1 = { ...rect, r2: splitR };
      const rect2 = { ...rect, r1: splitR + 1 };
      rects.splice(idx, 1, rect1, rect2);
    } else {
      // Split vertically
      const w1 = minWPart + Math.floor(rand() * (w - 2 * minWPart + 1));
      const splitC = rect.c1 + w1 - 1;
      const rect1 = { ...rect, c2: splitC };
      const rect2 = { ...rect, c1: splitC + 1 };
      rects.splice(idx, 1, rect1, rect2);
    }
  }
  
  // Now create the grid and assign numbers
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  
  for (const rect of rects) {
    const area = (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1);
    const rCell = rect.r1 + Math.floor(rand() * (rect.r2 - rect.r1 + 1));
    const cCell = rect.c1 + Math.floor(rand() * (rect.c2 - rect.c1 + 1));
    grid[rCell][cCell] = area;
  }
  
  return { size, grid };
};

const ShikakuArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  
  const [puzzle, setPuzzle] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  const [rects, setRects] = useState([]); // {r1, c1, r2, c2, colorIdx}
  const [drawing, setDrawing] = useState(null); // {r1, c1, r2, c2}

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
    alert("Puzzle is not fully solved yet. Keep trying!");
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
    </div>
  );
};

export default ShikakuArena;
