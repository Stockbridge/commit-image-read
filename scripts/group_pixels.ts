interface ImageObject {
  [x: number]: {
    [y: number]: string;
  };
}

interface GroupedPixels {
  [key: string]: number;
}

const COLOR_TO_LEVEL = new Map([
  // Level 0 - No commits (gray ~238,238,238)
  ['238,238,238', 0], ['237,237,237', 0], ['236,236,236', 0], ['239,239,239', 0],
  ['235,235,235', 0], ['235,236,236', 0], ['242,242,242', 0], ['231,231,231', 0],
  ['240,240,240', 0], ['243,243,243', 0], ['241,241,241', 0], ['239,238,238', 0],
  ['237,237,238', 0],
  
  // Level 1 - One commit (light blue ~164,210,238)
  ['164,211,238', 1], ['165,211,238', 1], ['166,211,238', 1], ['162,210,238', 1],
  ['156,207,237', 1], ['157,207,237', 1], ['163,211,238', 1], ['155,206,237', 1],
  ['160,209,238', 1], ['161,210,238', 1], ['158,208,237', 1], ['154,206,237', 1],
  ['158,208,238', 1], ['159,208,238', 1], ['163,210,238', 1], ['161,209,238', 1],
  
  // Level 2 - Two commits (blue ~103,200,255)
  ['104,200,255', 2], ['107,201,255', 2], ['106,201,255', 2], ['105,200,255', 2],
  ['100,199,255', 2], ['101,199,255', 2], ['103,200,255', 2],
  
  // Level 3 - Three commits (slate blue ~89,150,184)
  ['89,149,183', 3], ['91,150,184', 3], ['92,151,185', 3], ['90,150,183', 3],
  ['92,151,184', 3], ['90,149,183', 3], ['88,148,182', 3], ['84,147,182', 3],
  ['93,152,185', 3], ['88,148,183', 3], ['95,153,185', 3],
  
  // Level 4 - Four+ commits (dark blue ~0,64,134)
  ['0,63,135', 4], ['1,65,136', 4], ['0,59,132', 4], ['6,67,136', 4], ['3,66,135', 4],
  ['0,43,124', 4], ['6,68,137', 4], ['6,68,136', 4], ['0,45,125', 4], ['0,47,125', 4],
  ['0,56,131', 4], ['1,65,134', 4], ['0,59,133', 4], ['0,60,133', 4], ['0,52,128', 4],
  ['0,44,124', 4], ['8,68,137', 4], ['4,66,137', 4], ['0,47,126', 4], ['0,54,130', 4],
  ['0,49,127', 4], ['0,58,132', 4], ['0,55,130', 4], ['0,62,134', 4],
]);

function getCommitLevel(color: string): number | null {
  return COLOR_TO_LEVEL.has(color) ? COLOR_TO_LEVEL.get(color)! : null;
}

export function groupPixels(imageObj: ImageObject): GroupedPixels {
  const visited = new Set<string>();
  const result: GroupedPixels = {};
  
  const width = Object.keys(imageObj).length;
  const height = Object.keys(imageObj[0]).length;
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      
      const color = imageObj[x][y];
      const level = getCommitLevel(color);
      if (level === null) continue;
      
      const region = floodFillByLevel(imageObj, x, y, level, visited, width, height);
      
      if (region.length >= 16) { // 4x4 minimum
        const topLeft = region.reduce((min, coord) => {
          const [cx, cy] = coord.split(',').map(Number);
          const [mx, my] = min.split(',').map(Number);
          return (cy < my || (cy === my && cx < mx)) ? coord : min;
        });
        result[topLeft] = level;
      }
    }
  }
  
  return result;
}

function floodFillByLevel(imageObj: ImageObject, startX: number, startY: number, targetLevel: number, visited: Set<string>, width: number, height: number): string[] {
  const stack = [`${startX},${startY}`];
  const region: string[] = [];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    
    const [x, y] = current.split(',').map(Number);
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const currentLevel = getCommitLevel(imageObj[x][y]);
    if (currentLevel !== targetLevel) continue;
    
    visited.add(current);
    region.push(current);
    
    stack.push(`${x+1},${y}`, `${x-1},${y}`, `${x},${y+1}`, `${x},${y-1}`);
  }
  
  return region;
}
