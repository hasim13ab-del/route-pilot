import { Shipment } from '@/types/shipment';
import { GeminiService } from './gemini.service';
import { OCRCorrectionService } from './ocr-correction.service';

export class AICleanupService {
  static async cleanup(rawText: string): Promise<Partial<Shipment>[]> {
    // Attempt Gemini extraction first if API key is present
    const geminiResults = await GeminiService.extractShipments(rawText);
    if (geminiResults && geminiResults.length > 0) {
      return geminiResults;
    }

    return this.deterministicAIParser(rawText);
  }

  private static deterministicAIParser(text: string): Partial<Shipment>[] {
    const shipments: Partial<Shipment>[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let current: Partial<Shipment> | null = null;

    for (const line of lines) {
      // Improved Name Detection: Avoid common UI words and numbers
      const isName = /^[A-Z][A-Za-z]+ [A-Z][A-Za-z]+/.test(line) &&
                     !/Delivery|LANDMARK|Priority|Shipment|Jobsheet|Search|Paschim|Solmarijan|Hindu|Block/i.test(line) &&
                     !/Gyan|Jyoti|Jatio|Vidhyala/i.test(line) &&
                     !/\d{10}/.test(line) &&
                     !/[0-9]{12}/.test(line);

      if (isName) {
        if (current && current.customerName && current.address) {
          shipments.push(current);
        }
        current = {
          customerName: OCRCorrectionService.correctText(line),
          status: 'Pending',
          priority: 'Normal',
          address: '',
          isCOD: false
        };
      } else if (current) {
        // Phone extraction
        const phoneMatch = line.match(/\b\d{10}\b/);
        if (phoneMatch && !current.phone) {
          current.phone = phoneMatch[0];
        }

        // AWB extraction (usually 12+ digits)
        const awbMatch = line.match(/\b\d{12,15}\b/);
        if (awbMatch && !current.awb) {
          current.awb = awbMatch[0];
        }

        // COD detection
        if (/COD|C\.O\.D|Cash on Delivery/i.test(line)) {
          current.isCOD = true;
        }

        if (line.toUpperCase().includes('LANDMARK:')) {
          current.landmark = OCRCorrectionService.correctText(line.replace(/LANDMARK:\s*/i, '').trim());
        } else if (line.toUpperCase().includes('DELIVERY -')) {
          const match = line.match(/(\d+)/);
          if (match) current.deliveryCount = parseInt(match[1]);
        } else if (line.toUpperCase().includes('PRIORITY')) {
          current.priority = 'High';
        } else if (line.length > 5 && !/^[0-9]$/.test(line) && !phoneMatch && !awbMatch) {
          const correctedLine = OCRCorrectionService.correctText(line);
          if (!current.address) {
            current.address = correctedLine;
          } else if (current.address.length < 300) {
            current.address += ', ' + correctedLine;
          }
        }
      }
    }

    if (current && current.customerName && current.address) {
      shipments.push(current);
    }
    return shipments;
  }
}
