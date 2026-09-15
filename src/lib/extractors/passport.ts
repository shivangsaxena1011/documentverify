import { ParsedField } from "./aadhaar";

// ICAO 9303 Checksum Calculation with 7-3-1 weights
const WEIGHTS = [7, 3, 1];

export function calculateMRZCheckDigit(str: string): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    let val = 0;
    if (char >= "0" && char <= "9") {
      val = parseInt(char, 10);
    } else if (char >= "A" && char <= "Z") {
      val = char.charCodeAt(0) - 55; // A=10, B=11...
    } else if (char === "<") {
      val = 0;
    }
    sum += val * WEIGHTS[i % 3];
  }
  return sum % 10;
}

export function maskPassport(passportNo: string): string {
  if (passportNo.length >= 8) {
    return `${passportNo.slice(0, 2)}****${passportNo.slice(-2)}`;
  }
  return "P****982";
}

export interface MRZParseResult {
  isValid: boolean;
  documentCode: string;
  issuingState: string;
  surname: string;
  givenNames: string;
  passportNumber: string;
  passportNumberValid: boolean;
  nationality: string;
  dateOfBirth: string; // YYYY-MM-DD
  dobValid: boolean;
  sex: string;
  expirationDate: string; // YYYY-MM-DD
  expirationValid: boolean;
  personalNumber: string;
  compositeValid: boolean;
}

export function parseMRZLines(line1: string, line2: string): MRZParseResult | null {
  // Clean filler characters and align length
  const l1 = line1.replace(/[^A-Z0-9<]/g, "").padEnd(44, "<").slice(0, 44);
  const l2 = line2.replace(/[^A-Z0-9<]/g, "").padEnd(44, "<").slice(0, 44);

  if (!l1.startsWith("P")) return null;

  try {
    const documentCode = l1.slice(0, 2).replace(/</g, "");
    const issuingState = l1.slice(2, 5).replace(/</g, "");
    const namePart = l1.slice(5);
    const nameTokens = namePart.split("<<");
    const surname = (nameTokens[0] || "").replace(/</g, " ").trim();
    const givenNames = (nameTokens[1] || "").replace(/</g, " ").trim();

    const passportNumberRaw = l2.slice(0, 9);
    const passportNumber = passportNumberRaw.replace(/</g, "");
    const passportCheckDigit = parseInt(l2.charAt(9), 10);
    const passportNumberValid = calculateMRZCheckDigit(passportNumberRaw) === passportCheckDigit;

    const nationality = l2.slice(10, 13).replace(/</g, "");

    const dobRaw = l2.slice(13, 19);
    const dobCheckDigit = parseInt(l2.charAt(19), 10);
    const dobValid = calculateMRZCheckDigit(dobRaw) === dobCheckDigit;

    const sex = l2.charAt(20) === "F" ? "FEMALE" : l2.charAt(20) === "M" ? "MALE" : "UNSPECIFIED";

    const expRaw = l2.slice(21, 27);
    const expCheckDigit = parseInt(l2.charAt(27), 10);
    const expirationValid = calculateMRZCheckDigit(expRaw) === expCheckDigit;

    const personalNumberRaw = l2.slice(28, 42);
    const personalNumber = personalNumberRaw.replace(/</g, "");

    // Format dates YYMMDD -> YYYY-MM-DD
    const parseYYMMDD = (s: string, isExpiry = false) => {
      if (s.length !== 6 || /\D/.test(s)) return s;
      const yy = parseInt(s.slice(0, 2), 10);
      const mm = s.slice(2, 4);
      const dd = s.slice(4, 6);
      const century = isExpiry ? (yy < 70 ? "20" : "19") : yy > 30 ? "19" : "20";
      return `${century}${s.slice(0, 2)}-${mm}-${dd}`;
    };

    return {
      isValid: passportNumberValid && dobValid && expirationValid,
      documentCode,
      issuingState,
      surname,
      givenNames,
      passportNumber,
      passportNumberValid,
      nationality,
      dateOfBirth: parseYYMMDD(dobRaw, false),
      dobValid,
      sex,
      expirationDate: parseYYMMDD(expRaw, true),
      expirationValid,
      personalNumber,
      compositeValid: passportNumberValid && expirationValid,
    };
  } catch {
    return null;
  }
}

export function extractPassportFields(text: string): { fields: ParsedField[]; mrzResult: MRZParseResult | null } {
  const fields: ParsedField[] = [];
  const lines = text.split("\n").map((l) => l.trim().toUpperCase()).filter(Boolean);

  // Search for MRZ lines
  let mrz1 = "";
  let mrz2 = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\s/g, "");
    if (line.startsWith("P<") && line.length >= 30) {
      mrz1 = line;
      if (lines[i + 1]) {
        mrz2 = lines[i + 1].replace(/\s/g, "");
      }
      break;
    }
  }

  let mrzParsed: MRZParseResult | null = null;
  if (mrz1 && mrz2) {
    mrzParsed = parseMRZLines(mrz1, mrz2);
  }

  if (mrzParsed && mrzParsed.passportNumber) {
    fields.push({
      key: "passport_number",
      label: "Passport Number",
      rawValue: mrzParsed.passportNumber,
      maskedValue: maskPassport(mrzParsed.passportNumber),
      isSensitive: true,
      confidence: mrzParsed.passportNumberValid ? 98 : 75,
      validationStatus: mrzParsed.passportNumberValid ? "VALID" : "WARNING",
    });

    const fullName = `${mrzParsed.givenNames} ${mrzParsed.surname}`.trim();
    if (fullName) {
      fields.push({
        key: "holder_name",
        label: "Passport Holder Name",
        rawValue: fullName,
        maskedValue: fullName,
        isSensitive: false,
        confidence: 95,
        validationStatus: "VALID",
      });
    }

    fields.push({
      key: "nationality",
      label: "Nationality",
      rawValue: mrzParsed.nationality === "IND" ? "INDIAN (IND)" : mrzParsed.nationality,
      maskedValue: mrzParsed.nationality === "IND" ? "INDIAN (IND)" : mrzParsed.nationality,
      isSensitive: false,
      confidence: 96,
      validationStatus: "VALID",
    });

    fields.push({
      key: "dob",
      label: "Date of Birth",
      rawValue: mrzParsed.dateOfBirth,
      maskedValue: mrzParsed.dateOfBirth,
      isSensitive: false,
      confidence: mrzParsed.dobValid ? 95 : 70,
      validationStatus: mrzParsed.dobValid ? "VALID" : "WARNING",
    });

    fields.push({
      key: "gender",
      label: "Sex",
      rawValue: mrzParsed.sex,
      maskedValue: mrzParsed.sex,
      isSensitive: false,
      confidence: 95,
      validationStatus: "VALID",
    });

    fields.push({
      key: "expiry_date",
      label: "Date of Expiry",
      rawValue: mrzParsed.expirationDate,
      maskedValue: mrzParsed.expirationDate,
      isSensitive: false,
      confidence: mrzParsed.expirationValid ? 95 : 70,
      validationStatus: mrzParsed.expirationValid ? "VALID" : "WARNING",
    });
  } else {
    // Fallback: visual zone parsing if MRZ is occluded or not detected
    const passportRegex = /\b([A-Z][0-9]{7})\b/;
    const passMatch = text.match(passportRegex);
    if (passMatch) {
      fields.push({
        key: "passport_number",
        label: "Passport Number (Visual Zone)",
        rawValue: passMatch[1],
        maskedValue: maskPassport(passMatch[1]),
        isSensitive: true,
        confidence: 84,
        validationStatus: "VALID",
      });
    }
  }

  return { fields, mrzResult: mrzParsed };
}
