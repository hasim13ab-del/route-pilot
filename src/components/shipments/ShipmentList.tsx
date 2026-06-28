import { Shipment } from '@/types/shipment';
import { MapPin, Phone, CheckCircle2, AlertCircle, Trash2, ChevronUp, ChevronDown, Hash, Package, Activity, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShipmentCardProps {
  shipment: Shipment;
  onStatusChange: (id: number, status: Shipment['status']) => void;
  onDelete: (id: number) => void;
  onMoveUp?: (() => void) | null;
  onMoveDown?: (() => void) | null;
}

export function ShipmentCard({ shipment, onStatusChange, onDelete, onMoveUp, onMoveDown }: ShipmentCardProps) {
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 space-y-3 ${shipment.priority === 'High' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg truncate pr-2">{shipment.customerName}</h3>
            {shipment.priority === 'High' && (
              <span className="bg-red-50 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter flex items-center gap-0.5">
                <Star className="w-2 h-2 fill-red-600" /> Priority
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
              <Hash className="w-2.5 h-2.5" /> {shipment.awb}
            </span>
            {shipment.isCOD && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                COD: ₹{shipment.amount || 0}
              </span>
            )}
            {shipment.deliveryCount && shipment.deliveryCount > 0 && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" /> Delivery: {shipment.deliveryCount}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 flex items-start gap-1.5 mt-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
            <span className="line-clamp-2">{shipment.address}</span>
          </p>

          {shipment.landmark && (
            <p className="text-[10px] text-slate-500 mt-1 ml-5 font-medium italic truncate">
              Landmark: {shipment.landmark}
            </p>
          )}

          {shipment.locality && <p className="text-[11px] font-bold text-primary uppercase mt-1 ml-5 tracking-wider">{shipment.locality}</p>}
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          {onMoveUp && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveUp}><ChevronUp className="w-4 h-4" /></Button>}
          {onMoveDown && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveDown}><ChevronDown className="w-4 h-4" /></Button>}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Phone className="w-4 h-4 text-slate-400" />
          {shipment.phone || 'No phone'}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        {shipment.status === 'Pending' ? (
          <>
            <Button variant="outline" className="flex-1 h-9" onClick={() => onStatusChange(shipment.id!, 'Delivered')}>
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" />Done
            </Button>
            <Button variant="outline" className="flex-1 h-9 text-red-500" onClick={() => onStatusChange(shipment.id!, 'Failed')}>
              <AlertCircle className="w-4 h-4 mr-1.5" />Fail
            </Button>
          </>
        ) : (
          <div className="flex-1 text-center py-1.5 bg-slate-50 rounded text-[10px] uppercase font-black tracking-tighter text-slate-400">
            {shipment.status}
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500" onClick={() => onDelete(shipment.id!)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface ShipmentListProps {
  shipments: Shipment[];
  onStatusChange: (id: number, status: Shipment['status']) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
}

export function ShipmentList({ shipments, onStatusChange, onDelete, onReorder }: ShipmentListProps) {
  const move = (i: number, d: number) => {
    const next = [...shipments];
    const [item] = next.splice(i, 1);
    next.splice(i + d, 0, item);
    onReorder(next.map(s => s.id!));
  };

  if (shipments.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-dashed text-center space-y-2">
        <Package className="w-12 h-12 text-slate-200 mx-auto" />
        <p className="text-slate-400 font-medium">No shipments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((s, i) => (
        <ShipmentCard
          key={s.id}
          shipment={s}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onMoveUp={i > 0 ? () => move(i, -1) : null}
          onMoveDown={i < shipments.length - 1 ? () => move(i, 1) : null}
        />
      ))}
    </div>
  );
}
