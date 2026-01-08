import { Injectable, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, SubscriptionPlan, TwoFactorMethod } from '../models/user.model';

export interface GoogleAuthUser {
  name: string;
  email: string;
  avatarUrl: string;
}

const USER_KEY = 'clyro-user';
const USERS_KEY = 'clyro-users';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  private _users = signal<Record<string, User>>({});

  user = signal<User | null>(null);
  users = computed(() => Object.values(this._users()));
  isAuthenticated = computed(() => !!this.user());
  subscriptionPlan = computed(() => this.user()?.subscriptionPlan ?? 'free');
  isPremium = computed(() => this.subscriptionPlan() === 'premium');

  // 2FA state
  requires2fa = signal(false);
  private pendingLoginUser: { email: string; password?: string } | null = null;
  private pendingResetEmail: string | null = null;

  // Billing cycle tracking for proration
  billingCycleStart = signal<Date>(new Date());
  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  scheduledDowngrade = signal<{ plan: SubscriptionPlan; effectiveDate: Date } | null>(null);

  // Mock Google users for the Google Auth modal
  private googleAuthUsers: GoogleAuthUser[] = [
    { name: 'Alex Johnson', email: 'alex.j@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=alex.j@example.com' },
    { name: 'Maria Garcia', email: 'maria.g@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=maria.g@example.com' },
  ];

  constructor() {
    this.loadUsersFromStorage();
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        this.user.set(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem(USER_KEY);
      }
    }

    // FORCE FIX: Ensure current user and default user are Premium (migrations for existing localStorage data)
    this._users.update(users => {
      const updated = { ...users };
      if (updated['user@clyro.com']) {
        updated['user@clyro.com'].subscriptionPlan = 'premium';
      }
      return updated;
    });
    this.saveUsersToStorage();

    if (this.user()) {
      this.user.update(u => u ? { ...u, subscriptionPlan: 'premium' } : null);
      this.saveCurrentUser();
    }
  }

  private loadUsersFromStorage() {
    const usersJson = localStorage.getItem(USERS_KEY);
    if (usersJson) {
      try {
        this._users.set(JSON.parse(usersJson));
      } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        localStorage.removeItem(USERS_KEY);
        this.createDefaultUsers();
      }
    } else {
      this.createDefaultUsers();
    }
  }

  private createDefaultUsers() {
    // Create a default super-admin user and a basic user if none exist
    const defaultUsers: Record<string, User> = {
      'superadmin@clyro.com': {
        id: '1',
        name: 'Admin User',
        email: 'superadmin@clyro.com',
        password: 'ClyroAdmin2024!',
        role: 'super-admin',
        subscriptionPlan: 'premium',
        use2fa: false,
        twoFactorMethod: 'none',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Mock secret
        avatarUrl: 'https://i.pravatar.cc/150?u=superadmin@clyro.com',
        address: '123 Admin Ave, Suite 100, Capital City, 12345',
        phoneNumber: '555-0101',
        status: 'active'
      },
      'user@clyro.com': {
        id: '2',
        name: 'Basic User',
        email: 'user@clyro.com',
        password: 'password123',
        role: 'user',
        subscriptionPlan: 'free',
        use2fa: true,
        twoFactorMethod: 'authenticator',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Mock secret
        avatarUrl: 'https://i.pravatar.cc/150?u=user@clyro.com',
        address: '456 User St, Apt 2B, Townsville, 54321',
        phoneNumber: '555-0102',
        status: 'active'
      }
    };
    this._users.set(defaultUsers);
    this.saveUsersToStorage();
  }

  private saveUsersToStorage() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this._users()));
  }

  private saveCurrentUser() {
    localStorage.setItem(USER_KEY, JSON.stringify(this.user()));
  }

  signup(name: string, email: string, password: string): boolean {
    if (this._users()[email.toLowerCase()]) {
      return false; // User already exists
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      password, // In a real app, hash this!
      role: 'user',
      subscriptionPlan: 'free',
      use2fa: false,
      twoFactorMethod: 'none',
      twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Mock secret
      status: 'active'
    };
    this._users.update(users => ({ ...users, [newUser.email]: newUser }));
    this.saveUsersToStorage();
    this.user.set(newUser);
    this.saveCurrentUser();
    return true;
  }

  login(email: string, password: string): boolean {
    const user = this._users()[email.toLowerCase()];
    if (user && user.password === password) {
      if (user.use2fa) {
        this.pendingLoginUser = { email: user.email, password };
        this.requires2fa.set(true);
        return true;
      }
      this.user.set(user);
      this.saveCurrentUser();
      return true;
    }
    return false;
  }

  async verify2fa(code: string): Promise<boolean> {
    // Mock verification - in a real app, this would use a library like `otplib`
    // For this mock, any 6-digit code starting with '1' is considered valid.
    if (this.pendingLoginUser && code && code.length === 6 && code.startsWith('1')) {
      const user = this._users()[this.pendingLoginUser.email];
      this.user.set(user);
      this.saveCurrentUser();
      this.requires2fa.set(false);
      this.pendingLoginUser = null;
      return true;
    }
    return false;
  }

  getGoogleAuthUsers(): GoogleAuthUser[] {
    return this.googleAuthUsers;
  }

  loginWithGoogle(email: string) {
    // Try to find an existing user
    let user = this._users()[email.toLowerCase()];
    if (!user) {
      // If user doesn't exist, create a new one
      const googleUser = this.googleAuthUsers.find(u => u.email === email);
      if (googleUser) {
        this.signup(googleUser.name, googleUser.email, crypto.randomUUID()); // Random password
        user = this._users()[email.toLowerCase()];
      }
    }

    if (user) {
      // Log in the user (bypassing 2FA for simplicity in Google flow)
      this.user.set(user);
      this.saveCurrentUser();
      this.router.navigate(['/dashboard']);
    } else {
      console.error("Could not log in with Google.");
    }
  }

  logout() {
    this.user.set(null);
    localStorage.removeItem(USER_KEY);
    this.requires2fa.set(false);
    this.pendingLoginUser = null;
    this.router.navigate(['/login']);
  }

  setSubscriptionPlan(plan: SubscriptionPlan) {
    this.user.update(u => u ? { ...u, subscriptionPlan: plan } : null);
    this.saveCurrentUser();
    this.updateUserInMasterList(this.user());
  }

  // Upgrade plan immediately and start new billing cycle
  upgradePlan(plan: SubscriptionPlan, cycle: 'monthly' | 'yearly') {
    this.billingCycleStart.set(new Date());
    this.billingCycle.set(cycle);
    this.scheduledDowngrade.set(null); // Cancel any scheduled downgrade
    this.setSubscriptionPlan(plan);
  }

  // Schedule downgrade to take effect at end of current billing cycle
  scheduleDowngrade(plan: SubscriptionPlan) {
    const endDate = this.getBillingCycleEndDate();
    this.scheduledDowngrade.set({ plan, effectiveDate: endDate });
  }

  // Get the end date of the current billing cycle
  getBillingCycleEndDate(): Date {
    const start = this.billingCycleStart();
    const cycle = this.billingCycle();
    const endDate = new Date(start);
    if (cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    return endDate;
  }

  // Calculate days remaining in current billing cycle
  getDaysRemainingInCycle(): number {
    const endDate = this.getBillingCycleEndDate();
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Get total days in current billing cycle
  getTotalDaysInCycle(): number {
    return this.billingCycle() === 'monthly' ? 30 : 365;
  }

  updateUserProfile(profileData: Partial<User>) {
    this.user.update(u => u ? { ...u, ...profileData } : null);
    this.saveCurrentUser();
    this.updateUserInMasterList(this.user());
  }

  updateUserSettings(settings: { use2fa?: boolean, twoFactorMethod?: TwoFactorMethod, twoFactorSecret?: string }) {
    this.user.update(u => u ? { ...u, ...settings } : null);
    this.saveCurrentUser();
    this.updateUserInMasterList(this.user());
  }

  deleteAccount() {
    const currentUser = this.user();
    if (currentUser) {
      this._users.update(users => {
        const newUsers = { ...users };
        delete newUsers[currentUser.email];
        return newUsers;
      });
      this.saveUsersToStorage();
      this.logout();
    }
  }

  deleteUserByEmail(email: string): boolean {
    const currentUser = this.user();
    if (currentUser && currentUser.email === email) {
      console.error("Admin cannot delete their own account.");
      return false; // Can't delete self
    }

    const userToDelete = this._users()[email];
    if (userToDelete) {
      this._users.update(users => {
        const newUsers = { ...users };
        delete newUsers[email];
        return newUsers;
      });
      this.saveUsersToStorage();
      return true;
    }
    return false; // User not found
  }

  private updateUserInMasterList(updatedUser: User | null) {
    if (updatedUser) {
      this._users.update(users => ({ ...users, [updatedUser.email]: updatedUser }));
      this.saveUsersToStorage();
    }
  }

  // --- Password Reset Flow ---
  requestPasswordReset(email: string): boolean {
    const userExists = !!this._users()[email.toLowerCase()];
    if (userExists) {
      this.pendingResetEmail = email.toLowerCase();
    }
    // In a real app, you would send an email here.
    // We return true if user exists to simulate the email being sent,
    // but the UI message should be generic to prevent email enumeration.
    return userExists;
  }

  getPendingResetEmail(): string | null {
    return this.pendingResetEmail;
  }

  resetPassword(newPassword: string): boolean {
    if (this.pendingResetEmail) {
      const user = this._users()[this.pendingResetEmail];
      if (user) {
        const updatedUser = { ...user, password: newPassword };
        this.updateUserInMasterList(updatedUser);
        this.pendingResetEmail = null;
        return true;
      }
    }
    return false;
  }

  // --- User Blocking ---
  blockUser(email: string, reason: string): boolean {
    const user = this._users()[email.toLowerCase()];
    if (user) {
      const updatedUser: User = {
        ...user,
        status: 'blocked',
        blockReason: reason,
        blockedAt: new Date().toISOString()
      };
      this.updateUserInMasterList(updatedUser);
      return true;
    }
    return false;
  }

  unblockUser(email: string): boolean {
    const user = this._users()[email.toLowerCase()];
    if (user) {
      const updatedUser: User = {
        ...user,
        status: 'active',
        blockReason: undefined,
        blockedAt: undefined
      };
      this.updateUserInMasterList(updatedUser);
      return true;
    }
    return false;
  }

  // --- Role Management ---
  updateUserRole(email: string, role: 'user' | 'admin' | 'super-admin'): boolean {
    const user = this._users()[email.toLowerCase()];
    if (user) {
      const updatedUser: User = { ...user, role };
      this.updateUserInMasterList(updatedUser);
      return true;
    }
    return false;
  }
}
