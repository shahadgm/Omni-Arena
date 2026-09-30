import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService, authService } from '../services/db';

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

  const inputRefs = useRef({});

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
    
    // Focus the input
    setTimeout(() => {
      if (inputRefs.current[`${r},${c}`]) {
        inputRefs.current[`${r},${c}`].focus();
      }
    }, 10);
  };

  const handleClueClick = (orientation, position) => {
    const wordObj = clues[orientation].find(c => c.position === position);
    setActiveWord({ orientation, position });
    setActiveCell({ r: wordObj.starty - 1, c: wordObj.startx - 1 });
    setTimeout(() => {
      if (inputRefs.current[`${wordObj.starty - 1},${wordObj.startx - 1}`]) {
        inputRefs.current[`${wordObj.starty - 1},${wordObj.startx - 1}`].focus();
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

  const handleSubmit = async () => {
    if (!tournament) return;
    
    let isCorrect = true;
    let filled = 0;
    let total = 0;
    
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] !== '-') {
          total++;
          const expected = grid[r][c].toUpperCase();
          const actual = userInputs[`${r},${c}`];
          if (actual) filled++;
          if (actual !== expected) {
            isCorrect = false;
          }
        }
      }
    }
    
    if (filled < total) {
      alert(`You've only filled ${filled} out of ${total} letters.`);
      return;
    }
    
    if (!isCorrect) {
      alert("Some answers are incorrect. Keep trying!");
      return;
    }
    
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    setFinalTime(timeElapsed);
    setIsFinished(true);
    
    const studentId = localStorage.getItem('studentId');
    if (studentId && !id.startsWith('practice-')) {
      await dbService.saveResult(id, {
        studentId,
        accuracy: 100,
        timeElapsed,
        progress: 100,
        score: timeElapsed,
        timestamp: new Date().toISOString()
      });
    }
  };

  if (!tournament || grid.length === 0) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>{tournament.name}</h1>
      </div>

      {isFinished ? (
        <Card style={{ padding: '3rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--success)', marginBottom: '1rem' }}>Puzzle Solved!</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>You completed the crossword in <strong>{finalTime} seconds</strong>.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button onClick={() => navigate('/dashboard')} variant="secondary">Back to Dashboard</Button>
            <Button onClick={() => navigate(`/leaderboard/${id}`)}>View Leaderboard</Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <Card style={{ flex: '2 1 500px', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${grid[0].length}, 40px)`, 
              gridTemplateRows: `repeat(${grid.length}, 40px)`,
              gap: '0',
              border: '2px solid var(--glass-border)',
              backgroundColor: '#000'
            }}>
              {grid.map((row, r) => (
                row.map((cell, c) => {
                  if (cell === '-') {
                    return <div key={`${r},${c}`} style={{ backgroundColor: '#1a1a2e', width: '40px', height: '40px' }} />;
                  }
                  
                  const active = isCellActive(r, c);
                  const selected = activeCell?.r === r && activeCell?.c === c;
                  const num = numbersMap[`${r},${c}`];
                  
                  return (
                    <div 
                      key={`${r},${c}`} 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
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
                      {num && <span style={{ position: 'absolute', top: '2px', left: '2px', fontSize: '10px', color: '#000', fontWeight: 'bold' }}>{num}</span>}
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
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#000',
                          textTransform: 'uppercase',
                          outline: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          caretColor: 'transparent' // Hide cursor for cleaner look
                        }}
                        maxLength={1}
                      />
                    </div>
                  );
                })
              ))}
            </div>
          </Card>
          
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card style={{ padding: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
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
            
            <Card style={{ padding: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
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
