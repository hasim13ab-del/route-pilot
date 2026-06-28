import { Shipment } from '@/types/shipment';
import { AddressEngine } from '../address/address-engine';
import { OCRResult } from './ocr.service';
import { AICleanupService } from './ai-cleanup.service';

export class ShipmentExtractor {
  static async extractFromOCR(result: OCRResult): Promise<Shipment[]> {
    const rawShipments = await AICleanupService.cleanup(result.text);

    const finalized = rawShipments.map((s, index) => {
      const normalized = AddressEngine.normalize(s.address || '');

      return {
        customerName: s.customerName || 'Unknown',
        address: normalized.normalized || s.address || '',
        locality: normalized.locality?.name,
        landmark: s.landmark,
        deliveryCount: s.deliveryCount || 1,
        priority: s.priority || 'Normal',
        status: 'Pending',
        orderIndex: index,
        createdAt: Date.now(),
        phone: s.phone || '',
        awb: s.awb || '',
        isCOD: s.isCOD || false,
        confidence: s.confidence || { overall: normalized.confidence / 100 }
      } as Shipment;
    });

    return this.deduplicate(finalized);
  }

  private static deduplicate(shipments: Shipment[]): Shipment[] {
    const unique: Shipment[] = [];

    shipments.forEach(s => {
      const isDuplicate = unique.some(u => {
        // AWB match is definitive
        if (s.awb && u.awb && s.awb === u.awb) return true;

        // Name similarity
        const nameSimilarity = this.jaccard(s.customerName.toLowerCase(), u.customerName.toLowerCase());
        // Address similarity
        const addressSimilarity = this.jaccard(s.address.toLowerCase(), u.address.toLowerCase());

        return (nameSimilarity > 0.8 && addressSimilarity > 0.8);
      });

      if (!isDuplicate) {
        unique.push(s);
      }
    });

    return unique;
  }

  private static jaccard(a: string, b: string): number {
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }
}
