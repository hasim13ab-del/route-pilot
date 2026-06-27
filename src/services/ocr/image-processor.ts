import { ocrService, OCRResult } from './ocr.service';
export interface TiledOCRResult extends OCRResult { tileIndex: number; }
export class ImageProcessor {
  static async tileImage(file: File, tileHeight = 1000, overlap = 100): Promise<Blob[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const tiles: Blob[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');
        canvas.width = img.width;
        let y = 0;
        const processNextTile = () => {
          if (y >= img.height) { resolve(tiles); return; }
          const currentTileHeight = Math.min(tileHeight, img.height - y);
          canvas.height = currentTileHeight;
          ctx.drawImage(img, 0, y, img.width, currentTileHeight, 0, 0, img.width, currentTileHeight);
          canvas.toBlob((blob) => { if (blob) tiles.push(blob); y += (tileHeight - overlap); processNextTile(); }, 'image/jpeg', 0.95);
        };
        processNextTile();
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  static async processTiledImage(file: File): Promise<OCRResult> {
    const tiles = await this.tileImage(file);
    const results: TiledOCRResult[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const result = await ocrService.processImage(tiles[i]);
      results.push({ ...result, tileIndex: i });
    }
    return this.mergeResults(results);
  }
  private static mergeResults(results: TiledOCRResult[]): OCRResult {
    if (results.length === 0) return { text: '', confidence: 0, lines: [] };
    const allLines: Array<{ text: string; confidence: number }> = [];
    const seenTexts = new Set<string>();
    results.forEach(result => {
      result.lines.forEach(line => {
        const trimmed = line.text.trim();
        if (trimmed && !seenTexts.has(trimmed)) { allLines.push(line); seenTexts.add(trimmed); }
      });
    });
    const avgConfidence = allLines.reduce((acc, line) => acc + line.confidence, 0) / (allLines.length || 1);
    return { text: allLines.map(l => l.text).join('\n'), confidence: avgConfidence, lines: allLines };
  }
}
