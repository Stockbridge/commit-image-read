import { createCanvas, loadImage } from '@napi-rs/canvas';
import { groupPixels } from './group_pixels.js';
import { fuzzyGroupColumns } from './organize_columns.js';

interface ImageObject {
  [x: number]: {
    [y: number]: string;
  };
}

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

function columnsToCommitData(columns: any, years: number[]): CommitData {
  const result: CommitData = {};
  
  // Group columns by Y coordinate ranges to separate grids
  const columnsByY = Object.entries(columns).map(([x, regions]: [string, any]) => ({
    x: parseInt(x),
    regions,
    avgY: regions.reduce((sum: number, r: any) => sum + parseInt(r.coord.split(',')[1]), 0) / regions.length
  })).sort((a, b) => a.avgY - b.avgY);
  
  // Split into grids based on Y gaps
  const grids: any[][] = [];
  let currentGrid: any[] = [];
  let lastY = -1;
  
  for (const col of columnsByY) {
    if (lastY !== -1 && Math.abs(col.avgY - lastY) > 50) {
      if (currentGrid.length > 0) grids.push(currentGrid);
      currentGrid = [];
    }
    currentGrid.push(col);
    lastY = col.avgY;
  }
  if (currentGrid.length > 0) grids.push(currentGrid);
  
  // Process each grid as a year
  grids.forEach((grid, gridIndex) => {
    if (gridIndex >= years.length) return;
    
    const year = years[gridIndex];
    result[year] = {};
    
    // Sort columns by X coordinate and limit to 52
    const sortedCols = grid.sort((a, b) => a.x - b.x).slice(0, 52);
    
    // Detect if this grid should use reverse numbering (short grid at far right)
    const isShortGrid = sortedCols.length <= 10;
    const avgX = sortedCols.reduce((sum, col) => sum + col.x, 0) / sortedCols.length;
    const isRightSide = avgX > 400; // Adjust threshold as needed
    
    const useReverseNumbering = isShortGrid && isRightSide;
    const maxWeeks = useReverseNumbering ? 9 : 52;
    const startWeek = useReverseNumbering ? 44 : 1;
    
    sortedCols.slice(0, maxWeeks).forEach((col, weekIndex) => {
      const week = useReverseNumbering ? startWeek + weekIndex : weekIndex + 1;
      const weekData = { su: 0, m: 0, t: 0, w: 0, th: 0, f: 0, s: 0 };
      const dayKeys = ['su', 'm', 't', 'w', 'th', 'f', 's'];
      
      // Sort regions by Y coordinate (days of week)
      const sortedRegions = col.regions.sort((a: any, b: any) => {
        const yA = parseInt(a.coord.split(',')[1]);
        const yB = parseInt(b.coord.split(',')[1]);
        return yA - yB;
      }).slice(0, 7);
      
      sortedRegions.forEach((region: any, dayIndex: number) => {
        if (dayIndex < 7) {
          weekData[dayKeys[dayIndex] as keyof typeof weekData] = region.level;
        }
      });
      
      result[year][week] = weekData;
    });
  });
  
  return result;
}

export async function parseCommitImage(imagePath: string, years: number[]): Promise<CommitData> {
  const imageObj = await imageToObject(imagePath);
  const grouped = groupPixels(imageObj);
  const columns = fuzzyGroupColumns(grouped);
  return columnsToCommitData(columns, years);
}

export async function imageToObject(imagePath: string): Promise<ImageObject> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;
  
  const result: ImageObject = {};
  
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const index = (y * image.width + x) * 4;
      
      if (!result[x]) result[x] = {};
      result[x][y] = `${data[index]},${data[index + 1]},${data[index + 2]}`;
    }
  }
  
  return result;
}

// CLI execution
if (process.argv[2]) {
  const imagePath = process.argv[2];
  const years = process.argv[3] ? process.argv[3].split(',').map(Number) : [2022, 2023];
  
  // Test the new parseCommitImage function
  parseCommitImage(imagePath, years).then(commitData => {
    console.log('Parsed commit data:');
    console.log(JSON.stringify(commitData, null, 2));
  }).catch(console.error);
}
