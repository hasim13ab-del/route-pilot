import { Shipment } from '@/types/shipment';
import { GeocodingService } from './address/geocoding.service';

export interface RouteStop extends Shipment {
  coords?: { lat: number; lon: number };
}

export interface RouteMetrics {
  totalDistance: number; // in km
  totalDuration: number; // in minutes
  fuelEstimate: number; // in liters
}

export class RouteOptimizer {
  static FUEL_EFFICIENCY = 0.08; // 8L per 100km (typical bike/small van)
  static AVG_SPEED = 30; // 30 km/h avg speed in logistics

  static async optimize(shipments: Shipment[]): Promise<{ optimized: Shipment[], metrics: RouteMetrics }> {
    if (shipments.length === 0) {
      return { optimized: [], metrics: { totalDistance: 0, totalDuration: 0, fuelEstimate: 0 } };
    }

    // 1. Fetch all coordinates
    const stops: RouteStop[] = await Promise.all(
      shipments.map(async (s) => ({
        ...s,
        coords: (await GeocodingService.geocode(s.address)) || undefined
      }))
    );

    // 2. Separate by Priority
    const high = stops.filter(s => s.priority === 'High');
    const normal = stops.filter(s => s.priority === 'Normal');

    // 3. Optimize each group with NN + 2-opt
    const optHigh = this.optimizeGroup(high);
    const optNormal = this.optimizeGroup(normal, optHigh[optHigh.length - 1]?.coords);

    const optimized = [...optHigh, ...optNormal].map((s, i) => ({
      ...s,
      orderIndex: i
    }));

    // 4. Calculate metrics
    const metrics = this.calculateMetrics(optimized);

    return { optimized, metrics };
  }

  private static optimizeGroup(group: RouteStop[], startCoords?: { lat: number; lon: number }): RouteStop[] {
    if (group.length <= 1) return group;

    // Nearest Neighbor initialization
    let current = this.nearestNeighbor(group, startCoords);

    // 2-opt local search improvement
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < current.length - 1; i++) {
        for (let k = i + 1; k < current.length; k++) {
          const newRoute = this.twoOptSwap(current, i, k);
          if (this.calculateRouteDistance(newRoute) < this.calculateRouteDistance(current)) {
            current = newRoute;
            improved = true;
          }
        }
      }
    }

    return current;
  }

  private static nearestNeighbor(stops: RouteStop[], start?: { lat: number; lon: number }): RouteStop[] {
    const remaining = [...stops];
    const ordered: RouteStop[] = [];
    let currentPos = start || { lat: stops[0].coords?.lat || 0, lon: stops[0].coords?.lon || 0 };

    while (remaining.length > 0) {
      let bestIdx = 0;
      let minDist = Infinity;

      remaining.forEach((stop, idx) => {
        if (stop.coords) {
          const d = this.calculateDistance(currentPos, stop.coords);
          if (d < minDist) {
            minDist = d;
            bestIdx = idx;
          }
        }
      });

      const next = remaining.splice(bestIdx, 1)[0];
      ordered.push(next);
      if (next.coords) currentPos = next.coords;
    }
    return ordered;
  }

  private static twoOptSwap(route: RouteStop[], i: number, k: number): RouteStop[] {
    const newRoute = route.slice(0, i);
    const reversedSection = route.slice(i, k + 1).reverse();
    return [...newRoute, ...reversedSection, ...route.slice(k + 1)];
  }

  private static calculateRouteDistance(route: RouteStop[]): number {
    let dist = 0;
    for (let i = 0; i < route.length - 1; i++) {
      if (route[i].coords && route[i+1].coords) {
        dist += this.calculateDistance(route[i].coords!, route[i+1].coords!);
      }
    }
    return dist;
  }

  private static calculateDistance(p1: { lat: number; lon: number }, p2: { lat: number; lon: number }): number {
    const R = 6371; // Earth radius in km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lon - p1.lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static calculateMetrics(route: Shipment[]): RouteMetrics {
    const totalDistance = this.calculateRouteDistance(route as RouteStop[]);
    const totalDuration = (totalDistance / this.AVG_SPEED) * 60; // minutes
    const fuelEstimate = (totalDistance / 100) * (this.FUEL_EFFICIENCY * 100);

    return {
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalDuration: Math.round(totalDuration),
      fuelEstimate: parseFloat(fuelEstimate.toFixed(2))
    };
  }
}
