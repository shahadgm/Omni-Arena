import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!puzzle) return;
    
    let isValid = true;
    let coveredCount = 0;
    for (const r of rects) {
      coveredCount += (r.r2 - r.r1 + 1) * (r.c2 - r.c1 + 1);
    }
    if (coveredCount !== puzzle.size * puzzle.size) {
      isValid = false;
    }

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
      onSolve();
    }
  }, [rects, puzzle, onSolve]);

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
        <div style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px' }}>
          {String(Math.floor(timeElapsed / 60)).padStart(2, '0')}:{String(timeElapsed % 60).padStart(2, '0')}
        </div>
      </div>

      <Card style={{ marginBottom: '2rem', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', color: 'white' }}>
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
          <Button onClick={() => alert('Puzzle is not fully solved yet!')} style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold' }}>
            Submit Solution
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ShikakuBoard;
