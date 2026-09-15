import { ParsedField } from "./aadhaar";

const ENTITY_TYPES: Record<string, string> = {
  P: "Individual",
  C: "Company",
  H: "Hindu Undivided Family (HUF)",
  F: "Partnership Firm / LLP",
  A: "Association of Persons (AOP)",
  T: "Trust",
  B: "Body of Individuals (BOI)",
  L: "Local Authority",
  J: "Artificial Juridical Person",
  G: "Government Agency",
};

export function maskPAN(pan: string): string {
  if (pan.length === 10) {
    return `${pan.slice(0, 5)}****${pan.slice(9)}`;
  }
  return "ABCDE****F";
}

export function extractPANFields(text: string): ParsedField[] {
  const fields: ParsedField[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. PAN Number matching
  const panRegex = /\b([A-Z]{5}[0-9]{4}[A-Z])\b/;
  const panMatch = text.match(panRegex);

  if (panMatch) {
    const pan = panMatch[1];
    const entityChar = pan.charAt(3);
    const entityType = ENTITY_TYPES[entityChar] || "Unknown Entity";

    fields.push({
      key: "pan_number",
      label: "Permanent Account Number (PAN)",
      rawValue: pan,
      maskedValue: maskPAN(pan),
      isSensitive: true,
      confidence: 98,
      validationStatus: "VALID",
    });

    fields.push({
      key: "pan_entity_type",
      label: "PAN Entity Classification",
      rawValue: entityType,
      maskedValue: entityType,
      isSensitive: false,
      confidence: 96,
      validationStatus: "VALID",
    });
  }

  // 2. Date of Birth
  const dobRegex = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/;
  const dobMatch = text.match(dobRegex);
  if (dobMatch) {
    fields.push({
      key: "dob",
      label: "Date of Birth / Incorporation",
      rawValue: dobMatch[1],
      maskedValue: dobMatch[1],
      isSensitive: false,
      confidence: 92,
      validationStatus: "VALID",
    });
  }

  // 3. Name & Father's Name parsing
  // Income Tax PAN card lines usually:
  // [Header]
  // Name
  // Father's Name
  // Date of Birth
  // PAN Number
  let nameLine = "";
  let fatherNameLine = "";

  const nameIndex = lines.findIndex(
    (l) => /Name|Cardholder Name/i.test(l) && !/Father/i.test(l)
  );

  if (nameIndex !== -1 && lines[nameIndex + 1]) {
    nameLine = lines[nameIndex + 1];
  } else {
    // Heuristic: search clean capital lines before Father's name or DOB
    const dobIndex = lines.findIndex((l) => dobRegex.test(l));
    if (dobIndex >= 2) {
      nameLine = lines[dobIndex - 2];
      fatherNameLine = lines[dobIndex - 1];
    } else if (dobIndex === 1) {
      nameLine = lines[0];
    }
  }

  // Check if father name has explicit marker
  const fatherIndex = lines.findIndex((l) => /Father(?:'s)?\s*Name/i.test(l));
  if (fatherIndex !== -1 && lines[fatherIndex + 1]) {
    fatherNameLine = lines[fatherIndex + 1];
  }

  if (nameLine && !/INCOME|GOVT|INDIA|DEPARTMENT/i.test(nameLine)) {
    fields.push({
      key: "holder_name",
      label: "Cardholder Name",
      rawValue: nameLine.replace(/[^A-Za-z\s]/g, "").trim(),
      maskedValue: nameLine.replace(/[^A-Za-z\s]/g, "").trim(),
      isSensitive: false,
      confidence: 89,
      validationStatus: "VALID",
    });
  }

  if (fatherNameLine && !/INCOME|GOVT|INDIA|DEPARTMENT/i.test(fatherNameLine)) {
    fields.push({
      key: "father_name",
      label: "Father's Name",
      rawValue: fatherNameLine.replace(/[^A-Za-z\s]/g, "").trim(),
      maskedValue: fatherNameLine.replace(/[^A-Za-z\s]/g, "").trim(),
      isSensitive: false,
      confidence: 85,
      validationStatus: "VALID",
    });
  }

  return fields;
}
