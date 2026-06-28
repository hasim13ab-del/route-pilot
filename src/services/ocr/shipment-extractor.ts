import { Shipment } from '@/types/shipment';
import { AddressEngine } from '../address/address-engine';
import { Validator } from './validator';

export class ShipmentExtractor {
  static extract(text: string): Shipment[] {
    const shipments: Shipment[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Regular Expressions for key fields
    const phoneRegex = /(?:\+91|0)?\s?[6789]\d{9}/;
    const pincodeRegex = /\b[1-9][0-9]{2}\s?[0-9]{3}\b/;
    const awbRegex = /\b[A-Z0-9]{8,15}\b/;
    const codRegex = /COD|C\.O\.D|Cash on Delivery|Amount|Rs\.?|₹/i;
    const amountRegex = /(?:Rs\.?|₹|\s)([0-9]+(?:\.[0-9]{2})?)/;

    let current: Partial<Shipment> = this.getNewShipment();
    let linesSinceAnchor = 0;

    lines.forEach((line, index) => {
      const phoneMatch = line.match(phoneRegex);
      const awbMatch = line.match(awbRegex);
      const pincodeMatch = line.match(pincodeRegex);
      const hasCODKeyword = codRegex.test(line);

      if (phoneMatch || awbMatch) {
        if (this.isValidShipment(current)) {
          shipments.push(this.finalize(current, shipments.length));
          current = this.getNewShipment();
          linesSinceAnchor = 0;
        }

        if (phoneMatch) current.phone = Validator.autocorrect(phoneMatch[0], 'number');
        if (awbMatch && !current.awb) current.awb = awbMatch[0];

        const nameCandidate = line.replace(phoneMatch?.[0] || '', '').replace(awbMatch?.[0] || '', '').trim();
        if (nameCandidate.length > 3 && !current.customerName) {
          current.customerName = this.cleanText(nameCandidate);
        } else if (index > 0 && !current.customerName) {
           const prevLine = lines[index-1];
           if (!phoneRegex.test(prevLine) && !awbRegex.test(prevLine)) {
             current.customerName = this.cleanText(prevLine);
           }
        }
      } else if (current.phone || current.awb) {
        linesSinceAnchor++;

        if (pincodeMatch && !current.pincode) {
          current.pincode = Validator.autocorrect(pincodeMatch[0], 'number');
          if (!current.address) current.address = line;
          else if (!current.address.includes(line)) current.address += ', ' + line;
        } else if (linesSinceAnchor < 5) {
          if (!current.address) current.address = line;
          else if (!current.address.includes(line)) current.address += ', ' + line;
        }
      }

      if (hasCODKeyword) {
        current.isCOD = true;
        const amountMatch = line.match(amountRegex);
        if (amountMatch) {
          current.amount = parseFloat(amountMatch[1]);
        } else {
          const anyNum = line.match(/\d+/);
          if (anyNum && !current.amount) current.amount = parseInt(anyNum[0]);
        }
      }

      if (/Delivered/i.test(line)) current.status = 'Delivered';
      else if (/Failed|Returned|NDR/i.test(line)) current.status = 'Failed';
      if (/Priority|Urgent|Express/i.test(line)) current.priority = 'High';
    });

    if (this.isValidShipment(current)) {
      shipments.push(this.finalize(current, shipments.length));
    }

    return this.deduplicateShipments(shipments);
  }

  private static getNewShipment(): Partial<Shipment> {
    return {
      priority: 'Normal',
      isCOD: false,
      status: 'Pending',
      createdAt: Date.now()
    };
  }

  private static isValidShipment(s: Partial<Shipment>): boolean {
    return !!(s.phone || s.awb || (s.customerName && s.address));
  }

  private static finalize(s: Partial<Shipment>, index: number): Shipment {
    const finalized = {
      customerName: s.customerName || 'Unknown Customer',
      address: s.address || 'Address Missing',
      phone: s.phone || '',
      awb: s.awb || 'No AWB',
      pincode: s.pincode || '',
      priority: s.priority || 'Normal',
      isCOD: s.isCOD || false,
      amount: s.amount,
      status: s.status || 'Pending',
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

  private static deduplicateShipments(shipments: Shipment[]): Shipment[] {
    const seenAwb = new Set();
    const seenPhone = new Set();

    return shipments.filter(s => {
      if (s.awb && s.awb !== 'No AWB') {
        if (seenAwb.has(s.awb)) return false;
        seenAwb.add(s.awb);
      }
      const combo = `${s.phone}-${s.customerName}`;
      if (seenPhone.has(combo)) return false;
      seenPhone.add(combo);
      return true;
    });
  }
}
