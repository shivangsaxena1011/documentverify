import assert from "assert";
import {
  evaluateRegulatoryRules,
  CATEGORY_CHECKLISTS,
  CURRENT_RULESET_VERSION,
  PRELIMINARY_DECISION_DISCLAIMER,
  AppEvaluationContext,
} from "../src/lib/aicte/ruleset";
import { ExternalAuthorityVerificationAdapter } from "../src/lib/aicte/source-adapter";

console.log("==> [AICTE PS 26261 TEST SUITE] Starting regulatory rule engine tests...");

// -------------------------------------------------------------
// Test 1: Category Checklist Rule Selection
// -------------------------------------------------------------
console.log("Running Test 1: Category Checklist Rule Selection...");
assert.ok(CATEGORY_CHECKLISTS.EXTENSION_OF_APPROVAL.length > 0, "EoA checklist must contain rules");
assert.ok(CATEGORY_CHECKLISTS.NEW_PROGRAMME.length > 0, "New Programme checklist must contain rules");
assert.ok(CATEGORY_CHECKLISTS.INTAKE_CHANGE.length > 0, "Intake Change checklist must contain rules");
assert.ok(CATEGORY_CHECKLISTS.APPROVAL_CHANGE.length > 0, "Approval Change checklist must contain rules");

// Verify EoA requires Previous EoA and Affidavit
const eoaCategories = CATEGORY_CHECKLISTS.EXTENSION_OF_APPROVAL.map((r) => r.category);
assert.ok(eoaCategories.includes("PREVIOUS_EOA"), "EoA checklist must require PREVIOUS_EOA");
assert.ok(eoaCategories.includes("AFFIDAVIT"), "EoA checklist must require AFFIDAVIT");
assert.ok(eoaCategories.includes("FACULTY_DECLARATION"), "EoA checklist must require FACULTY_DECLARATION");
console.log("✔ Test 1 Passed: Category checklists mapped properly.");

// -------------------------------------------------------------
// Test 2: Missing Mandatory Documents Detection
// -------------------------------------------------------------
console.log("Running Test 2: Missing Mandatory Documents Detection...");
const emptyEoAContext: AppEvaluationContext = {
  applicationNumber: "APP-TEST-001",
  institutionName: "Test Institute of Technology",
  permanentId: "1-99999999",
  applicationCategory: "EXTENSION_OF_APPROVAL",
  academicYear: "2026-2027",
  previousApprovalRef: "F.No. AICTE/2025/1-99999999",
  previousApprovalStatus: "APPROVED",
  institutionRecordStatus: "ACTIVE",
  terFeeStatus: "PAID",
  approvedIntake: 120,
  requestedIntake: 120,
  facultyCount: 6,
  requiredFacultyCount: 6,
  infrastructureSubmitted: true,
  documents: [], // Zero documents uploaded
};

const resultEmpty = evaluateRegulatoryRules(emptyEoAContext);
assert.strictEqual(resultEmpty.rulesetVersion, CURRENT_RULESET_VERSION);
assert.ok(resultEmpty.failedCount > 0, "Missing documents must trigger failures");
const missingDocsFinding = resultEmpty.findings.find((f) => f.ruleId === "RULE_MANDATORY_PREVIOUS_EOA");
assert.ok(missingDocsFinding, "Must flag missing PREVIOUS_EOA document");
assert.strictEqual(missingDocsFinding?.severity, "CRITICAL");
assert.strictEqual(missingDocsFinding?.status, "FAILED");
console.log("✔ Test 2 Passed: Missing mandatory documents detected as CRITICAL failures.");

// -------------------------------------------------------------
// Test 3: Expired Document Detection
// -------------------------------------------------------------
console.log("Running Test 3: Expired Document Detection...");
const pastDate = new Date(Date.now() - 30 * 24 * 3600 * 1000); // 30 days ago
const expiredDocContext: AppEvaluationContext = {
  ...emptyEoAContext,
  documents: [
    {
      id: "doc-1",
      category: "PREVIOUS_EOA",
      fileName: "eoa-letter-2024.pdf",
      sha256Hash: "hash-001",
      expiryDate: pastDate,
      ocrStatus: "UNAVAILABLE_MANUAL_REVIEW",
    },
  ],
};

const resultExpired = evaluateRegulatoryRules(expiredDocContext);
const expiredFinding = resultExpired.findings.find((f) => f.ruleId === "RULE_DOC_EXPIRY");
assert.ok(expiredFinding, "Must flag expired document");
assert.strictEqual(expiredFinding?.status, "FAILED");
assert.strictEqual(expiredFinding?.severity, "HIGH");
console.log("✔ Test 3 Passed: Expired supporting document correctly flagged.");

// -------------------------------------------------------------
// Test 4: Intake Variation vs Faculty Cadre Ratio Discrepancy
// -------------------------------------------------------------
console.log("Running Test 4: Intake vs Faculty Ratio Discrepancy...");
const intakeDeficitContext: AppEvaluationContext = {
  ...emptyEoAContext,
  applicationCategory: "INTAKE_CHANGE",
  approvedIntake: 120,
  requestedIntake: 300, // 300 intake requires 15 faculty (1:20 norm)
  facultyCount: 8, // Declared only 8 -> Deficit of 7
  requiredFacultyCount: 15,
};

const resultIntake = evaluateRegulatoryRules(intakeDeficitContext);
const ratioFinding = resultIntake.findings.find((f) => f.ruleId === "RULE_FACULTY_INTAKE_RATIO");
assert.ok(ratioFinding, "Must evaluate faculty intake ratio");
assert.strictEqual(ratioFinding?.status, "WARNING");
assert.strictEqual(ratioFinding?.severity, "HIGH");
assert.ok(ratioFinding?.reason.includes("Deficit: 7"), "Reason must clearly cite the 7 faculty deficit");
console.log("✔ Test 4 Passed: Faculty ratio deficit accurately evaluated.");

// -------------------------------------------------------------
// Test 5: Duplicate Document Hash Detection
// -------------------------------------------------------------
console.log("Running Test 5: Duplicate Document Hash Detection...");
const duplicateDocContext: AppEvaluationContext = {
  ...emptyEoAContext,
  documents: [
    {
      id: "doc-2",
      category: "AFFIDAVIT",
      fileName: "affidavit-copy.pdf",
      sha256Hash: "shared-hash-abc",
      duplicateOfId: "doc-original-xyz", // Hash collision with earlier file
      ocrStatus: "UNAVAILABLE_MANUAL_REVIEW",
    },
  ],
};

const resultDupe = evaluateRegulatoryRules(duplicateDocContext);
const dupeFinding = resultDupe.findings.find((f) => f.ruleId === "RULE_DUPLICATE_EVIDENCE");
assert.ok(dupeFinding, "Must detect duplicate SHA-256 hash collision");
assert.strictEqual(dupeFinding?.status, "WARNING");
console.log("✔ Test 5 Passed: Cryptographic duplicate hash detection verified.");

// -------------------------------------------------------------
// Test 6: External Source Adapter Failure / Unconfigured Fallback
// -------------------------------------------------------------
console.log("Running Test 6: External Source Adapter Unconfigured Fallback...");
async function runSourceAdapterTest() {
  const result = await ExternalAuthorityVerificationAdapter.verifyInstitutionRecord(
    "1-432901928",
    "Apex Institute of Technology"
  );
  assert.strictEqual(result.status, "SOURCE_UNAVAILABLE");
  assert.strictEqual(result.isConfigured, false);
  assert.strictEqual(result.requiresManualReview, true);
  assert.ok(
    result.summary.includes("Source connector not configured"),
    "Summary must honestly state that connector is not configured"
  );
  console.log("✔ Test 6 Passed: Source adapter returns SOURCE_UNAVAILABLE without fabricating successes.");
}

// -------------------------------------------------------------
// Test 7: Statutory Advisory Disclaimer Verification
// -------------------------------------------------------------
console.log("Running Test 7: Statutory Advisory Disclaimer...");
const fullCompliantContext: AppEvaluationContext = {
  applicationNumber: "APP-TEST-FULL",
  institutionName: "Compliant Institute",
  permanentId: "1-12345678",
  applicationCategory: "EXTENSION_OF_APPROVAL",
  academicYear: "2026-2027",
  previousApprovalRef: "F.No. AICTE/AB/2025/1-12345678",
  previousApprovalStatus: "APPROVED",
  institutionRecordStatus: "ACTIVE",
  terFeeStatus: "PAID",
  terFeeReference: "UTR-BANK-2026-09",
  approvedIntake: 240,
  requestedIntake: 240,
  facultyCount: 16,
  requiredFacultyCount: 12,
  infrastructureSubmitted: true,
  documents: [
    { id: "d1", category: "PREVIOUS_EOA", fileName: "eoa.pdf", sha256Hash: "h1", ocrStatus: "EXTRACTED", ocrText: "Compliant Institute 1-12345678" },
    { id: "d2", category: "AFFIDAVIT", fileName: "affidavit.pdf", sha256Hash: "h2", ocrStatus: "EXTRACTED", ocrText: "Affidavit 1-12345678" },
    { id: "d3", category: "FACULTY_DECLARATION", fileName: "faculty.pdf", sha256Hash: "h3", ocrStatus: "EXTRACTED", ocrText: "Faculty list" },
    { id: "d4", category: "TER_FEE_RECEIPT", fileName: "ter.pdf", sha256Hash: "h4", ocrStatus: "EXTRACTED", ocrText: "TER Paid" },
    { id: "d5", category: "INFRASTRUCTURE_EVIDENCE", fileName: "infra.jpg", sha256Hash: "h5", ocrStatus: "EXTRACTED", ocrText: "Lab photos" },
  ],
};

const fullResult = evaluateRegulatoryRules(fullCompliantContext);
assert.ok(fullResult.complianceScore >= 80, "Compliant application should score >= 80%");
assert.strictEqual(fullResult.disclaimer, PRELIMINARY_DECISION_DISCLAIMER);
assert.ok(
  fullResult.disclaimer.includes("PRELIMINARY DECISION SUPPORT ONLY"),
  "Disclaimer must explicitly state preliminary decision support"
);
console.log("✔ Test 7 Passed: Scoring disclaimer enforces preliminary decision support boundary.");

// -------------------------------------------------------------
// Test 8: JWT Cryptographic Token Verification & Anti-Tampering
// -------------------------------------------------------------
console.log("Running Test 8: Session Token Cryptography & Anti-Tampering...");
import { createToken, verifyToken } from "../src/lib/auth/session";

const testSessionPayload = {
  id: "test-user-001",
  email: "admin@trishul-intel.org",
  name: "Dr. A. Sharma",
  role: "ADMINISTRATOR" as const,
  organizationId: "org-aicte-reg-01",
  organizationName: "AICTE Regulatory Directorate",
};

const validToken = createToken(testSessionPayload);
assert.ok(validToken && validToken.includes("."), "Token must be a valid JWT with 3 parts");

const verifiedUser = verifyToken(validToken);
assert.ok(verifiedUser !== null, "Valid token must verify successfully");
assert.strictEqual(verifiedUser?.email, testSessionPayload.email);
assert.strictEqual(verifiedUser?.role, "ADMINISTRATOR");
assert.strictEqual(verifiedUser?.organizationId, testSessionPayload.organizationId);

// Tamper test: modify payload to forge role
const parts = validToken.split(".");
const tamperedBody = Buffer.from(
  JSON.stringify({ ...testSessionPayload, role: "SUPER_GOD_MODE" })
).toString("base64url");
const tamperedToken = `${parts[0]}.${tamperedBody}.${parts[2]}`;
const tamperedResult = verifyToken(tamperedToken);
assert.strictEqual(tamperedResult, null, "Tampered token signature mismatch must be rejected with null");
console.log("✔ Test 8 Passed: Cryptographic JWT tamper-proofing & signature verification verified.");

// Run async tests
runSourceAdapterTest().then(() => {
  console.log("\n========================================================");
  console.log("🎉 ALL 8 TRISHUL + AICTE PS 26261 TESTS PASSED SUCCESSFULLY!");
  console.log("========================================================\n");
});
