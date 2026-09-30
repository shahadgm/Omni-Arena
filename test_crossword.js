import clg from 'crossword-layout-generator';

const inputJson = [
  {"answer": "angle", "clue": "A shape made by two lines meeting"},
  {"answer": "brake", "clue": "Stop a vehicle / sounds like something broken"},
  {"answer": "silent", "clue": "Quiet / an anagram of LISTEN"},
  {"answer": "flour", "clue": "Used in baking / sounds like FLOWER"},
  {"answer": "current", "clue": "Happening now / flow of electricity"},
  {"answer": "match", "clue": "A contest / something used to make a fire"},
  {"answer": "secure", "clue": "Safe / obtain something successfully"},
  {"answer": "right", "clue": "Correct / opposite of left"}
];

const layout = clg.generateLayout(inputJson);
console.log(JSON.stringify(layout, null, 2));
