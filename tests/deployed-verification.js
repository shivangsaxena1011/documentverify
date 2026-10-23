/**
 * Comprehensive Automated Verification Suite for Deployed Vercel Environment
 * Target: https://documentverify-two.vercel.app
 */

const assert = require("assert");

const VERCEL_BASE = "https://documentverify-two.vercel.app";
let cookieHeader = "";

async function testDeployedSite() {
  console.log("===============================================================");
  console.log(`🌐 AUDITING LIVE DEPLOYED ENVIRONMENT: ${VERCEL_BASE}`);
  console.log("===============================================================\n");

  // 1. PAGE ROUTE VERIFICATION
  console.log("--- 1. Testing Live Web Routes ---");
  const routes = [
    { path: "/", title: "Landing & Auth" },
    { path: "/dashboard", title: "Operations Dashboard" },
    { path: "/scanner", title: "Document Scanner" },
    { path: "/documents", title: "Document Repository" },
    { path: "/applications", title: "AICTE PS 26261 Institutional Applications" },
    { path: "/verification", title: "Manual Verification Queue" },
    { path: "/reports", title: "Analytical Reports" },
    { path: "/activity", title: "Audit Activity Log" },
    { path: "/api-access", title: "API Keys & Integrations" },
    { path: "/team", title: "Team & Role Access" },
    { path: "/security", title: "Security Posture" },
    { path: "/settings", title: "System Settings" },
    { path: "/integrations", title: "TRISHUL Network Hub" },
  ];

  for (const r of routes) {
    const res = await fetch(`${VERCEL_BASE}${r.path}`);
    console.log(`[ROUTE] ${r.path} -> HTTP ${res.status} (${r.title})`);
    assert.strictEqual(res.status, 200, `Route ${r.path} must return 200 OK`);
    const html = await res.text();
    assert.ok(html.length > 500, `Route ${r.path} should render valid HTML`);
  }
  console.log("✔ All 13 live routes returned HTTP 200 OK!\n");

  // 2. LIVE AUTHENTICATION AUDIT
  console.log("--- 2. Auditing Live Authentication & Session Handlers ---");
  
  // Unauthenticated check
  const unauthRes = await fetch(`${VERCEL_BASE}/api/auth/session`);
  assert.strictEqual(unauthRes.status, 200);
  const unauthJson = await unauthRes.json();
  assert.strictEqual(unauthJson.user, null, "Unauthenticated session must be null on deployed site");
  console.log("✔ Deployed /api/auth/session correctly returns user: null without auto-login.");

  // Invalid login check
  const invalidLogin = await fetch(`${VERCEL_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@trishul-intel.org", password: "BadPassword999!" }),
  });
  assert.strictEqual(invalidLogin.status, 401, "Invalid password must be rejected with 401");
  console.log("✔ Deployed /api/auth/login rejects incorrect passwords with 401.");

  // Valid login
  const loginRes = await fetch(`${VERCEL_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@trishul-intel.org", password: "Trishul@Enterprise2026" }),
  });
  console.log(`[LOGIN] status: ${loginRes.status}`);
  const loginJson = await loginRes.json();
  if (loginRes.status === 200) {
    const setCookie = loginRes.headers.get("set-cookie");
    assert.ok(setCookie, "Login must set session cookie");
    cookieHeader = setCookie.split(";")[0];
    console.log(`✔ Deployed login succeeded as ${loginJson.user.name} (${loginJson.user.role}).`);
  } else {
    console.warn(`[WARN] Login returned:`, loginJson);
  }

  // 3. LIVE AICTE INSTITUTIONAL APPLICATION WORKFLOW
  console.log("\n--- 3. Testing Deployed AICTE Institutional Applications Workflow ---");
  
  // List applications
  const listRes = await fetch(`${VERCEL_BASE}/api/institution-applications`, {
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(listRes.status, 200, "Must be able to list applications");
  const listJson = await listRes.json();
  console.log(`[APPLICATIONS] Existing cases count: ${listJson.total}`);

  // Create an application on Vercel
  const testPayload = {
    institutionName: "Indian Institute of Science & Tech (Autonomous)",
    permanentId: "1-9876543210",
    applicationCategory: "EXTENSION_OF_APPROVAL",
    academicYear: "2026-2027",
    programmeName: "Engineering & Applied Sciences",
    approvedIntake: 300,
    requestedIntake: 360,
    facultyCount: 15,
    requiredFacultyCount: 18,
    previousApprovalRef: "F.No. AICTE/WEST/2025/1-9876543210",
    previousApprovalStatus: "APPROVED",
    institutionRecordStatus: "ACTIVE",
    terFeeStatus: "PAID",
    terFeeReference: "UTR-AXIS-2026-8819",
    infrastructureSubmitted: true,
  };

  const createRes = await fetch(`${VERCEL_BASE}/api/institution-applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(testPayload),
  });
  console.log(`[CREATE APP] status: ${createRes.status}`);
  assert.ok(createRes.status === 200 || createRes.status === 201, "Create application should succeed");
  const createJson = await createRes.json();
  const createdApp = createJson.data;
  console.log(`✔ Created Application Case on Vercel: ${createdApp.applicationNumber} (ID: ${createdApp.id})`);

  // Upload an evidence document
  const docPayload = {
    category: "PREVIOUS_EOA",
    fileName: "AICTE_EOA_Approval_2025_2026.pdf",
    mimeType: "application/pdf",
    fileSize: 1048576,
    base64Data: Buffer.from("AICTE Western Regional Office EoA Official Document 2025-2026").toString("base64"),
    issuer: "AICTE Western Regional Committee",
    referenceNumber: "F.No. AICTE/WEST/2025/1-9876543210",
  };

  const uploadRes = await fetch(`${VERCEL_BASE}/api/institution-applications/${createdApp.id}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(docPayload),
  });
  console.log(`[UPLOAD DOC] status: ${uploadRes.status}`);
  assert.ok(uploadRes.status === 200 || uploadRes.status === 201);
  const uploadJson = await uploadRes.json();
  console.log(`✔ Uploaded Evidence Document on Vercel: ${uploadJson.data.fileName} (SHA-256: ${uploadJson.data.sha256Hash.slice(0, 16)}...)`);

  // Run regulatory validation engine on Vercel
  const valRes = await fetch(`${VERCEL_BASE}/api/institution-applications/${createdApp.id}/validate`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });
  console.log(`[VALIDATE] status: ${valRes.status}`);
  assert.strictEqual(valRes.status, 200);
  const valJson = await valRes.json();
  console.log(`✔ Regulatory Rules Evaluated: Version ${valJson.data.rulesetVersion}, Findings: ${valJson.data.findings.length}, Score: ${valJson.data.complianceScore}%`);

  // Check source adapter on Vercel
  const srcRes = await fetch(`${VERCEL_BASE}/api/institution-applications/${createdApp.id}/source-check`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });
  console.log(`[SOURCE CHECK] status: ${srcRes.status}`);
  assert.strictEqual(srcRes.status, 200);
  const srcJson = await srcRes.json();
  assert.strictEqual(srcJson.data[0].status, "SOURCE_UNAVAILABLE", "Must honestly report SOURCE_UNAVAILABLE on live deployment");
  console.log(`✔ Source adapter verified on Vercel: Returns SOURCE_UNAVAILABLE without simulated data.`);

  // Reviewer action transition on Vercel
  const revRes = await fetch(`${VERCEL_BASE}/api/institution-applications/${createdApp.id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      actionType: "REQUEST_RECTIFICATION",
      observationNotes: "Deficit of 3 faculty members identified for requested intake of 360 students. Please upload recruitment declaration.",
    }),
  });
  console.log(`[REVIEW ACTION] status: ${revRes.status}`);
  assert.strictEqual(revRes.status, 200);
  const revJson = await revRes.json();
  assert.strictEqual(revJson.data.validationStatus, "RECTIFICATION_REQUESTED");
  console.log(`✔ Reviewer workflow on Vercel: Status transitioned to RECTIFICATION_REQUESTED.`);

  // Dossier report generation on Vercel
  const repRes = await fetch(`${VERCEL_BASE}/api/institution-applications/${createdApp.id}/report`, {
    headers: { Cookie: cookieHeader },
  });
  console.log(`[DOSSIER REPORT] status: ${repRes.status}`);
  assert.strictEqual(repRes.status, 200);
  const repJson = await repRes.json();
  assert.ok(repJson.data.cryptographicSeal, "Dossier must contain computed cryptographic seal");
  console.log(`✔ Cryptographic Dossier Generated on Vercel: Seal ${repJson.data.cryptographicSeal.slice(0, 16)}...`);

  // 4. LIVE METRICS & INTEGRATIONS
  console.log("\n--- 4. Testing Deployed Metrics & Truthful Health Checks ---");
  const metricsRes = await fetch(`${VERCEL_BASE}/api/metrics`, {
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(metricsRes.status, 200);
  const metricsJson = await metricsRes.json();
  console.log(`[METRICS HEALTH] TRISHUL Hub: ${metricsJson.data.systemHealth.trishulHubGateway}`);
  console.log(`[METRICS HEALTH] Verification Gateway: ${metricsJson.data.systemHealth.verificationGateway}`);
  console.log(`[METRICS HEALTH] Biometrics Module: ${metricsJson.data.systemHealth.biometricsModule}`);
  assert.strictEqual(metricsJson.data.systemHealth.biometricsModule, "MANUAL_REVIEW_REQUIRED");
  assert.strictEqual(metricsJson.data.systemHealth.trishulHubGateway, "OFFLINE_STANDALONE");

  console.log("\n===============================================================");
  console.log("🎉 ALL LIVE DEPLOYED ENVIRONMENT VERIFICATIONS PASSED!");
  console.log("===============================================================\n");
}

testDeployedSite().catch((err) => {
  console.error("❌ DEPLOYED SITE VERIFICATION FAILED:", err);
  process.exit(1);
});
