import { createWorker, Worker } from 'tesseract.js';
export interface OCRResult {
  text: string;
  confidence: number;
  lines: Array<{ text: string; confidence: number; }>;
}
class OCRService {
  private worker: Worker | null = null;
  async init() { if (!this.worker) this.worker = await createWorker('eng'); }
  async processImage(imageSource: string | File | Blob): Promise<OCRResult> {
    await this.init();
    if (!this.worker) throw new Error('OCR Worker not initialized');
    const { data: { text, confidence, lines } } = await this.worker.recognize(imageSource);
    return { text, confidence, lines: lines.map(line => ({ text: line.text, confidence: line.confidence })) };
  }
}
export const ocrService = new OCRService();
