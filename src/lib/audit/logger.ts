import { prisma } from "../db";

export interface LogAuditParams {
  organizationId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
}

export async function recordAuditLog(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
    return null;
  }
}
