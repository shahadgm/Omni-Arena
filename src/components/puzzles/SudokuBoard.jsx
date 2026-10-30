import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ArrowLeft, Eraser, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { validateSudokuGrid } from '../../utils/puzzleGenerators';

const SudokuBoard = ({ puzzle, onSolve, timeElapsed, onSurrender, title = "Sudoku Tournament" }) => {
  // 9x9 user grid
  const [userGrid, setUserGrid] = useState(null);
  const [initialGrid, setInitialGrid] = useState(null);
  const [selectedCell, setSelectedCell] = useState([0, 0]); // [r, c]
  const [history, setHistory] = useState([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const hasSubmittedRef = useRef(false);

  // Initialize or re-initialize board on puzzle change
  useEffect(() => {
    if (puzzle && puzzle.initialGrid) {
      const init = puzzle.initialGrid.map(row => (Array.isArray(row) ? [...row] : []));
      const user = puzzle.initialGrid.map(row => (Array.isArray(row) ? [...row] : []));
      setInitialGrid(init);
      setUserGrid(user);
      setHistory([]);
      hasSubmittedRef.current = false;

      // Find first empty cell to select
      let firstEmpty = [0, 0];
      let found = false;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!init[r]?.[c]) {
            firstEmpty = [r, c];
            found = true;
            break;
          }
        }
        if (found) break;
      }
      setSelectedCell(firstEmpty);
    }
  }, [puzzle]);

  // Current validation status
  const currentValidation = React.useMemo(() => {
    if (!userGrid || !initialGrid) {
      return { isComplete: false, accuracy: 0, points: 0, conflicts: [], filledCount: 0, emptyTarget: 0, conflictCount: 0 };
    }
    return validateSudokuGrid(userGrid, initialGrid, puzzle?.solution);
  }, [userGrid, initialGrid, puzzle?.solution]);

  // Digit counts (how many 1-9 are currently on the board)
  const digitCounts = React.useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    if (!userGrid) return counts;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = userGrid[r]?.[c];
        if (val && counts[val] !== undefined) {
          counts[val]++;
        }
      }
    }
    return counts;
  }, [userGrid]);

  // Auto-solve trigger when completely and correctly filled
  useEffect(() => {
    if (!userGrid || !initialGrid || hasSubmittedRef.current) return;
    if (currentValidation.isComplete) {
      hasSubmittedRef.current = true;
      onSolve({
        points: 100,
        accuracy: 100,
        isComplete: true,
        timeElapsed
      });
    }
  }, [currentValidation.isComplete, onSolve, timeElapsed, userGrid, initialGrid]);

  // Set number in selected cell
  const handleSetNumber = useCallback((num) => {
    if (!selectedCell || !userGrid || !initialGrid) return;
    const [r, c] = selectedCell;

    // Cannot edit given initial clues
    if (initialGrid[r]?.[c]) return;

    const currentVal = userGrid[r]?.[c];
    // If user presses the same number, toggle it off (clear)
    const newVal = currentVal === num ? null : num;

    setHistory(prev => [...prev, { r, c, prevVal: currentVal, newVal }]);
    const nextGrid = userGrid.map(row => [...row]);
    nextGrid[r][c] = newVal;
    setUserGrid(nextGrid);
  }, [selectedCell, userGrid, initialGrid]);

  // Clear current cell
  const handleClearCell = useCallback(() => {
    if (!selectedCell || !userGrid || !initialGrid) return;
    const [r, c] = selectedCell;
    if (initialGrid[r]?.[c]) return;

    const currentVal = userGrid[r]?.[c];
    if (currentVal !== null) {
      setHistory(prev => [...prev, { r, c, prevVal: currentVal, newVal: null }]);
      const nextGrid = userGrid.map(row => [...row]);
      nextGrid[r][c] = null;
      setUserGrid(nextGrid);
    }
  }, [selectedCell, userGrid, initialGrid]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    const nextGrid = userGrid.map(row => [...row]);
    nextGrid[lastAction.r][lastAction.c] = lastAction.prevVal;
    setUserGrid(nextGrid);
    setSelectedCell([lastAction.r, lastAction.c]);
  }, [history, userGrid]);

  // Keyboard navigation & number input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      const [r, c] = selectedCell || [0, 0];

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedCell([Math.max(0, r - 1), c]);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedCell([Math.min(8, r + 1), c]);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setSelectedCell([r, Math.max(0, c - 1)]);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setSelectedCell([r, Math.min(8, c + 1)]);
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleSetNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        handleClearCell();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handleSetNumber, handleClearCell, handleUndo]);

  // Submit button click
  const handleSubmitClick = () => {
    if (hasSubmittedRef.current) return;
    if (currentValidation.isComplete) {
      hasSubmittedRef.current = true;
      onSolve({
        points: 100,
        accuracy: 100,
        isComplete: true,
        timeElapsed
      });
    } else {
      setConfirmModal(true);
    }
  };

  const handleConfirmSubmit = () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setConfirmModal(false);
    onSolve({
      points: currentValidation.points,
      accuracy: currentValidation.accuracy,
      isComplete: false,
      timeElapsed
    });
  };

  const handleResetUserEntries = () => {
    if (!initialGrid) return;
    if (window.confirm("Reset all user-filled numbers on the board?")) {
      const reset = initialGrid.map(row => [...row]);
      setUserGrid(reset);
      setHistory([]);
    }
  };

  if (!puzzle || !userGrid || !initialGrid) {
    return <div className="page-wrapper">Loading Sudoku...</div>;
  }

  const [selR, selC] = selectedCell;
  const selectedValue = userGrid[selR]?.[selC];

  return (
    <div className="container" style={{ maxWidth: '820px', padding: '0 1rem' }}>
      {/* Top Bar: Surrender & Timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          onClick={onSurrender} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer', 
            fontSize: '1rem', 
            padding: 0 
          }}
        >
          <ArrowLeft size={18} /> Surrender
        </button>
        <div style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
          {String(Math.floor(timeElapsed / 60)).padStart(2, '0')}:{String(timeElapsed % 60).padStart(2, '0')}
        </div>
      </div>

      <Card style={{ marginBottom: '2rem', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, textAlign: 'center', color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            background: puzzle.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.15)' : puzzle.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.15)' : 'var(--primary-glow)',
            color: puzzle.difficulty === 'easy' ? 'var(--success)' : puzzle.difficulty === 'hard' ? 'var(--danger)' : 'var(--primary)',
            border: `1px solid ${puzzle.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.35)' : puzzle.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.35)' : 'var(--primary)'}`
          }}>
            {puzzle.difficulty || 'Classic 9x9'}
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.25rem', maxWidth: '500px', fontSize: '0.875rem', lineHeight: 1.5 }}>
          Fill every row, column, and 3×3 square with numbers 1 to 9. Click or use arrow keys + numpad.
        </p>

        {/* Progress & Error HUD */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Placed: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{currentValidation.filledCount}</span> / {currentValidation.emptyTarget}
          </div>
          {currentValidation.conflictCount > 0 ? (
            <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
              <AlertTriangle size={15} /> {currentValidation.conflictCount} Conflict{currentValidation.conflictCount > 1 ? 's' : ''}
            </div>
          ) : (
            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
              <CheckCircle2 size={15} /> Valid Grid
            </div>
          )}
        </div>

        {/* Sudoku 9x9 Interactive Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, minmax(28px, 46px))',
          gridTemplateRows: 'repeat(9, minmax(28px, 46px))',
          border: '3px solid var(--primary)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -4px var(--primary-glow)',
          background: 'var(--surface)',
          touchAction: 'manipulation'
        }}>
          {userGrid.map((row, r) =>
            row.map((val, c) => {
              const isInitial = initialGrid[r]?.[c] !== null && initialGrid[r]?.[c] !== undefined;
              const isSelected = selR === r && selC === c;
              const isPeer = (selR === r || selC === c || (Math.floor(selR / 3) === Math.floor(r / 3) && Math.floor(selC / 3) === Math.floor(c / 3))) && !isSelected;
              const isMatchingValue = selectedValue && val === selectedValue && !isSelected;
              const hasConflict = currentValidation.conflicts?.[r]?.[c];

              // Borders for 3x3 blocks and 1x1 cells
              const borderRight = (c === 2 || c === 5) ? '2.5px solid var(--primary)' : (c === 8 ? 'none' : '1px solid var(--border)');
              const borderBottom = (r === 2 || r === 5) ? '2.5px solid var(--primary)' : (r === 8 ? 'none' : '1px solid var(--border)');

              // Cell Background
              let bg = 'transparent';
              if (isSelected) {
                bg = 'var(--primary-glow)';
              } else if (hasConflict) {
                bg = 'rgba(239, 68, 68, 0.2)';
              } else if (isMatchingValue) {
                bg = 'var(--primary-glow)';
              } else if (isPeer) {
                bg = 'var(--surface-hover)';
              }

              // Text Color (strictly theme-adaptive via design tokens)
              let textColor = 'var(--text-primary)';
              if (hasConflict) {
                textColor = 'var(--danger)';
              } else if (isInitial) {
                textColor = 'var(--text-primary)'; // Given clues: high-contrast text
              } else {
                textColor = 'var(--primary)'; // User entered numbers: distinct primary color
              }

              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => setSelectedCell([r, c])}
                  style={{
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
                    fontWeight: isInitial ? '800' : '700',
                    fontFamily: 'var(--font-mono)',
                    color: textColor,
                    background: bg,
                    borderRight: borderRight,
                    borderBottom: borderBottom,
                    cursor: 'pointer',
                    outline: isSelected ? '2px solid var(--primary)' : 'none',
                    outlineOffset: '-2px',
                    transition: 'background 0.1s ease',
                    position: 'relative'
                  }}
                >
                  {val || ''}
                </div>
              );
            })
          )}
        </div>

        {/* Numpad (1-9 + Clear + Undo) */}
        <div style={{ marginTop: '1.75rem', width: '100%', maxWidth: '440px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gap: '0.4rem',
            marginBottom: '0.75rem'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const count = digitCounts[num] || 0;
              const isFinished = count >= 9;
              return (
                <button
                  key={`num-btn-${num}`}
                  type="button"
                  onClick={() => handleSetNumber(num)}
                  disabled={isFinished}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem 0.2rem 0.45rem',
                    borderRadius: '8px',
                    background: isFinished ? 'var(--surface-2)' : 'var(--surface)',
                    border: `1px solid ${isFinished ? 'var(--border)' : 'var(--border)'}`,
                    color: isFinished ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: isFinished ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={e => {
                    if (!isFinished) {
                      e.currentTarget.style.background = 'var(--surface-hover)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isFinished) {
                      e.currentTarget.style.background = 'var(--surface)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1 }}>{num}</span>
                  <span style={{ fontSize: '0.65rem', marginTop: '0.2rem', color: isFinished ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
                    {isFinished ? '✓' : `${9 - count}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Row: Erase, Undo */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClearCell}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem'
              }}
            >
              <Eraser size={16} /> Erase Cell
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleUndo}
              disabled={history.length === 0}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                opacity: history.length === 0 ? 0.4 : 1
              }}
            >
              <RotateCcw size={16} /> Undo
            </Button>
          </div>
        </div>

        {/* Global Controls: Reset & Submit */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', width: '100%', maxWidth: '440px' }}>
          <Button
            variant="secondary"
            onClick={handleResetUserEntries}
            style={{
              flex: 1,
              padding: '0.75rem 1rem'
            }}
          >
            Clear Entries
          </Button>
          <Button
            onClick={handleSubmitClick}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              fontWeight: 'bold'
            }}
          >
            Submit Solution
          </Button>
        </div>
      </Card>

      {/* Partial Submission Confirmation Modal */}
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
          <Card style={{ maxWidth: '480px', width: '100%', padding: '2rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Submit Incomplete Sudoku?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
              The board is not completely or correctly solved yet. If you submit now, you will receive partial marks based on your valid entries.
            </p>

            <div style={{ background: 'var(--surface-2)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Cells Placed:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{currentValidation.filledCount} / {currentValidation.emptyTarget}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Conflicts / Duplicates:</span>
                <span style={{ color: currentValidation.conflictCount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>{currentValidation.conflictCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Estimated Accuracy:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>{currentValidation.accuracy}%</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button variant="secondary" onClick={() => setConfirmModal(false)} style={{ flex: 1 }}>
                Keep Solving
              </Button>
              <Button onClick={handleConfirmSubmit} style={{ flex: 1 }}>
                Confirm & Submit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SudokuBoard;