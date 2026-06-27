import { Shipment } from '@/types/shipment';

export function StatsDashboard({ shipments }: { shipments: Shipment[] }) {
  const total = shipments.length;
  const delivered = shipments.filter(s => s.status === 'Delivered').length;
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded border shadow-sm"><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold">{total}</p></div>
      <div className="bg-white p-4 rounded border shadow-sm"><p className="text-sm text-slate-500">Delivered</p><p className="text-2xl font-bold">{delivered}</p></div>
    </div>
  );
}
