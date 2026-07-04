import { AddressEngine } from '../address-engine';

describe('AddressEngine', () => {
  it('should correct common OCR misreadings and normalize Assam addresses', () => {
    // '0' as 'O', '1' as 'I'
    const input = 'Ashraf Talukdar, Rajbari R0ad, L0nglibost1, Hojai';
    const result = AddressEngine.normalize(input);

    expect(result.normalized).toContain('Rajbari Road');
    expect(result.normalized).toContain('Longlibosti');
    expect(result.locality?.name).toBe('Hojai');
    expect(result.locality?.district).toBe('Hojai');
  });

  it('should fuzzy match misspelled localities', () => {
    const input = 'Hindu Blok, Dobuka';
    const result = AddressEngine.normalize(input);

    expect(result.locality?.name).toBe('Hindu Block');
    expect(result.locality?.district).toBe('Hojai');
  });

  it('should normalize Nagaland addresses', () => {
    const input = 'Purana Bazar B, Chumukedima';
    const result = AddressEngine.normalize(input);

    expect(result.locality?.name).toBe('Purana Bazar');
    expect(result.locality?.state).toBe('Nagaland');
  });
});
