/**
 * Inpainting processor for client-side canvas preview.
 * Implements boundary-weighted color diffusion for interactive demonstration.
 */

export function inpaintCanvasRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  method: 'propainter' | 'e2fgvi' | 'opencv_telea' | 'delogo' = 'propainter'
) {
  // Boundary constraints
  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;
  
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const w = Math.min(canvasW - startX, Math.ceil(width));
  const h = Math.min(canvasH - startY, Math.ceil(height));

  if (w <= 0 || h <= 0) return;

  const padding = 8;
  const sampleX = Math.max(0, startX - padding);
  const sampleY = Math.max(0, startY - padding);
  const sampleW = Math.min(canvasW - sampleX, w + padding * 2);
  const sampleH = Math.min(canvasH - sampleY, h + padding * 2);

  const imgData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
  const data = imgData.data;

  // Relative bounding box inside sampled area
  const relX1 = startX - sampleX;
  const relY1 = startY - sampleY;
  const relX2 = relX1 + w;
  const relY2 = relY1 + h;

  // Sample perimeter colors around the box
  const topColors: number[][] = [];
  const bottomColors: number[][] = [];
  const leftColors: number[][] = [];
  const rightColors: number[][] = [];

  for (let px = relX1; px < relX2; px++) {
    // Top boundary sample
    if (relY1 > 1) {
      const idx = ((relY1 - 1) * sampleW + px) * 4;
      topColors.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    // Bottom boundary sample
    if (relY2 < sampleH - 1) {
      const idx = (relY2 * sampleW + px) * 4;
      bottomColors.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  for (let py = relY1; py < relY2; py++) {
    // Left boundary sample
    if (relX1 > 1) {
      const idx = (py * sampleW + (relX1 - 1)) * 4;
      leftColors.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    // Right boundary sample
    if (relX2 < sampleW - 1) {
      const idx = (py * sampleW + relX2) * 4;
      rightColors.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  // Bilinear + Inverse Distance Weighted interpolation inside the ROI
  for (let py = relY1; py < relY2; py++) {
    for (let px = relX1; px < relX2; px++) {
      const distLeft = px - relX1 + 1;
      const distRight = relX2 - px;
      const distTop = py - relY1 + 1;
      const distBottom = relY2 - py;

      const wLeft = 1 / (distLeft * distLeft);
      const wRight = 1 / (distRight * distRight);
      const wTop = 1 / (distTop * distTop);
      const wBottom = 1 / (distBottom * distBottom);

      const totalWeight = wLeft + wRight + wTop + wBottom;

      // Nearest border sample indices
      const topIdx = Math.min(topColors.length - 1, Math.max(0, Math.floor(((px - relX1) / w) * topColors.length)));
      const bottomIdx = Math.min(bottomColors.length - 1, Math.max(0, Math.floor(((px - relX1) / w) * bottomColors.length)));
      const leftIdx = Math.min(leftColors.length - 1, Math.max(0, Math.floor(((py - relY1) / h) * leftColors.length)));
      const rightIdx = Math.min(rightColors.length - 1, Math.max(0, Math.floor(((py - relY1) / h) * rightColors.length)));

      const colTop = topColors[topIdx] || [128, 128, 128];
      const colBottom = bottomColors[bottomIdx] || [128, 128, 128];
      const colLeft = leftColors[leftIdx] || [128, 128, 128];
      const colRight = rightColors[rightIdx] || [128, 128, 128];

      let r = (colTop[0] * wTop + colBottom[0] * wBottom + colLeft[0] * wLeft + colRight[0] * wRight) / totalWeight;
      let g = (colTop[1] * wTop + colBottom[1] * wBottom + colLeft[1] * wLeft + colRight[1] * wRight) / totalWeight;
      let b = (colTop[2] * wTop + colBottom[2] * wBottom + colLeft[2] * wLeft + colRight[2] * wRight) / totalWeight;

      // If simulated ProPainter or E2FGVI, add subtle texture blending to simulate neural optical flow coherence
      if (method === 'propainter' || method === 'e2fgvi') {
        const noise = (Math.sin(px * 12.9898 + py * 78.233) * 43758.5453 % 1) * 3 - 1.5;
        r = Math.min(255, Math.max(0, r + noise));
        g = Math.min(255, Math.max(0, g + noise));
        b = Math.min(255, Math.max(0, b + noise));
      }

      const pixelIdx = (py * sampleW + px) * 4;
      data[pixelIdx] = Math.round(r);
      data[pixelIdx + 1] = Math.round(g);
      data[pixelIdx + 2] = Math.round(b);
      data[pixelIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, sampleX, sampleY);
}
