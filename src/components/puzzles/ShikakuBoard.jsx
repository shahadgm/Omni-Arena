import React, { useState, useEffect, useRef } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ArrowLeft } from 'lucide-react';

const ShikakuBoard = ({ puzzle, onSolve, timeElapsed, onSurrender, title = "Shikaku Tournament" }) => {
  const [rects, setRects] = useState([]);
  const [drawing, setDrawing] = useState(null);

  useEffect(() => {
    if (puzzle) {
      setRects([]);
      setDrawing(null);
    }
  }, [puzzle]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!drawing) return;
      
      const rStart = Math.min(drawing.r1, drawing.r2);
      const rEnd = Math.max(drawing.r1, drawing.r2);
      const cStart = Math.min(drawing.c1, drawing.c2);
      const cEnd = Math.max(drawing.c1, drawing.c2);
      
      const newRect = { r1: rStart, c1: cStart, r2: rEnd, c2: cEnd };
      
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
  }, [drawing, rects]);

  const handleMouseDown = (r, c) => {
    setDrawing({ r1: r, c1: c, r2: r, c2: c });
  };

  const handleMouseEnter = (r, c) => {
    if (!drawing) return;
    setDrawing({ ...drawing, r2: r, c2: c });
  };

  const [confirmModal, setConfirmModal] = useState(false);
  const hasSubmittedRef = useRef(false);

  const calculateScore = () => {
    if (!puzzle || !puzzle.grid) return { isComplete: false, points: 0, accuracy: 0, validRects: 0, totalClues: 0 };
    
    let totalClues = 0;
    for (let r = 0; r < puzzle.size; r++) {
      if (!puzzle.grid[r]) continue;
      for (let c = 0; c < puzzle.size; c++) {
        if (puzzle.grid[r][c] !== null && puzzle.grid[r][c] !== undefined) {
          totalClues++;
        }
      }
    }

    let validRects = 0;
    let coveredCount = 0;

    for (const r of rects) {
      const area = (r.r2 - r.r1 + 1) * (r.c2 - r.c1 + 1);
      coveredCount += area;

      let numsInRect = [];
      for (let i = r.r1; i <= r.r2; i++) {
        if (!puzzle.grid[i]) continue;
        for (let j = r.c1; j <= r.c2; j++) {
          if (puzzle.grid[i][j] !== null && puzzle.grid[i][j] !== undefined) {
            numsInRect.push(puzzle.grid[i][j]);
          }
        }
      }

      if (numsInRect.length === 1 && numsInRect[0] === area) {
        validRects++;
      }
    }

    const isFullCovered = coveredCount === puzzle.size * puzzle.size;
    const isComplete = validRects === totalClues && isFullCovered;

    let accuracy = 0;
    if (isComplete) {
      accuracy = 100;
    } else if (totalClues > 0) {
      accuracy = Math.round((validRects / totalClues) * 100);
      accuracy = Math.min(99, Math.max(0, accuracy));
    }

    return {
      isComplete,
      accuracy,
      points: accuracy,
      validRects,
      totalClues
    };
  };

  useEffect(() => {
    if (!puzzle || hasSubmittedRef.current) return;
    const score = calculateScore();
    if (score.isComplete) {
      hasSubmittedRef.current = true;
      onSolve(score);
    }
  }, [rects, puzzle]);

  const handleSubmitClick = () => {
    if (hasSubmittedRef.current) return;
    const score = calculateScore();
    if (score.isComplete) {
      hasSubmittedRef.current = true;
      onSolve(score);
    } else {
      setConfirmModal(true);
    }
  };

  const handleConfirmSubmit = () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    const score = calculateScore();
    setConfirmModal(false);
    onSolve(score);
  };

  if (!puzzle) return <div className="page-wrapper">Loading...</div>;

  const cellSize = puzzle.size > 7 ? '45px' : '60px';

  const isDrawingCell = (r, c) => {
    if (!drawing) return false;
    const rStart = Math.min(drawing.r1, drawing.r2);
    const rEnd = Math.max(drawing.r1, drawing.r2);
    const cStart = Math.min(drawing.c1, drawing.c2);
    const cEnd = Math.max(drawing.c1, drawing.c2);
    return r >= rStart && r <= rEnd && c >= cStart && c <= cEnd;
  };

  const getCellRect = (r, c) => {
    return rects.find(rect => r >= rect.r1 && r <= rect.r2 && c >= rect.c1 && c <= rect.c2);
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={onSurrender} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
          <ArrowLeft size={18} /> Surrender
        </button>
        <div style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
          {String(Math.floor(timeElapsed / 60)).padStart(2, '0')}:{String(timeElapsed % 60).padStart(2, '0')}
        </div>
      </div>

      <Card style={{ marginBottom: '2rem', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>
          {title}
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
                const bgColor = isDrawing ? 'rgba(59, 130, 246, 0.3)' : (cellRect ? 'var(--primary-glow)' : 'transparent');
                
                return (
                  <div 
                    key={`sc-${c}`} 
                    onMouseDown={() => handleMouseDown(r, c)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    style={{ 
                      width: cellSize, height: cellSize, 
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      borderTop: r === 0 ? '1px solid var(--border)' : 'none',
                      borderLeft: c === 0 ? '1px solid var(--border)' : 'none',
                      backgroundColor: bgColor,
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      cursor: 'crosshair',
                      fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {val !== null ? val : ''}
                  </div>
                );
              })}
            </div>
          ))}

          {rects.map((rect, idx) => (
            <div 
              key={`rect-${idx}`}
              style={{
                position: 'absolute',
                top: `calc(${rect.r1} * ${cellSize})`,
                left: `calc(${rect.c1} * ${cellSize})`,
                width: `calc((${rect.c2 - rect.c1 + 1}) * ${cellSize})`,
                height: `calc((${rect.r2 - rect.r1 + 1}) * ${cellSize})`,
                border: '2px solid var(--primary)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />
          ))}
        </div>
        
        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
          <Button variant="secondary" onClick={() => setRects([])} style={{ padding: '0.75rem 1.5rem' }}>
            Clear All
          </Button>
          <Button onClick={handleSubmitClick} style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}>
            Submit Solution
          </Button>
        </div>
      </Card>

      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem'
        }}>
          <Card style={{ maxWidth: '480px', width: '100%', padding: '2rem', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Submit Solution?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.5' }}>
              Your puzzle is not fully solved yet. If you submit now, you will be awarded partial marks based on your correctly formed rectangles.
            </p>
            
            <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Valid Rectangles:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{calculateScore().validRects} / {calculateScore().totalClues}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Calculated Score:</span>
                <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{calculateScore().points} / 100 pts ({calculateScore().accuracy}%)</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button variant="secondary" onClick={() => setConfirmModal(false)} style={{ flex: 1 }}>
                Keep Solving
              </Button>
              <Button onClick={handleConfirmSubmit} style={{ flex: 1, background: 'var(--accent-primary)' }}>
                Submit Now
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ShikakuBoard;
