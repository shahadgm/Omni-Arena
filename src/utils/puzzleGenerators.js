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
