const fs = require('fs');

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

for(let i=0; i < (1 << 25); i++) {
    const grid = [];
    for(let r=0; r<5; r++) {
        const row = [];
        for(let c=0; c<5; c++) {
            row.push((i & (1 << (r*5 + c))) !== 0);
        }
        grid.push(row);
    }
    
    const rowClues = grid.map(r => getClues(r).join(','));
    if (rowClues[0] !== '2') continue;
    if (rowClues[1] !== '2') continue;
    if (rowClues[2] !== '1,1') continue;
    if (rowClues[3] !== '1,1') continue;
    if (rowClues[4] !== '1,1') continue;
    
    const colClues = [];
    for(let c=0; c<5; c++) {
        const col = [];
        for(let r=0; r<5; r++) col.push(grid[r][c]);
        colClues.push(getClues(col).join(','));
    }
    
    if (colClues[0] === '3' && colClues[1] === '2' && colClues[2] === '2,1' && colClues[3] === '1,1' && colClues[4] === '1') {
        console.log("FOUND EXACT MATCH!");
        console.log(grid);
    }
    
    // what if col5 is 1,1?
    if (colClues[0] === '3' && colClues[1] === '2' && colClues[2] === '2,1' && colClues[3] === '1,1' && colClues[4] === '1,1') {
        console.log("FOUND MATCH WITH COL5=1,1");
    }
}
