import { createWorker, Worker } from 'tesseract.js';

export interface OCRBlock {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
}

class OCRService {
  private worker: Worker | null = null;

  async init() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
      // Set parameters for better accuracy if needed
      // await this.worker.setParameters({
      //   tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ,.-#()',
      // });
    }
  }

  async processImage(imageSource: string | File | Blob): Promise<OCRResult> {
    await this.init();
    if (!this.worker) throw new Error('OCR Worker not initialized');

    const { data: { text, confidence, blocks } } = await this.worker.recognize(imageSource);

    // Convert tesseract blocks to our simpler structure
    const mappedBlocks: OCRBlock[] = (blocks || []).flatMap(block =>
      (block.paragraphs || []).flatMap(para =>
        (para.lines || []).map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox
        }))
      )
    );

    return {
      text,
      confidence,
      blocks: mappedBlocks
    };
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OCRService();
