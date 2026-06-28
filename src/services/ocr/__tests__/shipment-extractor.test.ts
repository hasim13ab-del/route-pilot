import { ShipmentExtractor } from '../shipment-extractor';
import { OCRResult } from '../ocr.service';

describe('ShipmentExtractor', () => {
  it('should extract exactly 6 shipments from the jobsheet screenshot data', async () => {
    const mockOCRResult: OCRResult = {
      text: '',
      confidence: 90,
      blocks: [
        // Card 1
        { text: 'Ashraf Talukdar', confidence: 99, bbox: { x0: 50, y0: 250, x1: 300, y1: 280 } },
        { text: 'Priority', confidence: 99, bbox: { x0: 800, y0: 250, x1: 950, y1: 280 } },
        { text: 'Gyan Jyoti Jatio Vidhyala, Rajbari Road,', confidence: 95, bbox: { x0: 50, y0: 290, x1: 700, y1: 310 } },
        { text: 'Longlibosti, Near Masjid Al-Huda, Hojai', confidence: 95, bbox: { x0: 50, y0: 315, x1: 700, y1: 335 } },
        { text: 'LANDMARK: Masjid Al-Huda', confidence: 95, bbox: { x0: 50, y0: 350, x1: 400, y1: 370 } },
        { text: 'Delivery - 1', confidence: 99, bbox: { x0: 130, y0: 450, x1: 300, y1: 470 } },

        // Card 2
        { text: 'SABIR AHMED', confidence: 99, bbox: { x0: 50, y0: 530, x1: 300, y1: 560 } },
        { text: 'Priority', confidence: 99, bbox: { x0: 800, y0: 530, x1: 950, y1: 560 } },
        { text: 'H No 247 Paschim Solmarijan Hindu Block Hojai', confidence: 95, bbox: { x0: 50, y0: 570, x1: 750, y1: 590 } },
        { text: 'Assam, Paschim Solmarijan, NAGAON', confidence: 95, bbox: { x0: 50, y0: 595, x1: 750, y1: 615 } },
        { text: 'Delivery - 1', confidence: 99, bbox: { x0: 130, y0: 710, x1: 300, y1: 730 } },

        // Card 3
        { text: 'Mustak Ahmed', confidence: 99, bbox: { x0: 50, y0: 790, x1: 300, y1: 820 } },
        { text: 'Priority', confidence: 99, bbox: { x0: 800, y0: 790, x1: 950, y1: 820 } },
        { text: 'Hindu Block Siddha Ashram, Hindu Block, Doboka', confidence: 95, bbox: { x0: 50, y0: 830, x1: 750, y1: 850 } },
        { text: 'LANDMARK: Hindu block Siddha Ashram', confidence: 95, bbox: { x0: 50, y0: 865, x1: 750, y1: 885 } },
        { text: 'Delivery - 2', confidence: 99, bbox: { x0: 130, y0: 970, x1: 300, y1: 990 } },

        // Card 4
        { text: 'Affan Alom', confidence: 99, bbox: { x0: 50, y0: 1050, x1: 300, y1: 1080 } },
        { text: '233, NAM DOBOKA GAON M.E SCHOOL, Doboka', confidence: 95, bbox: { x0: 50, y0: 1090, x1: 750, y1: 1110 } },
        { text: 'LANDMARK: Doboka depu road ekart off', confidence: 95, bbox: { x0: 50, y0: 1125, x1: 750, y1: 1145 } },
        { text: 'Delivery - 4', confidence: 99, bbox: { x0: 130, y0: 1230, x1: 300, y1: 1250 } },

        // Card 5
        { text: 'Mahmad Ali', confidence: 99, bbox: { x0: 50, y0: 1310, x1: 300, y1: 1340 } },
        { text: 'Nahargoan, Hindu block goan panchaya, Doboka', confidence: 95, bbox: { x0: 50, y0: 1350, x1: 750, y1: 1370 } },
        { text: 'Delivery - 1', confidence: 99, bbox: { x0: 130, y0: 1470, x1: 300, y1: 1490 } },

        // Card 6
        { text: 'Nurul Hoque', confidence: 99, bbox: { x0: 50, y0: 1550, x1: 300, y1: 1580 } },
        { text: '191, Hindu block post office, Doboka', confidence: 95, bbox: { x0: 50, y0: 1590, x1: 750, y1: 1610 } },
        { text: 'Delivery - 1', confidence: 99, bbox: { x0: 130, y0: 1710, x1: 300, y1: 1730 } },
      ]
    };

    // Construct raw text to simulate how extractor combines them for AI cleanup
    mockOCRResult.text = mockOCRResult.blocks.map(b => b.text).join('\n');

    const shipments = await ShipmentExtractor.extractFromOCR(mockOCRResult);

    expect(shipments.length).toBe(6);
    expect(shipments[0].customerName).toBe('Ashraf Talukdar');
    expect(shipments[0].priority).toBe('High');
    expect(shipments[0].landmark).toBe('Masjid Al-Huda');
    expect(shipments[0].deliveryCount).toBe(1);

    expect(shipments[1].customerName).toBe('SABIR AHMED');
    expect(shipments[1].priority).toBe('High');

    expect(shipments[3].customerName).toBe('Affan Alom');
    expect(shipments[3].deliveryCount).toBe(4);

    expect(shipments[5].customerName).toBe('Nurul Hoque');
    expect(shipments[5].address).toContain('191, Hindu block post office');
  });
});
