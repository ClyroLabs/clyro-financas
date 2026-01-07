import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // This guard runs after authGuard, so user is guaranteed to be non-null.
  if (authService.isPremium()) {
    return true;
  } else {
    // Redirect to the pricing page if the user is not a premium subscriber
    return router.parseUrl('/pricing');
  }
};
