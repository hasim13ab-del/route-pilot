import Dexie, { type EntityTable } from 'dexie';
import { Shipment } from '@/types/shipment';

export interface GeoCacheEntry {
  address: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export class RoutePilotDatabase extends Dexie {
  shipments!: EntityTable<Shipment, 'id'>;
  geoCache!: EntityTable<GeoCacheEntry, 'address'>;

  constructor() {
    super('RoutePilotDB');
    this.version(3).stores({
      shipments: '++id, customerName, locality, status, priority, orderIndex, createdAt',
      geoCache: 'address, timestamp'
    });
  }
}

export const db = new RoutePilotDatabase();
