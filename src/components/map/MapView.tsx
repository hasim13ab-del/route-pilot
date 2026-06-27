import { Shipment } from '@/types/shipment';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapsService } from '@/services/maps/maps.service';

export function MapView({ shipments }: { shipments: Shipment[] }) {
  const pending = shipments.filter(s => s.status === 'Pending');
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Route Overview ({pending.length} stops)</h3>
        <Button onClick={() => window.open(MapsService.getMultiStopUrl(pending.slice(0, 10)), '_blank')} disabled={pending.length === 0}>
          <Navigation className="w-4 h-4 mr-2" />Go
        </Button>
      </div>
      <div className="aspect-square bg-slate-100 rounded flex items-center justify-center text-slate-400">Map Interface Ready</div>
    </div>
  );
}
