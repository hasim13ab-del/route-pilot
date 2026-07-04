import { Shipment } from '@/types/shipment';
import { RouteMetrics } from '@/services/route-optimizer';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation, Route, Fuel, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapsService } from '@/services/maps/maps.service';

interface NavHUDProps {
  shipments: Shipment[];
  metrics: RouteMetrics;
  onShipmentClick: (id: number) => void;
  onComplete: (id: number) => void;
}

export function NavigationHUD({ shipments, metrics, onShipmentClick, onComplete }: NavHUDProps) {
  const pending = shipments.filter(s => s.status === 'Pending').sort((a, b) => a.orderIndex - b.orderIndex);
  const nextStop = pending[0];
  const remaining = pending.length;
  const currentStopNum = shipments.length - remaining + 1;

  if (!nextStop) return null;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center">
          <Route className="w-4 h-4 text-blue-500 mb-1" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Distance</span>
          <span className="text-sm font-black">{metrics.totalDistance} km</span>
        </div>
        <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center">
          <Clock className="w-4 h-4 text-yellow-500 mb-1" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Est. Time</span>
          <span className="text-sm font-black">{metrics.totalDuration}m</span>
        </div>
        <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center">
          <Fuel className="w-4 h-4 text-green-500 mb-1" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Fuel</span>
          <span className="text-sm font-black">{metrics.fuelEstimate}L</span>
        </div>
      </div>

      {/* Current Navigation Card */}
      <Card className="border-2 border-primary shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-2 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
              {currentStopNum}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">Next Stop</span>
          </div>
          <span className="text-[10px] font-bold opacity-80">{remaining} left</span>
        </div>
        <CardContent className="p-4 space-y-4">
          <div
            className="flex justify-between items-start cursor-pointer"
            onClick={() => onShipmentClick(nextStop.id!)}
          >
            <div className="space-y-1">
              <h4 className="font-black text-xl leading-tight">{nextStop.customerName}</h4>
              <p className="text-xs text-slate-500 flex items-start gap-1">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                {nextStop.address}
              </p>
            </div>
            <div className="text-right">
              {nextStop.priority === 'High' && (
                <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase mb-1 inline-block">
                  Priority
                </span>
              )}
              {nextStop.isCOD && (
                <p className="text-xs font-black text-green-600">₹{nextStop.amount}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 h-12 rounded-xl text-lg font-bold"
              onClick={() => window.open(MapsService.getSingleStopUrl(nextStop), '_blank')}
            >
              <Navigation className="w-5 h-5 mr-2" /> Navigate
            </Button>
            <Button
              variant="outline"
              className="h-12 w-12 rounded-xl p-0 border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => onComplete(nextStop.id!)}
            >
              <CheckCircle2 className="w-6 h-6" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Up Next List */}
      <div className="space-y-2">
        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Up Next</h5>
        {pending.slice(1, 4).map((s, idx) => (
          <div
            key={s.id}
            className="bg-white p-3 rounded-xl border shadow-sm flex justify-between items-center active:bg-slate-50"
            onClick={() => onShipmentClick(s.id!)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 w-4">#{currentStopNum + idx + 1}</span>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{s.customerName}</p>
                <p className="text-[10px] text-slate-400 truncate">{s.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               {s.priority === 'High' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
               <MapPin className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        ))}
        {pending.length > 4 && (
          <p className="text-center text-[10px] font-bold text-slate-400 pt-1">
            + {pending.length - 4} more deliveries
          </p>
        )}
      </div>
    </div>
  );
}
