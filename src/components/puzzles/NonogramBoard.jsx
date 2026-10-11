import React, { useState, useEffect, useRef } from 'react';
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

  const [confirmModal, setConfirmModal] = useState(false);
  const hasSubmittedRef = useRef(false);

  const calculateScore = () => {
    if (!puzzle || !userGrid) return { isComplete: false, points: 0, accuracy: 0, satisfiedClues: 0, totalClueLines: 0 };
    
    let satisfiedRows = 0;
    let satisfiedCols = 0;
    
    for (let r = 0; r < puzzle.size; r++) {
      if (!userGrid[r] || !Array.isArray(userGrid[r])) continue;
      const userRow = userGrid[r].map(cell => cell === 1);
      const userClues = getClues(userRow);
      if (puzzle.rowClues && puzzle.rowClues[r] && JSON.stringify(userClues) === JSON.stringify(puzzle.rowClues[r])) {
        satisfiedRows++;
      }
    }

    for (let c = 0; c < puzzle.size; c++) {
      const userCol = [];
      for (let r = 0; r < puzzle.size; r++) {
        if (userGrid[r]) userCol.push(userGrid[r][c] === 1);
      }
      const userClues = getClues(userCol);
      if (puzzle.colClues && puzzle.colClues[c] && JSON.stringify(userClues) === JSON.stringify(puzzle.colClues[c])) {
        satisfiedCols++;
      }
    }

    const totalClueLines = puzzle.size * 2;
    const satisfiedClues = satisfiedRows + satisfiedCols;
    const isComplete = satisfiedClues === totalClueLines;

    let correctFilled = 0;
    let wrongFilled = 0;
    let totalTargetFilled = 0;

    if (puzzle.grid) {
      for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
          const isTarget = !!(puzzle.grid[r] && puzzle.grid[r][c]);
          const isMarked = !!(userGrid[r] && userGrid[r][c] === 1);
          if (isTarget) totalTargetFilled++;
          if (isMarked && isTarget) correctFilled++;
          if (isMarked && !isTarget) wrongFilled++;
        }
      }
    }

    let accuracy = 0;
    if (isComplete) {
      accuracy = 100;
    } else if (totalTargetFilled > 0) {
      const netCells = Math.max(0, correctFilled - (wrongFilled * 0.5));
      const cellPct = (netCells / totalTargetFilled) * 100;
      const cluePct = (satisfiedClues / totalClueLines) * 100;
      accuracy = Math.round((cellPct * 0.7) + (cluePct * 0.3));
      accuracy = Math.min(99, Math.max(0, accuracy));
    } else {
      accuracy = Math.round((satisfiedClues / totalClueLines) * 100);
    }

    return {
      isComplete,
      accuracy,
      points: accuracy,
      satisfiedClues,
      totalClueLines
    };
  };

  useEffect(() => {
    if (!puzzle || !userGrid || hasSubmittedRef.current) return;
    const score = calculateScore();
    if (score.isComplete) {
      hasSubmittedRef.current = true;
      onSolve(score);
    }
  }, [userGrid, puzzle]);

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
          <Button onClick={handleSubmitClick} style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold' }}>
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
              Your puzzle is not fully solved yet. If you submit now, you will be awarded partial marks based on your correct clues and cells.
            </p>
            
            <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Satisfied Clues:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{calculateScore().satisfiedClues} / {calculateScore().totalClueLines}</strong>
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

export default NonogramBoard;
