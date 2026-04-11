export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPPLIER = 'SUPPLIER',
  EXPERT = 'EXPERT',
  GUEST = 'GUEST',
}

export interface UserProfileInfo {
  id: string;
  displayName: string;
  bio?: string | null;
  city?: string | null;
  district?: string | null;
  ward?: string | null;
  avatarUrl: string | null;
  growerVerificationStatus: string;
  totalHarvests: number;
  totalCareLogs: number;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  requiresPasswordSetup: boolean;
  profile: UserProfileInfo | null;
}

export const GUEST_USER: CurrentUser = {
  id: '',
  email: '',
  role: UserRole.GUEST,
  requiresPasswordSetup: false,
  profile: null,
};

export const isAuthenticated = (user: CurrentUser): boolean =>
  user.role !== UserRole.GUEST && user.id !== '';

export const hasRole = (user: CurrentUser, role: UserRole): boolean =>
  user.role === role;
