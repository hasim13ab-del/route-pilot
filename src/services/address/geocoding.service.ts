import { db } from '@/db/db';

export class GeocodingService {
  static async geocode(address: string): Promise<{ lat: number; lon: number } | null> {
    const cached = await db.geoCache.get(address);
    if (cached) return { lat: cached.lat, lon: cached.lon };

    try {
      // 1. Try with Full Address
      let coords = await this.fetchFromPhoton(address);

      // 2. Fallback: If full address fails, try stripping House No/Road
      if (!coords) {
        const fallbackAddress = address.split(',').slice(2).join(',').trim();
        if (fallbackAddress) {
           coords = await this.fetchFromPhoton(fallbackAddress);
        }
      }

      if (coords) {
        await db.geoCache.put({
          address,
          lat: coords.lat,
          lon: coords.lon,
          timestamp: Date.now()
        });
        return coords;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }

    return null;
  }

  private static async fetchFromPhoton(query: string): Promise<{ lat: number; lon: number } | null> {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      return { lat, lon };
    }
    return null;
  }
}
