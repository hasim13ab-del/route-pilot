export interface Shipment {
  id?: number;
  customerName: string;
  address: string;
  locality?: string;
  landmark?: string;
  phone: string;
  priority: 'High' | 'Normal';
  isCOD: boolean;
  amount?: number;
  remarks?: string;
  status: 'Pending' | 'Delivered' | 'Failed';
  orderIndex: number;
  createdAt: number;
}
