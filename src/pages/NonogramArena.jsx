import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { AlertModal } from '../components/ui/Modal';
import { dbService } from '../services/db';
import { Trophy, Clock, Grid, ArrowLeft } from 'lucide-react';

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

const getClues = (line) => {
  const clues = [];
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i]) count++;
    else if (count > 0) { clues.push(count); count = 0; }
  }
  if (count > 0) clues.push(count);
  return clues.length > 0 ? clues : [0];
};

const generateClues = (grid) => {
  const size = grid.length;
  
  const rowClues = grid.map(row => getClues(row));
  const colClues = [];
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = 0; r < size; r++) col.push(grid[r][c]);
    colClues.push(getClues(col));
  }
  return { solution: grid, rowClues, colClues, size };
};

const generateNonogram = (idStr, sizeOverride = null) => {
  let size = 10; // default for tournaments
  if (idStr.includes('5x5')) size = 5;
  if (idStr.includes('10x10')) size = 10;
  if (idStr.includes('15x15')) size = 15;

  if (sizeOverride) {
    if (sizeOverride.includes('5x5')) size = 5;
    else if (sizeOverride.includes('10x10')) size = 10;
    else if (sizeOverride.includes('15x15')) size = 15;
    else size = parseInt(sizeOverride.split('x')[0]) || 10;
  }

  const isPractice = idStr.startsWith('practice-');
  const rand = isPractice ? Math.random : mulberry32(hashString(idStr));

  const grid = Array(size).fill(null).map(() => Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = rand() > 0.45; // 55% chance to be filled
    }
  }

  return generateClues(grid);
};

const NonogramArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  
  const [puzzle, setPuzzle] = useState(null);
  const [userGrid, setUserGrid] = useState([]); // 0: empty, 1: filled, 2: marked X
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [alertModal, setAlertModal] = useState(false);

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }
    
    const initPuzzle = async () => {
      if (id.startsWith('practice-')) {
        const puz = generateNonogram(id);
        setPuzzle(puz);
        setUserGrid(Array(puz.size).fill(null).map(() => Array(puz.size).fill(0)));
      } else {
        const t = await dbService.getTournament(id);
        if (t && t.customPuzzle) {
          const puz = generateClues(t.customPuzzle);
          setPuzzle(puz);
          setUserGrid(Array(puz.size).fill(null).map(() => Array(puz.size).fill(0)));
        } else {
          const puz = generateNonogram(id, t?.puzzleSize);
          setPuzzle(puz);
          setUserGrid(Array(puz.size).fill(null).map(() => Array(puz.size).fill(0)));
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

  const handleCellClick = (r, c, e) => {
    if (completed) return;
    e.preventDefault();
    const newGrid = [...userGrid];
    if (e.type === 'contextmenu') {
      // Right click -> mark X
      newGrid[r][c] = newGrid[r][c] === 2 ? 0 : 2;
    } else {
      // Left click -> fill
      newGrid[r][c] = newGrid[r][c] === 1 ? 0 : 1;
    }
    setUserGrid(newGrid);
  };

  useEffect(() => {
    if (!puzzle || completed) return;
    
    // Auto-check on every grid change
    let isCorrect = true;
    
    // Check if userGrid satisfies all row clues
    for (let r = 0; r < puzzle.size; r++) {
      const userRow = userGrid[r].map(cell => cell === 1);
      const userClues = getClues(userRow);
      const targetClues = puzzle.rowClues[r];
      if (JSON.stringify(userClues) !== JSON.stringify(targetClues)) {
        isCorrect = false;
        break;
      }
    }

    // Check if userGrid satisfies all col clues
    if (isCorrect) {
      for (let c = 0; c < puzzle.size; c++) {
        const userCol = [];
        for (let r = 0; r < puzzle.size; r++) {
          userCol.push(userGrid[r][c] === 1);
        }
        const userClues = getClues(userCol);
        const targetClues = puzzle.colClues[c];
        if (JSON.stringify(userClues) !== JSON.stringify(targetClues)) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
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
          wpm: 0 // leaderboard sort
        });
        
        setTimeout(() => navigate(`/leaderboard/${id}`), 2000);
      };
      finish();
    }
  }, [userGrid, puzzle, completed, id, navigate, studentId, timeElapsed]);

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

  const cellSize = puzzle.size === 15 ? '20px' : puzzle.size === 10 ? '30px' : '40px';

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
          Nonogram Tournament
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem', maxWidth: '450px', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Click to fill (blue). Click again to mark empty (X). Click again to clear.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          
          {/* Top Col Clues */}
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
            {/* Left Row Clues */}
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

            {/* The Grid */}
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
          <Button onClick={handleDone} style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold' }}>
            Submit Solution
          </Button>
        </div>

      </Card>

      <AlertModal
        isOpen={alertModal}
        onClose={() => setAlertModal(false)}
        title="Keep Solving"
        message="Puzzle is not fully solved yet. Check your marked cells and clues, and keep trying!"
        buttonText="Back to Puzzle"
        variant="warning"
      />
    </div>
  );
};

export default NonogramArena;
