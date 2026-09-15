import { IOCRProvider } from "./provider.interface";
import { TesseractProvider } from "./tesseract.provider";
import { CloudVisionProvider } from "./cloud-vision.provider";

export class OCRFactory {
  static getProvider(): IOCRProvider {
    const configuredProvider = process.env.OCR_PROVIDER?.toUpperCase();

    if (configuredProvider === "GOOGLE_CLOUD_VISION") {
      const vision = new CloudVisionProvider();
      if (vision.isAvailable()) {
        return vision;
      }
      console.warn(
        "[OCRFactory] GOOGLE_CLOUD_VISION selected but API key not present. Falling back to local Tesseract engine."
      );
    }

    return new TesseractProvider();
  }
}
