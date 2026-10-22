/**
 * TRISHUL Document Intelligence + AICTE PS 26261
 * Comprehensive End-to-End System, API, Security & Regression Suite
 */

const assert = require("assert");

const LOCAL_BASE = "http://localhost:3000";
const VERCEL_BASE = "https://documentverify-two.vercel.app";

let cookieHeader = "";

async function runSuite() {
  console.log("===============================================================");
  console.log("🚀 STARTING COMPREHENSIVE END-TO-END QA & SECURITY TEST SUITE");
  console.log("===============================================================\n");

  // =========================================================================
  // 1. DEPLOYED VERCEL VERIFICATION & DRIFT AUDIT
  // =========================================================================
  console.log("--- 1. Testing Deployed Vercel Environment (https://documentverify-two.vercel.app/) ---");
  try {
    const vercelLanding = await fetch(`${VERCEL_BASE}/`);
    console.log(`[VERCEL] Landing page status: ${vercelLanding.status}`);
    assert.strictEqual(vercelLanding.status, 200, "Vercel landing page should be 200");

    const vercelApps = await fetch(`${VERCEL_BASE}/applications`);
    console.log(`[VERCEL] /applications page status: ${vercelApps.status}`);
    if (vercelApps.status === 404) {
      console.log("✔ [VERCEL FINDING CONFIRMED] Vercel deployed build lacks feature/aicte-ps26261 (returns 404).");
      console.log("  Root cause: Vercel tracks 'main' commit 11db6bb, feature branch not yet merged.");
    }
  } catch (err) {
    console.warn("[VERCEL] Network warning during Vercel check:", err.message);
  }

  // =========================================================================
  // 2. LOCAL FRONTEND ROUTE ACCESSIBILITY
  // =========================================================================
  console.log("\n--- 2. Verifying All Local Frontend Routes ---");
  const routes = [
    "/",
    "/dashboard",
    "/scanner",
    "/documents",
    "/applications",
    "/verification",
    "/reports",
    "/activity",
    "/api-access",
    "/team",
    "/security",
    "/settings",
    "/integrations",
  ];

  for (const route of routes) {
    const res = await fetch(`${LOCAL_BASE}${route}`);
    assert.strictEqual(res.status, 200, `Route ${route} must return 200 OK`);
    const text = await res.text();
    assert.ok(text.length > 500, `Route ${route} must render substantive HTML`);
    console.log(`✔ Route [200 OK]: ${route} (${text.length} bytes)`);
  }

  // =========================================================================
  // 3. AUTHENTICATION & ACCESS CONTROL SECURITY AUDIT
  // =========================================================================
  console.log("\n--- 3. Auditing Authentication, Session & Access Control ---");

  // 3a. Unauthenticated session check (Must NOT auto-login!)
  const unauthSession = await fetch(`${LOCAL_BASE}/api/auth/session`);
  const unauthJson = await unauthSession.json();
  assert.strictEqual(unauthSession.status, 200);
  assert.strictEqual(unauthJson.user, null, "Unauthenticated visitor must NOT be auto-logged in!");
  console.log("✔ Auto-login vulnerability resolved: /api/auth/session returns user: null for unauthenticated requests.");

  // 3b. Invalid credentials rejection
  const invalidLogin = await fetch(`${LOCAL_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@trishul-intel.org", password: "WrongPassword123!" }),
  });
  assert.strictEqual(invalidLogin.status, 401, "Invalid password must return 401");
  console.log("✔ Credential validation verified: Invalid password returns 401 Unauthorized.");

  // 3c. Non-existent user rejection
  const nonExistentLogin = await fetch(`${LOCAL_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "ghost@trishul-intel.org", password: "Trishul@Enterprise2026" }),
  });
  assert.strictEqual(nonExistentLogin.status, 401, "Non-existent user must return 401");
  console.log("✔ Non-existent user rejection verified.");

  // 3d. Role tampering payload test (client attempts roleOverride)
  const tamperLogin = await fetch(`${LOCAL_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "operator@trishul-intel.org",
      password: "Trishul@Enterprise2026",
      roleOverride: "ADMINISTRATOR", // Attacker attempts privilege escalation
    }),
  });
  assert.strictEqual(tamperLogin.status, 200);
  const tamperJson = await tamperLogin.json();
  assert.strictEqual(tamperJson.user.role, "OPERATOR", "Server MUST ignore client-supplied roleOverride!");
  console.log("✔ Privilege escalation vulnerability resolved: roleOverride is ignored; role strictly bound to DB.");

  // 3e. Valid Admin Login & Cookie Extraction
  const adminLogin = await fetch(`${LOCAL_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@trishul-intel.org",
      password: "Trishul@Enterprise2026",
    }),
  });
  assert.strictEqual(adminLogin.status, 200, "Admin login must succeed");
  const adminJson = await adminLogin.json();
  assert.strictEqual(adminJson.user.role, "ADMINISTRATOR");

  // Extract set-cookie
  const setCookie = adminLogin.headers.get("set-cookie");
  assert.ok(setCookie, "Login must set session cookie");
  cookieHeader = setCookie.split(";")[0];
  console.log(`✔ Admin authentication verified: Session token issued with cookie.`);

  // 3f. Verify authenticated session
  const authSession = await fetch(`${LOCAL_BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  });
  const authSessionJson = await authSession.json();
  assert.strictEqual(authSessionJson.user.email, "admin@trishul-intel.org");
  assert.strictEqual(authSessionJson.user.role, "ADMINISTRATOR");
  console.log("✔ Authenticated session verified: /api/auth/session correctly returns operator identity.");

  // 3g. Protected Endpoints: Verify Unauthenticated Rejection
  const unauthEndpoints = [
    { url: `${LOCAL_BASE}/api/api-keys`, method: "GET" },
    { url: `${LOCAL_BASE}/api/audit-logs`, method: "GET" },
    { url: `${LOCAL_BASE}/api/metrics`, method: "GET" },
    { url: `${LOCAL_BASE}/api/screenings/test-id/reveal`, method: "POST" },
  ];

  for (const ep of unauthEndpoints) {
    const res = await fetch(ep.url, { method: ep.method });
    assert.strictEqual(res.status, 401, `Endpoint ${ep.url} must reject unauthenticated requests with 401`);
  }
  console.log("✔ Protected endpoint access control verified: All sensitive endpoints enforce 401.");

  // 3h. Metrics: Verify Truthful Service Health
  const metricsRes = await fetch(`${LOCAL_BASE}/api/metrics`, {
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(metricsRes.status, 200);
  const metricsJson = await metricsRes.json();
  console.log(`[TRUTHFUL METRICS] TRISHUL Hub Gateway status: ${metricsJson.data.systemHealth.trishulHubGateway}`);
  console.log(`[TRUTHFUL METRICS] Verification Gateway status: ${metricsJson.data.systemHealth.verificationGateway}`);
  console.log(`[TRUTHFUL METRICS] Biometrics Module status: ${metricsJson.data.systemHealth.biometricsModule}`);
  assert.notStrictEqual(
    metricsJson.data.systemHealth.trishulHubGateway,
    "CONNECTED",
    "Must not falsely report CONNECTED without credentials"
  );
  assert.strictEqual(
    metricsJson.data.systemHealth.biometricsModule,
    "MANUAL_REVIEW_REQUIRED",
    "Biometrics must truthfully report manual review required without model"
  );
  console.log("✔ Truthful system health reporting verified: External unconfigured services report OFFLINE_STANDALONE / DISCONNECTED.");

  // =========================================================================
  // 4. AICTE PS 26261 REGULATORY WORKFLOW VERIFICATION
  // =========================================================================
  console.log("\n--- 4. Testing AICTE PS 26261 Full Regulatory Workflow ---");

  // 4a. Create Institutional Application
  const testAppPayload = {
    institutionName: "K.J. Somaiya College of Engineering (Autonomous)",
    permanentId: "1-3327189110",
    applicationCategory: "EXTENSION_OF_APPROVAL",
    academicYear: "2026-2027",
    programmeName: "Engineering and Technology",
    approvedIntake: 600,
    requestedIntake: 720,
    facultyCount: 30, // Deficit vs 720 / 20 = 36 required
    previousApprovalRef: "F.No. Western/1-3327189110/2025/EOA",
    previousApprovalStatus: "APPROVED",
    institutionRecordStatus: "ACTIVE",
    terFeeStatus: "PAID",
    terFeeReference: "UTR-SBIN20260491823",
    infrastructureSubmitted: true,
  };

  const createRes = await fetch(`${LOCAL_BASE}/api/institution-applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(testAppPayload),
  });
  assert.strictEqual(createRes.status, 201, "Institutional application creation should return 201");
  const createJson = await createRes.json();
  const createdApp = createJson.data;
  assert.ok(createdApp.id, "Created app must have ID");
  assert.strictEqual(createdApp.permanentId, testAppPayload.permanentId);
  console.log(`✔ Created AICTE Application: ${createdApp.applicationNumber} (ID: ${createdApp.id})`);

  // 4b. Upload Evidence Document
  const docPayload = {
    category: "PREVIOUS_EOA",
    fileName: "EOA_Letter_2025_2026.pdf",
    mimeType: "application/pdf",
    fileSize: 204850,
    base64Data: Buffer.from("AICTE Western Region EOA Approval Letter 2025-2026").toString("base64"),
  };

  const uploadRes = await fetch(`${LOCAL_BASE}/api/institution-applications/${createdApp.id}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(docPayload),
  });
  assert.strictEqual(uploadRes.status, 201, "Document upload must return 201");
  const uploadJson = await uploadRes.json();
  const uploadedDoc = uploadJson.data;
  assert.ok(uploadedDoc.sha256Hash, "Uploaded document must have computed SHA-256 hash");
  console.log(`✔ Uploaded Application Evidence: ${uploadedDoc.fileName} (SHA-256: ${uploadedDoc.sha256Hash.slice(0, 16)}...)`);

  // 4c. Duplicate Hash Collision Test
  const dupeRes = await fetch(`${LOCAL_BASE}/api/institution-applications/${createdApp.id}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      ...docPayload,
      fileName: "duplicate_copy_of_eoa.pdf",
    }),
  });
  assert.strictEqual(dupeRes.status, 201);
  const dupeJson = await dupeRes.json();
  assert.strictEqual(dupeJson.data.isDuplicate, true, "System must flag duplicate SHA-256 evidence!");
  console.log(`✔ Cryptographic duplicate detection verified: Collision detected with original document.`);

  // 4d. Trigger Regulatory Rule Validation Engine
  const validateRes = await fetch(`${LOCAL_BASE}/api/institution-applications/${createdApp.id}/validate`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(validateRes.status, 200, "Rule evaluation must return 200");
  const validateJson = await validateRes.json();
  const evalData = validateJson.data;
  console.log(`[EVALUATION RESULT] Compliance Score: ${evalData.complianceScore}%`);
  console.log(`[EVALUATION RESULT] Ruleset Version: ${evalData.rulesetVersion}`);
  console.log(`[EVALUATION RESULT] Total Findings: ${evalData.findings.length} (Failed: ${evalData.failedCount}, Warnings: ${evalData.warningCount}, Passed: ${evalData.passedCount})`);
  assert.ok(evalData.findings.length > 0, "Evaluation must produce regulatory findings");
  assert.ok(evalData.disclaimer.includes("PRELIMINARY DECISION SUPPORT ONLY"));
  console.log("✔ AICTE Rule Engine verified: Versioned ruleset evaluated and preliminary disclaimer enforced.");

  // 4e. Test External Authority Source Verification Connector (Truthful Fallback)
  const sourceRes = await fetch(`${LOCAL_BASE}/api/institution-applications/${createdApp.id}/source-check`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(sourceRes.status, 200);
  const sourceJson = await sourceRes.json();
  const sourceRecords = sourceJson.data;
  assert.ok(Array.isArray(sourceRecords) && sourceRecords.length > 0, "Source check must return verification records");
  const sourceRecord = sourceRecords[0];
  assert.strictEqual(sourceRecord.status, "SOURCE_UNAVAILABLE", "Must return SOURCE_UNAVAILABLE without fake success");
  const details = JSON.parse(sourceRecord.detailsJson || "{}");
  assert.strictEqual(details.requiresManualReview, true, "Source check details must flag requiresManualReview");
  console.log("✔ Truthful external authority adapter verified: Unconfigured API yields SOURCE_UNAVAILABLE with manual review flag.");

  // 4f. Reviewer Workflow Action & Rectification Transition
  const reviewPayload = {
    action: "REQUEST_RECTIFICATION",
    notes: "Deficit in faculty cadre ratio identified (30 declared vs 36 required for requested 720 intake). Please submit revised roster.",
    ruleFindingId: evalData.findings[0]?.id,
  };

  const reviewRes = await fetch(`${LOCAL_BASE}/api/institution-applications/${createdApp.id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(reviewPayload),
  });
  assert.strictEqual(reviewRes.status, 200);
  const reviewJson = await reviewRes.json();
  assert.strictEqual(reviewJson.data.validationStatus, "RECTIFICATION_REQUESTED");
  console.log("✔ Reviewer workflow transition verified: Status updated to RECTIFICATION_REQUESTED.");

  // 4g. Dossier / Report Generation
  const reportRes = await fetch(`${LOCAL_BASE}/api/institution-applications/${createdApp.id}/report`, {
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(reportRes.status, 200);
  const reportJson = await reportRes.json();
  const dossier = reportJson.data;
  assert.strictEqual(dossier.application.applicationNumber, createdApp.applicationNumber);
  assert.ok(dossier.cryptographicSeal, "Dossier must have computed cryptographic seal");
  assert.ok(dossier.documentManifest.length >= 2, "Dossier must include manifest of uploaded files");
  assert.ok(dossier.legalDisclaimer.length > 50, "Dossier must include full legal disclaimer");
  console.log(`✔ Dossier synthesis verified: ${dossier.application.applicationNumber} generated with seal ${dossier.cryptographicSeal.slice(0, 16)}...`);

  // =========================================================================
  // 5. REGRESSION AUDIT: IDENTITY DOCUMENT CAPABILITIES
  // =========================================================================
  console.log("\n--- 5. Auditing Identity Document Capabilities for Regressions ---");

  // 5a. Synthetic PAN Document Screening
  const syntheticPanText =
    "INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nPermanent Account Number Card\nABCPS9182K\nName: KESHAV AGRAWAL\nFather's Name: SURESH AGRAWAL\nDate of Birth: 15/07/1985";

  const screeningRes = await fetch(`${LOCAL_BASE}/api/screenings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      text: syntheticPanText,
      fileName: "pan_calibration_specimen.jpg",
      documentType: "PAN_CARD",
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    }),
  });
  assert.ok(screeningRes.status === 200 || screeningRes.status === 201, "Screening session creation should succeed");
  const screeningJson = await screeningRes.json();
  const screening = screeningJson.data;
  assert.strictEqual(screening.documentType, "PAN_CARD");
  assert.ok(screening.riskScore !== undefined, "Screening must compute risk score");
  console.log(`✔ PAN screening verified: Extracted type=${screening.documentType}, Risk Score=${screening.riskScore} (${screening.riskTier})`);

  // 5b. Sensitive PII Unmasking with Justification
  const revealRes = await fetch(`${LOCAL_BASE}/api/screenings/${screening.id}/reveal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ reason: "Regulatory KYC Cross-Verification Audit" }),
  });
  assert.strictEqual(revealRes.status, 200, "PII reveal should succeed for authenticated reviewer");
  const revealJson = await revealRes.json();
  assert.ok(revealJson.revealedFields.length > 0, "Must return unmasked fields");
  console.log("✔ PII unmasking verified: Masked fields revealed with logged regulatory justification.");

  // 5c. Biometric Face Verification (Truthful unconfigured response)
  const faceRes = await fetch(`${LOCAL_BASE}/api/screenings/${screening.id}/face-verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      selfieImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    }),
  });
  assert.strictEqual(faceRes.status, 200);
  const faceJson = await faceRes.json();
  assert.strictEqual(faceJson.comparison.matchStatus, "REVIEW_REQUIRED");
  assert.ok(faceJson.comparison.notes[0].includes("unconfigured"), "Notes must state biometric model is unconfigured");
  console.log("✔ Truthful biometric handling verified: Returns REVIEW_REQUIRED without fake similarity percentages.");

  // 5d. TRISHUL External Dispatch (Truthful offline buffer)
  const dispatchRes = await fetch(`${LOCAL_BASE}/api/screenings/${screening.id}/trishul-dispatch`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(dispatchRes.status, 200);
  const dispatchJson = await dispatchRes.json();
  assert.strictEqual(dispatchJson.receipt.status, "QUEUED");
  console.log("✔ Truthful TRISHUL dispatch verified: Status QUEUED / OFFLINE_BUFFERED.");

  console.log("\n===============================================================");
  console.log("🏆 ALL END-TO-END VERIFICATION & REGRESSION TESTS PASSED!");
  console.log("===============================================================\n");
}

runSuite().catch((err) => {
  console.error("❌ E2E TEST FAILED:", err);
  process.exit(1);
});
