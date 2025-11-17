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

async function parseHeatmap(imagePath: string, year: number): Promise<CommitData> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  
  const squareSize = 11;
  const startX = 30;
  const startY = 20;
  const days = ['su', 'm', 't', 'w', 'th', 'f', 's'];
  
  const result: CommitData = { [year]: {} };
  
  for (let week = 0; week < 53; week++) {
    const weekData: any = {};
    
    for (let day = 0; day < 7; day++) {
      const x = startX + week * (squareSize + 2);
      const y = startY + day * (squareSize + 2);
      
      if (x < image.width && y < image.height) {
        const imageData = ctx.getImageData(x, y, 1, 1);
        const [r, g, b] = imageData.data;
        weekData[days[day]] = getCommitLevel(r, g, b);
      } else {
        weekData[days[day]] = 0;
      }
    }
    
    result[year][week + 1] = weekData;
  }
  
  return result;
}

// Usage
parseHeatmap('./images/22_23_CommitHistory_CommitOnly.png', 2022)
  .then(data => console.log(JSON.stringify(data, null, 2)));
