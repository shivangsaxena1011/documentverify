import { ParsedField } from "./aadhaar";

export function maskEPIC(epic: string): string {
  if (epic.length === 10) {
    return `${epic.slice(0, 3)}****${epic.slice(7)}`;
  }
  return "EPIC-****781";
}

export function extractVoterIDFields(text: string): ParsedField[] {
  const fields: ParsedField[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. EPIC Number: 3 capital letters + 7 digits
  const epicRegex = /\b([A-Z]{3}[0-9]{7})\b/;
  const epicMatch = text.match(epicRegex);

  if (epicMatch) {
    const epic = epicMatch[1];
    fields.push({
      key: "epic_number",
      label: "Elector's Photo Identity Card (EPIC) Number",
      rawValue: epic,
      maskedValue: maskEPIC(epic),
      isSensitive: true,
      confidence: 97,
      validationStatus: "VALID",
    });
  }

  // 2. Elector Name
  const nameIdx = lines.findIndex((l) => /Elector's\s*Name|Name\s*:/i.test(l) && !/Father|Husband/i.test(l));
  if (nameIdx !== -1) {
    const candidate = lines[nameIdx].replace(/Elector's\s*Name|Name\s*:/i, "").trim();
    if (candidate.length > 2) {
      fields.push({
        key: "holder_name",
        label: "Elector Name",
        rawValue: candidate,
        maskedValue: candidate,
        isSensitive: false,
        confidence: 90,
        validationStatus: "VALID",
      });
    }
  }

  // 3. Relation Name (Father/Husband)
  const relIdx = lines.findIndex((l) => /Father(?:'s)?\s*Name|Husband(?:'s)?\s*Name/i.test(l));
  if (relIdx !== -1) {
    const candidate = lines[relIdx].replace(/Father(?:'s)?\s*Name|Husband(?:'s)?\s*Name\s*:/i, "").trim();
    if (candidate.length > 2) {
      fields.push({
        key: "relation_name",
        label: "Father's / Husband's Name",
        rawValue: candidate,
        maskedValue: candidate,
        isSensitive: false,
        confidence: 87,
        validationStatus: "VALID",
      });
    }
  }

  // 4. Gender & Age
  const genderMatch = text.match(/\b(MALE|FEMALE|TRANSGENDER)\b/i);
  if (genderMatch) {
    fields.push({
      key: "gender",
      label: "Sex",
      rawValue: genderMatch[1].toUpperCase(),
      maskedValue: genderMatch[1].toUpperCase(),
      isSensitive: false,
      confidence: 94,
      validationStatus: "VALID",
    });
  }

  const ageMatch = text.match(/(?:Age|आयु)\s*[:\-]?\s*(\d{2})/i);
  if (ageMatch) {
    fields.push({
      key: "age",
      label: "Age",
      rawValue: ageMatch[1],
      maskedValue: ageMatch[1],
      isSensitive: false,
      confidence: 91,
      validationStatus: "VALID",
    });
  }

  return fields;
}
