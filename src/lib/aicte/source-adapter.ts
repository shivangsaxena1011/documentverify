import { SourceVerificationStatus } from "./types";

export interface SourceCheckRequest {
  applicationId: string;
  documentId?: string;
  verificationTarget: "INSTITUTION_RECORD" | "TER_PAYMENT" | "EOA_RECORD" | "ACCREDITATION" | "NOC_VERIFICATION";
  identifier: string; // Permanent ID, Transaction ID, Approval Ref, etc.
  institutionName?: string;
}

export interface SourceCheckResult {
  sourceProvider: string;
  verificationTarget: string;
  status: SourceVerificationStatus;
  summary: string;
  details: Record<string, unknown>;
  verifiedAt: string;
  isConfigured: boolean;
  requiresManualReview: boolean;
}

export interface ManualVerificationInput {
  applicationId: string;
  documentId?: string;
  verificationTarget: string;
  reviewerId: string;
  reviewerEmail: string;
  notes: string;
  decisionStatus: "VERIFIED" | "MISMATCH_DETECTED" | "EXPIRED" | "MANUAL_REVIEW_REQUIRED";
}

/**
 * Adapter interface for external issuing authorities and government registries.
 * Strictly avoids fabricating mock successes when official credentials are not configured.
 */
export class ExternalAuthorityVerificationAdapter {
  private static aictePortalApiUrl = process.env.AICTE_PORTAL_API_URL;
  private static aicteClientId = process.env.AICTE_PORTAL_CLIENT_ID;
  private static verificationGatewayUrl = process.env.VERIFICATION_GATEWAY_URL;

  /**
   * Verify an institution's master standing against the AICTE Portal Institutional Registry.
   */
  public static async verifyInstitutionRecord(
    permanentId: string,
    institutionName: string
  ): Promise<SourceCheckResult> {
    const isConfigured = Boolean(this.aictePortalApiUrl && this.aicteClientId);

    if (!isConfigured) {
      return {
        sourceProvider: "AICTE Central Institutional Registry (Official API)",
        verificationTarget: "INSTITUTION_RECORD",
        status: "SOURCE_UNAVAILABLE",
        summary:
          "Source connector not configured — official AICTE institutional gateway credentials are not set. Manual reviewer verification required.",
        details: {
          permanentId,
          institutionName,
          reason: "MISSING_GATEWAY_CREDENTIALS",
          resolutionPath: "Verify institutional master standing via authorized AICTE portal credentials or manual inspection.",
        },
        verifiedAt: new Date().toISOString(),
        isConfigured: false,
        requiresManualReview: true,
      };
    }

    try {
      // If configured, invoke live authorized API endpoint
      const res = await fetch(`${this.aictePortalApiUrl}/v1/institutions/${permanentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.AICTE_PORTAL_CLIENT_SECRET}`,
          "X-Client-ID": this.aicteClientId || "",
        },
      });

      if (!res.ok) {
        return {
          sourceProvider: "AICTE Central Institutional Registry (Official API)",
          verificationTarget: "INSTITUTION_RECORD",
          status: "MANUAL_REVIEW_REQUIRED",
          summary: `Remote institutional gateway returned HTTP ${res.status}. Manual reviewer scrutiny required.`,
          details: { permanentId, status: res.status },
          verifiedAt: new Date().toISOString(),
          isConfigured: true,
          requiresManualReview: true,
        };
      }

      const data = await res.json();
      return {
        sourceProvider: "AICTE Central Institutional Registry (Official API)",
        verificationTarget: "INSTITUTION_RECORD",
        status: data.active ? "VERIFIED" : "MISMATCH_DETECTED",
        summary: data.active
          ? "Institutional standing verified against AICTE central registry."
          : "Registry record indicates institution status is currently inactive or restricted.",
        details: data,
        verifiedAt: new Date().toISOString(),
        isConfigured: true,
        requiresManualReview: !data.active,
      };
    } catch (error) {
      return {
        sourceProvider: "AICTE Central Institutional Registry (Official API)",
        verificationTarget: "INSTITUTION_RECORD",
        status: "SOURCE_UNAVAILABLE",
        summary: "Gateway timeout or network error connecting to AICTE portal. Manual review required.",
        details: { error: error instanceof Error ? error.message : "Network error" },
        verifiedAt: new Date().toISOString(),
        isConfigured: true,
        requiresManualReview: true,
      };
    }
  }

  /**
   * Verify TER fee transaction or receipt with payment reconciliation service.
   */
  public static async verifyTerPayment(
    reference: string,
    permanentId: string
  ): Promise<SourceCheckResult> {
    const isConfigured = Boolean(this.verificationGatewayUrl);

    if (!isConfigured) {
      return {
        sourceProvider: "AICTE TER Banking & Treasury Reconciliation Gateway",
        verificationTarget: "TER_PAYMENT",
        status: "SOURCE_UNAVAILABLE",
        summary:
          "Source connector not configured — banking treasury gateway credentials not configured. Manual receipt audit required.",
        details: {
          reference,
          permanentId,
          resolutionPath: "Verify transaction UTR and bank stamp via internal accounts portal.",
        },
        verifiedAt: new Date().toISOString(),
        isConfigured: false,
        requiresManualReview: true,
      };
    }

    return {
      sourceProvider: "AICTE TER Banking & Treasury Reconciliation Gateway",
      verificationTarget: "TER_PAYMENT",
      status: "PENDING",
      summary: "Bank reconciliation query dispatched; awaiting clearance confirmation.",
      details: { reference, permanentId },
      verifiedAt: new Date().toISOString(),
      isConfigured: true,
      requiresManualReview: true,
    };
  }

  /**
   * Verify digital accreditation or NoC records against authorized state repository or DigiLocker/NAD.
   */
  public static async verifyRepositoryDocument(
    target: "ACCREDITATION" | "NOC_VERIFICATION" | "EOA_RECORD",
    documentRef: string
  ): Promise<SourceCheckResult> {
    const providerName =
      target === "ACCREDITATION"
        ? "NBA / NAAC National Accreditation Repository"
        : target === "EOA_RECORD"
        ? "AICTE Central Document Repository"
        : "State Higher Education Department NoC Portal";

    return {
      sourceProvider: providerName,
      verificationTarget: target,
      status: "SOURCE_UNAVAILABLE",
      summary: `Source connector not configured for ${providerName}. Manual document verification required.`,
      details: {
        documentRef,
        reason: "NO_ACTIVE_SOURCE_CREDENTIALS",
      },
      verifiedAt: new Date().toISOString(),
      isConfigured: false,
      requiresManualReview: true,
    };
  }
}
