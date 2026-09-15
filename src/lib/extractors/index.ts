import { DocumentType } from "../classifier/document-classifier";
import { extractAadhaarFields, ParsedField } from "./aadhaar";
import { extractPANFields } from "./pan";
import { extractPassportFields, MRZParseResult } from "./passport";
import { extractDrivingLicenceFields } from "./driving-licence";
import { extractVoterIDFields } from "./voter-id";

export interface ExtractionResult {
  fields: ParsedField[];
  mrzResult?: MRZParseResult | null;
}

export function extractFieldsForDocument(
  docType: DocumentType,
  ocrText: string
): ExtractionResult {
  switch (docType) {
    case "AADHAAR_CARD":
      return { fields: extractAadhaarFields(ocrText) };
    case "PAN_CARD":
      return { fields: extractPANFields(ocrText) };
    case "PASSPORT":
      return extractPassportFields(ocrText);
    case "DRIVING_LICENCE":
      return { fields: extractDrivingLicenceFields(ocrText) };
    case "VOTER_ID":
      return { fields: extractVoterIDFields(ocrText) };
    default:
      // Fallback: search common fields
      const generalFields: ParsedField[] = [];
      const dobMatch = ocrText.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
      if (dobMatch) {
        generalFields.push({
          key: "dob",
          label: "Identified Date",
          rawValue: dobMatch[1],
          maskedValue: dobMatch[1],
          isSensitive: false,
          confidence: 70,
          validationStatus: "WARNING",
        });
      }
      return { fields: generalFields };
  }
}
