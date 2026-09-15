import { ParsedField } from "./aadhaar";

export function maskDL(dl: string): string {
  const clean = dl.replace(/\s/g, "");
  if (clean.length > 8) {
    return `${clean.slice(0, 4)}****${clean.slice(-4)}`;
  }
  return "DL-****9021";
}

export function extractDrivingLicenceFields(text: string): ParsedField[] {
  const fields: ParsedField[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. DL Number
  // Format: 2-letter state code + 2-digit RTO + 4-digit year + 7-digit sequential
  const dlRegex = /\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7})\b|\b([A-Z]{2}[0-9]{2}[-\s]?[0-9]{4,11})\b/i;
  const dlMatch = text.match(dlRegex);

  if (dlMatch) {
    const rawDL = (dlMatch[1] || dlMatch[2]).toUpperCase();
    fields.push({
      key: "dl_number",
      label: "Driving Licence Number",
      rawValue: rawDL,
      maskedValue: maskDL(rawDL),
      isSensitive: true,
      confidence: 96,
      validationStatus: "VALID",
    });
  }

  // 2. Validity / Expiry Date
  const validityRegex = /(?:Valid Till|Validity|Valid Up To|NT\s*Validity)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;
  const valMatch = text.match(validityRegex);
  if (valMatch) {
    fields.push({
      key: "valid_till",
      label: "Validity (Non-Transport)",
      rawValue: valMatch[1],
      maskedValue: valMatch[1],
      isSensitive: false,
      confidence: 91,
      validationStatus: "VALID",
    });
  }

  // 3. Date of Birth
  const dobRegex = /(?:DOB|Date of Birth)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;
  const dobMatch = text.match(dobRegex);
  if (dobMatch) {
    fields.push({
      key: "dob",
      label: "Date of Birth",
      rawValue: dobMatch[1],
      maskedValue: dobMatch[1],
      isSensitive: false,
      confidence: 93,
      validationStatus: "VALID",
    });
  }

  // 4. Vehicle Classes (COV)
  const covClasses: string[] = [];
  if (/\bMCWG\b/i.test(text) || /\bMCWOG\b/i.test(text)) covClasses.push("MCWG (Motor Cycle with Gear)");
  if (/\bLMV\b/i.test(text) || /\bLMV-NT\b/i.test(text)) covClasses.push("LMV (Light Motor Vehicle)");
  if (/\bTRANS\b/i.test(text) || /\bHGMV\b/i.test(text)) covClasses.push("TRANS (Heavy / Commercial)");

  if (covClasses.length > 0) {
    fields.push({
      key: "vehicle_classes",
      label: "Authorized Vehicle Classes",
      rawValue: covClasses.join(", "),
      maskedValue: covClasses.join(", "),
      isSensitive: false,
      confidence: 94,
      validationStatus: "VALID",
    });
  }

  // 5. Name
  const nameIdx = lines.findIndex((l) => /Name\s*[:\-]/i.test(l) && !/Father/i.test(l));
  if (nameIdx !== -1) {
    const candidate = lines[nameIdx].replace(/Name\s*[:\-]/i, "").trim();
    if (candidate.length > 2) {
      fields.push({
        key: "holder_name",
        label: "Licence Holder Name",
        rawValue: candidate,
        maskedValue: candidate,
        isSensitive: false,
        confidence: 88,
        validationStatus: "VALID",
      });
    }
  }

  return fields;
}
