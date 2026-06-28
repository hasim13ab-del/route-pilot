import React from 'react';
import { Shipment } from '@/types/shipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CheckCircle2, Clock, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

export function StatsDashboard({ shipments }: { shipments: Shipment[] }) {
  const total = shipments.length;
  const delivered = shipments.filter(s => s.status === 'Delivered').length;
  const pending = shipments.filter(s => s.status === 'Pending').length;
  const failed = shipments.filter(s => s.status === 'Failed').length;
  const codTotal = shipments.filter(s => s.isCOD).reduce((acc, s) => acc + (s.amount || 0), 0);
  const highPriority = shipments.filter(s => s.priority === 'High').length;

  const stats = [
    { title: 'Total Shipments', value: total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
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
            <CardTitle className="text-sm font-bold">Logistics Overview</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">High Priority</p>
                  <p className="text-sm font-bold">{highPriority} Shipments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-primary uppercase">Attention Required</p>
              </div>
            </div>

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

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">Performance History</CardTitle>
            <Calendar className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="h-24 flex items-end justify-between gap-1 px-2">
              {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group" style={{ height: `${h}%` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <span key={d} className="text-[8px] font-bold text-slate-400 uppercase">{d}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
