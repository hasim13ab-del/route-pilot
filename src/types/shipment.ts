export interface Shipment {
  id?: number;
  awb?: string;
  customerName: string;
  phone: string;
  deliveryCount: number;

  // Granular Address Fields
  houseNo?: string;
  road?: string;
  village?: string;
  landmark?: string;
  town?: string;
  locality?: string;
  district?: string;
  state: string;
  pincode?: string;

  // Combined address for mapping/nav
  address: string;

  priority: 'High' | 'Normal';
  isCOD: boolean;
  amount?: number;
  remarks?: string;
  status: 'Pending' | 'Delivered' | 'Failed';
  orderIndex: number;
  createdAt: number;

  confidence?: {
    overall: number;
    fields: Record<string, number>;
  };
}
