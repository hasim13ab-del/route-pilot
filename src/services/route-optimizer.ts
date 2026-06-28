import { Shipment } from '@/types/shipment';
import { GeocodingService } from './address/geocoding.service';

export interface RouteStop extends Shipment {
  coords?: { lat: number; lon: number };
}

export class RouteOptimizer {
  /**
   * Optimizes the delivery route using a multi-stage approach:
   * 1. Priority-First: High priority items are delivered first.
   * 2. Area Clustering: Shipments are grouped by locality.
   * 3. Nearest Neighbor: Within each group/cluster, stops are ordered by shortest distance.
   */
  static async optimize(shipments: Shipment[]): Promise<Shipment[]> {
    if (shipments.length === 0) return [];

    // 1. Fetch all coordinates (cached in IndexedDB)
    const stops: RouteStop[] = await Promise.all(
      shipments.map(async (s) => ({
        ...s,
        coords: (await GeocodingService.geocode(s.address)) || undefined
      }))
    );

    // 2. Split by Priority
    const highPriority = stops.filter(s => s.priority === 'High');
    const normalPriority = stops.filter(s => s.priority === 'Normal');

    // 3. Optimize each priority group
    const optimizedHigh = this.optimizeGroup(highPriority);
    const optimizedNormal = this.optimizeGroup(normalPriority);

    const result = [...optimizedHigh, ...optimizedNormal];

    // 4. Update order indices
    return result.map((s, i) => ({
      ...s,
      orderIndex: i
    }));
  }

  private static optimizeGroup(group: RouteStop[]): RouteStop[] {
    if (group.length === 0) return [];

    // Group by locality
    const clusters: Record<string, RouteStop[]> = {};
    group.forEach(s => {
      const key = s.locality || 'Unknown';
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(s);
    });

    // Order clusters: Sort localities by their average coordinates to keep clusters together
    const sortedLocalities = Object.keys(clusters).sort((a, b) => {
      const centerA = this.getClusterCenter(clusters[a]);
      const centerB = this.getClusterCenter(clusters[b]);
      if (!centerA || !centerB) return 0;
      return centerA.lat - centerB.lat || centerA.lon - centerB.lon;
    });

    const optimized: RouteStop[] = [];

    for (const loc of sortedLocalities) {
      const cluster = clusters[loc];
      // Sort within cluster using Nearest Neighbor
      optimized.push(...this.nearestNeighbor(cluster, optimized[optimized.length - 1]?.coords));
    }

    return optimized;
  }

  private static getClusterCenter(cluster: RouteStop[]): { lat: number; lon: number } | null {
    const coords = cluster.filter(s => s.coords).map(s => s.coords!);
    if (coords.length === 0) return null;
    return {
      lat: coords.reduce((acc, c) => acc + c.lat, 0) / coords.length,
      lon: coords.reduce((acc, c) => acc + c.lon, 0) / coords.length
    };
  }

  private static nearestNeighbor(stops: RouteStop[], startCoords?: { lat: number; lon: number }): RouteStop[] {
    const remaining = [...stops];
    const ordered: RouteStop[] = [];
    let currentPos = startCoords || this.getClusterCenter(stops);

    while (remaining.length > 0) {
      let nearestIdx = 0;
      if (currentPos) {
        let minDist = Infinity;
        remaining.forEach((stop, idx) => {
          if (stop.coords) {
            const d = this.calculateDistance(currentPos!, stop.coords);
            if (d < minDist) {
              minDist = d;
              nearestIdx = idx;
            }
          }
        });
      }

      const next = remaining.splice(nearestIdx, 1)[0];
      ordered.push(next);
      if (next.coords) {
        currentPos = next.coords;
      }
    }

    return ordered;
  }

  private static calculateDistance(p1: { lat: number; lon: number }, p2: { lat: number; lon: number }): number {
    // Simple Euclidean distance for local optimization (Haversine not strictly needed for short distances)
    return Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2));
  }
}
