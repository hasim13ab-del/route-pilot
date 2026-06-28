import { useState, useEffect } from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapsService } from '@/services/maps/maps.service';
import { GeocodingService } from '@/services/address/geocoding.service';
import { Shipment } from '@/types/shipment';

export function MapView({ shipments }: { shipments: Shipment[] }) {
  const pending = shipments.filter(s => s.status === 'Pending');
  const [coords, setCoords] = useState<Record<number, { lat: number; lon: number }>>({});

  useEffect(() => {
    const fetchCoords = async () => {
      const newCoords: Record<number, { lat: number; lon: number }> = {};
      for (const s of pending) {
        const res = await GeocodingService.geocode(s.address);
        if (res && s.id) newCoords[s.id] = res;
      }
      setCoords(newCoords);
    };
    fetchCoords();
  }, [pending]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Live Route Map ({pending.length})</h3>
          <Button onClick={() => window.open(MapsService.getMultiStopUrl(pending.slice(0, 10)), '_blank')} disabled={pending.length === 0}>
            <Navigation className="w-4 h-4 mr-2" />Go
          </Button>
        </div>

        <div className="aspect-video bg-slate-100 rounded-lg border flex flex-col items-center justify-center text-slate-400 relative overflow-hidden">
          {Object.keys(coords).length > 0 ? (
             <div className="absolute inset-0 p-4">
                {Object.entries(coords).map(([id, pos]) => (
                  <div
                    key={id}
                    className="absolute transition-all duration-1000"
                    style={{
                      top: `${((pos.lat - 26) * 100) % 100}%`,
                      left: `${((pos.lon - 92) * 100) % 100}%`
                    }}
                  >
                    <MapPin className="w-6 h-6 text-primary fill-primary/20" />
                  </div>
                ))}
             </div>
          ) : (
            <p className="text-xs font-medium animate-pulse">Initializing coordinates...</p>
          )}
          <p className="text-[10px] mt-2 opacity-50 z-10">Map View (Normalized Viewport)</p>
        </div>
      </div>

      <div className="space-y-2">
        {pending.slice(0, 5).map(s => (
          <div key={s.id} className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm">
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{s.customerName}</p>
              <p className="text-[10px] text-slate-500 truncate">{s.address}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => window.open(MapsService.getSingleStopUrl(s), '_blank')}>
              <Navigation className="w-4 h-4 text-primary" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
