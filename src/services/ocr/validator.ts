import { Shipment } from '@/types/shipment';

export class Validator {
  static validate(shipment: Shipment): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Phone validation (Indian context: 10 digits starting with 6-9)
    if (shipment.phone) {
      const cleanPhone = shipment.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
        warnings.push('Invalid phone number format detected.');
      }
    } else {
      warnings.push('Phone number is missing.');
    }

    // Pincode validation (6 digits)
    if (shipment.pincode) {
      if (!/^[1-9][0-9]{5}$/.test(shipment.pincode)) {
        warnings.push('Invalid pincode format.');
      }
    }

    // Amount validation
    if (shipment.isCOD && (!shipment.amount || shipment.amount <= 0)) {
      warnings.push('COD shipment missing amount.');
    } else if (shipment.amount && shipment.amount > 50000) {
      warnings.push('Unusually high COD amount detected.');
    }

    // Address length
    if (shipment.address.length < 10 && shipment.address !== 'Address Missing') {
      warnings.push('Address seems too short.');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Fixes common OCR misreads in numeric fields.
   */
  static autocorrect(text: string, type: 'number' | 'text'): string {
    if (type === 'number') {
      return text
        .replace(/O/g, '0')
        .replace(/I/g, '1')
        .replace(/l/g, '1')
        .replace(/S/g, '5')
        .replace(/B/g, '8')
        .replace(/\D/g, '');
    }
    return text.trim();
  }
}
