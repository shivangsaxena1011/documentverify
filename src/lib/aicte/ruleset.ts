import {
  ApplicationCategory,
  DocumentCategory,
  RuleEvaluationResult,
  PreliminaryValidationSummary,
  CategoryChecklistRule,
} from "./types";

export const CURRENT_RULESET_VERSION = "APH-2024-27-V1";
export const RULESET_SOURCE_TITLE = "AICTE Approval Process Handbook (APH) 2024-2027";

export const PRELIMINARY_DECISION_DISCLAIMER =
  "PRELIMINARY DECISION SUPPORT ONLY: This automated regulatory compliance assessment is an advisory analytical tool designed to assist institutional verification. Findings and calculated completeness metrics do NOT constitute a statutory approval, sanction, rejection, or formal AICTE institutional decision. Final authority resides strictly with the competent AICTE Scrutiny Committee.";

// Mandatory document checklists per category based on APH 2024-27 Norms
export const CATEGORY_CHECKLISTS: Record<ApplicationCategory, CategoryChecklistRule[]> = {
  EXTENSION_OF_APPROVAL: [
    {
      ruleId: "RULE_MANDATORY_PREVIOUS_EOA",
      category: "PREVIOUS_EOA",
      name: "Previous Academic Year EoA Letter",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.1",
      guidance: "Copy of the most recent Extension of Approval (EoA) letter issued by AICTE.",
    },
    {
      ruleId: "RULE_MANDATORY_AFFIDAVIT",
      category: "AFFIDAVIT",
      name: "Statutory Undertaking & Affidavit",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.4 (Affidavit-1/2)",
      guidance: "Duly notarized affidavit on stamp paper confirming compliance with AICTE norms.",
    },
    {
      ruleId: "RULE_MANDATORY_FACULTY_DECLARATION",
      category: "FACULTY_DECLARATION",
      name: "Cadre-wise Faculty Roster Declaration",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Appendix 7 (Faculty Norms)",
      guidance: "Declared list of approved teaching faculty adhering to the prescribed Student-Teacher Ratio.",
    },
    {
      ruleId: "RULE_MANDATORY_TER_FEE",
      category: "TER_FEE_RECEIPT",
      name: "TER Processing Fee Payment Receipt",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.8",
      guidance: "Proof of successful payment of the Technical Education Regulatory (TER) fee.",
    },
    {
      ruleId: "RULE_MANDATORY_INFRA_EVIDENCE",
      category: "INFRASTRUCTURE_EVIDENCE",
      name: "Geo-tagged Infrastructure & Safety Evidence",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Appendix 4 (Land & Building Norms)",
      guidance: "Geo-tagged photographs of classrooms, laboratories, barrier-free access, and fire safety certificate.",
    },
  ],
  NEW_PROGRAMME: [
    {
      ruleId: "RULE_MANDATORY_NOC",
      category: "NOC_PERMISSION",
      name: "State Government NOC & University Affiliation",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter I, Clause 1.3",
      guidance: "No Objection Certificate from State Government and provisional affiliation letter from affiliating university.",
    },
    {
      ruleId: "RULE_MANDATORY_LEASE_PROPERTY",
      category: "LEASE_PROPERTY_EVIDENCE",
      name: "Registered Land & Property Deed",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Appendix 4 (Land Requirements)",
      guidance: "Registered ownership or non-revocable 30-year lease documents in the name of the Trust/Society/Institution.",
    },
    {
      ruleId: "RULE_MANDATORY_PROGRAMME_INTAKE",
      category: "PROGRAMME_INTAKE_EVIDENCE",
      name: "Curriculum & Programme Structure Dossier",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter I, Clause 1.5",
      guidance: "Detailed curriculum scheme, laboratory requirements, and proposed initial student intake.",
    },
    {
      ruleId: "RULE_MANDATORY_FACULTY_DECLARATION",
      category: "FACULTY_DECLARATION",
      name: "Faculty Recruitment & Cadre Plan",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Appendix 7",
      guidance: "List of appointed core faculty and recruitment schedule meeting AICTE qualifications.",
    },
    {
      ruleId: "RULE_MANDATORY_INFRA_EVIDENCE",
      category: "INFRASTRUCTURE_EVIDENCE",
      name: "Approved Building Plans & Physical Infrastructure",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Appendix 4",
      guidance: "Architect-certified floor plans, barrier-free accessibility ramps/lifts, and specialized lab photographs.",
    },
    {
      ruleId: "RULE_MANDATORY_TER_FEE",
      category: "TER_FEE_RECEIPT",
      name: "TER Application Fee Receipt",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter I, Clause 1.8",
      guidance: "TER fee receipt for introduction of new technical programmes.",
    },
    {
      ruleId: "RULE_MANDATORY_AFFIDAVIT",
      category: "AFFIDAVIT",
      name: "Trust/Society Affidavit",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter I, Clause 1.4",
      guidance: "Undertaking regarding non-commercial operation and endowment fund maintenance.",
    },
  ],
  INTAKE_CHANGE: [
    {
      ruleId: "RULE_MANDATORY_PREVIOUS_EOA",
      category: "PREVIOUS_EOA",
      name: "Existing Approval / EoA Reference",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.12",
      guidance: "Current approved intake baseline document from previous academic session.",
    },
    {
      ruleId: "RULE_MANDATORY_PROGRAMME_INTAKE",
      category: "PROGRAMME_INTAKE_EVIDENCE",
      name: "Intake Justification & Capacity Audit",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.14",
      guidance: "Justification dossier demonstrating built-up area and facility readiness for requested additional divisions.",
    },
    {
      ruleId: "RULE_MANDATORY_FACULTY_DECLARATION",
      category: "FACULTY_DECLARATION",
      name: "Cadre Faculty Declaration for Additional Intake",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Appendix 7",
      guidance: "Verification of faculty strength sufficient to sustain the requested incremental student enrollment.",
    },
    {
      ruleId: "RULE_MANDATORY_INFRA_EVIDENCE",
      category: "INFRASTRUCTURE_EVIDENCE",
      name: "Additional Classroom & Laboratory Evidence",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Appendix 4",
      guidance: "Photographic proof of dedicated instructional area matching the incremental division size.",
    },
    {
      ruleId: "RULE_MANDATORY_TER_FEE",
      category: "TER_FEE_RECEIPT",
      name: "TER Intake Variation Fee Payment",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.15",
      guidance: "Receipt of TER fee for increase in student intake capacity.",
    },
    {
      ruleId: "RULE_MANDATORY_AFFIDAVIT",
      category: "AFFIDAVIT",
      name: "Compliance Affidavit for Intake Expansion",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.4",
      guidance: "Affidavit confirming no pending deficiencies or court orders restricting enrollment expansion.",
    },
  ],
  APPROVAL_CHANGE: [
    {
      ruleId: "RULE_MANDATORY_AFFIDAVIT",
      category: "AFFIDAVIT",
      name: "Governing Board Resolution & Affidavit",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.18",
      guidance: "Signed resolution of the Trust/Society detailing the nature of the requested approval variation.",
    },
    {
      ruleId: "RULE_MANDATORY_NOC",
      category: "NOC_PERMISSION",
      name: "State Govt & Affiliating Body NoC",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.19",
      guidance: "Concurrence letter from the territorial administration and university body.",
    },
    {
      ruleId: "RULE_MANDATORY_TER_FEE",
      category: "TER_FEE_RECEIPT",
      name: "TER Administrative Fee Receipt",
      isMandatory: true,
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.20",
      guidance: "Proof of administrative fee remittance.",
    },
  ],
};

export interface AppEvaluationContext {
  applicationNumber: string;
  institutionName: string;
  permanentId: string;
  applicationCategory: ApplicationCategory;
  academicYear: string;
  previousApprovalRef?: string | null;
  previousApprovalStatus: string;
  institutionRecordStatus: string;
  terFeeStatus: string;
  terFeeReference?: string | null;
  approvedIntake: number;
  requestedIntake: number;
  facultyCount: number;
  requiredFacultyCount: number;
  infrastructureSubmitted: boolean;
  documents: Array<{
    id: string;
    category: DocumentCategory;
    fileName: string;
    sha256Hash: string;
    issueDate?: Date | null;
    expiryDate?: Date | null;
    issuer?: string | null;
    referenceNumber?: string | null;
    ocrStatus: string;
    ocrText?: string | null;
    duplicateOfId?: string | null;
  }>;
}

export function evaluateRegulatoryRules(context: AppEvaluationContext): PreliminaryValidationSummary {
  const findings: RuleEvaluationResult[] = [];
  const now = new Date();

  // -------------------------------------------------------------
  // Rule 1: Category Mandatory Document Completeness
  // -------------------------------------------------------------
  const checklist = CATEGORY_CHECKLISTS[context.applicationCategory] || [];
  const submittedCategories = new Set(context.documents.map((d) => d.category));

  for (const item of checklist) {
    if (item.isMandatory && !submittedCategories.has(item.category)) {
      findings.push({
        ruleId: item.ruleId,
        ruleSource: item.ruleSource,
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "CRITICAL",
        status: "FAILED",
        title: `Missing Required Document: ${item.name}`,
        reason: `Mandatory document of category [${item.category}] has not been submitted. Under ${item.ruleSource}, this document is required for ${context.applicationCategory.replace(/_/g, " ")}.`,
        recommendedNextStep: `Upload a valid, authenticated copy of ${item.name} (${item.guidance}).`,
      });
    } else if (submittedCategories.has(item.category)) {
      const doc = context.documents.find((d) => d.category === item.category);
      findings.push({
        ruleId: item.ruleId,
        ruleSource: item.ruleSource,
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "LOW",
        status: "PASSED",
        title: `Document Submitted: ${item.name}`,
        reason: `Required evidence for ${item.name} is attached (File: ${doc?.fileName}).`,
        documentReference: doc?.id,
        recommendedNextStep: "Proceed with content and issuing authority verification.",
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 2: Document Validity and Expiration Dates
  // -------------------------------------------------------------
  for (const doc of context.documents) {
    if (doc.expiryDate) {
      const exp = new Date(doc.expiryDate);
      if (exp.getTime() < now.getTime()) {
        findings.push({
          ruleId: "RULE_DOC_EXPIRY",
          ruleSource: "AICTE APH 2024-27, General Conditions, Clause 1.8(c)",
          rulesetVersion: CURRENT_RULESET_VERSION,
          severity: "HIGH",
          status: "FAILED",
          title: `Expired Supporting Evidence: ${doc.fileName}`,
          reason: `Document [${doc.fileName}] indicates an expiration date of ${exp.toISOString().split("T")[0]}, which has elapsed. Expired documents cannot satisfy regulatory compliance criteria.`,
          documentReference: doc.id,
          recommendedNextStep: "Obtain and submit a renewed certificate or extension letter from the issuing authority.",
        });
      }
    }
  }

  // -------------------------------------------------------------
  // Rule 3: Previous EoA / Approval Reference Check
  // -------------------------------------------------------------
  if (context.applicationCategory === "EXTENSION_OF_APPROVAL" || context.applicationCategory === "INTAKE_CHANGE") {
    if (!context.previousApprovalRef || context.previousApprovalRef.trim().length < 5) {
      findings.push({
        ruleId: "RULE_PREVIOUS_EOA_REF",
        ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.2",
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "HIGH",
        status: "FAILED",
        title: "Missing Previous Approval / EoA Reference",
        reason: "Extension of Approval and Intake Variation applications require a recorded reference to the preceding academic session's approval letter.",
        recommendedNextStep: "Provide the official AICTE Order / EoA dispatch reference number in the application workspace.",
      });
    } else {
      findings.push({
        ruleId: "RULE_PREVIOUS_EOA_REF",
        ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.2",
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "LOW",
        status: "PASSED",
        title: "Previous Approval Reference Provided",
        reason: `Previous approval reference recorded: ${context.previousApprovalRef}`,
        recommendedNextStep: "Cross-verify with the AICTE central institutional portal repository.",
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 4: TER Fee Payment Verification
  // -------------------------------------------------------------
  if (context.terFeeStatus === "PAID") {
    findings.push({
      ruleId: "RULE_TER_FEE_VERIFICATION",
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.8",
      rulesetVersion: CURRENT_RULESET_VERSION,
      severity: "LOW",
      status: "PASSED",
      title: "Technical Education Regulatory (TER) Fee Remitted",
      reason: `TER fee status is marked PAID. Transaction Reference: ${context.terFeeReference || "Provided on record"}`,
      recommendedNextStep: "Maintain bank payment reconciliation in the case audit file.",
    });
  } else if (context.terFeeStatus === "EXEMPTED") {
    findings.push({
      ruleId: "RULE_TER_FEE_VERIFICATION",
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.8(b)",
      rulesetVersion: CURRENT_RULESET_VERSION,
      severity: "LOW",
      status: "PASSED",
      title: "TER Fee Exemption Claimed",
      reason: "Institutional category claims statutory fee exemption under applicable AICTE provisions.",
      recommendedNextStep: "Review supporting government gazette or exemption order.",
    });
  } else {
    findings.push({
      ruleId: "RULE_TER_FEE_VERIFICATION",
      ruleSource: "AICTE APH 2024-27, Chapter II, Clause 2.8",
      rulesetVersion: CURRENT_RULESET_VERSION,
      severity: "CRITICAL",
      status: "FAILED",
      title: "Unresolved TER Processing Fee",
      reason: `Current TER fee status is [${context.terFeeStatus}]. Applications cannot proceed to scrutiny without settled processing fees.`,
      recommendedNextStep: "Complete fee remittance via authorized payment gateway and upload the payment receipt.",
    });
  }

  // -------------------------------------------------------------
  // Rule 5: Intake Variation vs Cadre-wise Faculty Ratio Norm
  // -------------------------------------------------------------
  if (context.applicationCategory === "INTAKE_CHANGE" || context.applicationCategory === "EXTENSION_OF_APPROVAL") {
    const targetIntake = context.requestedIntake > 0 ? context.requestedIntake : context.approvedIntake;
    const requiredFaculty = context.requiredFacultyCount > 0
      ? context.requiredFacultyCount
      : Math.ceil(targetIntake / 20); // Statutory baseline ratio 1:20

    if (context.facultyCount < requiredFaculty) {
      const deficit = requiredFaculty - context.facultyCount;
      findings.push({
        ruleId: "RULE_FACULTY_INTAKE_RATIO",
        ruleSource: "AICTE APH 2024-27, Appendix 7, Table 7.1",
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "HIGH",
        status: "WARNING",
        title: "Potential Faculty Cadre Deficit for Target Intake",
        reason: `Target student intake (${targetIntake}) requires a minimum of ${requiredFaculty} faculty members under the 1:20 statutory ratio norm. Current declared faculty is ${context.facultyCount} (Deficit: ${deficit}).`,
        recommendedNextStep: "Review faculty roster declaration or submit justification/recruitment notices for scrutiny.",
      });
    } else {
      findings.push({
        ruleId: "RULE_FACULTY_INTAKE_RATIO",
        ruleSource: "AICTE APH 2024-27, Appendix 7, Table 7.1",
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "LOW",
        status: "PASSED",
        title: "Faculty Cadre Count Meets Statutory Ratio Norm",
        reason: `Declared faculty count of ${context.facultyCount} satisfies the statutory 1:20 requirement (${requiredFaculty} required for ${targetIntake} student capacity).`,
        recommendedNextStep: "Verify individual faculty credential declarations during official review.",
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 6: Institution Record Status
  // -------------------------------------------------------------
  if (context.institutionRecordStatus === "ACTIVE") {
    findings.push({
      ruleId: "RULE_INSTITUTION_STATUS",
      ruleSource: "AICTE Institutional Registry Master Data",
      rulesetVersion: CURRENT_RULESET_VERSION,
      severity: "LOW",
      status: "PASSED",
      title: "Institution Record Status Active",
      reason: `Permanent ID [${context.permanentId}] is mapped to an active institution entity.`,
      recommendedNextStep: "Proceed with standard review cycle.",
    });
  } else {
    findings.push({
      ruleId: "RULE_INSTITUTION_STATUS",
      ruleSource: "AICTE Institutional Registry Master Data",
      rulesetVersion: CURRENT_RULESET_VERSION,
      severity: "CRITICAL",
      status: "FAILED",
      title: `Non-Active Institution Record Status: [${context.institutionRecordStatus}]`,
      reason: `Institutional entity is recorded as ${context.institutionRecordStatus}. Applications cannot be processed under defunct, unverified, or debarred statuses.`,
      recommendedNextStep: "Contact AICTE Regional Office to resolve institutional master record standing.",
    });
  }

  // -------------------------------------------------------------
  // Rule 7: Infrastructure Evidence Completeness
  // -------------------------------------------------------------
  const infraDocs = context.documents.filter((d) => d.category === "INFRASTRUCTURE_EVIDENCE");
  if (!context.infrastructureSubmitted && infraDocs.length === 0) {
    findings.push({
      ruleId: "RULE_INFRASTRUCTURE_GAPS",
      ruleSource: "AICTE APH 2024-27, Appendix 4, Clause 4.1",
      rulesetVersion: CURRENT_RULESET_VERSION,
      severity: "HIGH",
      status: "FAILED",
      title: "Missing Physical Infrastructure Evidence",
      reason: "No physical infrastructure documentation (geo-tagged photos, floor plans, fire safety certificates) has been submitted.",
      recommendedNextStep: "Upload geo-tagged photographs of classrooms, computer centres, and laboratories.",
    });
  } else {
    findings.push({
      ruleId: "RULE_INFRASTRUCTURE_GAPS",
      ruleSource: "AICTE APH 2024-27, Appendix 4, Clause 4.1",
      rulesetVersion: CURRENT_RULESET_VERSION,
      severity: "LOW",
      status: "PASSED",
      title: "Infrastructure Evidence Attached",
      reason: `${infraDocs.length} infrastructure document(s) uploaded for instructional facility verification.`,
      recommendedNextStep: "Examine infrastructure photographic quality in the Infrastructure Review panel.",
    });
  }

  // -------------------------------------------------------------
  // Rule 8: Duplicate Document Detection via Cryptographic Hashes
  // -------------------------------------------------------------
  for (const doc of context.documents) {
    if (doc.duplicateOfId) {
      findings.push({
        ruleId: "RULE_DUPLICATE_EVIDENCE",
        ruleSource: "TRISHUL Document Integrity & Anti-Collision Check",
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "MEDIUM",
        status: "WARNING",
        title: `Duplicate Document Content Detected: ${doc.fileName}`,
        reason: `SHA-256 hash collision with previously submitted document (Reference: ${doc.duplicateOfId}). The identical binary file has been uploaded under multiple instances.`,
        documentReference: doc.id,
        recommendedNextStep: "Review uploaded files to ensure distinct evidence is provided for each required category.",
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 9: Document Cross-Check OCR Validation (Provisional)
  // -------------------------------------------------------------
  let ocrMatches = 0;
  let ocrChecked = 0;
  for (const doc of context.documents) {
    if (doc.ocrText && doc.ocrText.trim().length > 20) {
      ocrChecked++;
      const textLower = doc.ocrText.toLowerCase();
      const codeClean = context.permanentId.toLowerCase().replace(/[^a-z0-9]/g, "");
      const nameParts = context.institutionName.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      
      const containsId = textLower.includes(codeClean) || textLower.includes(context.permanentId.toLowerCase());
      const matchingWords = nameParts.filter((part) => textLower.includes(part));
      const matchRatio = nameParts.length > 0 ? matchingWords.length / nameParts.length : 0;

      if (containsId || matchRatio >= 0.5) {
        ocrMatches++;
      }
    }
  }

  if (ocrChecked > 0) {
    if (ocrMatches === 0) {
      findings.push({
        ruleId: "RULE_OCR_CROSS_CHECK",
        ruleSource: "AICTE Automated Document Verification & Forensic OCR",
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "MEDIUM",
        status: "MANUAL_REVIEW_REQUIRED",
        title: "Potential Discrepancy in OCR Extracted Identifiers",
        reason: "Extracted optical character recognition text did not yield strong matches with the institution name or Permanent ID. This is an advisory discrepancy requiring reviewer inspection, not a definitive accusation.",
        recommendedNextStep: "Manually review the document header and seal to confirm institutional association.",
        isProvisional: true,
      });
    } else {
      findings.push({
        ruleId: "RULE_OCR_CROSS_CHECK",
        ruleSource: "AICTE Automated Document Verification & Forensic OCR",
        rulesetVersion: CURRENT_RULESET_VERSION,
        severity: "LOW",
        status: "PASSED",
        title: "OCR Identifier Cross-Check Corroborated",
        reason: `Extracted text across ${ocrMatches} document(s) correlates with the declared institution profile.`,
        recommendedNextStep: "Proceed with institutional record verification.",
        isProvisional: true,
      });
    }
  }

  // -------------------------------------------------------------
  // Score Calculation (0-100 Preliminary Checklist Metric)
  // -------------------------------------------------------------
  let score = 100;
  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;
  let manualReviewCount = 0;

  for (const f of findings) {
    if (f.status === "PASSED") {
      passedCount++;
    } else if (f.status === "FAILED") {
      failedCount++;
      if (f.severity === "CRITICAL") score -= 25;
      else if (f.severity === "HIGH") score -= 15;
      else score -= 8;
    } else if (f.status === "WARNING") {
      warningCount++;
      score -= 8;
    } else if (f.status === "MANUAL_REVIEW_REQUIRED") {
      manualReviewCount++;
      score -= 5;
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    rulesetVersion: CURRENT_RULESET_VERSION,
    complianceScore: finalScore,
    evaluatedAt: now.toISOString(),
    findings,
    category: context.applicationCategory,
    totalRules: findings.length,
    passedCount,
    failedCount,
    warningCount,
    manualReviewCount,
    disclaimer: PRELIMINARY_DECISION_DISCLAIMER,
  };
}
