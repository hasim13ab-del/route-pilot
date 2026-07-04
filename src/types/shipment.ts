export interface Shipment {
  id?: number;
  awb?: string;
  customerName: string;

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
  remark?: string;
  status: 'Pending' | 'Delivered' | 'Failed';
  orderIndex: number;
  createdAt: number;

  confidence?: {
    overall: number;
    fields: Record<string, number>;
  };
}
