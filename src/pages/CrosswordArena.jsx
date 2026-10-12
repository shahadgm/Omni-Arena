import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService, authService } from '../services/db';
import { useAntiCheat } from '../hooks/useAntiCheat';

const CrosswordArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  
  const [grid, setGrid] = useState([]);
  const [clues, setClues] = useState({ across: [], down: [] });
  const [numbersMap, setNumbersMap] = useState({});
  const [userInputs, setUserInputs] = useState({}); // 'row,col' -> char
  
  const [activeWord, setActiveWord] = useState(null); // { orientation: 'across'|'down', position: 1 }
  const [activeCell, setActiveCell] = useState(null); // { r, c }
  
  const [startTime, setStartTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [finalScoreWords, setFinalScoreWords] = useState(0);
  const [cellSize, setCellSize] = useState(36);

  const inputRefs = useRef({});

  const handleZoomIn = () => setCellSize(prev => Math.min(prev + 4, 52));
  const handleZoomOut = () => setCellSize(prev => Math.max(prev - 4, 22));
  const handleZoomReset = () => {
    if (!grid || grid.length === 0 || !grid[0]) return setCellSize(36);
    const cols = grid[0].length;
    if (cols > 24) setCellSize(28);
    else if (cols > 18) setCellSize(32);
    else if (cols > 12) setCellSize(36);
    else setCellSize(40);
  };

  useEffect(() => {
    const init = async () => {
      const studentId = localStorage.getItem('studentId');
      if (!studentId && !authService.isAdmin() && !id.startsWith('practice-')) {
        navigate('/');
        return;
      }
      
      let t;
      if (id.startsWith('practice-')) {
        t = {
          id: 'practice-crossword',
          name: 'Practice Crossword',
          crosswordLayout: {
            table: [
              ["-", "-", "f", "-", "-"],
              ["a", "p", "p", "l", "e"],
              ["-", "-", "x", "-", "-"],
            ],
            result: [
              { answer: "apple", clue: "Red fruit", startx: 1, starty: 2, orientation: "across", position: 1 },
              { answer: "fpx", clue: "Random letters", startx: 3, starty: 1, orientation: "down", position: 2 }
            ],
            rows: 3,
            cols: 5
          }
        };
      } else {
        t = await dbService.getTournament(id);
      }
      
      if (!t || !t.crosswordLayout) {
        navigate('/dashboard');
        return;
      }
      
      setTournament(t);
      const layout = t.crosswordLayout;
      setGrid(layout.table);

      const cols = layout.cols || (layout.table[0] ? layout.table[0].length : 15);
      if (cols > 24) setCellSize(28);
      else if (cols > 18) setCellSize(32);
      else if (cols > 12) setCellSize(36);
      else setCellSize(40);
      
      const nums = {};
      const ac = [];
      const dw = [];
      
      layout.result.forEach(r => {
        const row = r.starty - 1;
        const col = r.startx - 1;
        nums[`${row},${col}`] = r.position;
        if (r.orientation === 'across') ac.push(r);
        else dw.push(r);
      });
      
      ac.sort((a,b) => a.position - b.position);
      dw.sort((a,b) => a.position - b.position);
      
      setNumbersMap(nums);
      setClues({ across: ac, down: dw });
      setStartTime(Date.now());
      
      if (ac.length > 0) setActiveWord({ orientation: 'across', position: ac[0].position });
      else if (dw.length > 0) setActiveWord({ orientation: 'down', position: dw[0].position });
    };
    init();
  }, [id, navigate]);

  useEffect(() => {
    if (activeWord) {
      const wordObj = clues[activeWord.orientation].find(c => c.position === activeWord.position);
      if (wordObj && !activeCell) {
        setActiveCell({ r: wordObj.starty - 1, c: wordObj.startx - 1 });
      }
    }
  }, [activeWord]);

  const handleCellClick = (r, c) => {
    if (grid[r][c] === '-') return;
    
    // Find words that intersect this cell
    const intersectingWords = [];
    
    clues.across.forEach(w => {
      if (r === w.starty - 1 && c >= w.startx - 1 && c < w.startx - 1 + w.answer.length) intersectingWords.push({ ...w, orientation: 'across' });
    });
    
    clues.down.forEach(w => {
      if (c === w.startx - 1 && r >= w.starty - 1 && r < w.starty - 1 + w.answer.length) intersectingWords.push({ ...w, orientation: 'down' });
    });
    
    if (intersectingWords.length === 0) return;
    
    if (intersectingWords.length === 1) {
      setActiveWord({ orientation: intersectingWords[0].orientation, position: intersectingWords[0].position });
    } else {
      // Toggle orientation if already active in one
      if (activeWord && intersectingWords.some(w => w.orientation === activeWord.orientation && w.position === activeWord.position)) {
        const other = intersectingWords.find(w => !(w.orientation === activeWord.orientation && w.position === activeWord.position));
        setActiveWord({ orientation: other.orientation, position: other.position });
      } else {
        setActiveWord({ orientation: intersectingWords[0].orientation, position: intersectingWords[0].position });
      }
    }
    setActiveCell({ r, c });
    
    // Focus the input and scroll into view
    setTimeout(() => {
      if (inputRefs.current[`${r},${c}`]) {
        inputRefs.current[`${r},${c}`].focus();
        inputRefs.current[`${r},${c}`].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }, 10);
  };

  const handleClueClick = (orientation, position) => {
    const wordObj = clues[orientation].find(c => c.position === position);
    setActiveWord({ orientation, position });
    const targetR = wordObj.starty - 1;
    const targetC = wordObj.startx - 1;
    setActiveCell({ r: targetR, c: targetC });
    setTimeout(() => {
      if (inputRefs.current[`${targetR},${targetC}`]) {
        inputRefs.current[`${targetR},${targetC}`].focus();
        inputRefs.current[`${targetR},${targetC}`].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }, 10);
  };

  const advanceCell = (r, c, offset = 1) => {
    if (!activeWord) return;
    const isAcross = activeWord.orientation === 'across';
    const nextR = isAcross ? r : r + offset;
    const nextC = isAcross ? c + offset : c;
    
    if (nextR >= 0 && nextR < grid.length && nextC >= 0 && nextC < grid[0].length && grid[nextR][nextC] !== '-') {
      setActiveCell({ r: nextR, c: nextC });
      setTimeout(() => {
        if (inputRefs.current[`${nextR},${nextC}`]) {
          inputRefs.current[`${nextR},${nextC}`].focus();
          inputRefs.current[`${nextR},${nextC}`].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }, 10);
    }
  };

  const handleKeyDown = (e, r, c) => {
    if (e.key === 'Backspace' && !userInputs[`${r},${c}`]) {
      advanceCell(r, c, -1);
    } else if (e.key === 'ArrowRight') {
      if (activeWord?.orientation !== 'across') setActiveWord({ orientation: 'across', position: activeWord?.position });
      advanceCell(r, c, 1);
    } else if (e.key === 'ArrowLeft') {
      if (activeWord?.orientation !== 'across') setActiveWord({ orientation: 'across', position: activeWord?.position });
      advanceCell(r, c, -1);
    } else if (e.key === 'ArrowDown') {
      if (activeWord?.orientation !== 'down') setActiveWord({ orientation: 'down', position: activeWord?.position });
      advanceCell(r, c, 1);
    } else if (e.key === 'ArrowUp') {
      if (activeWord?.orientation !== 'down') setActiveWord({ orientation: 'down', position: activeWord?.position });
      advanceCell(r, c, -1);
    }
  };

  const handleChange = (e, r, c) => {
    const val = e.target.value.toUpperCase().slice(-1);
    setUserInputs(prev => ({ ...prev, [`${r},${c}`]: val }));
    if (val) {
      advanceCell(r, c, 1);
    }
  };

  const isCellActive = (r, c) => {
    if (!activeWord) return false;
    const wordObj = clues[activeWord.orientation].find(w => w.position === activeWord.position);
    if (!wordObj) return false;
    
    if (activeWord.orientation === 'across') {
      return r === wordObj.starty - 1 && c >= wordObj.startx - 1 && c < wordObj.startx - 1 + wordObj.answer.length;
    } else {
      return c === wordObj.startx - 1 && r >= wordObj.starty - 1 && r < wordObj.starty - 1 + wordObj.answer.length;
    }
  };

  const handleSubmit = async (force = false) => {
    if (!tournament) return;
    
    let filled = 0;
    let total = 0;
    let correctLetters = 0;
    
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] !== '-') {
          total++;
          const expected = grid[r][c].toUpperCase();
          const actual = userInputs[`${r},${c}`];
          if (actual) filled++;
          if (actual === expected) {
            correctLetters++;
          }
        }
      }
    }
    
    // Check correct words
    let correctWords = 0;
    const allWords = [...clues.across, ...clues.down];
    allWords.forEach(wordObj => {
      const { answer, startx, starty, orientation } = wordObj;
      let isWordCorrect = true;
      for (let i = 0; i < answer.length; i++) {
        const r = orientation === 'across' ? starty - 1 : starty - 1 + i;
        const c = orientation === 'across' ? startx - 1 + i : startx - 1;
        if (userInputs[`${r},${c}`] !== answer[i].toUpperCase()) {
          isWordCorrect = false;
          break;
        }
      }
      if (isWordCorrect) {
        correctWords++;
      }
    });

    if (!force && (filled < total || correctLetters < total)) {
      if (!window.confirm(`You have filled ${filled} out of ${total} letters. ${correctLetters < total ? 'Some answers might be incomplete or incorrect. ' : ''}Are you sure you want to submit?`)) {
        return;
      }
    }
    
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    setFinalTime(timeElapsed);
    setFinalScoreWords(correctWords);
    setIsFinished(true);
    
    const studentId = localStorage.getItem('studentId');
    if (studentId && !id.startsWith('practice-')) {
      const accuracy = Math.round((correctLetters / total) * 100);
      const score = (correctWords * 100000) - timeElapsed;
      
      await dbService.saveResult(id, {
        studentId,
        accuracy,
        timeElapsed,
        progress: Math.round((correctWords / allWords.length) * 100),
        score,
        displayScore: correctWords,
        correctCount: correctWords,
        totalQuestions: allWords.length,
        timestamp: new Date().toISOString()
      });
    }
  };

  useAntiCheat(() => {
    if (!isFinished) handleSubmit(true); // Call with force = true
  }, id.startsWith('practice-'));

  if (!tournament || grid.length === 0) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div 
      className="container" 
      style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)', paddingBottom: '4rem', userSelect: 'none', maxWidth: '1600px' }}
      onCopy={e => e.preventDefault()}
      onCut={e => e.preventDefault()}
      onPaste={e => e.preventDefault()}
      onContextMenu={e => e.preventDefault()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>{tournament.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Zoom:</span>
          <Button onClick={handleZoomOut} variant="secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '1rem', minWidth: '32px' }} title="Zoom Out">−</Button>
          <span style={{ fontSize: '0.85rem', minWidth: '42px', textAlign: 'center', fontWeight: 'bold' }}>{cellSize}px</span>
          <Button onClick={handleZoomIn} variant="secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '1rem', minWidth: '32px' }} title="Zoom In">+</Button>
          <Button onClick={handleZoomReset} variant="secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} title="Fit to Grid">Fit</Button>
        </div>
      </div>

      {isFinished ? (
        <Card style={{ padding: '3rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--success)', marginBottom: '1rem' }}>Puzzle Finished!</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>You correctly guessed <strong>{finalScoreWords} words</strong> in <strong>{finalTime} seconds</strong>.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button onClick={() => navigate('/dashboard')} variant="secondary">Back to Dashboard</Button>
            <Button onClick={() => navigate(`/leaderboard/${id}`)}>View Leaderboard</Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Card style={{ flex: '2 1 600px', padding: '1.5rem', minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div 
              style={{ 
                width: '100%', 
                maxHeight: '72vh', 
                overflow: 'auto', 
                backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: '8px', 
                padding: '1.5rem',
                border: '1px solid var(--glass-border)',
                display: 'flex'
              }}
            >
              <div style={{ 
                margin: 'auto',
                display: 'grid', 
                gridTemplateColumns: `repeat(${grid[0].length}, ${cellSize}px)`, 
                gridTemplateRows: `repeat(${grid.length}, ${cellSize}px)`,
                gap: '0',
                border: '2px solid var(--glass-border)',
                backgroundColor: 'var(--text-primary)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
              }}>
                {grid.map((row, r) => (
                  Array.from(row).map((cell, c) => {
                    if (cell === '-') {
                      return <div key={`${r},${c}`} style={{ backgroundColor: 'var(--bg-tertiary)', width: `${cellSize}px`, height: `${cellSize}px` }} />;
                    }
                    
                    const active = isCellActive(r, c);
                    const selected = activeCell?.r === r && activeCell?.c === c;
                    const num = numbersMap[`${r},${c}`];
                    
                    return (
                      <div 
                        key={`${r},${c}`} 
                        style={{ 
                          width: `${cellSize}px`, 
                          height: `${cellSize}px`, 
                          backgroundColor: selected ? '#ffeb3b' : active ? '#a5d6a7' : '#fff',
                          border: '1px solid #333',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {num && (
                          <span 
                            style={{ 
                              position: 'absolute', 
                              top: '1px', 
                              left: '2px', 
                              fontSize: `${Math.max(8, Math.round(cellSize * 0.25))}px`, 
                              lineHeight: 1, 
                              color: '#000', 
                              fontWeight: 'bold',
                              pointerEvents: 'none'
                            }}
                          >
                            {num}
                          </span>
                        )}
                        <input
                          ref={el => inputRefs.current[`${r},${c}`] = el}
                          value={userInputs[`${r},${c}`] || ''}
                          onChange={(e) => handleChange(e, r, c)}
                          onKeyDown={(e) => handleKeyDown(e, r, c)}
                          onFocus={() => {
                            if (!active) handleCellClick(r, c);
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'center',
                            fontSize: `${Math.max(11, Math.round(cellSize * 0.48))}px`,
                            fontWeight: 'bold',
                            color: '#000',
                            textTransform: 'uppercase',
                            outline: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            caretColor: 'transparent'
                          }}
                          maxLength={1}
                        />
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Tip: Click clues or cells to navigate. Arrow keys move cursor. Use Zoom buttons or scrollbars if board extends.
            </div>
          </Card>
          
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '280px' }}>
            <Card style={{ padding: '1.5rem', maxHeight: '36vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Across</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {clues.across.map(c => {
                  const isActive = activeWord?.orientation === 'across' && activeWord?.position === c.position;
                  return (
                    <li 
                      key={c.position}
                      onClick={() => handleClueClick('across', c.position)}
                      style={{ 
                        padding: '0.5rem', 
                        backgroundColor: isActive ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.5rem'
                      }}
                    >
                      <strong style={{ minWidth: '24px' }}>{c.position}.</strong>
                      <span>{c.clue}</span>
                    </li>
                  )
                })}
              </ul>
            </Card>
            
            <Card style={{ padding: '1.5rem', maxHeight: '36vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Down</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {clues.down.map(c => {
                  const isActive = activeWord?.orientation === 'down' && activeWord?.position === c.position;
                  return (
                    <li 
                      key={c.position}
                      onClick={() => handleClueClick('down', c.position)}
                      style={{ 
                        padding: '0.5rem', 
                        backgroundColor: isActive ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.5rem'
                      }}
                    >
                      <strong style={{ minWidth: '24px' }}>{c.position}.</strong>
                      <span>{c.clue}</span>
                    </li>
                  )
                })}
              </ul>
            </Card>
            
            <Button onClick={handleSubmit} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              Submit Puzzle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrosswordArena;
