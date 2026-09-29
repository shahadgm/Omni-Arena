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
  const seedNum = seedId.replace(/\D/g, '') || '1';
  const rng = mulberry32(hashString(seedNum + "shikaku"));
  
  let size = 7;
  if (overrideSize) {
    size = parseInt(overrideSize.split('x')[0]);
  } else if (seedId.includes('5x5')) size = 5;
  else if (seedId.includes('10x10')) size = 10;
  
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  let availableCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      availableCells.push({r, c});
    }
  }
  
  while (availableCells.length > 0) {
    const idx = Math.floor(rng() * availableCells.length);
    const start = availableCells[idx];
    
    let maxW = 1, maxH = 1;
    for (let w = 1; w <= size - start.c; w++) {
      let canPlace = true;
      for (let c = start.c; c < start.c + w; c++) {
        if (!availableCells.some(cell => cell.r === start.r && cell.c === c)) canPlace = false;
      }
      if (canPlace) maxW = w; else break;
    }
    
    let w = 1 + Math.floor(rng() * maxW);
    for (let h = 1; h <= size - start.r; h++) {
      let canPlace = true;
      for (let r = start.r; r < start.r + h; r++) {
        for (let c = start.c; c < start.c + w; c++) {
          if (!availableCells.some(cell => cell.r === r && cell.c === c)) canPlace = false;
        }
      }
      if (canPlace) maxH = h; else break;
    }
    
    let h = 1 + Math.floor(rng() * maxH);
    
    // Prevent 1x1 rectangles
    if (w === 1 && h === 1) {
      if (start.c + 1 < size && availableCells.some(c => c.r === start.r && c.c === start.c + 1)) w = 2;
      else if (start.r + 1 < size && availableCells.some(c => c.r === start.r + 1 && c.c === start.c)) h = 2;
    }
    
    const area = w * h;
    const numR = start.r + Math.floor(rng() * h);
    const numC = start.c + Math.floor(rng() * w);
    grid[numR][numC] = area;
    
    for (let r = start.r; r < start.r + h; r++) {
      for (let c = start.c; c < start.c + w; c++) {
        availableCells = availableCells.filter(cell => !(cell.r === r && cell.c === c));
      }
    }
  }
  
  return { size, grid };
};
