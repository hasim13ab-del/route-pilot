export interface GeocodedAddress {
  address: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export class GeocodingService {
  private static CACHE_KEY = 'routepilot_geocoding_cache';

  static async geocode(address: string): Promise<{ lat: number; lon: number } | null> {
    const cache = this.getCache();
    if (cache[address]) return cache[address];

    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        this.saveToCache(address, { lat, lon });
        return { lat, lon };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }

    return null;
  }

  private static getCache(): Record<string, { lat: number; lon: number }> {
    const raw = localStorage.getItem(this.CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  private static saveToCache(address: string, coords: { lat: number; lon: number }) {
    const cache = this.getCache();
    cache[address] = coords;
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
  }
}
