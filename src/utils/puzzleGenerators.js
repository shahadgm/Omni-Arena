export const mulberry32 = (a) => {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
};

export const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
};

export const generateClues = (grid) => {
  const size = grid.length;
  const rowClues = [];
  const colClues = [];
  
  const getLineClues = (line) => {
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

  for (let r = 0; r < size; r++) {
    rowClues.push(getLineClues(grid[r]));
  }
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = 0; r < size; r++) {
      col.push(grid[r][c]);
    }
    colClues.push(getLineClues(col));
  }
  
  return { size, rowClues, colClues, grid };
};

export const generateNonogram = (seedId, overrideSize = null) => {
  const seedNum = seedId.replace(/\D/g, '') || '1';
  const rng = mulberry32(hashString(seedNum + "nonogram"));
  
  let size = 10;
  if (overrideSize) {
    size = parseInt(overrideSize.split('x')[0]);
  } else if (seedId.includes('5x5')) size = 5;
  else if (seedId.includes('15x15')) size = 15;
  
  const grid = Array(size).fill(null).map(() => Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = rng() > 0.5;
    }
  }
  
  return generateClues(grid);
};

export const generateShikaku = (seedId, overrideSize = null) => {
  let size = 7;
  if (overrideSize) {
    if (typeof overrideSize === 'number') size = overrideSize;
    else if (overrideSize.includes('5x5')) size = 5;
    else if (overrideSize.includes('7x7')) size = 7;
    else if (overrideSize.includes('10x10')) size = 10;
    else if (overrideSize.includes('15x15')) size = 15;
    else size = parseInt(overrideSize.split('x')[0]) || 7;
  } else if (seedId.includes('5x5')) size = 5;
  else if (seedId.includes('10x10')) size = 10;
  else if (seedId.includes('15x15')) size = 15;
  else if (seedId.includes('7x7')) size = 7;

  // Use truly random for practice, but seeded mulberry32 for tournaments (fair competition)
  const isPractice = seedId.startsWith('practice-');
  const rng = isPractice ? Math.random : mulberry32(hashString(seedId + "shikaku"));

  // Binary Space Partitioning (BSP) starting from the full board.
  // Crucial rule: any split MUST ensure both child rectangles have area >= 2.
  // This mathematically guarantees no 1x1 rectangle or number 1 is ever produced.
  let rects = [{ r1: 0, c1: 0, r2: size - 1, c2: size - 1 }];
  const targetRects = Math.max(4, Math.floor((size * size) / 3.8));
  const maxArea = size <= 5 ? 8 : (size <= 7 ? 10 : 14);

  let attempts = 0;
  while (attempts++ < 500) {
    const splittable = [];
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const w = r.c2 - r.c1 + 1;
      const h = r.r2 - r.r1 + 1;
      // To ensure area >= 2:
      // If w === 1, horizontal split requires h >= 4 so both children have h >= 2 (area >= 2).
      // If w >= 2, horizontal split requires h >= 2 so both children have h >= 1 (area >= 2).
      const canSplitH = (w === 1 ? h >= 4 : h >= 2);
      // If h === 1, vertical split requires w >= 4 so both children have w >= 2 (area >= 2).
      // If h >= 2, vertical split requires w >= 2 so both children have w >= 1 (area >= 2).
      const canSplitV = (h === 1 ? w >= 4 : w >= 2);

      if (canSplitH || canSplitV) {
        splittable.push({ index: i, rect: r, w, h, canSplitH, canSplitV, area: w * h });
      }
    }

    if (splittable.length === 0) break;
    if (rects.length >= targetRects && !splittable.some(s => s.area > maxArea)) break;

    // Prioritize splitting large rectangles first
    const largeOnes = splittable.filter(s => s.area > maxArea);
    const pool = largeOnes.length > 0 ? largeOnes : splittable;
    const choice = pool[Math.floor(rng() * pool.length)];

    const { rect, w, h, canSplitH, canSplitV } = choice;
    let splitH = false;
    if (canSplitH && !canSplitV) splitH = true;
    else if (!canSplitH && canSplitV) splitH = false;
    else {
      // Favor splitting the longer dimension
      if (h > w) splitH = true;
      else if (w > h) splitH = false;
      else splitH = rng() > 0.5;
    }

    if (splitH) {
      const minH = (w === 1 ? 2 : 1);
      const maxH = h - minH;
      const h1 = minH + Math.floor(rng() * (maxH - minH + 1));
      const r1 = { r1: rect.r1, c1: rect.c1, r2: rect.r1 + h1 - 1, c2: rect.c2 };
      const r2 = { r1: rect.r1 + h1, c1: rect.c1, r2: rect.r2, c2: rect.c2 };
      rects.splice(choice.index, 1, r1, r2);
    } else {
      const minW = (h === 1 ? 2 : 1);
      const maxW = w - minW;
      const w1 = minW + Math.floor(rng() * (maxW - minW + 1));
      const r1 = { r1: rect.r1, c1: rect.c1, r2: rect.r2, c2: rect.c1 + w1 - 1 };
      const r2 = { r1: rect.r1, c1: rect.c1 + w1, r2: rect.r2, c2: rect.c2 };
      rects.splice(choice.index, 1, r1, r2);
    }
  }

  // Populate grid: each rectangle receives exactly one clue number equal to its area
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const rect of rects) {
    const area = (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1);
    if (area < 2) continue; // Absolute safeguard: never place 1
    const rCell = rect.r1 + Math.floor(rng() * (rect.r2 - rect.r1 + 1));
    const cCell = rect.c1 + Math.floor(rng() * (rect.c2 - rect.c1 + 1));
    grid[rCell][cCell] = area;
  }

  return { size, grid };
};

export const solveSudoku = (grid) => {
  if (!grid || !Array.isArray(grid) || grid.length !== 9) return null;
  const board = grid.map(row => (Array.isArray(row) ? [...row] : []));
  
  const isValid = (r, c, val) => {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === val) return false;
      if (board[i][c] === val) return false;
      const br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
      const bc = Math.floor(c / 3) * 3 + (i % 3);
      if (board[br][bc] === val) return false;
    }
    return true;
  };

  const solve = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!board[r][c]) {
          for (let v = 1; v <= 9; v++) {
            if (isValid(r, c, v)) {
              board[r][c] = v;
              if (solve()) return true;
              board[r][c] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  return solve() ? board : null;
};

export const generateSudoku = (seedId = 'practice-sudoku-medium', overrideDifficulty = null) => {
  const seedStr = String(seedId || 'practice-sudoku');
  let difficulty = 'medium';
  if (overrideDifficulty) {
    const diffLower = String(overrideDifficulty).toLowerCase();
    if (diffLower.includes('easy')) difficulty = 'easy';
    else if (diffLower.includes('hard')) difficulty = 'hard';
    else difficulty = 'medium';
  } else if (seedStr.includes('easy')) {
    difficulty = 'easy';
  } else if (seedStr.includes('hard')) {
    difficulty = 'hard';
  }

  const isPractice = seedStr.startsWith('practice-');
  const rng = isPractice ? Math.random : mulberry32(hashString(seedStr + "sudoku"));

  // Build canonical solved 9x9 Sudoku base board
  let solution = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      row.push(((r * 3 + Math.floor(r / 3) + c) % 9) + 1);
    }
    solution.push(row);
  }

  // 1. Permute digits randomly (bijective mapping from 1-9 to 1-9)
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  const digitMap = {};
  for (let i = 0; i < 9; i++) digitMap[i + 1] = digits[i];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      solution[r][c] = digitMap[solution[r][c]];
    }
  }

  // 2. Shuffle rows within bands
  for (let band = 0; band < 3; band++) {
    const rStart = band * 3;
    for (let i = 0; i < 3; i++) {
      const j = Math.floor(rng() * 3);
      const k = Math.floor(rng() * 3);
      if (j !== k) {
        [solution[rStart + j], solution[rStart + k]] = [solution[rStart + k], solution[rStart + j]];
      }
    }
  }

  // 3. Shuffle columns within stacks
  for (let stack = 0; stack < 3; stack++) {
    const cStart = stack * 3;
    for (let i = 0; i < 3; i++) {
      const j = Math.floor(rng() * 3);
      const k = Math.floor(rng() * 3);
      if (j !== k) {
        for (let r = 0; r < 9; r++) {
          const tmp = solution[r][cStart + j];
          solution[r][cStart + j] = solution[r][cStart + k];
          solution[r][cStart + k] = tmp;
        }
      }
    }
  }

  // 4. Shuffle entire 3-row bands
  for (let i = 0; i < 2; i++) {
    const b1 = Math.floor(rng() * 3);
    const b2 = Math.floor(rng() * 3);
    if (b1 !== b2) {
      for (let r = 0; r < 3; r++) {
        [solution[b1 * 3 + r], solution[b2 * 3 + r]] = [solution[b2 * 3 + r], solution[b1 * 3 + r]];
      }
    }
  }

  // 5. Shuffle entire 3-column stacks
  for (let i = 0; i < 2; i++) {
    const s1 = Math.floor(rng() * 3);
    const s2 = Math.floor(rng() * 3);
    if (s1 !== s2) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 3; c++) {
          const tmp = solution[r][s1 * 3 + c];
          solution[r][s1 * 3 + c] = solution[r][s2 * 3 + c];
          solution[r][s2 * 3 + c] = tmp;
        }
      }
    }
  }

  // 6. Transpose with 50% probability
  if (rng() > 0.5) {
    const transposed = Array(9).fill(null).map(() => Array(9).fill(0));
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        transposed[c][r] = solution[r][c];
      }
    }
    solution = transposed;
  }

  // Generate initialGrid by removing cells with 180-degree rotational symmetry
  const initialGrid = solution.map(row => [...row]);
  const targetRemovals = difficulty === 'easy' ? 38 : (difficulty === 'hard' ? 52 : 46);

  const pairs = [];
  for (let r = 0; r < 5; r++) {
    const maxC = (r === 4) ? 5 : 9;
    for (let c = 0; c < maxC; c++) {
      pairs.push([[r, c], [8 - r, 8 - c]]);
    }
  }

  // Shuffle pairs
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  let removedCount = 0;
  for (const [p1, p2] of pairs) {
    if (removedCount >= targetRemovals) break;
    const isCenter = p1[0] === p2[0] && p1[1] === p2[1];
    if (isCenter) {
      initialGrid[p1[0]][p1[1]] = null;
      removedCount++;
    } else {
      if (removedCount + 2 <= targetRemovals) {
        initialGrid[p1[0]][p1[1]] = null;
        initialGrid[p2[0]][p2[1]] = null;
        removedCount += 2;
      }
    }
  }

  return {
    size: 9,
    initialGrid,
    solution,
    difficulty,
    cluesCount: 81 - removedCount
  };
};

export const validateSudokuGrid = (grid, initialGrid, solution = null) => {
  if (!grid || !Array.isArray(grid)) {
    return { isComplete: false, accuracy: 0, points: 0, conflicts: [], filledCount: 0, emptyTarget: 0, conflictCount: 0 };
  }

  const conflicts = Array(9).fill(null).map(() => Array(9).fill(false));
  let conflictCount = 0;

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = {};
    for (let c = 0; c < 9; c++) {
      const val = grid[r]?.[c];
      if (val) {
        if (seen[val] !== undefined) {
          conflicts[r][c] = true;
          conflicts[r][seen[val]] = true;
          conflictCount++;
        } else {
          seen[val] = c;
        }
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = {};
    for (let r = 0; r < 9; r++) {
      const val = grid[r]?.[c];
      if (val) {
        if (seen[val] !== undefined) {
          conflicts[r][c] = true;
          conflicts[seen[val]][c] = true;
          conflictCount++;
        } else {
          seen[val] = r;
        }
      }
    }
  }

  // Check 3x3 boxes
  for (let b = 0; b < 9; b++) {
    const seen = {};
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    for (let i = 0; i < 9; i++) {
      const r = br + Math.floor(i / 3);
      const c = bc + (i % 3);
      const val = grid[r]?.[c];
      if (val) {
        if (seen[val] !== undefined) {
          conflicts[r][c] = true;
          conflicts[seen[val][0]][seen[val][1]] = true;
          conflictCount++;
        } else {
          seen[val] = [r, c];
        }
      }
    }
  }

  let filledCount = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let emptyTarget = 0;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const isInitial = initialGrid && initialGrid[r] && initialGrid[r][c] !== null && initialGrid[r][c] !== undefined;
      if (!isInitial) {
        emptyTarget++;
        const val = grid[r]?.[c];
        if (val) {
          filledCount++;
          if (conflicts[r][c]) {
            wrongCount++;
          } else if (solution && solution[r] && solution[r][c] === val) {
            correctCount++;
          } else if (!solution) {
            correctCount++;
          } else {
            correctCount++;
          }
        }
      }
    }
  }

  const isComplete = (filledCount === emptyTarget) && (conflictCount === 0);
  let accuracy = 0;
  if (isComplete) {
    accuracy = 100;
  } else if (emptyTarget > 0) {
    const netCorrect = Math.max(0, correctCount - (wrongCount * 0.5));
    accuracy = Math.min(99, Math.round((netCorrect / emptyTarget) * 100));
  }

  return {
    isComplete,
    accuracy,
    points: accuracy,
    conflicts,
    filledCount,
    emptyTarget,
    conflictCount,
    correctCount
  };
};
