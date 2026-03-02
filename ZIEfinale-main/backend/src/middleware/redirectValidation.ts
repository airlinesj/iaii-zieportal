import { Request, Response, NextFunction } from 'express';
import { RedirectValidationService } from '../services/RedirectValidationService';

/**
 * Middleware to validate redirect URLs
 * Prevents open redirect vulnerabilities by validating against allowlist
 */
export const validateRedirectUrl = (req: Request, res: Response, next: NextFunction) => {
  // Check for common redirect URL parameters
  const redirectUrl = req.query.redirect || req.query.returnUrl || req.query.return_url || req.body.redirectUrl;

  if (redirectUrl && typeof redirectUrl === 'string') {
    if (!RedirectValidationService.isValidRedirect(redirectUrl)) {
      console.warn('🚫 Invalid redirect URL attempted:', redirectUrl);
      return res.status(400).json({
        message: 'Invalid redirect URL',
        error: 'The specified redirect URL is not allowed'
      });
    }
  }

  next();
};

/**
 * Express middleware to add validated redirect helper to response object
 */
export const addRedirectHelper = (req: Request, res: Response, next: NextFunction) => {
  // Add helper method to response object for safe redirects
  (res as any).safeRedirect = function(url: string, statusCode: number = 302) {
    if (RedirectValidationService.isValidRedirect(url)) {
      return this.redirect(statusCode, url);
    } else {
      console.warn('🚫 Attempted unsafe redirect:', url);
      return this.status(400).json({
        message: 'Invalid redirect URL',
        error: 'The specified redirect URL is not allowed'
      });
    }
  };

  next();
};

/**
 * Extend Express Response type to include safeRedirect method
 */
declare module 'express-serve-static-core' {
  interface Response {
    safeRedirect(url: string, statusCode?: number): Response;
  }
}
