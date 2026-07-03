import { OCRResult, OCRBlock } from './ocr.service';
import { GeminiService } from './gemini.service';
import { OCRCorrectionService } from './ocr-correction.service';
import { AddressEngine } from '../address/address-engine';
import { Shipment } from '@/types/shipment';

export class ShipmentExtractor {
  static async extractFromOCR(result: OCRResult): Promise<Shipment[]> {
    // 1. Attempt Gemini segmentation first
    let rawShipments = await GeminiService.segmentAndExtract(result.text);

    // 2. Fallback to Spatial Deterministic Segmentation if Gemini fails/missing
    if (rawShipments.length === 0) {
      rawShipments = this.spatialSegmentation(result.blocks);
    }

    const shipments: Shipment[] = rawShipments.map((s, index) => {
      const corrected = this.applyOCRCorrections(s);
      const normalized = AddressEngine.normalize(this.constructFullAddress(corrected));

      return {
        customerName: corrected.customerName || 'Unknown',
        phone: corrected.phone || '',
        deliveryCount: corrected.deliveryCount || 1,
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

    return this.deduplicate(shipments);
  }

  /**
   * segments shipments based on "Delivery - X" markers and vertical proximity.
   */
  private static spatialSegmentation(blocks: OCRBlock[]): Partial<Shipment>[] {
    const shipments: Partial<Shipment>[] = [];

    // Group blocks into cards using "Delivery -" as the anchor for the bottom of a card
    let currentCardBlocks: OCRBlock[] = [];

    blocks.forEach(block => {
      currentCardBlocks.push(block);
      if (block.text.toUpperCase().includes('DELIVERY -')) {
        shipments.push(this.parseBlocksAsShipment(currentCardBlocks));
        currentCardBlocks = [];
      }
    });

    if (currentCardBlocks.length > 3) {
      shipments.push(this.parseBlocksAsShipment(currentCardBlocks));
    }

    return shipments;
  }

  private static parseBlocksAsShipment(blocks: OCRBlock[]): Partial<Shipment> {
    const shipment: Partial<Shipment> = { priority: 'Normal', isCOD: false };
    const textLines = blocks.map(b => b.text.trim()).filter(Boolean);

    if (textLines.length === 0) return shipment;

    // 1. Identify Name (First line that isn't Priority or noise)
    let nameIdx = textLines.findIndex(l => !/Priority|Jobsheet|Search/i.test(l));
    if (nameIdx !== -1) {
      shipment.customerName = textLines[nameIdx];
    }

    // 2. Extract specific patterns
    textLines.forEach(line => {
      const upLine = line.toUpperCase();

      if (upLine.includes('PRIORITY')) shipment.priority = 'High';

      const phoneMatch = line.match(/\b\d{10}\b/);
      if (phoneMatch && !shipment.phone) shipment.phone = phoneMatch[0];

      const awbMatch = line.match(/\b\d{12,15}\b/);
      if (awbMatch && !shipment.awb) shipment.awb = awbMatch[0];

      if (upLine.includes('DELIVERY -')) {
        const dMatch = line.match(/(\d+)/);
        if (dMatch) shipment.deliveryCount = parseInt(dMatch[1]);
      }

      if (upLine.includes('LANDMARK:')) {
        shipment.landmark = line.replace(/LANDMARK:\s*/i, '').trim();
      }

      if (upLine.includes('COD') || upLine.includes('CASH ON DELIVERY')) {
        shipment.isCOD = true;
      }
    });

    // 3. Heuristic Address: Everything after name and before Landmark/Delivery
    const addressLines = textLines.slice((nameIdx === -1 ? 0 : nameIdx) + 1)
      .filter(l => !/Priority|Delivery -|LANDMARK:|COD|C\.O\.D/i.test(l) && !/\b\d{10}\b/.test(l) && !/\b\d{12,15}\b/.test(l));

    shipment.village = addressLines[0];
    shipment.town = addressLines[addressLines.length - 1];

    return shipment;
  }

  private static applyOCRCorrections(s: Partial<Shipment>): Partial<Shipment> {
    return {
      ...s,
      customerName: OCRCorrectionService.correctText(s.customerName || ''),
      phone: OCRCorrectionService.correctNumeric(s.phone || ''),
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
        (s.phone === u.phone && s.customerName.toLowerCase() === u.customerName.toLowerCase())
      );
      if (!isDup) unique.push(s);
    });
    return unique;
  }
}
