import { Shipment } from '@/types/shipment';
import { AddressEngine } from '../address/address-engine';
import { Validator } from './validator';
import { OCRBlock, OCRResult } from './ocr.service';

export class ShipmentExtractor {
  /**
   * Main entry point for extraction from OCR result.
   */
  static extractFromOCR(result: OCRResult): Shipment[] {
    const blocks = result.blocks;
    if (!blocks || blocks.length === 0) return [];

    // 1. Identify "Delivery - X" blocks as card anchors
    const anchors = blocks.filter(b => /Delivery\s*-\s*\d+/i.test(b.text));

    // Sort anchors by vertical position
    anchors.sort((a, b) => a.bbox.y0 - b.bbox.y0);

    // 2. Segment blocks into cards
    const cards: OCRBlock[][] = [];

    // Filter out top UI (anything above the first potential name)
    const firstAnchor = anchors[0];
    if (!firstAnchor) return [];

    anchors.forEach((anchor, index) => {
      const cardBlocks = blocks.filter(b => {
        const minY = index === 0 ? (firstAnchor.bbox.y0 - 200) : anchors[index-1].bbox.y1;
        const maxY = anchor.bbox.y1 + 20;
        return b.bbox.y0 >= minY && b.bbox.y1 <= maxY;
      });
      cards.push(cardBlocks);
    });

    // 3. Parse each card
    return cards.map((cardBlocks, index) => this.parseCard(cardBlocks, index));
  }

  private static parseCard(blocks: OCRBlock[], index: number): Shipment {
    blocks.sort((a, b) => (a.bbox.y0 - b.bbox.y0) || (a.bbox.x0 - b.bbox.x0));

    let customerName = '';
    let address = '';
    let landmark = '';
    let phone = '';
    let priority: 'High' | 'Normal' = 'Normal';
    let deliveryCount = 0;
    let awb = '';

    const lines: string[] = [];
    let currentLine: string[] = [];
    let lastY = -1;

    blocks.forEach(b => {
      if (lastY !== -1 && Math.abs(b.bbox.y0 - lastY) > 15) {
        lines.push(currentLine.join(' '));
        currentLine = [];
      }
      currentLine.push(b.text.trim());
      lastY = b.bbox.y0;
    });
    if (currentLine.length > 0) lines.push(currentLine.join(' '));

    const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 0);

    cleanLines.forEach((line, i) => {
      if (i === 0) {
        if (/Priority/i.test(line)) {
          priority = 'High';
          customerName = line.replace(/Priority/i, '').trim();
        } else {
          customerName = line;
        }
      } else if (/LANDMARK:/i.test(line)) {
        landmark = line.replace(/LANDMARK:\s*/i, '').trim();
      } else if (/Delivery\s*-\s*(\d+)/i.test(line)) {
        const match = line.match(/Delivery\s*-\s*(\d+)/i);
        if (match) deliveryCount = parseInt(match[1]);
      } else if (line.length > 5) {
        if (!/^[0-9]$/.test(line) && !/Priority/i.test(line)) {
          if (!address) address = line;
          else address += ', ' + line;
        }
      }

      if (/Priority/i.test(line)) priority = 'High';

      const pMatch = line.match(/(?:\+91|0)?\s?[6789]\d{9}/);
      if (pMatch && !phone) phone = Validator.autocorrect(pMatch[0], 'number');

      const aMatch = line.match(/\b[A-Z0-9]{8,15}\b/);
      if (aMatch && !awb) awb = aMatch[0];
    });

    return this.finalize({
      customerName: this.cleanText(customerName),
      address: this.cleanText(address),
      landmark: this.cleanText(landmark),
      phone,
      awb,
      priority,
      deliveryCount,
      orderIndex: index,
      status: 'Pending'
    }, index);
  }

  /**
   * Fallback to line-based extraction for non-grid layouts
   */
  static extract(_text: string): Shipment[] {
    return [];
  }

  private static finalize(s: Partial<Shipment>, index: number): Shipment {
    const finalized = {
      customerName: s.customerName || 'Unknown Customer',
      address: s.address || 'Address Missing',
      phone: s.phone || '',
      awb: s.awb || 'No AWB',
      priority: s.priority || 'Normal',
      isCOD: s.isCOD || false,
      status: 'Pending',
      orderIndex: index,
      createdAt: Date.now(),
      ...s
    } as Shipment;

    finalized.locality = AddressEngine.recognizeLocality(finalized.address);
    return finalized;
  }

  private static cleanText(text: string): string {
    return text.replace(/[|\\/_[]{}]/g, '').trim();
  }
}
