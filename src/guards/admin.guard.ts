import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // This guard runs after authGuard, so user is guaranteed to be non-null.
  const role = authService.user()?.role;
  if (role === 'super-admin' || role === 'admin') {
    return true;
  } else {
    // Redirect to the dashboard if the user is not an admin
    console.warn('Admin access denied. Redirecting to dashboard.');
    return router.parseUrl('/dashboard');
  }
};
