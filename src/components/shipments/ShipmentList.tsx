import React, { useState } from 'react';
import { Shipment } from '@/types/shipment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, XCircle, Trash2, GripVertical, MapPin, Star, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const QUICK_REMARKS = [
  'Delivered',
  'Customer not available',
  'Wrong address',
  'Rescheduled',
  'Refused',
  'Closed',
  'Not reachable'
];

interface SortableItemProps {
  shipment: Shipment;
  onStatusChange: (id: number, status: Shipment['status'], remark?: string) => void;
  onDelete: (id: number) => void;
  onSelect?: (id: number) => void;
}

function SortableShipmentItem({ shipment, onStatusChange, onDelete, onSelect }: SortableItemProps) {
  const [showRemarkDialog, setShowRemarkDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Shipment['status'] | null>(null);
  const [customRemark, setCustomRemark] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: shipment.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleStatusClick = (status: Shipment['status']) => {
    setPendingStatus(status);
    setShowRemarkDialog(true);
  };

  const confirmStatus = (remark: string) => {
    if (pendingStatus) {
      onStatusChange(shipment.id!, pendingStatus, remark);
      setShowRemarkDialog(false);
      setPendingStatus(null);
      setCustomRemark('');
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3 transition-colors ${shipment.status === 'Delivered' ? 'bg-green-50/50' : shipment.status === 'Failed' ? 'bg-red-50/50' : ''}`}
      >
        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing p-1 hover:bg-slate-50 rounded">
          <GripVertical className="w-5 h-5 text-slate-300" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex justify-between items-start" onClick={() => onSelect?.(shipment.id!)}>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 truncate flex items-center gap-2">
                {shipment.customerName}
                {shipment.priority === 'High' && (
                  <Star className="w-3 h-3 text-red-500 fill-red-500" />
                )}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {shipment.awb || 'No AWB'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={shipment.status === 'Delivered' ? 'default' : shipment.status === 'Failed' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-black py-0 px-2">
                {shipment.status}
              </Badge>
              <span className="text-[10px] font-bold text-slate-400">#{shipment.orderIndex + 1}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 flex items-start gap-1">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
            {shipment.address}
          </p>

          {shipment.remark && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
               <MessageSquare className="w-3 h-3" /> "{shipment.remark}"
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
               {shipment.isCOD && (
                 <div className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                   COD ₹{shipment.amount}
                 </div>
               )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-500" onClick={() => handleStatusClick('Delivered')}>
                <CheckCircle2 className="w-5 h-5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleStatusClick('Failed')}>
                <XCircle className="w-5 h-5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-300 hover:text-red-500" onClick={() => onDelete(shipment.id!)}>
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showRemarkDialog} onOpenChange={setShowRemarkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Delivery Remark</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_REMARKS.map(r => (
                <Button key={r} variant="outline" size="sm" className="text-xs" onClick={() => confirmStatus(r)}>
                  {r}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Custom Remark</label>
              <textarea
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                rows={2}
                value={customRemark}
                onChange={e => setCustomRemark(e.target.value)}
                placeholder="Enter custom text..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowRemarkDialog(false)}>Cancel</Button>
            <Button onClick={() => confirmStatus(customRemark)}>Save Remark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ShipmentList({ shipments, onStatusChange, onDelete, onReorder, onSelect }: {
  shipments: Shipment[],
  onStatusChange: (id: number, s: Shipment['status'], remark?: string) => void,
  onDelete: (id: number) => void,
  onReorder: (ids: number[]) => void,
  onSelect?: (id: number) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = shipments.findIndex(s => s.id === active.id);
      const newIndex = shipments.findIndex(s => s.id === over.id);
      const newArray = arrayMove(shipments, oldIndex, newIndex);
      onReorder(newArray.map(s => s.id!));
    }
  };

  if (shipments.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center space-y-4">
        <PackageIcon className="w-12 h-12 text-slate-200 mx-auto" />
        <p className="text-slate-400 font-medium">No shipments found</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={shipments.map(s => s.id!)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {shipments.map((s) => (
            <SortableShipmentItem
              key={s.id}
              shipment={s}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function PackageIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M16.5 9.4 7.5 4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
