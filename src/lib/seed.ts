import { prisma } from "./db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_trishul_salt_2026").digest("hex");
}

export async function ensureDatabaseSeeded() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true" && !process.env.VERCEL) {
    console.log("[SEED] Production environment detected. Skipping default demo credentials seeding for security.");
    return;
  }

  // Ensure organization exists
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Apex Verification & Identity Operations Hub",
        code: "APEX-VERIF-HQ-09",
        orgType: "ENTERPRISE_SECURITY",
      },
    });
  }

  const defaultPassword = hashPassword("Trishul@Enterprise2026");

  // Ensure users exist
  let admin = await prisma.user.findUnique({ where: { email: "admin@trishul-intel.org" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@trishul-intel.org",
        passwordHash: defaultPassword,
        name: "Vikramaditya Rao",
        role: "ADMINISTRATOR",
        organizationId: org.id,
      },
    });
  }

  let reviewer = await prisma.user.findUnique({ where: { email: "reviewer@trishul-intel.org" } });
  if (!reviewer) {
    reviewer = await prisma.user.create({
      data: {
        email: "reviewer@trishul-intel.org",
        passwordHash: defaultPassword,
        name: "Dr. Ananya Sen",
        role: "REVIEWER",
        organizationId: org.id,
      },
    });
  }

  let investigator = await prisma.user.findUnique({ where: { email: "investigator@trishul-intel.org" } });
  if (!investigator) {
    investigator = await prisma.user.create({
      data: {
        email: "investigator@trishul-intel.org",
        passwordHash: defaultPassword,
        name: "Rajeshwar Chauhan",
        role: "INVESTIGATOR",
        organizationId: org.id,
      },
    });
  }

  let operator = await prisma.user.findUnique({ where: { email: "operator@trishul-intel.org" } });
  if (!operator) {
    operator = await prisma.user.create({
      data: {
        email: "operator@trishul-intel.org",
        passwordHash: defaultPassword,
        name: "Shiva Verma",
        role: "OPERATOR",
        organizationId: org.id,
      },
    });
  }

  // Create initial realistic operational screenings for dashboard if empty
  const screeningCount = await prisma.screeningSession.count();
  if (screeningCount === 0) {
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
  }

  // Seed baseline demonstration institutional applications for AICTE PS 26261 scrutiny
  const existingApp = await prisma.institutionApplication.findFirst();
  if (!existingApp) {
    const app1 = await prisma.institutionApplication.create({
      data: {
        applicationNumber: "APP-2026-AICTE-001",
        institutionName: "K.J. Somaiya College of Engineering (Autonomous)",
        permanentId: "1-3327189110",
        applicationCategory: "EXTENSION_OF_APPROVAL",
        academicYear: "2026-2027",
        previousApprovalRef: "F.No. Western/1-3327189110/2025/EOA",
        previousApprovalStatus: "APPROVED",
        institutionRecordStatus: "ACTIVE",
        terFeeStatus: "PAID",
        terFeeReference: "UTR-SBIN20260491823",
        approvedIntake: 600,
        requestedIntake: 720,
        facultyCount: 30,
        requiredFacultyCount: 36,
        infrastructureSubmitted: true,
        validationStatus: "UNDER_REVIEW",
        complianceScore: 78,
        rulesetVersion: "APH-2024-27-V1",
        organizationId: org.id,
        creatorId: admin.id,
        reviewerNotes: "[2026-10-23 09:00:00] Dr. Ananya Sen (REVIEWER): Preliminary checklist evaluated. Faculty deficit flagged.",
      },
    });

    const app2 = await prisma.institutionApplication.create({
      data: {
        applicationNumber: "APP-2026-AICTE-002",
        institutionName: "Sardar Patel Institute of Technology",
        permanentId: "1-432901928",
        applicationCategory: "INTAKE_CHANGE",
        academicYear: "2026-2027",
        previousApprovalRef: "F.No. Western/1-432901928/2025/EOA",
        previousApprovalStatus: "APPROVED",
        institutionRecordStatus: "ACTIVE",
        terFeeStatus: "PAID",
        terFeeReference: "UTR-HDFC20260912401",
        approvedIntake: 240,
        requestedIntake: 300,
        facultyCount: 16,
        requiredFacultyCount: 15,
        infrastructureSubmitted: true,
        validationStatus: "READY_FOR_OFFICIAL_SCRUTINY",
        complianceScore: 92,
        rulesetVersion: "APH-2024-27-V1",
        organizationId: org.id,
        creatorId: admin.id,
        reviewerNotes: "[2026-10-23 09:15:00] Dr. Ananya Sen (REVIEWER): All mandatory statutory evidence uploaded and verified.",
      },
    });

    await prisma.applicationDocument.create({
      data: {
        applicationId: app1.id,
        category: "PREVIOUS_EOA",
        fileName: "EOA_Letter_2025_2026.pdf",
        mimeType: "application/pdf",
        fileSize: 1048576,
        sha256Hash: "c192268d99d6211f42018a4d701e741369528bcda78901234567890abcdef123",
        base64Data: "UEZGQ0RFRkFVTFQ=",
        storageKey: `org_${org.id}/app_${app1.id}/eoa_letter.pdf`,
        issueDate: new Date("2025-06-15"),
        expiryDate: new Date("2026-06-30"),
        issuer: "AICTE Western Regional Committee",
        referenceNumber: "F.No. Western/1-3327189110/2025/EOA",
        ocrStatus: "EXTRACTED",
        ocrText: "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION\nAPPROVAL LETTER 2025-2026\nK.J. Somaiya College of Engineering\nPermanent ID: 1-3327189110",
        ocrConfidence: 94.5,
      },
    });

    await prisma.validationFinding.createMany({
      data: [
        {
          applicationId: app1.id,
          ruleId: "RULE_MANDATORY_PREVIOUS_EOA",
          ruleSource: "AICTE Approval Process Handbook (APH) 2024-27, Ch 2",
          rulesetVersion: "APH-2024-27-V1",
          severity: "CRITICAL",
          status: "PASSED",
          title: "Mandatory Previous Year EoA Verification",
          reason: "Valid previous Extension of Approval letter identified.",
          recommendedNextStep: "Proceed to next verification checklist.",
        },
        {
          applicationId: app1.id,
          ruleId: "RULE_FACULTY_INTAKE_RATIO",
          ruleSource: "AICTE APH 2024-27, Appendix 7 (Faculty Norms)",
          rulesetVersion: "APH-2024-27-V1",
          severity: "HIGH",
          status: "WARNING",
          title: "Faculty Cadre to Student Intake Ratio",
          reason: "Cadre ratio deficit identified: 30 declared vs 36 required for requested 720 intake (1:20 norm). Deficit: 6 faculty members.",
          recommendedNextStep: "Submit recruitment affidavit and revised faculty cadre roster.",
        },
      ],
    });
  }

  console.log("[SEED] Enterprise seeding complete.");
}
