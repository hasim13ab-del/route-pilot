import { Shipment } from '@/types/shipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Package
} from 'lucide-react';

export function StatsDashboard({ shipments }: { shipments: Shipment[] }) {
  const total = shipments.length;
  const delivered = shipments.filter(s => s.status === 'Delivered').length;
  const pending = shipments.filter(s => s.status === 'Pending').length;
  const failed = shipments.filter(s => s.status === 'Failed').length;
  const codTotal = shipments.filter(s => s.isCOD).reduce((acc, s) => acc + (s.amount || 0), 0);

  const stats = [
    { title: 'Total', value: total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Delivered', value: delivered, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Pending', value: pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { title: 'Failed', value: failed, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden">
            <CardHeader className={`${stat.bg} py-3 px-4 flex flex-row items-center justify-between space-y-0`}>
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="py-4 px-4">
              <div className="text-2xl font-black">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">Delivery Remarks</CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
             {shipments.filter(s => s.remark).length === 0 ? (
               <p className="text-xs text-slate-400 text-center py-4">No remarks recorded yet</p>
             ) : (
               shipments.filter(s => s.remark).slice(0, 5).map((s, i) => (
                 <div key={i} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{s.customerName}</p>
                      <p className="text-[11px] text-slate-500 italic mt-1">"{s.remark}"</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      s.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.status}
                    </span>
                 </div>
               ))
             )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">Logistics Overview</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs">₹</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">COD Collection</p>
                  <p className="text-sm font-bold">₹{codTotal.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-green-600 uppercase">Total Cash</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
