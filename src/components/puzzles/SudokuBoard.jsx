import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Modal, ConfirmModal } from '../ui/Modal';
import Confetti from '../ui/Confetti';
import MatchCountdown from '../ui/MatchCountdown';
import ShareCardModal from '../ui/ShareCardModal';
import soundEngine from '../../utils/soundEffects';
import { 
  ArrowLeft, Eraser, RotateCcw, CheckCircle2, AlertTriangle, 
  Flag, Sparkles, PenTool, HelpCircle, Keyboard as KeyboardIcon, Check 
} from 'lucide-react';
import { validateSudokuGrid } from '../../utils/puzzleGenerators';

const SudokuBoard = ({ puzzle, onSolve, timeElapsed, onSurrender, title = "Sudoku Tournament" }) => {
  // 9x9 user grid
  const [userGrid, setUserGrid] = useState(null);
  const [initialGrid, setInitialGrid] = useState(null);
  const [notesGrid, setNotesGrid] = useState(() => 
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()))
  );
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState([0, 0]); // [r, c]
  const [hoveredDigit, setHoveredDigit] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Themed modal & esports HUD states
  const [submitConfirmModal, setSubmitConfirmModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [surrenderModal, setSurrenderModal] = useState(false);
  const [hotkeyHelpModal, setHotkeyHelpModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(() => !puzzle?.id?.startsWith('practice-') && !puzzle?.isPractice);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  const hasSubmittedRef = useRef(false);

  // Initialize or re-initialize board on puzzle change
  useEffect(() => {
    if (puzzle && puzzle.initialGrid) {
      const init = puzzle.initialGrid.map(row => (Array.isArray(row) ? [...row] : []));
      const user = puzzle.initialGrid.map(row => (Array.isArray(row) ? [...row] : []));
      setInitialGrid(init);
      setUserGrid(user);
      setNotesGrid(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())));
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
  const currentValidation = useMemo(() => {
    if (!userGrid || !initialGrid) {
      return { isComplete: false, accuracy: 0, points: 0, conflicts: [], filledCount: 0, emptyTarget: 0, conflictCount: 0 };
    }
    return validateSudokuGrid(userGrid, initialGrid, puzzle?.solution);
  }, [userGrid, initialGrid, puzzle?.solution]);

  // Digit counts (how many 1-9 are currently on the board)
  const digitCounts = useMemo(() => {
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
      soundEngine.playVictory();
      setShowConfetti(true);
      setShowVictoryModal(true);
    }
  }, [currentValidation.isComplete, userGrid, initialGrid]);

  // Set number or pencil note in selected cell
  const handleSetNumber = useCallback((num, forceNote = null) => {
    if (!selectedCell || !userGrid || !initialGrid) return;
    const [r, c] = selectedCell;

    // Cannot edit given initial clues
    if (initialGrid[r]?.[c]) return;

    const writingNote = forceNote !== null ? forceNote : isNotesMode;

    if (writingNote) {
      // Toggle note in cell
      soundEngine.playNote();
      setNotesGrid(prev => {
        const next = prev.map((row, rowIdx) => 
          rowIdx === r 
            ? row.map((cellSet, colIdx) => {
                if (colIdx === c) {
                  const s = new Set(cellSet);
                  if (s.has(num)) s.delete(num);
                  else s.add(num);
                  return s;
                }
                return cellSet;
              })
            : row
        );
        return next;
      });
      return;
    }

    // Confirmed placement
    const currentVal = userGrid[r]?.[c];
    const newVal = currentVal === num ? null : num;

    setHistory(prev => [...prev, { 
      r, c, 
      prevVal: currentVal, 
      newVal, 
      prevNotes: new Set(notesGrid[r]?.[c] || []) 
    }]);

    const nextGrid = userGrid.map(row => [...row]);
    nextGrid[r][c] = newVal;
    setUserGrid(nextGrid);

    if (newVal !== null) {
      soundEngine.playPlaceDigit();

      // Check if this placement completed all 9 of this digit
      if ((digitCounts[num] || 0) + 1 === 9) {
        soundEngine.playBoxComplete();
      }

      // Auto-prune notes for this digit in same row, column, and 3x3 box
      setNotesGrid(prev => {
        const boxR = Math.floor(r / 3) * 3;
        const boxC = Math.floor(c / 3) * 3;
        return prev.map((row, rowIdx) =>
          row.map((set, colIdx) => {
            if (rowIdx === r && colIdx === c) return new Set();
            if (rowIdx === r || colIdx === c || (rowIdx >= boxR && rowIdx < boxR + 3 && colIdx >= boxC && colIdx < boxC + 3)) {
              if (set.has(num)) {
                const s = new Set(set);
                s.delete(num);
                return s;
              }
            }
            return set;
          })
        );
      });
    } else {
      soundEngine.playErase();
    }
  }, [selectedCell, userGrid, initialGrid, isNotesMode, notesGrid, digitCounts]);

  // Clear current cell
  const handleClearCell = useCallback(() => {
    if (!selectedCell || !userGrid || !initialGrid) return;
    const [r, c] = selectedCell;
    if (initialGrid[r]?.[c]) return;

    const currentVal = userGrid[r]?.[c];
    const currentNotes = notesGrid[r]?.[c];

    if (currentVal !== null || (currentNotes && currentNotes.size > 0)) {
      soundEngine.playErase();
      setHistory(prev => [...prev, { 
        r, c, 
        prevVal: currentVal, 
        newVal: null,
        prevNotes: new Set(currentNotes || []) 
      }]);
      
      const nextGrid = userGrid.map(row => [...row]);
      nextGrid[r][c] = null;
      setUserGrid(nextGrid);

      setNotesGrid(prev => 
        prev.map((row, rowIdx) => 
          rowIdx === r ? row.map((s, colIdx) => colIdx === c ? new Set() : s) : row
        )
      );
    }
  }, [selectedCell, userGrid, initialGrid, notesGrid]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    soundEngine.playClick();
    const nextGrid = userGrid.map(row => [...row]);
    nextGrid[lastAction.r][lastAction.c] = lastAction.prevVal;
    setUserGrid(nextGrid);

    if (lastAction.prevNotes) {
      setNotesGrid(prev => 
        prev.map((row, rowIdx) => 
          rowIdx === lastAction.r 
            ? row.map((s, colIdx) => colIdx === lastAction.c ? new Set(lastAction.prevNotes) : s) 
            : row
        )
      );
    }

    setSelectedCell([lastAction.r, lastAction.c]);
  }, [history, userGrid]);

  // Keyboard navigation & number input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      const [r, c] = selectedCell || [0, 0];

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        soundEngine.playClick();
        setSelectedCell([Math.max(0, r - 1), c]);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        soundEngine.playClick();
        setSelectedCell([Math.min(8, r + 1), c]);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        soundEngine.playClick();
        setSelectedCell([r, Math.max(0, c - 1)]);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        soundEngine.playClick();
        setSelectedCell([r, Math.min(8, c + 1)]);
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleSetNumber(parseInt(e.key, 10), e.shiftKey ? true : null);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        soundEngine.playNote();
        setIsNotesMode(prev => !prev);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setHotkeyHelpModal(prev => !prev);
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
      soundEngine.playVictory();
      setShowConfetti(true);
      setShowVictoryModal(true);
    } else {
      soundEngine.playConflict();
      setSubmitConfirmModal(true);
    }
  };

  const handleConfirmSubmit = () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSubmitConfirmModal(false);
    onSolve({
      points: currentValidation.points,
      accuracy: currentValidation.accuracy,
      isComplete: false,
      timeElapsed
    });
  };

  // Themed Reset Confirmation (no window.confirm)
  const handleConfirmReset = () => {
    if (!initialGrid) return;
    soundEngine.playErase();
    const reset = initialGrid.map(row => [...row]);
    setUserGrid(reset);
    setNotesGrid(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())));
    setHistory([]);
    setResetModal(false);
  };

  if (!puzzle || !userGrid || !initialGrid) {
    return <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>Loading Sudoku...</div>;
  }

  const [selR, selC] = selectedCell;
  const selectedValue = userGrid[selR]?.[selC];
  const activeFocusDigit = hoveredDigit || selectedValue;

  return (
    <div className="container" style={{ maxWidth: '840px', padding: '0 1rem' }}>
      {/* Optional Esports Match Countdown */}
      {showCountdown && (
        <MatchCountdown 
          title="Sudoku Arena"
          subtitle="Position your fingers on 1–9 and Arrow Keys"
          onReady={() => setShowCountdown(false)}
        />
      )}

      {/* Confetti Explosion on Solve */}
      {showConfetti && <Confetti count={70} onComplete={() => setShowConfetti(false)} />}

      {/* Top Bar: Surrender & Timer & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button 
          onClick={() => {
            soundEngine.playClick();
            setSurrenderModal(true);
          }} 
          style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: '8px',
            color: 'var(--text-secondary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer', 
            fontSize: '0.9rem', 
            padding: '0.5rem 0.85rem',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-focus)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <ArrowLeft size={16} /> Surrender
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => {
              soundEngine.playClick();
              setHotkeyHelpModal(true);
            }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.85rem'
            }}
            title="Keyboard Speedrun Hotkeys"
          >
            <HelpCircle size={15} /> Hotkeys
          </button>

          {/* Timer HUD */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--surface)',
            padding: '0.45rem 1.1rem',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            color: 'var(--primary)',
            fontSize: '1.15rem',
            fontWeight: 'bold',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1px',
            boxShadow: '0 2px 8px var(--primary-glow)'
          }}>
            {String(Math.floor(timeElapsed / 60)).padStart(2, '0')}:{String(timeElapsed % 60).padStart(2, '0')}
          </div>
        </div>
      </div>

      <Card style={{ marginBottom: '2rem', padding: '1.75rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 'bold', margin: 0, textAlign: 'center', color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '0.2rem 0.65rem',
            borderRadius: '999px',
            background: puzzle.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.15)' : puzzle.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.15)' : 'var(--primary-glow)',
            color: puzzle.difficulty === 'easy' ? 'var(--success)' : puzzle.difficulty === 'hard' ? 'var(--danger)' : 'var(--primary)',
            border: `1px solid ${puzzle.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.35)' : puzzle.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.35)' : 'var(--primary)'}`
          }}>
            {puzzle.difficulty || 'Classic 9x9'}
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem', maxWidth: '500px', fontSize: '0.85rem', lineHeight: 1.5 }}>
          Fill every row, column, and 3×3 in-built box with digits 1 to 9. Use numpad or keyboard hotkeys.
        </p>

        {/* Live HUD: Placed, Conflicts, Accuracy */}
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

        {/* ========================================================= */}
        {/* Sudoku Board: 9 Distinct In-Built Boxes in Website's Theme */}
        {/* ========================================================= */}
        <div 
          role="grid"
          aria-label="Sudoku Board"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '10px',
            background: 'var(--surface-2)',
            borderRadius: '16px',
            border: '2px solid var(--border)',
            boxShadow: 'var(--glass-shadow)',
            maxWidth: '480px',
            width: '100%',
            touchAction: 'manipulation'
          }}
        >
          {[0, 1, 2].map(boxRow =>
            [0, 1, 2].map(boxCol => {
              const boxIndex = boxRow * 3 + boxCol;
              return (
                <div
                  key={`inbuilt-box-${boxIndex}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(3, 1fr)',
                    background: 'var(--surface)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1.5px solid var(--border)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  {[0, 1, 2].map(subR =>
                    [0, 1, 2].map(subC => {
                      const r = boxRow * 3 + subR;
                      const c = boxCol * 3 + subC;
                      const val = userGrid[r]?.[c];
                      const isInitial = initialGrid[r]?.[c] !== null && initialGrid[r]?.[c] !== undefined;
                      const isSelected = selR === r && selC === c;
                      const isPeer = (selR === r || selC === c || (Math.floor(selR / 3) === boxRow && Math.floor(selC / 3) === boxCol)) && !isSelected;
                      const isMatchingValue = activeFocusDigit && val === activeFocusDigit;
                      const hasConflict = currentValidation.conflicts?.[r]?.[c];
                      const cellNotes = notesGrid[r]?.[c];

                      // Internal cell dividers within the 3x3 box
                      const borderRight = subC < 2 ? '1px solid var(--border)' : 'none';
                      const borderBottom = subR < 2 ? '1px solid var(--border)' : 'none';

                      // Cell Background states
                      let bg = 'transparent';
                      if (isSelected) {
                        bg = 'var(--primary-glow)';
                      } else if (hasConflict) {
                        bg = 'rgba(239, 68, 68, 0.2)';
                      } else if (isMatchingValue) {
                        bg = 'rgba(99, 102, 241, 0.22)';
                      } else if (isPeer) {
                        bg = 'var(--surface-hover)';
                      }

                      // Cell text color states
                      let textColor = 'var(--text-primary)';
                      if (hasConflict) {
                        textColor = 'var(--danger)';
                      } else if (isInitial) {
                        textColor = 'var(--text-primary)';
                      } else {
                        textColor = 'var(--primary)';
                      }

                      return (
                        <div
                          key={`cell-${r}-${c}`}
                          onClick={() => {
                            soundEngine.playClick();
                            setSelectedCell([r, c]);
                          }}
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'clamp(1.1rem, 2.7vw, 1.45rem)',
                            fontWeight: isInitial ? '800' : '700',
                            fontFamily: 'var(--font-mono)',
                            color: textColor,
                            background: bg,
                            borderRight: borderRight,
                            borderBottom: borderBottom,
                            cursor: 'pointer',
                            outline: isSelected ? '2.5px solid var(--primary)' : isMatchingValue && !isSelected ? '1px solid var(--primary)' : 'none',
                            outlineOffset: '-2px',
                            transition: 'background 0.12s ease',
                            position: 'relative'
                          }}
                        >
                          {val ? (
                            <span>{val}</span>
                          ) : cellNotes && cellNotes.size > 0 ? (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gridTemplateRows: 'repeat(3, 1fr)',
                              width: '100%',
                              height: '100%',
                              padding: '2px',
                              boxSizing: 'border-box'
                            }}>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <div
                                  key={`note-${n}`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 'clamp(0.55rem, 1.1vw, 0.7rem)',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 'bold',
                                    color: activeFocusDigit === n ? 'var(--primary)' : 'var(--text-secondary)',
                                    opacity: cellNotes.has(n) ? (activeFocusDigit === n ? 1 : 0.75) : 0,
                                    lineHeight: 1
                                  }}
                                >
                                  {n}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================= */}
        {/* Numpad & Controls: 9 Themed Digit Keys + Notes Mode */}
        {/* ========================================================= */}
        <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '480px' }}>
          {/* Notes Mode & Erase & Undo Header Row */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                soundEngine.playNote();
                setIsNotesMode(prev => !prev);
              }}
              style={{
                flex: 1.2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: isNotesMode ? 'var(--primary)' : 'var(--surface)',
                border: `1.5px solid ${isNotesMode ? 'var(--primary)' : 'var(--border)'}`,
                color: isNotesMode ? '#ffffff' : 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isNotesMode ? '0 4px 12px var(--primary-glow)' : 'none'
              }}
            >
              <PenTool size={15} /> Notes Mode: {isNotesMode ? 'ON' : 'OFF'}
            </button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleClearCell}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.65rem 0.75rem',
                fontSize: '0.85rem'
              }}
            >
              <Eraser size={15} /> Erase
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
                gap: '0.35rem',
                padding: '0.65rem 0.75rem',
                fontSize: '0.85rem',
                opacity: history.length === 0 ? 0.4 : 1
              }}
            >
              <RotateCcw size={15} /> Undo
            </Button>
          </div>

          {/* 1–9 Keypad Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gap: '0.4rem',
            marginBottom: '0.75rem'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const count = digitCounts[num] || 0;
              const isFinished = count >= 9;
              const isHighlighted = activeFocusDigit === num;

              return (
                <button
                  key={`num-btn-${num}`}
                  type="button"
                  onClick={() => handleSetNumber(num)}
                  onMouseEnter={() => setHoveredDigit(num)}
                  onMouseLeave={() => setHoveredDigit(null)}
                  disabled={isFinished}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem 0.15rem 0.45rem',
                    borderRadius: '10px',
                    background: isFinished 
                      ? 'var(--surface-2)' 
                      : isHighlighted 
                        ? 'var(--primary-glow)' 
                        : 'var(--surface)',
                    border: `1.5px solid ${isHighlighted ? 'var(--primary)' : isFinished ? 'var(--border)' : 'var(--border)'}`,
                    color: isFinished ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: isFinished ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isFinished ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: 1 }}>{num}</span>
                  <span style={{ fontSize: '0.65rem', marginTop: '0.2rem', color: isFinished ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {isFinished ? '✓' : `${9 - count}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Controls: Clear Entries & Submit Solution */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', width: '100%', maxWidth: '480px' }}>
          <Button
            variant="secondary"
            onClick={() => {
              soundEngine.playClick();
              setResetModal(true);
            }}
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

      {/* ========================================================= */}
      {/* In-Built Themed Modal Dialogs (Zero Browser Popups) */}
      {/* ========================================================= */}

      {/* 1. Clear Entries Confirmation */}
      <ConfirmModal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        onConfirm={handleConfirmReset}
        title="Clear All Entries?"
        message="This will reset all your entered numbers and candidate notes on the board. Original starter clues will remain unchanged."
        confirmText="Clear Board"
        cancelText="Cancel"
        variant="danger"
        icon={<RotateCcw size={26} />}
      />

      {/* 2. Surrender Confirmation */}
      <ConfirmModal
        isOpen={surrenderModal}
        onClose={() => setSurrenderModal(false)}
        onConfirm={() => {
          setSurrenderModal(false);
          onSurrender();
        }}
        title="Surrender Match?"
        message="Are you sure you want to surrender and exit to the dashboard? Your puzzle attempt will end."
        confirmText="Surrender & Exit"
        cancelText="Keep Playing"
        variant="danger"
        icon={<Flag size={26} />}
      />

      {/* 3. Partial Submission Confirmation Modal */}
      <Modal
        isOpen={submitConfirmModal}
        onClose={() => setSubmitConfirmModal(false)}
        title="Submit Incomplete Sudoku?"
        icon={<Sparkles size={28} />}
        maxWidth="480px"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'center' }}>
          The board is not completely solved yet. If you submit now, you will be awarded partial marks based on your valid entries.
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

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={() => setSubmitConfirmModal(false)} style={{ flex: 1, padding: '0.75rem 1rem' }}>
            Keep Solving
          </Button>
          <Button onClick={handleConfirmSubmit} style={{ flex: 1, padding: '0.75rem 1rem', fontWeight: 'bold' }}>
            Confirm & Submit
          </Button>
        </div>
      </Modal>

      {/* 4. Keyboard Speedrun Hotkey Help Modal */}
      <Modal
        isOpen={hotkeyHelpModal}
        onClose={() => setHotkeyHelpModal(false)}
        title="Speedrun Keyboard Controls"
        icon={<KeyboardIcon size={26} />}
        maxWidth="460px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { key: '1 – 9', desc: 'Place confirmed number into selected cell' },
            { key: 'Shift + 1 – 9', desc: 'Add / remove candidate pencil note' },
            { key: 'N', desc: 'Toggle Notes Mode ON / OFF' },
            { key: 'Arrow Keys / WASD', desc: 'Navigate grid cells' },
            { key: 'Backspace / Delete', desc: 'Erase current cell number & notes' },
            { key: 'Ctrl + Z', desc: 'Undo last move' },
            { key: '?', desc: 'Toggle this hotkey reference' }
          ].map(item => (
            <div 
              key={item.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)'
              }}
            >
              <kbd style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.2rem 0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: 'var(--primary)'
              }}>
                {item.key}
              </kbd>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>

        <Button onClick={() => setHotkeyHelpModal(false)} style={{ width: '100%', padding: '0.75rem 1rem', fontWeight: 'bold' }}>
          Got It, Let's Solve
        </Button>
      </Modal>

      {/* 5. Victory & Share Card Modal */}
      <ShareCardModal
        isOpen={showVictoryModal}
        onClose={() => setShowVictoryModal(false)}
        gameTitle={`${title} [${puzzle.difficulty || 'Classic'}]`}
        timeElapsed={timeElapsed}
        accuracy={100}
        score={100}
        onContinue={() => {
          setShowVictoryModal(false);
          onSolve({
            points: 100,
            accuracy: 100,
            isComplete: true,
            timeElapsed
          });
        }}
      />
    </div>
  );
};

export default SudokuBoard;
