import { LOCALITY_DB, Locality } from './locality-db';
import { OCRCorrectionService } from '../ocr/ocr-correction.service';

export class AddressEngine {
  /**
   * Normalizes an address by finding the best matching locality from the database.
   */
  static normalize(address: string): { normalized: string; locality?: Locality; confidence: number } {
    if (!address) return { normalized: '', confidence: 0 };

    // Apply OCR Corrections first
    const correctedAddress = OCRCorrectionService.correctText(address);
    const input = correctedAddress.toLowerCase();
    let bestMatch: Locality | undefined = undefined;
    let maxScore = 0;

    for (const loc of LOCALITY_DB) {
      let score = 0;
      const name = loc.name.toLowerCase();

      // 1. Direct match
      if (input.includes(name)) {
        score = (name.length * 2) / input.length; // Boost direct matches
      }

      // 2. Alias match
      if (loc.aliases) {
        for (const alias of loc.aliases) {
          if (input.includes(alias.toLowerCase())) {
            score = Math.max(score, alias.length / input.length);
          }
        }
      }

      // 3. Fuzzy match for misspelled words
      const words = input.split(/[\s,.-]+/);
      for (const word of words) {
        if (word.length < 4) continue;
        const dist = this.levenshtein(word, name);
        if (dist <= 1) { // 1 char error allowed
          score = Math.max(score, (name.length - dist) / name.length);
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = loc;
      }
    }

    if (bestMatch && maxScore > 0.4) {
      return {
        normalized: `${correctedAddress.trim()}, ${bestMatch.name}, ${bestMatch.district}, ${bestMatch.state}`,
        locality: bestMatch,
        confidence: maxScore * 100
      };
    }

    return { normalized: correctedAddress.trim(), confidence: 0 };
  }

  private static levenshtein(a: string, b: string): number {
    const tmp = [];
    let i, j, alen = a.length, blen = b.length;
    if (alen === 0) return blen;
    if (blen === 0) return alen;
    for (i = 0; i <= alen; i++) tmp[i] = [i];
    for (j = 0; j <= blen; j++) tmp[0][j] = j;
    for (i = 1; i <= alen; i++) {
      for (j = 1; j <= blen; j++) {
        tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return tmp[alen][blen];
  }
}
