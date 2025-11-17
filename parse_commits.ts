import { createCanvas, loadImage } from '@napi-rs/canvas';

interface CommitData {
  [year: string]: {
    [week: string]: {
      su: number;
      m: number;
      t: number;
      w: number;
      th: number;
      f: number;
      s: number;
    };
  };
}

function getCommitLevel(r: number, g: number, b: number): number {
  const colors = [
    { rgb: [235, 237, 240], level: 0 }, // No commits
    { rgb: [155, 233, 168], level: 1 }, // Light
    { rgb: [64, 196, 255], level: 1 },  // Light blue
    { rgb: [48, 161, 78], level: 2 },   // Medium
    { rgb: [33, 110, 57], level: 3 },   // Dark
    { rgb: [24, 69, 59], level: 4 }     // Darkest
  ];

  let minDist = Infinity;
  let level = 0;
  
  for (const color of colors) {
    const dist = Math.pow(r - color.rgb[0], 2) + 
                  Math.pow(g - color.rgb[1], 2) + 
                  Math.pow(b - color.rgb[2], 2);
    if (dist < minDist) {
      minDist = dist;
      level = color.level;
    }
  }
  return level;
}

function detectGrid(ctx: any, width: number, height: number): { startX: number, startY: number, squareSize: number, spacing: number } {
  const bgColor = [235, 237, 240];
  
  // Look for small squares (5-20 pixels) in a grid pattern
  for (let y = 10; y < height - 100; y += 2) {
    for (let x = 10; x < width - 100; x += 2) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const [r, g, b] = pixel;
      
      const dist = Math.pow(r - bgColor[0], 2) + Math.pow(g - bgColor[1], 2) + Math.pow(b - bgColor[2], 2);
      if (dist > 100) {
        // Found a non-background pixel, check if it's part of a small square
        let size = 1;
        while (size < 20 && x + size < width && y + size < height) {
          const cornerPixel = ctx.getImageData(x + size, y + size, 1, 1).data;
          const cornerDist = Math.pow(cornerPixel[0] - bgColor[0], 2) + Math.pow(cornerPixel[1] - bgColor[1], 2) + Math.pow(cornerPixel[2] - bgColor[2], 2);
          if (cornerDist < 100) break; // Hit background
          size++;
        }
        
        if (size >= 8 && size <= 15) { // Reasonable square size
          // Check for next square to determine spacing
          let nextX = x + size + 1;
          while (nextX < width - size) {
            const nextPixel = ctx.getImageData(nextX, y, 1, 1).data;
            const nextDist = Math.pow(nextPixel[0] - bgColor[0], 2) + Math.pow(nextPixel[1] - bgColor[1], 2) + Math.pow(nextPixel[2] - bgColor[2], 2);
            if (nextDist > 100) {
              const spacing = nextX - x - size;
              return { startX: x, startY: y, squareSize: size, spacing };
            }
            nextX++;
          }
        }
      }
    }
  }
  
  return { startX: 30, startY: 20, squareSize: 11, spacing: 2 };
}

function detectAllGrids(ctx: any, width: number, height: number): Array<{ startX: number, startY: number, squareSize: number, spacing: number }> {
  const grids = [];
  const bgColor = [235, 237, 240];
  
  for (let y = 10; y < height - 100; y += 10) {
    for (let x = 10; x < width - 200; x += 5) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const [r, g, b] = pixel;
      
      const dist = Math.pow(r - bgColor[0], 2) + Math.pow(g - bgColor[1], 2) + Math.pow(b - bgColor[2], 2);
      if (dist > 100) {
        let size = 1;
        while (size < 20 && x + size < width && y + size < height) {
          const cornerPixel = ctx.getImageData(x + size, y + size, 1, 1).data;
          const cornerDist = Math.pow(cornerPixel[0] - bgColor[0], 2) + Math.pow(cornerPixel[1] - bgColor[1], 2) + Math.pow(cornerPixel[2] - bgColor[2], 2);
          if (cornerDist < 100) break;
          size++;
        }
        
        if (size >= 8 && size <= 15) {
          let nextX = x + size + 1;
          while (nextX < x + size + 5) {
            const nextPixel = ctx.getImageData(nextX, y, 1, 1).data;
            const nextDist = Math.pow(nextPixel[0] - bgColor[0], 2) + Math.pow(nextPixel[1] - bgColor[1], 2) + Math.pow(nextPixel[2] - bgColor[2], 2);
            if (nextDist > 100) {
              const spacing = nextX - x - size;
              
              // Check if already found nearby
              const existing = grids.find(g => Math.abs(g.startY - y) < 15 && Math.abs(g.startX - x) < 15);
              if (!existing) {
                grids.push({ startX: x, startY: y, squareSize: size, spacing });
              }
              break;
            }
            nextX++;
          }
        }
      }
    }
  }
  
  return grids.sort((a, b) => a.startY - b.startY).slice(0, 2);
}

async function parseHeatmap(imagePath: string): Promise<CommitData> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  
  const grids = detectAllGrids(ctx, image.width, image.height);
  console.log(`Detected ${grids.length} grids:`, grids);
  
  const days = ['su', 'm', 't', 'w', 'th', 'f', 's'];
  const result: CommitData = {};
  
  if (grids.length >= 2) {
    // 2022 - weeks 44-52 (9 weeks)
    result[2022] = {};
    for (let week = 0; week < 9; week++) {
      const weekData: any = {};
      for (let day = 0; day < 7; day++) {
        const x = grids[0].startX + week * (grids[0].squareSize + grids[0].spacing);
        const y = grids[0].startY + day * (grids[0].squareSize + grids[0].spacing);
        
        if (x < image.width && y < image.height) {
          const imageData = ctx.getImageData(x, y, 1, 1);
          const [r, g, b] = imageData.data;
          weekData[days[day]] = getCommitLevel(r, g, b);
        } else {
          weekData[days[day]] = 0;
        }
      }
      result[2022][44 + week] = weekData;
    }
    
    // 2023 - weeks 1-44 (44 weeks)
    result[2023] = {};
    for (let week = 0; week < 44; week++) {
      const weekData: any = {};
      for (let day = 0; day < 7; day++) {
        const x = grids[1].startX + week * (grids[1].squareSize + grids[1].spacing);
        const y = grids[1].startY + day * (grids[1].squareSize + grids[1].spacing);
        
        if (x < image.width && y < image.height) {
          const imageData = ctx.getImageData(x, y, 1, 1);
          const [r, g, b] = imageData.data;
          weekData[days[day]] = getCommitLevel(r, g, b);
        } else {
          weekData[days[day]] = 0;
        }
      }
      result[2023][week + 1] = weekData;
    }
  }
  
  return result;
}

// Usage
parseHeatmap('./images/22_23_CommitHistory_CommitOnly.png')
  .then(data => console.log(JSON.stringify(data, null, 2)));
