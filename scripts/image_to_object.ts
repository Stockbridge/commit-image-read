import { createCanvas, loadImage } from '@napi-rs/canvas';
import { groupPixels } from './group_pixels.js';
import { organizeByColumns } from './organize_columns.js';

interface ImageObject {
  [x: number]: {
    [y: number]: string;
  };
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
  imageToObject(imagePath).then(imageObj => {
    const width = Object.keys(imageObj).length;
    const height = Object.keys(imageObj[0]).length;
    console.log(`Processed image: ${width}x${height} pixels`);
    
    // Analyze unique colors
    const colorCounts = new Map<string, number>();
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const color = imageObj[x][y];
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    }
    
    console.log('Top 10 colors in image:');
    Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([color, count]) => {
        console.log(`  ${color}: ${count} pixels`);
      });
    
    const grouped = groupPixels(imageObj);
    console.log(`Found ${Object.keys(grouped).length} regions of 4x4+ pixels`);
    
    const columns = organizeByColumns(grouped);
    console.log(`Organized into ${Object.keys(columns).length} columns`);
    
    // Show level distribution
    const levelCounts = new Map<number, number>();
    Object.values(grouped).forEach(level => {
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    });
    
    console.log('Commit level distribution:');
    Array.from(levelCounts.entries()).sort().forEach(([level, count]) => {
      console.log(`  Level ${level}: ${count} regions`);
    });
  }).catch(console.error);
}
