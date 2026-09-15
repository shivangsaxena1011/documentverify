# TRISHUL Document Intelligence
**Enterprise Identity Document Scanning, OCR, Forensics & Verification Platform**

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel%20Ready-black?style=flat&logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-blue?style=flat&logo=next.js)](https://nextjs.org)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-teal?style=flat&logo=prisma)](https://prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)

TRISHUL Document Intelligence is a production-grade, enterprise-level identity document scanning, OCR, document analysis, and verification platform. It is engineered for authorized organizations such as hotels, financial institutions, enterprises, verification desks, and investigation teams to ingest, parse, inspect, and verify statutory identity documents with explainable risk scoring.

---

## Key Capabilities

1. **Document Scanner Station (`/scanner`)**
   - **Device Camera Viewfinder**: Real-time browser camera stream with document framing guides, boundary alignment crosshairs, and live glare/lighting feedback.
   - **Multi-Format Upload**: Drag-and-drop file ingestion supporting JPG, PNG, and PDF.
   - **Real-Time Preprocessing**: Laplacian variance sharpness assessment, luminance histogram glare detection, and contrast normalization.

2. **Document Classification & Multi-Provider OCR**
   - **Automated Type Identification**: Classifies Aadhaar Card, PAN Card, Passport, Driving Licence, and Voter ID with confidence scoring.
   - **Manual Override**: Operators can correct or adjust classification if needed.
   - **Modular OCR Abstraction**: Pluggable provider layer supporting local Tesseract engine and cloud neural adapters (Google Cloud Vision / Azure Document Intelligence).

3. **Structured Field Extraction & PII Masking**
   - **Aadhaar Card**: UID extraction with Verhoeff mathematical checksum, demographic fields, masked presentation (`XXXX XXXX 1234`).
   - **PAN Card**: 10-character syntax check (`[A-Z]{5}[0-9]{4}[A-Z]`), entity classification (Individual, Company, Trust), masked output (`ABCDE****F`).
   - **Passport (ICAO 9303)**: TD3 Machine Readable Zone (MRZ) parser, character weight multipliers (7-3-1 modulo 10) checksum matrix.
   - **Driving Licence**: State RTO code parsing, validity periods, authorized vehicle classes (LMV, MCWG, TRANS).
   - **Voter ID (EPIC)**: 10-character identifier (`[A-Z]{3}[0-9]{7}`), constituency, demographic data.
   - **Authorized PII Unmasking**: Role-gated reveal action with mandatory operational justification recorded in the security audit trail.

4. **Document Forensics & Visual Anomaly Detection**
   - Visual anomaly coordinate localization (`boundingBox`).
   - Font micro-variation and layout geometry checks.
   - Transparent, professional terminology: *Potential Anomaly*, *Review Required*, *No Significant Anomaly Detected*, *Analysis Confidence*.

5. **Optional Biometric Face Verification**
   - Automated crop of ID portrait photograph.
   - Live selfie capture/upload with normalized landmark similarity scoring (Match / Review Required / No Match).

6. **Explainable Screening Assessment Engine**
   - Composite risk score from 0 to 100 with clear tiering (Low Risk, Review Required, High Risk).
   - Full explainability breakdown of positive signals vs. review indicators.

7. **TRISHUL Intelligence Platform Integration (`/integrations`)**
   - Cryptographically sealed evidence handoff (`SHA-256`) to the primary TRISHUL Criminal Network Analysis platform.
   - Handoff tracking with receipt IDs (e.g. `TRISHUL-TX-...`).

8. **Governance, Security & Privacy (`/security`)**
   - Configurable retention policies (Instant Ephemeral Purge, 24 Hours, 7 Days, 30 Days, Indefinite).
   - On-demand permanent image purge tools.
   - Tamper-evident audit logging of all operator actions (`/activity`).

---

## Operational Architecture

```
[Document Ingestion (Camera / Upload)]
               │
               ▼
[Image Enhancement & Quality Assessment (Blur, Glare, Contrast)]
               │
               ▼
[Multi-Provider OCR (Tesseract / Cloud Neural Vision)]
               │
               ▼
[Document Classifier (Aadhaar / PAN / Passport / DL / Voter ID)]
               │
               ▼
[Structured Field Extraction & Mathematical Checksums (Verhoeff, ICAO 9303)]
               │
               ▼
[Forensic Visual Anomaly & Geometry Detector]
               │
               ▼
[Optional Biometric Face Similarity Verification]
               │
               ▼
[Explainable Risk Assessment Engine (0-100 Score & Tier)]
               │
               ▼
[Verification Dossier & PDF Report Generation]
               │
               ▼
[TRISHUL Intelligence Network Cryptographic Handoff]
```

---

## Deployment on Vercel

### 1. Push Code to GitHub
Ensure the project is pushed to your GitHub repository:
```bash
git push -u origin main
```

### 2. Import into Vercel
1. Navigate to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Select the `documentverify` repository.
3. Framework Preset: **Next.js** (automatically detected).
4. Build Command: `prisma generate && next build` (pre-configured in `package.json`).
5. Output Directory: `.next` (default).

### 3. Environment Variables in Vercel
Add the following environment variables in the Vercel project settings:

| Variable | Description | Recommended Value / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Database connection string | `file:./dev.db` (or PostgreSQL connection string) |
| `JWT_SECRET` | Session signature secret | `trishul_enterprise_jwt_sec_8f9024cba1207e` |
| `OCR_PROVIDER` | Default OCR engine | `TESSERACT` |
| `TRISHUL_CENTRAL_ENDPOINT` | Central TRISHUL Hub | `https://api.trishul-intel.internal/v1/screening/ingest` |
| `TRISHUL_API_KEY` | Node API Key | `trishul_live_sec_89204810294` |
| `TRISHUL_ORGANIZATION_ID` | Authority Identifier | `APEX-VERIF-HQ-09` |
| `DOCUMENT_RETENTION_DAYS` | Data retention policy | `30` |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Sync database schema
npx prisma db push

# 3. Seed initial enterprise records
npx tsx -e "import('./src/lib/seed').then(m => m.ensureDatabaseSeeded())"

# 4. Start local development server
npm run dev
```

Visit `http://localhost:3000` to access the platform.

### Default Operator Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@trishul-intel.org` | `Trishul@Enterprise2026` |
| **Reviewer** | `reviewer@trishul-intel.org` | `Trishul@Enterprise2026` |
| **Investigator** | `investigator@trishul-intel.org` | `Trishul@Enterprise2026` |
| **Operator** | `operator@trishul-intel.org` | `Trishul@Enterprise2026` |

---

## REST API Specification

### Analyze Document
```http
POST /api/v1/screening/analyze
Authorization: Bearer <INSTITUTIONAL_API_KEY>
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,...",
  "documentType": "PAN_CARD"
}
```

---

## License
Confidential enterprise software engineered for authorized operational identity verification and intelligence processing.
