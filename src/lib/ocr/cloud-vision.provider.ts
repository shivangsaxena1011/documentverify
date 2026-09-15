import { IOCRProvider, OCRResponse } from "./provider.interface";

export class CloudVisionProvider implements IOCRProvider {
  name = "GOOGLE_CLOUD_VISION";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async processImage(imageSource: Buffer | string): Promise<OCRResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        "Google Cloud Vision API key is not configured in organization settings. Using primary fallback OCR engine."
      );
    }

    const startTime = Date.now();
    let base64Content = "";

    if (Buffer.isBuffer(imageSource)) {
      base64Content = imageSource.toString("base64");
    } else if (typeof imageSource === "string") {
      base64Content = imageSource.includes(",") ? imageSource.split(",")[1] : imageSource;
    }

    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Content },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Cloud Vision responded with status ${response.status}`);
      }

      const data = await response.json();
      const annotation = data.responses?.[0]?.fullTextAnnotation;
      const fullText = annotation?.text || "";

      return {
        provider: this.name,
        fullText,
        averageConfidence: 94, // Cloud vision confidence
        wordsCount: fullText.split(/\s+/).filter(Boolean).length,
        linesCount: fullText.split("\n").filter(Boolean).length,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error("[CLOUD_VISION_ERROR]", error);
      throw new Error(`Cloud Vision processing error: ${error.message}`);
    }
  }
}
