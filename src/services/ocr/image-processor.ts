import { ocrService, OCRResult, OCRBlock } from './ocr.service';

export interface TiledOCRBlock extends OCRBlock {
  absoluteY0: number;
  absoluteY1: number;
}

export class ImageProcessor {
  /**
   * Aggressively tiles long screenshots with significant overlap.
   */
  static async tileImage(file: File, tileHeight = 1200, overlap = 400): Promise<{ blob: Blob; offset: number }[]> {
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

  /**
   * Processes tiled image and merges blocks with spatial deduplication.
   */
  static async processTiledImage(file: File): Promise<OCRResult> {
    const tiles = await this.tileImage(file);
    const allBlocks: TiledOCRBlock[] = [];

    for (const tile of tiles) {
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

  private static isUINoise(text: string, bbox: OCRBlock['bbox'], offset: number): boolean {
    const trimmed = text.trim();

    // 1. Position based noise (Status bar usually at top < 100px)
    if (offset === 0 && bbox.y1 < 100) return true;

    // 2. Button/Tab patterns
    const patterns = [
      /^[0-9]{1,2}:[0-9]{2}/,      // Time
      /^[0-9]{1,3}%/,              // Battery
      /LTE|4G|5G|WiFi/i,           // Network
      /^Jobsheet$/i,               // App header
      /^SOS$/i,                    // Emergency button
      /^Pending$/i, /^Failed$/i, /^Completed$/i, /^Delivered$/i,
      /^All Shipments/i, /^Priority Shipments/i,
      /^My Route/i, /^Search$/i, /^Filter$/i,
      /^Shipment$/i, /^Add$/i, /^Edit$/i,
      /^Stats$/i, /^Settings$/i,
      /^Scanner$/i, /^History$/i,
      /^Go$/i, /^Navigate$/i,
    ];

    if (patterns.some(p => p.test(trimmed))) return true;

    // 3. Very small/single char blocks often noise
    if (trimmed.length < 2 && !/[0-9]/.test(trimmed)) return true;

    return false;
  }

  private static mergeAndSortBlocks(blocks: TiledOCRBlock[]): OCRResult {
    if (blocks.length === 0) return { text: '', confidence: 0, blocks: [] };

    // Deduping based on spatial coordinates
    const deduped: TiledOCRBlock[] = [];

    // Sort primarily by vertical position, secondarily by horizontal
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

      if (!existing) {
        deduped.push(block);
      } else if (block.confidence > existing.confidence) {
        Object.assign(existing, block);
      }
    });

    // Final sorting for reading order: group into lines
    const sorted = this.sortByReadingOrder(deduped);
    const avgConfidence = sorted.reduce((acc, b) => acc + b.confidence, 0) / sorted.length;

    return {
      text: sorted.map(b => b.text).join('\n'),
      confidence: avgConfidence,
      blocks: sorted.map(b => ({
        ...b,
        bbox: { ...b.bbox, y0: b.absoluteY0, y1: b.absoluteY1 }
      }))
    };
  }

  private static sortByReadingOrder(blocks: TiledOCRBlock[]): TiledOCRBlock[] {
    // Group blocks into "lines" based on vertical overlap
    const lines: TiledOCRBlock[][] = [];

    blocks.forEach(block => {
      let placed = false;
      for (const line of lines) {
        const lineY0 = Math.min(...line.map(b => b.absoluteY0));
        const lineY1 = Math.max(...line.map(b => b.absoluteY1));
        const overlap = Math.min(block.absoluteY1, lineY1) - Math.max(block.absoluteY0, lineY0);
        const height = Math.min(block.absoluteY1 - block.absoluteY0, lineY1 - lineY0);

        if (overlap / height > 0.5) {
          line.push(block);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lines.push([block]);
      }
    });

    // Sort lines by vertical position
    lines.sort((a, b) => Math.min(...a.map(b => b.absoluteY0)) - Math.min(...b.map(b => b.absoluteY0)));

    // Sort blocks within each line by horizontal position
    lines.forEach(line => line.sort((a, b) => a.bbox.x0 - b.bbox.x0));

    return lines.flat();
  }
}
