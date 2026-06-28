import { ocrService, OCRResult, OCRBlock } from './ocr.service';

export interface TiledOCRBlock extends OCRBlock {
  absoluteY0: number;
  absoluteY1: number;
}

export class ImageProcessor {
  /**
   * Splits a long screenshot into overlapping tiles.
   */
  static async tileImage(file: File, tileHeight = 1200, overlap = 200): Promise<{ blob: Blob; offset: number }[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const tiles: { blob: Blob; offset: number }[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');

        canvas.width = img.width;
        let y = 0;

        const processNextTile = () => {
          if (y >= img.height && tiles.length > 0) {
            resolve(tiles);
            return;
          }
          if (y >= img.height) { resolve([]); return; }

          const currentTileHeight = Math.min(tileHeight, img.height - y);
          canvas.height = currentTileHeight;
          ctx.drawImage(img, 0, y, img.width, currentTileHeight, 0, 0, img.width, currentTileHeight);

          const currentY = y;
          canvas.toBlob((blob) => {
            if (blob) tiles.push({ blob, offset: currentY });

            if (currentY + currentTileHeight >= img.height) {
              resolve(tiles);
            } else {
              y += (tileHeight - overlap);
              processNextTile();
            }
          }, 'image/jpeg', 0.90);
        };

        processNextTile();
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  static async processTiledImage(file: File): Promise<OCRResult> {
    const tiles = await this.tileImage(file);
    const allBlocks: TiledOCRBlock[] = [];

    for (const tile of tiles) {
      const result = await ocrService.processImage(tile.blob);

      // Filter out low confidence blocks and UI noise
      const filteredBlocks = result.blocks
        .filter(b => b.confidence > 60) // Increased confidence threshold
        .filter(b => !this.isUINoise(b.text))
        .map(b => ({
          ...b,
          absoluteY0: b.bbox.y0 + tile.offset,
          absoluteY1: b.bbox.y1 + tile.offset
        }));

      allBlocks.push(...filteredBlocks);
    }

    return this.mergeAndSortBlocks(allBlocks);
  }

  private static isUINoise(text: string): boolean {
    const noisePatterns = [
      /^[0-9]{1,2}:[0-9]{2}/, // Time
      /^[0-9]{1,3}%/,         // Battery %
      /LTE|4G|5G|WiFi/i,      // Network
      /^Status$/i,
      /^Settings$/i,
      /^Back$/i,
      /^Home$/i
    ];
    return noisePatterns.some(p => p.test(text.trim()));
  }

  private static mergeAndSortBlocks(blocks: TiledOCRBlock[]): OCRResult {
    if (blocks.length === 0) return { text: '', confidence: 0, blocks: [] };

    // Deduplicate overlapping blocks
    // If two blocks have significant vertical overlap and similar text, keep the one with higher confidence
    const deduped: TiledOCRBlock[] = [];

    blocks.sort((a, b) => a.absoluteY0 - b.absoluteY0);

    blocks.forEach(block => {
      const isDuplicate = deduped.some(existing => {
        const verticalOverlap = Math.min(block.absoluteY1, existing.absoluteY1) - Math.max(block.absoluteY0, existing.absoluteY0);
        const overlapRatio = verticalOverlap / Math.min(block.absoluteY1 - block.absoluteY0, existing.absoluteY1 - existing.absoluteY0);

        if (overlapRatio > 0.7) {
          // Check text similarity (simplified)
          const s1 = block.text.trim().toLowerCase();
          const s2 = existing.text.trim().toLowerCase();
          return s1.includes(s2) || s2.includes(s1);
        }
        return false;
      });

      if (!isDuplicate) {
        deduped.push(block);
      } else {
        // If it was a duplicate, maybe update existing if current has higher confidence
        // For simplicity, we just keep the first one found as they are sorted by Y
      }
    });

    const avgConfidence = deduped.reduce((acc, b) => acc + b.confidence, 0) / deduped.length;

    return {
      text: deduped.map(b => b.text).join('\n'),
      confidence: avgConfidence,
      blocks: deduped.map(b => ({
        ...b,
        bbox: { ...b.bbox, y0: b.absoluteY0, y1: b.absoluteY1 }
      }))
    };
  }
}
