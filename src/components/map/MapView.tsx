import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shipment } from '@/types/shipment';
import { GeocodingService } from '@/services/address/geocoding.service';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapsService } from '@/services/maps/maps.service';

// Fix Leaflet icon issue
// @ts-expect-error - Leaflet internal icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

interface MarkerData {
  id: number;
  lat: number;
  lon: number;
  name: string;
  order: number;
}

export function MapView({ shipments, highlightedId }: { shipments: Shipment[], highlightedId?: number }) {
  const pending = useMemo(() =>
    shipments.filter(s => s.status === 'Pending').sort((a, b) => a.orderIndex - b.orderIndex),
    [shipments]
  );
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarkers = async () => {
      const data = await Promise.all(pending.map(async (s) => {
        const coords = await GeocodingService.geocode(s.address);
        return coords ? { id: s.id!, lat: coords.lat, lon: coords.lon, name: s.customerName, order: s.orderIndex + 1 } : null;
      }));
      setMarkers(data.filter((m): m is MarkerData => m !== null));
      setLoading(false);
    };
    loadMarkers();
  }, [pending]);

  const center: [number, number] = markers.length > 0 ? [markers[0].lat, markers[0].lon] : [26.1158, 91.7086];
  const polyline = markers.map(m => [m.lat, m.lon] as [number, number]);

  const createNumberedIcon = (number: number, isHighlighted: boolean) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full border-2 ${isHighlighted ? 'bg-orange-500 border-white' : 'bg-primary border-white'} flex items-center justify-center text-white font-bold text-xs shadow-lg transform ${isHighlighted ? 'scale-125' : ''} transition-transform">
            ${number}
          </div>
          <div class="absolute -bottom-1 w-2 h-2 ${isHighlighted ? 'bg-orange-500' : 'bg-primary'} rotate-45"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  if (loading) {
    return (
      <div className="h-[400px] bg-slate-100 rounded-xl border flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Mapping Route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[400px] rounded-xl border overflow-hidden shadow-sm relative">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lon]}
              icon={createNumberedIcon(m.order, m.id === highlightedId)}
            >
              <Popup>
                <div className="font-bold">{m.name}</div>
                <div className="text-xs text-slate-500">Stop #{m.order}</div>
              </Popup>
            </Marker>
          ))}
          <Polyline positions={polyline} color="#3b82f6" weight={3} opacity={0.7} dashArray="10, 10" />
          {highlightedId && markers.find(m => m.id === highlightedId) && (
            <MapRecenter center={[markers.find(m => m.id === highlightedId)!.lat, markers.find(m => m.id === highlightedId)!.lon]} />
          )}
        </MapContainer>

        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <Button size="sm" className="shadow-lg" onClick={() => window.open(MapsService.getMultiStopUrl(pending), '_blank')}>
            <Navigation className="w-4 h-4 mr-2" /> Navigate All
          </Button>
        </div>
      </div>
    </div>
  );
}
