import { ocrService, OCRResult, OCRBlock } from './ocr.service';

export interface TiledOCRBlock extends OCRBlock {
  absoluteY0: number;
  absoluteY1: number;
}

export class ImageProcessor {
  /**
   * Preprocesses image: Rotation correction (metadata), tiling for long screenshots.
   * Note: Browser canvas handles most rotation automatically from EXIF.
   */
  static async processTiledImage(file: File): Promise<OCRResult> {
    const tiles = await this.tileImage(file);
    const allBlocks: TiledOCRBlock[] = [];

    for (const tile of tiles) {
      // Contrast/Noise logic usually handled by Tesseract.js internally
      // but we can add canvas filters if accuracy stays low.
      const result = await ocrService.processImage(tile.blob);

      const filteredBlocks = result.blocks
        .filter(b => b.confidence > 45)
        .filter(b => !this.isUINoise(b.text, b.bbox, tile.offset))
        .map(b => ({
          ...b,
          absoluteY0: b.bbox.y0 + tile.offset,
          absoluteY1: b.bbox.y1 + tile.offset
        }));

      allBlocks.push(...filteredBlocks);
    }

    return this.mergeAndSortBlocks(allBlocks);
  }

  private static async tileImage(file: File, tileHeight = 1200, overlap = 400): Promise<{ blob: Blob; offset: number }[]> {
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
          if (y >= img.height) {
            resolve(tiles);
            return;
          }

          const currentTileHeight = Math.min(tileHeight, img.height - y);
          canvas.height = currentTileHeight;

          // Apply Contrast/Sharpness via Canvas Filters
          ctx.filter = 'contrast(1.2) brightness(1.1)';
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
          }, 'image/jpeg', 0.95);
        };

        processNextTile();
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private static isUINoise(text: string, bbox: OCRBlock['bbox'], offset: number): boolean {
    const trimmed = text.trim();
    if (offset === 0 && bbox.y1 < 100) return true; // Status bar

    const patterns = [
      /^[0-9]{1,2}:[0-9]{2}/, /^[0-9]{1,3}%/, /LTE|4G|5G|WiFi/i,
      /^Jobsheet$/i, /^SOS$/i, /^Pending/i, /^Completed/i, /^Delivered/i,
      /^All Shipments/i, /^Priority/i, /^My Route/i, /^Search/i, /^Filter/i,
      /^Stats/i, /^Settings/i, /^Scanner/i, /^Navigate/i, /^Go$/i
    ];

    return patterns.some(p => p.test(trimmed)) || (trimmed.length < 2 && !/[0-9]/.test(trimmed));
  }

  private static mergeAndSortBlocks(blocks: TiledOCRBlock[]): OCRResult {
    const deduped: TiledOCRBlock[] = [];
    blocks.sort((a, b) => (a.absoluteY0 - b.absoluteY0) || (a.bbox.x0 - b.bbox.x0));

    blocks.forEach(block => {
      const existing = deduped.find(d => {
        const yOverlap = Math.min(block.absoluteY1, d.absoluteY1) - Math.max(block.absoluteY0, d.absoluteY0);
        const yHeight = Math.min(block.absoluteY1 - block.absoluteY0, d.absoluteY1 - d.absoluteY0);
        if (yOverlap / yHeight > 0.7) {
           const xOverlap = Math.min(block.bbox.x1, d.bbox.x1) - Math.max(block.bbox.x0, d.bbox.x0);
           const xWidth = Math.min(block.bbox.x1 - block.bbox.x0, d.bbox.x1 - d.bbox.x0);
           return xOverlap / xWidth > 0.6;
        }
        return false;
      });

      if (!existing) deduped.push(block);
      else if (block.confidence > existing.confidence) Object.assign(existing, block);
    });

    const sorted = this.sortByReadingOrder(deduped);
    return {
      text: sorted.map(b => b.text).join('\n'),
      confidence: sorted.reduce((acc, b) => acc + b.confidence, 0) / sorted.length,
      blocks: sorted.map(b => ({ ...b, bbox: { ...b.bbox, y0: b.absoluteY0, y1: b.absoluteY1 } }))
    };
  }

  private static sortByReadingOrder(blocks: TiledOCRBlock[]): TiledOCRBlock[] {
    const lines: TiledOCRBlock[][] = [];
    blocks.forEach(block => {
      let placed = false;
      for (const line of lines) {
        const lineY0 = Math.min(...line.map(b => b.absoluteY0));
        const lineY1 = Math.max(...line.map(b => b.absoluteY1));
        const overlap = Math.min(block.absoluteY1, lineY1) - Math.max(block.absoluteY0, lineY0);
        if (overlap / Math.min(block.absoluteY1 - block.absoluteY0, lineY1 - lineY0) > 0.5) {
          line.push(block);
          placed = true;
          break;
        }
      }
      if (!placed) lines.push([block]);
    });
    lines.sort((a, b) => Math.min(...a.map(b => b.absoluteY0)) - Math.min(...b.map(b => b.absoluteY0)));
    lines.forEach(line => line.sort((a, b) => a.bbox.x0 - b.bbox.x0));
    return lines.flat();
  }
}
