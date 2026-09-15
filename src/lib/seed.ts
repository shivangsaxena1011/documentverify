import { prisma } from "./db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_trishul_salt_2026").digest("hex");
}

export async function ensureDatabaseSeeded() {
  const existingOrg = await prisma.organization.findFirst();
  if (existingOrg) return; // Already initialized

  console.log("[SEED] Initializing enterprise verification organization and security principals...");

  const org = await prisma.organization.create({
    data: {
      name: "Apex Verification & Identity Operations Hub",
      code: "APEX-VERIF-HQ-09",
      orgType: "ENTERPRISE_SECURITY",
    },
  });

  const defaultPassword = hashPassword("Trishul@Enterprise2026");

  const admin = await prisma.user.create({
    data: {
      email: "admin@trishul-intel.org",
      passwordHash: defaultPassword,
      name: "Vikramaditya Rao",
      role: "ADMINISTRATOR",
      organizationId: org.id,
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: "reviewer@trishul-intel.org",
      passwordHash: defaultPassword,
      name: "Dr. Ananya Sen",
      role: "REVIEWER",
      organizationId: org.id,
    },
  });

  const investigator = await prisma.user.create({
    data: {
      email: "investigator@trishul-intel.org",
      passwordHash: defaultPassword,
      name: "Rajeshwar Chauhan",
      role: "INVESTIGATOR",
      organizationId: org.id,
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: "operator@trishul-intel.org",
      passwordHash: defaultPassword,
      name: "Shiva Verma",
      role: "OPERATOR",
      organizationId: org.id,
    },
  });

  // Create initial realistic operational screenings for dashboard
  const records = [
    {
      screeningId: "TR-2026-89012",
      docType: "AADHAAR_CARD",
      status: "COMPLETED",
      riskScore: 12,
      riskTier: "LOW_RISK",
      procTime: 2340,
      user: operator,
      fields: [
        { key: "aadhaar_number", label: "Aadhaar Number", raw: "5482 9102 3841", masked: "XXXX XXXX 3841", sens: true, conf: 98, status: "VALID" },
        { key: "holder_name", label: "Full Name", raw: "SURESH KUMAR SHARMA", masked: "SURESH KUMAR SHARMA", sens: false, conf: 96, status: "VALID" },
        { key: "dob", label: "Date of Birth", raw: "14/08/1986", masked: "14/08/1986", sens: false, conf: 94, status: "VALID" },
        { key: "gender", label: "Gender", raw: "MALE", masked: "MALE", sens: false, conf: 99, status: "VALID" },
      ],
      positiveSignals: [
        "Aadhaar Verhoeff mathematical checksum validated successfully",
        "Demographic text alignment and UIDAI typography match issuance standard",
        "High-definition image resolution (1920x1080) with minimal optical blur",
      ],
      reviewIndicators: [],
    },
    {
      screeningId: "TR-2026-89025",
      docType: "PAN_CARD",
      status: "COMPLETED",
      riskScore: 18,
      riskTier: "LOW_RISK",
      procTime: 1890,
      user: operator,
      fields: [
        { key: "pan_number", label: "Permanent Account Number", raw: "ABCPR8291K", masked: "ABCPR****K", sens: true, conf: 99, status: "VALID" },
        { key: "pan_entity_type", label: "PAN Entity Classification", raw: "Individual", masked: "Individual", sens: false, conf: 99, status: "VALID" },
        { key: "holder_name", label: "Cardholder Name", raw: "PRIYA NAIR", masked: "PRIYA NAIR", sens: false, conf: 93, status: "VALID" },
        { key: "father_name", label: "Father's Name", raw: "RAMAN NAIR", masked: "RAMAN NAIR", sens: false, conf: 91, status: "VALID" },
        { key: "dob", label: "Date of Birth", raw: "22/11/1992", masked: "22/11/1992", sens: false, conf: 96, status: "VALID" },
      ],
      positiveSignals: [
        "Income Tax Department statutory PAN format verified",
        "Entity classification character 'P' correctly corresponds to individual title",
        "No visual tampering artifacts or font micro-variations detected",
      ],
      reviewIndicators: [],
    },
    {
      screeningId: "TR-2026-89041",
      docType: "PASSPORT",
      status: "REQUIRES_REVIEW",
      riskScore: 58,
      riskTier: "REVIEW_REQUIRED",
      procTime: 3120,
      user: operator,
      fields: [
        { key: "passport_number", label: "Passport Number", raw: "Z8192039", masked: "Z8****39", sens: true, conf: 82, status: "WARNING" },
        { key: "holder_name", label: "Passport Holder Name", raw: "AMITABH DASGUPTA", masked: "AMITABH DASGUPTA", sens: false, conf: 89, status: "VALID" },
        { key: "nationality", label: "Nationality", raw: "INDIAN (IND)", masked: "INDIAN (IND)", sens: false, conf: 95, status: "VALID" },
        { key: "dob", label: "Date of Birth", raw: "1978-04-12", masked: "1978-04-12", sens: false, conf: 85, status: "VALID" },
      ],
      positiveSignals: [
        "ICAO Doc 9303 MRZ zone recognized across bottom scanning line",
        "National territorial mark 'IND' verified",
      ],
      reviewIndicators: [
        "MRZ check digit single character checksum discrepancy on passport number",
        "Visual glare detected across upper laminate surface requiring manual inspector verification",
      ],
    },
    {
      screeningId: "TR-2026-89058",
      docType: "DRIVING_LICENCE",
      status: "COMPLETED",
      riskScore: 22,
      riskTier: "LOW_RISK",
      procTime: 2150,
      user: operator,
      fields: [
        { key: "dl_number", label: "Driving Licence Number", raw: "DL-0420180029183", masked: "DL-04****9183", sens: true, conf: 95, status: "VALID" },
        { key: "holder_name", label: "Licence Holder Name", raw: "MANPREET SINGH", masked: "MANPREET SINGH", sens: false, conf: 92, status: "VALID" },
        { key: "valid_till", label: "Validity (Non-Transport)", raw: "15/06/2038", masked: "15/06/2038", sens: false, conf: 90, status: "VALID" },
        { key: "vehicle_classes", label: "Authorized Vehicle Classes", raw: "LMV, MCWG", masked: "LMV, MCWG", sens: false, conf: 94, status: "VALID" },
      ],
      positiveSignals: [
        "State Transport Department DL numbering schema adheres to Sarathi specification",
        "Expiry date falls within legal 20-year licensing window",
      ],
      reviewIndicators: [],
    },
    {
      screeningId: "TR-2026-89072",
      docType: "VOTER_ID",
      status: "COMPLETED",
      riskScore: 16,
      riskTier: "LOW_RISK",
      procTime: 2040,
      user: operator,
      fields: [
        { key: "epic_number", label: "EPIC Number", raw: "WBF2910482", masked: "WBF****482", sens: true, conf: 96, status: "VALID" },
        { key: "holder_name", label: "Elector Name", raw: "KAVITA MEHTA", masked: "KAVITA MEHTA", sens: false, conf: 93, status: "VALID" },
        { key: "gender", label: "Sex", raw: "FEMALE", masked: "FEMALE", sens: false, conf: 98, status: "VALID" },
        { key: "age", label: "Age", raw: "34", masked: "34", sens: false, conf: 92, status: "VALID" },
      ],
      positiveSignals: [
        "Election Commission of India EPIC 10-character code confirmed",
        "Typography and security rosette patterns align with standard electoral card",
      ],
      reviewIndicators: [],
    },
  ];

  for (const r of records) {
    const session = await prisma.screeningSession.create({
      data: {
        screeningId: r.screeningId,
        documentType: r.docType,
        detectedType: r.docType,
        classificationConfidence: 94.5,
        status: r.status,
        riskScore: r.riskScore,
        riskTier: r.riskTier,
        processingTimeMs: r.procTime,
        operatorId: r.user.id,
        organizationId: org.id,
        ocrResult: {
          create: {
            provider: "TESSERACT_LOCAL",
            fullText: `[OFFICIAL GOVERNMENT RECORD]\n${r.fields.map((f) => `${f.label}: ${f.raw}`).join("\n")}`,
            averageConfidence: 93.4,
            wordsCount: 42,
            linesCount: 8,
            executionTimeMs: 650,
          },
        },
        documentAnalysis: {
          create: {
            qualityScore: 88,
            blurIndex: 91,
            glareIndex: 12,
            brightnessScore: 56,
            contrastScore: 84,
            resolutionStatus: "HIGH_RESOLUTION",
            structuralIntegrity: "CONFIRMED",
            fontConsistencyScore: 96,
            layoutAlignmentScore: 94,
          },
        },
        riskAssessment: {
          create: {
            compositeScore: r.riskScore,
            riskTier: r.riskTier,
            positiveSignalsJson: JSON.stringify(r.positiveSignals),
            reviewIndicatorsJson: JSON.stringify(r.reviewIndicators),
          },
        },
        extractedFields: {
          create: r.fields.map((f) => ({
            fieldKey: f.key,
            fieldLabel: f.label,
            rawValue: f.raw,
            maskedValue: f.masked,
            isSensitive: f.sens,
            confidence: f.conf,
            validationStatus: f.status,
          })),
        },
      },
    });

    if (r.docType === "PASSPORT") {
      await prisma.forensicAnomaly.create({
        data: {
          screeningSessionId: session.id,
          anomalyType: "LAYOUT_DISCREPANCY",
          severity: "HIGH",
          title: "MRZ Checksum Variance",
          explanation: "Optical character read at position 10 of line 2 failed modulo 10 verification.",
          confidence: 88,
          boundingBox: JSON.stringify({ x: 10, y: 84, width: 80, height: 12 }),
        },
      });
    }
  }

  // Create initial audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org.id,
        userId: admin.id,
        userEmail: admin.email,
        action: "ORGANIZATION_INITIALIZED",
        resourceType: "ORGANIZATION",
        resourceId: org.id,
        details: "Institutional security tenant activated with default compliance profiles.",
      },
      {
        organizationId: org.id,
        userId: operator.id,
        userEmail: operator.email,
        action: "SCREENING_COMPLETED",
        resourceType: "SCREENING_SESSION",
        resourceId: "TR-2026-89012",
        details: "Aadhaar Card screening successfully completed with Low Risk (Score: 12).",
      },
    ],
  });

  console.log("[SEED] Enterprise seeding complete.");
}
