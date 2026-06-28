export interface Shipment {
  id?: number;
  awb?: string;
  customerName: string;
  address: string;
  locality?: string;
  pincode?: string;
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
