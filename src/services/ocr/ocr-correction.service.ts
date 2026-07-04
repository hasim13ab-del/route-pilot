export class OCRCorrectionService {
  private static MAPPING: Record<string, string> = {
    '0': 'O',
    '1': 'I',
    '5': 'S',
    '8': 'B',
  };

  /**
   * Corrects common OCR misreadings in names/addresses (Numbers to Letters)
   */
  static correctText(text: string): string {
    return text.split(' ').map(word => {
      // 1. Direct replacements for known problematic words/patterns
      let corrected = word
        .replace(/R0ad/g, 'Road')
        .replace(/L0ngli/g, 'Longli')
        .replace(/bost1/g, 'bosti')
        .replace(/Hndu/g, 'Hindu')
        .replace(/Blok/g, 'Block');

      // 2. Heuristic: If the word is mostly letters but has a few numbers, correct them
      if (/[A-Za-z]/.test(corrected) && /[0-9]/.test(corrected) && corrected.length > 3) {
        corrected = corrected.replace(/[0158]/g, m => this.MAPPING[m] || m);
      }

      // 3. Common specific fixes for single chars or mixed case
      return corrected
        .replace(/\bl\b/g, 'I')
        .replace(/(\w)1(\w)/g, '$1I$2')
        .replace(/(\w)0(\w)/g, '$1O$2');
    }).join(' ');
  }

  /**
   * Corrects common OCR misreadings in IDs/Phones (Letters to Numbers)
   */
  static correctNumeric(text: string): string {
    return text
      .replace(/O/g, '0')
      .replace(/[Il]/g, '1')
      .replace(/S/g, '5')
      .replace(/B/g, '8');
  }
}
