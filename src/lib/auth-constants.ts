// ============================================================
// AUTHENTICATION CONSTANTS
// Based on docs/AUTH.md specification
// ============================================================

// Role types for authentication
export type AppRole = "superadmin" | "principal" | "master_admin" | "admin" | "teacher" | "non_teaching" | "student";

// All staff roles (for unified staff login)
export const STAFF_ROLES: AppRole[] = ["master_admin", "admin", "teacher", "non_teaching"];

// Login gateway routes
export const AUTH_ROUTES = {
  SUPERADMIN: "/auth/superadmin",
  PRINCIPAL: "/auth/principal",
  STAFF: "/auth/staff",
  STUDENT: "/auth/student",
} as const;

// Account status values
export const ACCOUNT_STATUS = {
  CREATED: "created",
  FIRST_LOGIN: "first_login",
  ACTIVE: "active",
  INACTIVE: "inactive",
  LOCKED: "locked",
} as const;

// OTP purpose types
export const OTP_PURPOSE = {
  LOGIN: "login",
  RECOVERY: "recovery",
  SETUP: "setup",
  NEW_DEVICE: "new_device",
} as const;

// LocalStorage keys for auth persistence
export const AUTH_STORAGE_KEYS = {
  SCHOOL_ID: "sharp_school_id",
  SCHOOL_NAME: "sharp_school_name",
  SCHOOL_LOGO: "sharp_school_logo",
  SCHOOL_COLOR: "sharp_school_color",
  LAST_USER_ID: "sharp_last_user_id",
  LAST_ROLE: "sharp_last_role",
  LAST_USER_NAME: "sharp_last_user_name",
  LAST_USER_PHOTO: "sharp_last_user_photo",
  LAST_USER_EMAIL: "sharp_last_user_email",
  LAST_USER_TAG: "sharp_last_user_tag", // Messenger tag for staff
  LAST_USER_CLASS: "sharp_last_user_class", // Class-section for students
} as const;

// Session storage keys
export const SESSION_KEYS = {
  PIN_VERIFIED: "pin_verified",
  DEVICE_FINGERPRINT: "device_fingerprint",
} as const;

// ============================================================
// PIN CONFIGURATION
// ============================================================

export const PIN_CONFIG = {
  LENGTH: 6,
  MIN_VALUE: 0,
  MAX_VALUE: 999999,
  MAX_ATTEMPTS: 5,
  WEAK_PINS_BLOCKED: [
    "123456",
    "654321",
    "111111",
    "222222",
    "333333",
    "444444",
    "555555",
    "666666",
    "777777",
    "888888",
    "999999",
    "000000",
    "121212",
  ],
} as const;

// ============================================================
// OTP CONFIGURATION
// ============================================================

export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  RESEND_DELAY_SECONDS: 30,
  MAX_ATTEMPTS: 5,
  LOCKOUT_HOURS: 24,
} as const;

// ============================================================
// PASSWORD CONFIGURATION (Principal only)
// ============================================================

export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  BLOCKED_PASSWORDS: ["password", "12345678", "qwerty", "sharp123"],
} as const;

// ============================================================
// RATE LIMITING
// ============================================================

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS_PER_IP: { limit: 5, windowMinutes: 1 },
  OTP_REQUESTS_PER_MOBILE: { limit: 3, windowMinutes: 10 },
  PIN_VERIFICATION_PER_USER: { limit: 5, windowMinutes: 1 },
  PASSWORD_ATTEMPTS_PER_USER: { limit: 5, windowMinutes: 1 },
} as const;

// ============================================================
// ACCOUNT LOCKOUT
// ============================================================

export const LOCKOUT_CONFIG = {
  MAX_PIN_ATTEMPTS: 5,
  MAX_OTP_ATTEMPTS: 5,
  MAX_PASSWORD_ATTEMPTS: 5,
  AUTO_UNLOCK_HOURS: 24,
} as const;

// ============================================================
// SCHOOL SELECTION
// ============================================================

export const SCHOOL_SELECTION_CONFIG = {
  STATE_SORT: "alphabetical" as const,
  CITY_SORT: "alphabetical" as const,
  SCHOOL_SORT: "alphabetical" as const,
  SHOW_LOGO: true,
  SHOW_CITY: true,
} as const;

// ============================================================
// ROLE DISPLAY LABELS
// ============================================================

export const ROLE_LABELS: Record<AppRole, string> = {
  superadmin: "Super Admin",
  principal: "Principal",
  master_admin: "Master Admin",
  admin: "Admin",
  teacher: "Teacher",
  non_teaching: "Non-Teaching Staff",
  student: "Student",
};

// Helper functions
export function isStaffRole(role: string | null): boolean {
  return STAFF_ROLES.includes(role as AppRole);
}

export function isPrincipal(role: string | null): boolean {
  return role === "principal";
}

export function isSuperAdmin(role: string | null): boolean {
  return role === "superadmin";
}

export function isStudent(role: string | null): boolean {
  return role === "student";
}

export function getGatewayRoute(role: AppRole): string {
  if (role === "superadmin") return AUTH_ROUTES.SUPERADMIN;
  if (role === "principal") return AUTH_ROUTES.PRINCIPAL;
  if (isStaffRole(role)) return AUTH_ROUTES.STAFF;
  if (isStudent(role)) return AUTH_ROUTES.STUDENT;
  return AUTH_ROUTES.STAFF; // Default to staff gateway
}