import { GoogleGenerativeAI } from "@google/generative-ai";
import { Shipment } from '@/types/shipment';

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getApiKey(): string | null {
    try {
      // Use a string-based lookup to avoid 'import.meta' syntax errors in Jest
      const meta = new Function('return import.meta')();
      return meta.env.VITE_GEMINI_API_KEY || null;
    } catch {
      // Fallback for node/jest environment
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

  static async extractShipments(text: string): Promise<Partial<Shipment>[] | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an expert logistics runsheet parser.
        Extract shipment details from the following OCR text.

        The text contains multiple shipment cards. Each card typically includes:
        - Customer Name
        - Full Address (Reconstruct from multiple lines if broken. Look for village, town, district, state)
        - Landmark (optional)
        - Phone Number (10 digits)
        - AWB Number (usually 12-15 digits)
        - COD status (True if "COD", "Cash on Delivery" or an amount is mentioned. False if "Prepaid")
        - Delivery Count (e.g., "Delivery - 2" means 2)
        - Priority (High if "Priority" is mentioned)

        CONSTRAINTS:
        - Never hallucinate missing information.
        - Return confidence scores (0-1) for: customerName, address, phone, awb, and an overall score.
        - Normalize names and addresses (correct common OCR typos).
        - Every visible shipment card must be a separate object.
        - Do not merge different customers.

        Return ONLY a valid JSON array of objects with keys:
        customerName, address, landmark, phone, awb, isCOD, deliveryCount, priority, confidence (object with sub-keys).

        Text:
        ${text}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().replace(/```json|```/g, '').trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      return null;
    }
  }
}
