import { Shipment } from '@/types/shipment';

export class RouteOptimizer {
  static optimize(shipments: Shipment[]): Shipment[] {
    const high = shipments.filter(s => s.priority === 'High');
    const normal = shipments.filter(s => s.priority === 'Normal');
    const res = [...this.cluster(high), ...this.cluster(normal)];
    return res.map((s, i) => ({ ...s, orderIndex: i }));
  }

  private static cluster(group: Shipment[]): Shipment[] {
    const map: Record<string, Shipment[]> = {};
    group.forEach(s => {
      const k = s.locality || 'Unknown';
      if (!map[k]) map[k] = [];
      map[k].push(s);
    });
    return Object.values(map).flat();
  }
}
