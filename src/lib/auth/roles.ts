export type UserRole = "OPERATOR" | "INVESTIGATOR" | "REVIEWER" | "ADMINISTRATOR";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  OPERATOR: [
    "screenings:create",
    "screenings:read",
    "reports:view",
    "reports:export",
    "scanner:use",
  ],
  INVESTIGATOR: [
    "screenings:create",
    "screenings:read",
    "forensics:view",
    "biometrics:analyze",
    "reports:view",
    "reports:export",
    "trishul:dispatch",
  ],
  REVIEWER: [
    "screenings:create",
    "screenings:read",
    "screenings:review",
    "pii:unmask",
    "forensics:view",
    "biometrics:analyze",
    "reports:view",
    "reports:export",
    "trishul:dispatch",
  ],
  ADMINISTRATOR: [
    "screenings:create",
    "screenings:read",
    "screenings:review",
    "screenings:delete",
    "pii:unmask",
    "forensics:view",
    "biometrics:analyze",
    "reports:view",
    "reports:export",
    "trishul:dispatch",
    "trishul:configure",
    "api_keys:manage",
    "audit_logs:read",
    "settings:manage",
    "team:manage",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
