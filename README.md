# TRISHUL Document Intelligence
**Enterprise Identity Document Scanning, OCR, Forensics & AICTE Regulatory Compliance Platform**

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel%20Ready-black?style=flat&logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-blue?style=flat&logo=next.js)](https://nextjs.org)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-teal?style=flat&logo=prisma)](https://prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![SIH 2026](https://img.shields.io/badge/SIH%202026-PS%2026261-orange?style=flat)](https://www.sih.gov.in)

TRISHUL Document Intelligence is an enterprise-grade document intelligence, optical character recognition (OCR), forensic analysis, and regulatory verification platform. Originally engineered for identity document screening, it features an additive enterprise module for **AI-Powered Application Validation, Document Authentication, and Regulatory Compliance Verification (AICTE PS 26261)**.

---

## Core Capabilities

### 1. AICTE Institutional Applications & Regulatory Compliance (`/applications`) — *PS 26261*
- **Application Intake & Case Management**: Intake tracking for Extension of Approval (EoA), New Programmes/Courses, Intake Variations, and Approval Modifications. Tracks Permanent IDs, academic year, previous approvals, and TER fees.
- **Evidence Document Handling & Cryptographic Hashes**: Ingestion of affidavits, approval letters, faculty declarations, building plans, and TER fee receipts. Enforces server-side 15MB limits, computes cryptographic SHA-256 hashes, and detects duplicate document uploads via hash collision inspection.
- **Versioned Regulatory Rules Engine (`src/lib/aicte/`)**: Evaluates cases against **AICTE Approval Process Handbook (APH 2024-2027)** rules (`APH-2024-27-V1`). Identifies missing mandatory documents, expired evidence, previous EoA reference gaps, TER payment deficiencies, and faculty cadre-to-intake ratio disparities (1:20 statutory baseline).
- **External Issuing Authority Verification Adapters**: Interface for AICTE Institutional Master Registry, Banking Treasury Settlement, and State Higher Ed NoC repositories. When live credentials are not configured, gracefully operates in `SOURCE_UNAVAILABLE` ("Source connector not configured — manual verification required") and offers a manual review workflow.
- **Infrastructure Evidence Scrutiny**: Dedicated review panel for physical/instructional facilities (geo-tagged photos, floor plans, barrier-free access, fire safety certificates) with advisory observations.
- **Official Scrutiny Workflow & Role-Gated Actions**: Multi-state workflow (`DRAFT`, `VALIDATION_PENDING`, `RECTIFICATION_REQUESTED`, `OFFICIAL_REVIEW_REQUIRED`, `READY_FOR_OFFICIAL_SCRUTINY`, `UNDER_REVIEW`, `CLOSED`). Actions are role-gated and logged to the immutable audit trail.
- **Validation Dossier & Traceability (`/report`)**: Generates an authoritative compliance dossier containing application metadata, rule-by-rule findings, document manifest with SHA-256 seals, reviewer notes, and explicit statutory decision-support disclaimers.

### 2. Identity Document Scanning Station (`/scanner`)
- **Device Camera Viewfinder**: Real-time browser camera stream with document framing guides, boundary alignment crosshairs, and live glare/lighting feedback.
- **Multi-Format Upload**: Drag-and-drop file ingestion supporting JPG, PNG, and PDF.
- **Real-Time Preprocessing**: Laplacian variance sharpness assessment, luminance histogram glare detection, and contrast normalization.

### 3. Identity Classification & Multi-Provider OCR
- **Automated Type Identification**: Classifies Aadhaar Card, PAN Card, Passport, Driving Licence, and Voter ID with confidence scoring.
- **Modular OCR Abstraction**: Pluggable provider layer supporting local Tesseract engine and cloud neural vision adapters (Google Cloud Vision / Azure Document Intelligence).

### 4. Structured Field Extraction & PII Masking
- **Aadhaar Card**: UID extraction with Verhoeff mathematical checksum, demographic fields, masked presentation (`XXXX XXXX 1234`).
- **PAN Card**: 10-character syntax check (`[A-Z]{5}[0-9]{4}[A-Z]`), entity classification (Individual, Company, Trust), masked output (`ABCDE****F`).
- **Passport (ICAO 9303)**: TD3 Machine Readable Zone (MRZ) parser, character weight multipliers (7-3-1 modulo 10) checksum matrix.
- **Driving Licence**: State RTO code parsing, validity periods, authorized vehicle classes (LMV, MCWG, TRANS).
- **Voter ID (EPIC)**: 10-character identifier (`[A-Z]{3}[0-9]{7}`), constituency, demographic data.
- **Authorized PII Unmasking**: Role-gated reveal action with mandatory operational justification recorded in the security audit trail.

### 5. Document Forensics & Visual Anomaly Detection
- Visual anomaly coordinate localization (`boundingBox`).
- Font micro-variation and layout geometry checks.
- Transparent, professional terminology: *Potential Anomaly*, *Review Required*, *No Significant Anomaly Detected*, *Analysis Confidence*.

### 6. Biometric Face Verification
- Automated crop of ID portrait photograph.
- Live selfie capture/upload with normalized landmark similarity scoring (Match / Review Required / No Match).

### 7. Explainable Screening Assessment Engine
- Composite risk score from 0 to 100 with clear tiering (Low Risk, Review Required, High Risk).
- Full explainability breakdown of positive signals vs. review indicators.

### 8. TRISHUL Intelligence Network Integration (`/integrations`)
- Cryptographically sealed evidence handoff (`SHA-256`) to the primary TRISHUL Criminal Network Analysis platform.
- Handoff tracking with receipt IDs (e.g. `TRISHUL-TX-...`).

### 9. Governance, Security & Privacy (`/security`)
- Configurable retention policies (Instant Ephemeral Purge, 24 Hours, 7 Days, 30 Days, Indefinite).
- On-demand permanent image purge tools.
- Tamper-evident audit logging of all operator actions (`/activity`).

---

## Operational Architecture

```
                       [TRISHUL Document Intelligence]
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         ▼                                                         ▼
[Identity Screening Subsystem]                          [AICTE Regulatory Subsystem]
(/scanner, /documents, /reports)                        (/applications, /applications/[id])
         │                                                         │
         ├─► Camera/File Ingestion                                ├─► Case Intake Workspace
         ├─► Laplacian/Glare Quality Analysis                     ├─► Category-based Checklist
         ├─► Multi-Provider OCR (Tesseract/Vision)                ├─► SHA-256 Hash Duplicate Detection
         ├─► Indian ID Checksums (Verhoeff, ICAO)                 ├─► APH 2024-27 Rule Engine
         ├─► Forensic Anomaly Localization                        ├─► External Authority Adapters
         ├─► Biometric Face Verification                          ├─► Infrastructure Scrutiny
         └─► Explainable 0-100 Risk Engine                        └─► Official Scrutiny Dossier
```

---

## AICTE Regulatory Endpoints (PS 26261)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/institution-applications` | Search and filter applications, retrieve KPI metrics |
| `POST` | `/api/institution-applications` | Register new institutional application case |
| `GET` | `/api/institution-applications/[id]` | Case workspace detail, document manifests, findings |
| `PATCH` | `/api/institution-applications/[id]` | Update application metadata, intake, and status |
| `POST` | `/api/institution-applications/[id]/documents` | Upload evidence document, compute SHA-256, execute OCR |
| `POST` | `/api/institution-applications/[id]/validate` | Execute APH 2024-27 ruleset and generate structured findings |
| `POST` | `/api/institution-applications/[id]/source-check` | Dispatch issuing-authority checks or record manual scrutiny |
| `POST` | `/api/institution-applications/[id]/review` | Reviewer status transition (rectification, scrutiny, closure) |
| `GET` | `/api/institution-applications/[id]/report` | Export complete compliance dossier and cryptographic seal |

---

## Deployment & Database Considerations

### Production Database Storage Note
- **Local Development**: Uses local SQLite (`file:./dev.db`) through Prisma.
- **Serverless Environments (Vercel / AWS Lambda)**: The filesystem at `/var/task` is strictly read-only. The application includes an automated `/tmp` adapter for serverless execution. However, storage in `/tmp` is **ephemeral** and does not persist across cold starts.
- **Durable Production Deployments**: For multi-tenant production environments, set `DATABASE_URL` to a persistent database such as PostgreSQL (Neon, Supabase, AWS RDS, GCP Cloud SQL) or MySQL.

### Production Authentication Requirement
- In production (`NODE_ENV="production"`), the application **fails closed** if a high-entropy `JWT_SECRET` (32+ characters) is not configured in the environment.

---

## Environment Variables Configuration

Copy `.env.example` to `.env` for local development:

```env
# Database Persistence
DATABASE_URL="file:./dev.db"

# Environment & Server
NODE_ENV="development"
PORT=3000

# Authentication & Session Security (MANDATORY in production: min 32 chars)
JWT_SECRET="replace-with-a-secure-random-32-char-secret-in-production"
SESSION_EXPIRY_HOURS="12"

# OCR Service Provider Configuration (TESSERACT | GOOGLE_CLOUD_VISION)
OCR_PROVIDER="TESSERACT"
OCR_CONFIDENCE_THRESHOLD="65"
GOOGLE_CLOUD_VISION_API_KEY=""

# TRISHUL Criminal Network Intelligence Hub Integration
TRISHUL_CENTRAL_ENDPOINT="https://api.trishul-intel.internal/v1/screening/ingest"
TRISHUL_API_KEY="placeholder-trishul-api-key"
TRISHUL_ORGANIZATION_ID="APEX-VERIF-HQ-09"
TRISHUL_TRANSMISSION_MODE="METADATA_AND_EVIDENCE"

# Verification Gateway (Institutional Connectors)
VERIFICATION_GATEWAY_URL=""
VERIFICATION_GATEWAY_KEY=""
AICTE_PORTAL_API_URL=""
AICTE_PORTAL_CLIENT_ID=""
AICTE_PORTAL_CLIENT_SECRET=""

# Data Retention Policy (Days to keep raw documents; 0 for instant purge)
DOCUMENT_RETENTION_DAYS="30"
ALLOW_OPERATOR_PII_UNMASK="true"
ENABLE_BIOMETRICS="true"
```

---

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Sync database schema (generates new models)
npx prisma db push

# 3. Seed initial local testing accounts (Skipped automatically in production)
npm run dev
```

### Pre-configured Local Demo Accounts (Development Only)

> **Notice**: These demo credentials are strictly intended for local development and offline evaluation. In production environments, default demo seeding is disabled.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@trishul-intel.org` | `Trishul@Enterprise2026` |
| **Reviewer** | `reviewer@trishul-intel.org` | `Trishul@Enterprise2026` |
| **Investigator** | `investigator@trishul-intel.org` | `Trishul@Enterprise2026` |
| **Operator** | `operator@trishul-intel.org` | `Trishul@Enterprise2026` |

---

## Statutory Decision Support Disclaimer

TRISHUL Document Intelligence provides automated preliminary compliance scoring, forensic optical character recognition, and cross-reference verification in adherence with the AICTE Approval Process Handbook (APH 2024-2027). All scoring outputs are advisory decision-support signals. Formal statutory scrutiny and final approval decisions rest strictly with competent AICTE authorities.
