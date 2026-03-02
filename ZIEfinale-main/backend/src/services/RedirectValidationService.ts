import { URL } from 'url';

/**
 * Service for validating redirect URLs against a whitelist
 * Prevents open redirect vulnerabilities
 */
export class RedirectValidationService {
  // List of allowed redirect domains/patterns
  private static allowedRedirects: Set<string> = new Set();

  /**
   * Initialize the redirect allowlist from environment configuration
   */
  static initialize(): void {
    const allowedOrigins = [
      process.env.PRODUCTION_DOMAIN || 'https://zie.co.zw',
      process.env.FRONTEND_URL || 'http://localhost:4200',
      ...(process.env.ADDITIONAL_ALLOWED_REDIRECTS
        ? process.env.ADDITIONAL_ALLOWED_REDIRECTS.split(',').map(s => s.trim())
        : [])
    ].filter(Boolean);

    this.allowedRedirects.clear();
    allowedOrigins.forEach(origin => this.allowedRedirects.add(origin));

    console.log('✓ Redirect validation initialized with domains:', Array.from(this.allowedRedirects));
  }

  /**
   * Validate a redirect URL
   * @param redirectUrl - URL to validate
   * @returns true if URL is allowed, false otherwise
   */
  static isValidRedirect(redirectUrl: string): boolean {
    if (!redirectUrl) {
      return false;
    }

    // Trim whitespace
    redirectUrl = redirectUrl.trim();

    // Reject protocol-relative URLs and data: URIs
    if (redirectUrl.startsWith('//') || redirectUrl.startsWith('data:') || redirectUrl.startsWith('javascript:')) {
      console.warn('🚫 Invalid protocol in redirect URL:', redirectUrl);
      return false;
    }

    // Allow relative URLs (internal redirects)
    if (redirectUrl.startsWith('/')) {
      return true;
    }

    try {
      const url = new URL(redirectUrl);
      
      // Check if origin is in allowlist
      const origin = url.origin;
      const isAllowed = this.allowedRedirects.has(origin);
      
      if (!isAllowed) {
        console.warn('🚫 Redirect domain not in allowlist:', origin);
      }
      
      return isAllowed;
    } catch (error) {
      console.warn('🚫 Invalid redirect URL format:', redirectUrl);
      return false;
    }
  }

  /**
   * Get a validated redirect URL or fallback to default
   * @param redirectUrl - URL to validate
   * @param defaultUrl - Fallback URL if validation fails
   * @returns Validated URL or default
   */
  static getValidatedRedirect(redirectUrl: string, defaultUrl: string = '/'): string {
    return this.isValidRedirect(redirectUrl) ? redirectUrl : defaultUrl;
  }

  /**
   * Add a domain to the allowlist
   * @param domain - Domain to add (e.g., 'https://example.com')
   */
  static addAllowedDomain(domain: string): void {
    this.allowedRedirects.add(domain);
    console.log('✓ Added domain to redirect allowlist:', domain);
  }

  /**
   * Remove a domain from the allowlist
   * @param domain - Domain to remove
   */
  static removeAllowedDomain(domain: string): void {
    this.allowedRedirects.delete(domain);
    console.log('✓ Removed domain from redirect allowlist:', domain);
  }

  /**
   * Get all allowed domains
   */
  static getAllowedDomains(): string[] {
    return Array.from(this.allowedRedirects);
  }
}

// Initialize on module load
RedirectValidationService.initialize();
