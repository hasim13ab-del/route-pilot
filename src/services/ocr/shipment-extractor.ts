import { Shipment } from '@/types/shipment';
import { AddressEngine } from '../address/address-engine';
export class ShipmentExtractor {
  static extract(text: string): Shipment[] {
    const shipments: Shipment[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const phoneRegex = /(?:\+91|0)?\s?[6789]\d{9}/g;
    let current: Partial<Shipment> = { priority: 'Normal', isCOD: false, status: 'Pending', createdAt: Date.now() };
    lines.forEach((line, index) => {
      const phones = line.match(phoneRegex);
      if (phones) {
        if (current.customerName || current.address) shipments.push(this.finalize(current, shipments.length));
        current = { priority: 'Normal', isCOD: false, status: 'Pending', createdAt: Date.now(), phone: phones[0].replace(/\s/g, '') };
        const namePart = line.replace(phones[0], '').trim();
        if (namePart.length > 2) current.customerName = namePart;
        else if (index > 0) current.customerName = lines[index-1];
      } else if (current.phone) {
        if (!current.address) current.address = line;
        else current.address += ', ' + line;
      }
      if (line.toUpperCase().includes('COD')) {
        current.isCOD = true;
        const match = line.match(/\d+/);
        if (match) current.amount = parseInt(match[0]);
      }
      if (line.toUpperCase().includes('PRIORITY')) current.priority = 'High';
    });
    if (current.customerName || current.phone) shipments.push(this.finalize(current, shipments.length));
    return shipments;
  }
  private static finalize(s: Partial<Shipment>, index: number): Shipment {
    const res = { customerName: 'Unknown', address: 'No Address', phone: '', priority: 'Normal', isCOD: false, status: 'Pending', orderIndex: index, createdAt: Date.now(), ...s } as Shipment;
    res.locality = AddressEngine.recognizeLocality(res.address);
    return res;
  }
}
