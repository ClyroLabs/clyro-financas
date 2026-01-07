export type SubscriptionPlan = 'free' | 'basic' | 'premium';
export type TwoFactorMethod = 'none' | 'authenticator' | 'email';
export type UserStatus = 'active' | 'blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin' | 'super-admin';
  subscriptionPlan: SubscriptionPlan;
  use2fa: boolean;
  twoFactorMethod: TwoFactorMethod;
  twoFactorSecret: string;
  avatarUrl?: string;
  address?: string;
  phoneNumber?: string;
  status: UserStatus;
  blockReason?: string;
  blockedAt?: string;
}
