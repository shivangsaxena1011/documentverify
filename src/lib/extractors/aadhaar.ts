export interface ParsedField {
  key: string;
  label: string;
  rawValue: string;
  maskedValue: string;
  isSensitive: boolean;
  confidence: number;
  validationStatus: "VALID" | "WARNING" | "INCONSISTENT";
}

// Verhoeff Algorithm for Aadhaar Checksum Validation
const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function validateVerhoeff(numStr: string): boolean {
  const clean = numStr.replace(/\D/g, "");
  if (clean.length !== 12) return false;

  let c = 0;
  const reversed = clean.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    const digit = parseInt(reversed[i], 10);
    c = d[c][p[i % 8][digit]];
  }
  return c === 0;
}

export function maskAadhaar(numStr: string): string {
  const clean = numStr.replace(/\D/g, "");
  if (clean.length === 12) {
    const last4 = clean.slice(-4);
    return `XXXX XXXX ${last4}`;
  }
  return "XXXX XXXX ****";
}

export function extractAadhaarFields(text: string): ParsedField[] {
  const fields: ParsedField[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Aadhaar UID extraction
  const uidRegex = /\b(\d{4}\s\d{4}\s\d{4}|\d{12})\b/;
  const uidMatch = text.match(uidRegex);
  if (uidMatch) {
    const rawUid = uidMatch[0].replace(/\s/g, "");
    const isValidVerhoeff = validateVerhoeff(rawUid);
    fields.push({
      key: "aadhaar_number",
      label: "Aadhaar Number",
      rawValue: `${rawUid.slice(0, 4)} ${rawUid.slice(4, 8)} ${rawUid.slice(8, 12)}`,
      maskedValue: maskAadhaar(rawUid),
      isSensitive: true,
      confidence: isValidVerhoeff ? 96 : 82,
      validationStatus: isValidVerhoeff ? "VALID" : "WARNING",
    });
  }

  // 2. Date of Birth / Year of Birth
  const dobRegex = /(?:DOB|Date of Birth|Birth|DOB\s*:|जन्म\s*तिथि)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;
  const yobRegex = /(?:Year of Birth|YOB)\s*[:\-]?\s*(\d{4})/i;
  const dobMatch = text.match(dobRegex);
  const yobMatch = text.match(yobRegex);

  if (dobMatch) {
    fields.push({
      key: "dob",
      label: "Date of Birth",
      rawValue: dobMatch[1],
      maskedValue: dobMatch[1],
      isSensitive: false,
      confidence: 94,
      validationStatus: "VALID",
    });
  } else if (yobMatch) {
    fields.push({
      key: "yob",
      label: "Year of Birth",
      rawValue: yobMatch[1],
      maskedValue: yobMatch[1],
      isSensitive: false,
      confidence: 90,
      validationStatus: "VALID",
    });
  }

  // 3. Gender extraction
  const genderRegex = /\b(MALE|FEMALE|TRANSGENDER|पुरुष|महिला)\b/i;
  const genderMatch = text.match(genderRegex);
  if (genderMatch) {
    const g = genderMatch[1].toUpperCase();
    const normalizedGender = g.includes("FEMALE") || g.includes("महिला") ? "FEMALE" : g.includes("TRANS") ? "TRANSGENDER" : "MALE";
    fields.push({
      key: "gender",
      label: "Gender",
      rawValue: normalizedGender,
      maskedValue: normalizedGender,
      isSensitive: false,
      confidence: 95,
      validationStatus: "VALID",
    });
  }

  // 4. Name extraction
  // Usually line right above DOB or immediately following UIDAI header
  let name = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/(?:DOB|Date of Birth|Birth|Year of Birth)/i)) {
      if (i > 0) {
        const candidate = lines[i - 1];
        if (!candidate.match(/GOVERNMENT|UNIQUE|INDIA|AUTHORITY|ENROLMENT/i) && candidate.length > 2) {
          name = candidate;
          break;
        }
      }
    }
  }

  if (name) {
    fields.push({
      key: "holder_name",
      label: "Full Name",
      rawValue: name,
      maskedValue: name,
      isSensitive: false,
      confidence: 88,
      validationStatus: "VALID",
    });
  }

  // 5. Address (if present on back)
  const addressIdx = lines.findIndex((l) => /Address\s*:|पता\s*:/i.test(l));
  if (addressIdx !== -1) {
    const addressLines = lines.slice(addressIdx, addressIdx + 4).join(", ");
    const cleanAddress = addressLines.replace(/Address\s*:|पता\s*:/i, "").trim();
    if (cleanAddress.length > 10) {
      fields.push({
        key: "address",
        label: "Address",
        rawValue: cleanAddress,
        maskedValue: cleanAddress.slice(0, 25) + "... [Protected Address]",
        isSensitive: true,
        confidence: 85,
        validationStatus: "VALID",
      });
    }
  }

  return fields;
}
