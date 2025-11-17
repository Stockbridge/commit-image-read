import { createCanvas, loadImage } from '@napi-rs/canvas';

interface GridBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const AMAZON_COMMIT_LEVELS = {
  0: [238, 238, 238], // No commits (grey)
  1: [164, 210, 238], // 1 commit (light blue)
  2: [103, 200, 255], // 2 commits (blue)
  3: [89, 150, 184],  // 3 commits (slate blue)
  4: [0, 64, 134]     // 4+ commits (dark blue)
};

function classifyCommitLevel(color: [number, number, number]): number {
  const [r, g, b] = color;
  let closestLevel = 0;
  let minDistance = Infinity;
  
  for (const [level, [tr, tg, tb]] of Object.entries(AMAZON_COMMIT_LEVELS)) {
    const distance = Math.sqrt(
      Math.pow(r - tr, 2) + 
      Math.pow(g - tg, 2) + 
      Math.pow(b - tb, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestLevel = parseInt(level);
    }
  }
  
  // If the closest match is still far away, it might be white background
  if (minDistance > 50 && r > 240 && g > 240 && b > 240) {
    return 0; // Treat as no commits
  }
  
  return closestLevel;
}

interface CommitData {
  week: number;
  day: number;
  x: number;
  y: number;
  color: [number, number, number];
  level: number;
}

function findCommitGrid(ctx: any, width: number, height: number): GridBounds | null {
  // First, scan for actual Amazon commit colors
  const commitPixels: {x: number, y: number, level: number}[] = [];
  
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      console.info(pixel)
      const color: [number, number, number] = [pixel[0], pixel[1], pixel[2]];
      const level = classifyCommitLevel(color);
      
      // Only keep actual commit colors (not white/background/black borders)
      if ((level > 0 || (color[0] === 238 && color[1] === 238 && color[2] === 238)) && 
          !(color[0] === 0 && color[1] === 0 && color[2] === 0)) { // Exclude pure black
        commitPixels.push({x, y, level});
      }
    }
  }
  
  console.log(`Found ${commitPixels.length} potential commit pixels`);
  
  if (commitPixels.length < 10) return null;
  
  // Find the top-left corner of the grid
  const minX = Math.min(...commitPixels.map(p => p.x));
  const minY = Math.min(...commitPixels.map(p => p.y));
  
  // Adjust to likely grid start (account for square centers)
  const gridStartX = minX - 5;
  const gridStartY = minY - 5;
  
  console.log(`Grid likely starts around x=${gridStartX}, y=${gridStartY}`);
  
  return {
    x: gridStartX,
    y: gridStartY,
    width: 53 * 13,
    height: 7 * 13
  };
}

function extractCommitData(ctx: any, gridBounds: GridBounds): CommitData[] {
  const cellSize = 11;
  const gap = 2;
  const stride = cellSize + gap;
  const commits: CommitData[] = [];
  
  // Extract 53 weeks × 7 days
  for (let week = 0; week < 53; week++) {
    for (let day = 0; day < 7; day++) {
      const x = gridBounds.x + (week * stride);
      const y = gridBounds.y + (day * stride);
      
      // Sample from center of square
      const centerX = x + Math.floor(cellSize / 2);
      const centerY = y + Math.floor(cellSize / 2);
      
      if (centerX < ctx.canvas.width && centerY < ctx.canvas.height) {
        const pixel = ctx.getImageData(centerX, centerY, 1, 1).data;
        const color: [number, number, number] = [pixel[0], pixel[1], pixel[2]];
        
        commits.push({
          week,
          day,
          x: centerX,
          y: centerY,
          color,
          level: classifyCommitLevel(color)
        });
      }
    }
  }
  
  return commits;
}

async function detectCommitGrid(imagePath: string): Promise<CommitData[]> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  
  console.log(`Analyzing image: ${image.width}x${image.height}`);
  
  const gridBounds = findCommitGrid(ctx, image.width, image.height);
  
  if (!gridBounds) {
    console.log('No commit grid found');
    return [];
  }
  
  console.log(`Found grid at: x=${gridBounds.x}, y=${gridBounds.y}, size=${gridBounds.width}x${gridBounds.height}`);
  
  const commits = extractCommitData(ctx, gridBounds);
  
  console.log(`Extracted ${commits.length} commit squares`);
  
  // Show commit level distribution
  const levelCounts = [0, 0, 0, 0, 0];
  commits.forEach(commit => levelCounts[commit.level]++);
  
  console.log('Commit level distribution:');
  levelCounts.forEach((count, level) => {
    console.log(`  Level ${level}: ${count} squares`);
  });
  
  // Show unique colors found
  const uniqueColors = new Map<string, number>();
  commits.forEach(commit => {
    const colorKey = commit.color.join(',');
    uniqueColors.set(colorKey, (uniqueColors.get(colorKey) || 0) + 1);
  });
  
  console.log('\nUnique colors found:');
  Array.from(uniqueColors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([color, count]) => {
      const [r, g, b] = color.split(',').map(Number);
      const level = classifyCommitLevel([r, g, b]);
      console.log(`  [${color}]: ${count} times -> Level ${level}`);
    });
  
  console.log('\nSample commits:');
  commits.slice(0, 20).forEach((commit, i) => {
    console.log(`  Week ${commit.week}, Day ${commit.day}: [${commit.color.join(',')}] -> Level ${commit.level}`);
  });
  
  return commits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  detectCommitGrid('./images/22_23_CommitHistory_CommitOnly.png');
}

export { detectCommitGrid, findCommitGrid, extractCommitData };
