import { OCRResult, OCRBlock } from './ocr.service';
import { GeminiService } from './gemini.service';
import { OCRCorrectionService } from './ocr-correction.service';
import { AddressEngine } from '../address/address-engine';
import { Shipment } from '@/types/shipment';

export type ExtractionStrategy = 'Gemini-AI' | 'Offline-OCR';

export interface ExtractionResult {
  shipments: Shipment[];
  strategy: ExtractionStrategy;
}

export class ShipmentExtractor {
  static async extractFromOCR(result: OCRResult): Promise<ExtractionResult> {
    let strategy: ExtractionStrategy = 'Gemini-AI';
    let rawShipments = await GeminiService.segmentAndExtract(result.text);

    if (rawShipments.length === 0) {
      strategy = 'Offline-OCR';
      rawShipments = this.spatialSegmentation(result.blocks);
    }

    const shipments: Shipment[] = rawShipments.map((s, index) => {
      const corrected = this.applyOCRCorrections(s);
      const normalized = AddressEngine.normalize(this.constructFullAddress(corrected));

      return {
        customerName: corrected.customerName || 'Unknown',
        awb: corrected.awb,
        houseNo: corrected.houseNo,
        road: corrected.road,
        village: corrected.village,
        landmark: corrected.landmark,
        town: corrected.town || normalized.locality?.name,
        district: corrected.district || normalized.locality?.district,
        state: corrected.state || normalized.locality?.state || 'Assam',
        pincode: corrected.pincode,
        locality: normalized.locality?.name,
        address: normalized.normalized,
        isCOD: corrected.isCOD || false,
        amount: corrected.amount,
        priority: corrected.priority || 'Normal',
        status: 'Pending',
        orderIndex: index,
        createdAt: Date.now(),
        confidence: s.confidence as Shipment['confidence']
      } as Shipment;
    });

    return {
      shipments: this.deduplicate(shipments),
      strategy
    };
  }

  private static spatialSegmentation(blocks: OCRBlock[]): Partial<Shipment>[] {
    const shipments: Partial<Shipment>[] = [];
    let currentCardBlocks: OCRBlock[] = [];

    blocks.forEach(block => {
      const text = block.text.trim();
      const upText = text.toUpperCase();
      if (/Pending|Completed|Failed|Search|Shipments|My Route|SOS|Jobsheet/i.test(text)) return;

      const isSegmentMarker = upText.includes('PRIORITY') || upText.includes('DELIVERY -');

      if (isSegmentMarker && currentCardBlocks.length > 2) {
         shipments.push(this.parseBlocksAsShipment(currentCardBlocks));
         currentCardBlocks = [block];
      } else {
         currentCardBlocks.push(block);
      }
    });

    if (currentCardBlocks.length > 1) {
      shipments.push(this.parseBlocksAsShipment(currentCardBlocks));
    }

    return shipments;
  }

  private static parseBlocksAsShipment(blocks: OCRBlock[]): Partial<Shipment> {
    const shipment: Partial<Shipment> = { priority: 'Normal', isCOD: false };
    const textLines = blocks.map(b => b.text.trim()).filter(Boolean).filter(l => !l.toUpperCase().includes('DELIVERY -'));

    if (textLines.length === 0) return shipment;

    let nameIdx = textLines.findIndex(l => !l.toUpperCase().includes('PRIORITY'));
    if (nameIdx === -1) nameIdx = 0;
    shipment.customerName = textLines[nameIdx] || 'Unknown';

    textLines.forEach(line => {
      const upLine = line.toUpperCase();
      if (upLine.includes('PRIORITY')) shipment.priority = 'High';

      // Strict AWB pattern: 12-15 digits
      const awbMatch = line.match(/\b\d{12,15}\b/);
      if (awbMatch && !shipment.awb) shipment.awb = awbMatch[0];

      if (upLine.includes('LANDMARK:')) {
        shipment.landmark = line.replace(/LANDMARK:\s*/i, '').trim();
      }
      if (upLine.includes('COD') || upLine.includes('CASH ON DELIVERY')) {
        shipment.isCOD = true;
      }
    });

    const addressLines = textLines.filter((l, i) => i !== nameIdx && !/Priority|LANDMARK:|COD|C\.O\.D/i.test(l) && !/\b\d{12,15}\b/.test(l));
    if (addressLines.length > 0) {
      shipment.village = addressLines[0];
      shipment.town = addressLines[addressLines.length - 1];
    }

    return shipment;
  }

  private static applyOCRCorrections(s: Partial<Shipment>): Partial<Shipment> {
    return {
      ...s,
      customerName: OCRCorrectionService.correctText(s.customerName || ''),
      village: s.village ? OCRCorrectionService.correctText(s.village) : undefined,
      town: s.town ? OCRCorrectionService.correctText(s.town) : undefined,
      landmark: s.landmark ? OCRCorrectionService.correctText(s.landmark) : undefined,
    };
  }

  private static constructFullAddress(s: Partial<Shipment>): string {
    return [s.houseNo, s.road, s.village, s.landmark, s.town, s.district, s.state, s.pincode]
      .filter(Boolean)
      .join(', ');
  }

  private static deduplicate(shipments: Shipment[]): Shipment[] {
    const unique: Shipment[] = [];
    shipments.forEach(s => {
      const isDup = unique.some(u =>
        (s.awb && u.awb && s.awb === u.awb) ||
        (s.customerName.toLowerCase() === u.customerName.toLowerCase() && s.village === u.village)
      );
      if (!isDup) unique.push(s);
    });
    return unique;
  }
}
