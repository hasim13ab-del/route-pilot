import { db } from '@/db/db';

export class GeocodingService {
  static async geocode(address: string): Promise<{ lat: number; lon: number } | null> {
    const cached = await db.geoCache.get(address);
    if (cached) return { lat: cached.lat, lon: cached.lon };

    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        await db.geoCache.put({
          address,
          lat,
          lon,
          timestamp: Date.now()
        });
        return { lat, lon };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }

    return null;
  }
}
