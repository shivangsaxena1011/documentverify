export type ApplicationCategory =
  | "EXTENSION_OF_APPROVAL"
  | "NEW_PROGRAMME"
  | "INTAKE_CHANGE"
  | "APPROVAL_CHANGE";

export type DocumentCategory =
  | "AFFIDAVIT"
  | "PREVIOUS_EOA"
  | "ACCREDITATION_CERTIFICATE"
  | "NOC_PERMISSION"
  | "FACULTY_DECLARATION"
  | "PROGRAMME_INTAKE_EVIDENCE"
  | "TER_FEE_RECEIPT"
  | "INFRASTRUCTURE_EVIDENCE"
  | "LEASE_PROPERTY_EVIDENCE"
  | "OTHER";

export type ValidationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "VALIDATION_PENDING"
  | "RECTIFICATION_REQUESTED"
  | "OFFICIAL_REVIEW_REQUIRED"
  | "READY_FOR_OFFICIAL_SCRUTINY"
  | "UNDER_REVIEW"
  | "CLOSED";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "ADVISORY";

export type FindingStatus = "PASSED" | "FAILED" | "WARNING" | "MANUAL_REVIEW_REQUIRED" | "PROVISIONAL";

export type SourceVerificationStatus =
  | "VERIFIED"
  | "MISMATCH_DETECTED"
  | "EXPIRED"
  | "PENDING"
  | "SOURCE_UNAVAILABLE"
  | "MANUAL_REVIEW_REQUIRED";

export type InfrastructureEvidenceType =
  | "CLASSROOM_LAB_PHOTO"
  | "FLOOR_PLAN_BLUEPRINT"
  | "BARRIER_FREE_ACCESS"
  | "SAFETY_CERTIFICATE";

export interface CategoryChecklistRule {
  ruleId: string;
  category: DocumentCategory;
  name: string;
  isMandatory: boolean;
  ruleSource: string;
  guidance: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleSource: string;
  rulesetVersion: string;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  reason: string;
  documentReference?: string;
  recommendedNextStep: string;
  isProvisional?: boolean;
}

export interface PreliminaryValidationSummary {
  rulesetVersion: string;
  complianceScore: number; // 0 - 100
  evaluatedAt: string;
  findings: RuleEvaluationResult[];
  category: ApplicationCategory;
  totalRules: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  manualReviewCount: number;
  disclaimer: string;
}
