import { db } from '@/db/db';
import { Shipment } from '@/types/shipment';
export class ShipmentService {
  static async getAll() { return db.shipments.orderBy('orderIndex').toArray(); }
  static async add(shipment: Shipment) { return db.shipments.add(shipment); }
  static async addMany(shipments: Shipment[]) { return db.shipments.bulkAdd(shipments); }
  static async update(id: number, changes: Partial<Shipment>) { return db.shipments.update(id, changes); }
  static async delete(id: number) { return db.shipments.delete(id); }
  static async deleteAll() { return db.shipments.clear(); }
  static async updateOrder(orderedIds: number[]) {
    return db.transaction('rw', db.shipments, async () => {
      for (let i = 0; i < orderedIds.length; i++) { await db.shipments.update(orderedIds[i], { orderIndex: i }); }
    });
  }
}
