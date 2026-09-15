export type DocumentType =
  | "AADHAAR_CARD"
  | "PAN_CARD"
  | "PASSPORT"
  | "DRIVING_LICENCE"
  | "VOTER_ID"
  | "UNKNOWN";

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number; // 0 to 100
  secondaryType?: DocumentType;
  signals: string[];
}

export class DocumentClassifier {
  static classify(text: string, width?: number, height?: number): ClassificationResult {
    const normalized = text.toUpperCase();
    const scores: Record<DocumentType, { score: number; signals: string[] }> = {
      AADHAAR_CARD: { score: 0, signals: [] },
      PAN_CARD: { score: 0, signals: [] },
      PASSPORT: { score: 0, signals: [] },
      DRIVING_LICENCE: { score: 0, signals: [] },
      VOTER_ID: { score: 0, signals: [] },
      UNKNOWN: { score: 0, signals: [] },
    };

    // Aadhaar indicators
    if (normalized.includes("AADHAAR") || normalized.includes("AADHAR")) {
      scores.AADHAAR_CARD.score += 40;
      scores.AADHAAR_CARD.signals.push("Keyword 'AADHAAR' identified");
    }
    if (normalized.includes("UNIQUE IDENTIFICATION") || normalized.includes("UIDAI")) {
      scores.AADHAAR_CARD.score += 35;
      scores.AADHAAR_CARD.signals.push("UIDAI institutional header detected");
    }
    if (normalized.includes("GOVERNMENT OF INDIA") && (normalized.includes("MERA") || normalized.includes("PEHCHAN") || normalized.includes("MALE") || normalized.includes("FEMALE"))) {
      scores.AADHAAR_CARD.score += 20;
      scores.AADHAAR_CARD.signals.push("Standard Aadhaar bilingual/demographic markers detected");
    }
    // 12-digit format check
    if (/\b\d{4}\s\d{4}\s\d{4}\b/.test(text) || /\b\d{12}\b/.test(text)) {
      scores.AADHAAR_CARD.score += 35;
      scores.AADHAAR_CARD.signals.push("12-digit numeric sequence matching Aadhaar UID structure");
    }

    // PAN indicators
    if (normalized.includes("INCOME TAX DEPARTMENT") || normalized.includes("INCOMETAX")) {
      scores.PAN_CARD.score += 45;
      scores.PAN_CARD.signals.push("Income Tax Department header detected");
    }
    if (normalized.includes("PERMANENT ACCOUNT NUMBER") || normalized.includes("PAN CARD")) {
      scores.PAN_CARD.score += 40;
      scores.PAN_CARD.signals.push("Permanent Account Number title identified");
    }
    // PAN regex [A-Z]{5}[0-9]{4}[A-Z]
    if (/\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(text)) {
      scores.PAN_CARD.score += 45;
      scores.PAN_CARD.signals.push("10-character alphanumeric PAN format detected");
    }
    if (normalized.includes("FATHER'S NAME") || normalized.includes("FATHER NAME")) {
      scores.PAN_CARD.score += 15;
      scores.PAN_CARD.signals.push("Paternal lineage field marker detected");
    }

    // Passport indicators
    if (normalized.includes("PASSPORT") || normalized.includes("PASSEPORT")) {
      scores.PASSPORT.score += 35;
      scores.PASSPORT.signals.push("Passport document title identified");
    }
    if (normalized.includes("REPUBLIC OF INDIA") || normalized.includes("BHARAT SARKAR")) {
      scores.PASSPORT.score += 25;
      scores.PASSPORT.signals.push("Republic of India sovereign header");
    }
    // MRZ line indicator
    if (/P<IND[A-Z<]+/.test(text) || /P<[A-Z<]{2}/.test(text) || /<{5,}/.test(text)) {
      scores.PASSPORT.score += 50;
      scores.PASSPORT.signals.push("ICAO 9303 Machine Readable Zone (MRZ) detected");
    }
    if (normalized.includes("NATIONALITY") || normalized.includes("INDIAN")) {
      scores.PASSPORT.score += 15;
      scores.PASSPORT.signals.push("Nationality / Sovereign metadata detected");
    }

    // Driving Licence indicators
    if (normalized.includes("DRIVING LICENCE") || normalized.includes("DRIVING LICENSE") || normalized.includes("MOTOR VEHICLES")) {
      scores.DRIVING_LICENCE.score += 45;
      scores.DRIVING_LICENCE.signals.push("Driving Licence / Motor Vehicles title detected");
    }
    if (normalized.includes("TRANSPORT DEPARTMENT") || normalized.includes("RTO") || normalized.includes("SARATHI")) {
      scores.DRIVING_LICENCE.score += 35;
      scores.DRIVING_LICENCE.signals.push("Transport Department / Sarathi regulatory markers");
    }
    if (/\b[A-Z]{2}[0-9]{2}[-\s]?[0-9]{4,11}\b/.test(text) || normalized.includes("DL NO")) {
      scores.DRIVING_LICENCE.score += 40;
      scores.DRIVING_LICENCE.signals.push("State-specific Driving Licence number syntax detected");
    }
    if (normalized.includes("LMV") || normalized.includes("MCWG") || normalized.includes("COV")) {
      scores.DRIVING_LICENCE.score += 25;
      scores.DRIVING_LICENCE.signals.push("Vehicle classification classes (LMV/MCWG) identified");
    }

    // Voter ID indicators
    if (normalized.includes("ELECTION COMMISSION OF INDIA") || normalized.includes("ELECTION COMMISSION")) {
      scores.VOTER_ID.score += 45;
      scores.VOTER_ID.signals.push("Election Commission of India header detected");
    }
    if (normalized.includes("ELECTOR PHOTO IDENTITY CARD") || normalized.includes("VOTER") || normalized.includes("EPIC")) {
      scores.VOTER_ID.score += 40;
      scores.VOTER_ID.signals.push("Elector Photo Identity Card (EPIC) marker");
    }
    // EPIC format [A-Z]{3}[0-9]{7}
    if (/\b[A-Z]{3}[0-9]{7}\b/.test(text)) {
      scores.VOTER_ID.score += 45;
      scores.VOTER_ID.signals.push("Standard 10-character EPIC identifier detected");
    }
    if (normalized.includes("ASSEMBLY CONSTITUENCY") || normalized.includes("PARLIAMENTARY")) {
      scores.VOTER_ID.score += 25;
      scores.VOTER_ID.signals.push("Constituency territorial markers identified");
    }

    // Rank candidates
    const candidates = (
      Object.keys(scores) as DocumentType[]
    ).filter((t) => t !== "UNKNOWN");

    candidates.sort((a, b) => scores[b].score - scores[a].score);

    const topCandidate = candidates[0];
    const topScore = scores[topCandidate].score;

    if (topScore >= 30) {
      const confidence = Math.min(99, Math.max(50, Math.round((topScore / 110) * 100)));
      return {
        documentType: topCandidate,
        confidence,
        secondaryType: scores[candidates[1]].score >= 25 ? candidates[1] : undefined,
        signals: scores[topCandidate].signals,
      };
    }

    return {
      documentType: "UNKNOWN",
      confidence: 15,
      signals: ["No conclusive government identity pattern recognized in OCR output"],
    };
  }
}
