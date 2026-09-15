import { createWorker } from "tesseract.js";
import { IOCRProvider, OCRResponse, OCRWord } from "./provider.interface";

export class TesseractProvider implements IOCRProvider {
  name = "TESSERACT_LOCAL";

  isAvailable(): boolean {
    return true; // Local engine is always available
  }

  async processImage(imageSource: Buffer | string): Promise<OCRResponse> {
    const startTime = Date.now();

    // Support base64 data url, buffer, or file path
    let worker: any = null;
    try {
      worker = await createWorker("eng");
      
      const ret = await worker.recognize(imageSource);
      const executionTimeMs = Date.now() - startTime;

      const words: OCRWord[] = (ret.data.words || []).map((w: any) => ({
        text: w.text,
        confidence: Math.round(w.confidence || 0),
        bbox: w.bbox
          ? {
              x: w.bbox.x0,
              y: w.bbox.y0,
              width: w.bbox.x1 - w.bbox.x0,
              height: w.bbox.y1 - w.bbox.y0,
            }
          : undefined,
      }));

      const averageConfidence =
        words.length > 0
          ? Math.round(words.reduce((sum, w) => sum + w.confidence, 0) / words.length)
          : Math.round(ret.data.confidence || 0);

      const linesCount = ret.data.lines ? ret.data.lines.length : ret.data.text.split("\n").filter(Boolean).length;

      return {
        provider: this.name,
        fullText: ret.data.text,
        averageConfidence: Math.min(100, Math.max(0, averageConfidence)),
        wordsCount: words.length,
        linesCount: linesCount,
        executionTimeMs,
        words,
      };
    } catch (error: any) {
      console.error("[TESSERACT_PROVIDER_ERROR]", error);
      throw new Error(`Tesseract OCR processing failed: ${error?.message || "Unknown error"}`);
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // ignore termination error
        }
      }
    }
  }
}
