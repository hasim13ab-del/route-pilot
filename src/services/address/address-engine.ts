export const ASSAM_LOCALITIES = ['Doboka', 'Niz Doboka', 'Kodoba', 'Islampur', 'College Road', 'Lumding Road', 'Masjid Road', 'Hojai', 'Nagaon', 'Lanka', 'Jamunamukh', 'Dimapur', 'Chümoukedima'];
export class AddressEngine {
  static recognizeLocality(address: string): string | undefined {
    if (!address) return undefined;
    const normalized = address.toLowerCase();
    for (const loc of ASSAM_LOCALITIES) { if (normalized.includes(loc.toLowerCase())) return loc; }
    return undefined;
  }
}
