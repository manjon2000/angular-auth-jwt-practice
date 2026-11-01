export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];
