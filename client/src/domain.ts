/**
 * Shared domain vocabulary: roles, genders, line types and stage names.
 * Visual values live in design.ts — this file only names business concepts.
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  LINE_MANAGER: 'LINE_MANAGER',
  // Legacy role kept so old accounts and tokens keep working.
  SUPERVISOR: 'SUPERVISOR',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  LINE_MANAGER: 'Line Manager',
  SUPERVISOR: 'Line Manager',
};

export const isAdminRole = (role?: string | null): boolean => role === ROLES.ADMIN;

export const isLineManagerRole = (role?: string | null): boolean =>
  role === ROLES.LINE_MANAGER || role === ROLES.SUPERVISOR;

/** Where a signed-in user belongs after login / when a route is not allowed. */
export const homeForRole = (role?: string | null): string =>
  isAdminRole(role) ? '/' : '/entry';

export interface SessionUser {
  id: number;
  username?: string;
  name: string;
  role: UserRole | string;
  line_id: number | null;
}

export const GENDERS = ['MEN', 'WOMEN', 'BOYS', 'GIRLS', 'KIDS', 'UNISEX'] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  MEN: 'Men',
  WOMEN: 'Women',
  BOYS: 'Boys',
  GIRLS: 'Girls',
  KIDS: 'Kids',
  UNISEX: 'Unisex',
};

export const LINE_TYPES = ['SEWING', 'CUTTING'] as const;
export type LineType = (typeof LINE_TYPES)[number];

export const LINE_TYPE_LABELS: Record<LineType, string> = {
  SEWING: 'Sewing',
  CUTTING: 'Cutting',
};

export const PROCESS_STAGES = ['CUTTING', 'STITCHING', 'IRONING', 'PACKING'] as const;
export type ProcessStage = (typeof PROCESS_STAGES)[number];

export const STAGE_LABELS: Record<ProcessStage, string> = {
  CUTTING: 'Cutting',
  STITCHING: 'Stitching',
  IRONING: 'Ironing',
  PACKING: 'Packing',
};

/** The five daily tabs. Quality is a check, not a process_stage_daily stage. */
export const DAILY_STAGE_TABS = ['CUTTING', 'STITCHING', 'IRONING', 'PACKING', 'QUALITY'] as const;
export type DailyStageTab = (typeof DAILY_STAGE_TABS)[number];

export const DAILY_STAGE_TAB_LABELS: Record<DailyStageTab, string> = {
  ...STAGE_LABELS,
  QUALITY: 'Quality',
};
