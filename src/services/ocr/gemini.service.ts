import { GoogleGenerativeAI } from "@google/generative-ai";
import { Shipment } from '@/types/shipment';

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getApiKey(): string | null {
    try {
      const meta = new Function('return import.meta')();
      return meta.env.VITE_GEMINI_API_KEY || null;
    } catch {
      // eslint-disable-next-line no-undef
      const nodeEnv: Record<string, string | undefined> = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {};
      return nodeEnv.VITE_GEMINI_API_KEY || null;
    }
  }

  private static getClient() {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  static async segmentAndExtract(ocrText: string): Promise<Partial<Shipment>[]> {
    const client = this.getClient();
    if (!client) return [];

    try {
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are a highly accurate logistics OCR parser.
        Analyze the following OCR text from a delivery runsheet.

        CRITICAL RULES:
        1. SEGMENTATION: The text contains MULTIPLE shipments. Identify boundaries.
        2. CUSTOMER NAME: Always the first valid name. NEVER use address lines or landmarks as names.
        3. DELIVERY COUNT: Extract exactly as seen (e.g. "Delivery - 1" -> 1).
        4. ADDRESS GRANULARITY: Split address into houseNo, road, village, landmark, town, district, state, pincode.
        5. IGNORE UI: Skip headers like "Pending", "My Route", "SOS", "Search", "Jobsheet".
        6. REGIONAL: Focus on Assam and Nagaland localities.
        7. AWB: Extract 12-15 digit tracking numbers.
        8. PHONE: Extract 10 digit numbers.
        9. COD: Check for "COD", "Cash on Delivery" or amount.

        Return ONLY a valid JSON array of shipment objects.
        Fields: customerName, phone, deliveryCount, houseNo, road, village, landmark, town, district, state, pincode, awb, isCOD, amount, priority, confidence (object with field scores 0-1).

        OCR TEXT:
        ${ocrText}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      return [];
    }
  }
}
