import { Shipment } from '@/types/shipment';
export class MapsService {
  static getSingleStopUrl(s: Shipment) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address + ' ' + (s.locality || ''))}`; }
  static getMultiStopUrl(shipments: Shipment[]) {
    if (shipments.length === 0) return '';
    const dest = encodeURIComponent(shipments[shipments.length-1].address);
    const waypoints = shipments.slice(0, -1).map(s => encodeURIComponent(s.address)).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${dest}&waypoints=${waypoints}`;
  }
}
