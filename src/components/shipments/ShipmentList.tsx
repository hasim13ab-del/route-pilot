import { Shipment } from '@/types/shipment';
import { MapPin, Phone, CheckCircle2, AlertCircle, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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
        <div className="flex-1">
          <h3 className="font-bold text-lg flex items-center gap-2">{shipment.customerName} {shipment.isCOD && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">COD</span>}</h3>
          <p className="text-sm text-slate-600 flex items-start gap-1.5 mt-1"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{shipment.address}</p>
          {shipment.locality && <p className="text-[11px] font-semibold text-primary uppercase ml-5">{shipment.locality}</p>}
        </div>
        <div className="flex flex-col gap-1">
          {onMoveUp && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveUp}><ChevronUp className="w-4 h-4" /></Button>}
          {onMoveDown && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveDown}><ChevronDown className="w-4 h-4" /></Button>}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-500"><div className="flex items-center gap-1"><Phone className="w-4 h-4" />{shipment.phone}</div></div>
      <div className="flex gap-2 pt-2 border-t">
        {shipment.status === 'Pending' ? (
          <><Button variant="outline" className="flex-1" onClick={() => onStatusChange(shipment.id!, 'Delivered')}><CheckCircle2 className="w-4 h-4 mr-1" />Done</Button>
          <Button variant="outline" className="flex-1 text-red-500" onClick={() => onStatusChange(shipment.id!, 'Failed')}><AlertCircle className="w-4 h-4 mr-1" />Fail</Button></>
        ) : <div className="flex-1 text-center py-2 bg-slate-50 rounded text-sm uppercase font-bold">{shipment.status}</div>}
        <Button variant="ghost" size="icon" onClick={() => onDelete(shipment.id!)}><Trash2 className="w-4 h-4" /></Button>
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
