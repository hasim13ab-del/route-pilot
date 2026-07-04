import { Shipment } from '@/types/shipment';

export class Validator {
  static validate(s: Shipment): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!s.customerName || s.customerName === 'Unknown') {
      warnings.push('Customer name is missing or unclear');
    }

    if (!s.address || s.address.length < 10) {
      warnings.push('Address seems incomplete');
    }

    if (!s.awb) {
      warnings.push('AWB number not found');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}
