import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ArrowLeft } from 'lucide-react';

const getClues = (line) => {
  const clues = [];
  let count = 0;
  for (let val of line) {
    if (val) {
      count++;
    } else if (count > 0) {
      clues.push(count);
      count = 0;
    }
  }
  if (count > 0) clues.push(count);
  if (clues.length === 0) clues.push(0);
  return clues;
};

const NonogramBoard = ({ puzzle, onSolve, timeElapsed, onSurrender, title = "Nonogram Tournament" }) => {
  const [userGrid, setUserGrid] = useState(null);

  useEffect(() => {
    if (puzzle) {
      setUserGrid(Array(puzzle.size).fill(null).map(() => Array(puzzle.size).fill(0)));
    }
  }, [puzzle]);

  const handleCellClick = (r, c, e) => {
    e.preventDefault();
    const newGrid = [...userGrid];
    if (e.type === 'contextmenu') {
      newGrid[r][c] = newGrid[r][c] === 2 ? 0 : 2;
    } else {
      newGrid[r][c] = newGrid[r][c] === 1 ? 0 : 1;
    }
    setUserGrid(newGrid);
  };

  useEffect(() => {
    if (!puzzle || !userGrid) return;
    
    let isCorrect = true;
    for (let r = 0; r < puzzle.size; r++) {
      const userRow = userGrid[r].map(cell => cell === 1);
      const userClues = getClues(userRow);
      if (JSON.stringify(userClues) !== JSON.stringify(puzzle.rowClues[r])) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      for (let c = 0; c < puzzle.size; c++) {
        const userCol = [];
        for (let r = 0; r < puzzle.size; r++) {
          userCol.push(userGrid[r][c] === 1);
        }
        const userClues = getClues(userCol);
        if (JSON.stringify(userClues) !== JSON.stringify(puzzle.colClues[c])) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
      onSolve();
    }
  }, [userGrid, puzzle, onSolve]);

  if (!puzzle || !userGrid) return <div className="page-wrapper">Loading...</div>;

  const cellSize = puzzle.size === 15 ? '20px' : puzzle.size === 10 ? '30px' : '40px';

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
          Click to fill (blue). Click again to mark empty (X). Click again to clear.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <div style={{ display: 'flex', marginLeft: '120px' }}>
            {puzzle.colClues.map((clueArr, c) => (
              <div key={`col-${c}`} style={{ 
                width: cellSize, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', 
                paddingBottom: '0.5rem'
              }}>
                {clueArr.map((clue, idx) => (
                  <div key={idx} style={{ fontSize: puzzle.size === 15 ? '0.7rem' : '0.9rem', fontWeight: 'bold', color: 'white' }}>{clue}</div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
              {puzzle.rowClues.map((clueArr, r) => (
                <div key={`row-${r}`} style={{ 
                  height: cellSize, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', 
                  paddingRight: '0.5rem'
                }}>
                  {clueArr.map((clue, idx) => (
                    <span key={idx} style={{ fontSize: puzzle.size === 15 ? '0.7rem' : '0.9rem', fontWeight: 'bold', marginLeft: '0.4rem', color: 'white' }}>{clue}</span>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
              {userGrid.map((row, r) => (
                <div key={`gr-${r}`} style={{ display: 'flex' }}>
                  {row.map((val, c) => (
                    <div 
                      key={`gc-${c}`} 
                      onClick={(e) => handleCellClick(r, c, e)}
                      onContextMenu={(e) => handleCellClick(r, c, e)}
                      style={{ 
                        width: cellSize, height: cellSize, 
                        borderRight: '1px solid rgba(255,255,255,0.15)',
                        borderBottom: '1px solid rgba(255,255,255,0.15)',
                        background: val === 1 ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {val === 2 && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', fontWeight: 'bold' }}>X</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>

          </div>
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
          <Button variant="secondary" onClick={() => setUserGrid(Array(puzzle.size).fill(null).map(() => Array(puzzle.size).fill(0)))} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
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

export default NonogramBoard;
