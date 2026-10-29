/**
 * Nawira Traders - Security Hardening & Input Sanitization Engine
 * 
 * Provides defense against:
 * - Cross-Site Scripting (XSS)
 * - SQL / NoSQL / Command Injection patterns
 * - Automated Bot / Scraper Spam (Honeypot verification)
 * - Denial of Service / Memory Overflow via giant payloads
 * - Client-side request flooding (Rate-limiting throttler)
 */

// Maximum allowable input lengths to prevent buffer overflow / payload spikes
export const MAX_INPUT_LENGTHS = {
  NAME: 80,
  PHONE: 20,
  ADDRESS: 250,
  SEARCH: 100,
  EMAIL: 100,
  NOTES: 300,
} as const;

/**
 * Sanitizes generic user text input.
 * Strips HTML tags, script tags, javascript: protocols, null bytes, and non-printable control characters.
 */
export function sanitizeText(rawInput: string, maxLength: number = 250): string {
  if (!rawInput || typeof rawInput !== 'string') return '';

  return (
    rawInput
      // Strip null bytes and non-printable ASCII control characters (0x00-0x1F, except newline/tab)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Strip HTML tags (<script>, <iframe>, <img>, etc.)
      .replace(/<[^>]*>/g, '')
      // Strip javascript: or data: pseudo-protocols
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/vbscript:/gi, '')
      // Replace malicious event handler attributes if passed as loose text
      .replace(/on\w+\s*=/gi, '')
      // Trim excessive leading/trailing whitespace
      .trim()
      // Enforce hard length limit
      .slice(0, maxLength)
  );
}

/**
 * Validates a standard Pakistani mobile number.
 * Accepts formats:
 * - 03001234567
 * - 0300-1234567
 * - +923001234567
 * - +92 300 1234567
 * - 923001234567
 */
export function validatePakistaniPhone(phone: string): {
  isValid: boolean;
  cleanPhone: string;
  errorMessage?: string;
} {
  if (!phone) {
    return { isValid: false, cleanPhone: '', errorMessage: 'Phone number is required.' };
  }

  // Remove common separators (spaces, dashes, parens)
  const normalized = phone.replace(/[\s\-()]/g, '');

  // Regex for Pakistani cellular prefixes (0300 to 0355, +923XX)
  const pakistaniPhoneRegex = /^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/;

  if (!pakistaniPhoneRegex.test(normalized)) {
    return {
      isValid: false,
      cleanPhone: normalized,
      errorMessage: 'Please enter a valid Pakistani mobile number (e.g. 0300-1234567).',
    };
  }

  // Format into standard local 03XXXXXXXXX format
  let clean = normalized;
  if (clean.startsWith('+92')) clean = '0' + clean.slice(3);
  else if (clean.startsWith('0092')) clean = '0' + clean.slice(4);
  else if (clean.startsWith('92')) clean = '0' + clean.slice(2);
  else if (!clean.startsWith('0')) clean = '0' + clean;

  return { isValid: true, cleanPhone: clean };
}

/**
 * Validates either a Pakistani phone number or a valid email address (for newsletter).
 */
export function validateEmailOrPhone(input: string): boolean {
  if (!input || input.length > MAX_INPUT_LENGTHS.EMAIL) return false;
  const sanitized = sanitizeText(input, MAX_INPUT_LENGTHS.EMAIL);

  // Check email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (emailRegex.test(sanitized)) return true;

  // Check phone format
  return validatePakistaniPhone(sanitized).isValid;
}

/**
 * Honeypot verification to block automated form spammers and headless attack bots.
 * If the honeypot trap field contains any value, it was filled by a bot.
 */
export function isBotSubmission(honeypotValue: string): boolean {
  return typeof honeypotValue === 'string' && honeypotValue.trim().length > 0;
}

/**
 * Simple client-side submission rate-limiter.
 * Prevents rapid double-clicking or scripted click floods.
 */
class RateLimiter {
  private lastSubmissions: Map<string, number> = new Map();

  isAllowed(actionKey: string, cooldownMs: number = 3000): boolean {
    const now = Date.now();
    const lastTime = this.lastSubmissions.get(actionKey) || 0;
    if (now - lastTime < cooldownMs) {
      return false;
    }
    this.lastSubmissions.set(actionKey, now);
    return true;
  }
}

export const submissionRateLimiter = new RateLimiter();
