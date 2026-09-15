export interface OCRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox?: OCRBoundingBox;
}

export interface OCRResponse {
  provider: string;
  fullText: string;
  averageConfidence: number;
  wordsCount: number;
  linesCount: number;
  executionTimeMs: number;
  words?: OCRWord[];
}

export interface IOCRProvider {
  name: string;
  isAvailable(): boolean;
  processImage(imageBuffer: Buffer | string): Promise<OCRResponse>;
}
