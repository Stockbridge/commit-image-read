import { createCanvas, loadImage } from '@napi-rs/canvas';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  color: [number, number, number];
}

function findBoxes(ctx: any, width: number, height: number): Box[] {
  const bgColor = [235, 237, 240];
  const boxes: Box[] = [];
  
  for (let y = 0; y < height - 8; y += 2) {
    for (let x = 0; x < width - 8; x += 2) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const [r, g, b] = pixel;
      
      // Skip white/light colors (high RGB values)
      if (r > 200 && g > 200 && b > 200) continue;
      
      // Check if not background
      const colorDistance = Math.sqrt(
        Math.pow(r - bgColor[0], 2) + 
        Math.pow(g - bgColor[1], 2) + 
        Math.pow(b - bgColor[2], 2)
      );
      
      if (colorDistance > 30) { // Must be distinctly different from background
        // Measure box dimensions
        let boxWidth = 1;
        while (x + boxWidth < width) {
          const rightPixel = ctx.getImageData(x + boxWidth, y, 1, 1).data;
          const rightDistance = Math.sqrt(
            Math.pow(rightPixel[0] - bgColor[0], 2) + 
            Math.pow(rightPixel[1] - bgColor[1], 2) + 
            Math.pow(rightPixel[2] - bgColor[2], 2)
          );
          if (rightDistance <= 30) break;
          boxWidth++;
        }
        
        let boxHeight = 1;
        while (y + boxHeight < height) {
          const bottomPixel = ctx.getImageData(x, y + boxHeight, 1, 1).data;
          const bottomDistance = Math.sqrt(
            Math.pow(bottomPixel[0] - bgColor[0], 2) + 
            Math.pow(bottomPixel[1] - bgColor[1], 2) + 
            Math.pow(bottomPixel[2] - bgColor[2], 2)
          );
          if (bottomDistance <= 30) break;
          boxHeight++;
        }
        
        // Only keep boxes at least 8 pixels wide
        if (boxWidth >= 8) {
          boxes.push({
            x,
            y,
            width: boxWidth,
            height: boxHeight,
            color: [r, g, b]
          });
        }
      }
    }
  }
  
  return boxes;
}

async function detectBoxesFromImage(imagePath: string): Promise<Box[]> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  
  const boxes = findBoxes(ctx, image.width, image.height);
  
  console.log(`Found ${boxes.length} boxes (≥8px wide):`);
  boxes.forEach((box, i) => {
    console.log(`Box ${i + 1}: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}, color=[${box.color.join(',')}]`);
  });
  
  return boxes;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  detectBoxesFromImage('./images/22_23_CommitHistory_CommitOnly.png');
}

export { findBoxes, detectBoxesFromImage };
