import Dexie, { type EntityTable } from 'dexie';
import { Shipment } from '@/types/shipment';
export class RoutePilotDatabase extends Dexie {
  shipments!: EntityTable<Shipment, 'id'>;
  constructor() {
    super('RoutePilotDB');
    this.version(1).stores({ shipments: '++id, customerName, phone, locality, status, priority, orderIndex, createdAt' });
  }
}
export const db = new RoutePilotDatabase();
