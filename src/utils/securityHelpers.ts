import { SecurityConfig } from '../types';

export const DEFAULT_ADMIN_PASSWORD = 'sunil2026';
export const DEFAULT_ADMIN_SALT = 'sntc_default_salt_2026';

export function generateRandomSalt(byteLength = 12): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Deterministic fallback digest if crypto.subtle is unavailable
function fallbackDigestHex(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h1 >>> 0).toString(16).padStart(8, '0');
  return `fb_${part1}${part2}`;
}

export async function hashSecret(secret: string, salt: string): Promise<string> {
  const payload = `${salt}::${secret}`;
  try {
    if (
      typeof crypto !== 'undefined' &&
      crypto.subtle &&
      typeof TextEncoder !== 'undefined'
    ) {
      const data = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback below
  }
  return fallbackDigestHex(payload);
}

export async function verifySecret(
  candidate: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  if (!expectedHash) {
    return candidate === DEFAULT_ADMIN_PASSWORD;
  }
  const computed = await hashSecret(candidate, salt);
  return computed === expectedHash;
}

export function generateSixDigitOtp(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const num = 100000 + (arr[0] % 900000);
    return String(num);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '******';
  return `+91 ******${digits.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  const local = parts[0];
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${parts[1]}`;
}

export function evaluatePasswordStrength(password: string): {
  score: number;
  label: 'Too Short' | 'Fair' | 'Strong' | 'Very Strong';
  barColor: string;
  textColor: string;
} {
  if (password.length < 4) {
    return {
      score: 1,
      label: 'Too Short',
      barColor: 'bg-rose-500',
      textColor: 'text-rose-700'
    };
  }
  let pts = 1;
  if (password.length >= 6) pts++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) pts++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) pts++;

  if (pts <= 1) {
    return {
      score: 1,
      label: 'Too Short',
      barColor: 'bg-rose-500',
      textColor: 'text-rose-700'
    };
  }
  if (pts === 2) {
    return {
      score: 2,
      label: 'Fair',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-700'
    };
  }
  if (pts === 3) {
    return {
      score: 3,
      label: 'Strong',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-700'
    };
  }
  return {
    score: 4,
    label: 'Very Strong',
    barColor: 'bg-emerald-700',
    textColor: 'text-emerald-800'
  };
}

export function createInitialSecurityConfig(
  phoneDisplay: string,
  email: string
): SecurityConfig {
  return {
    adminAuthMode: 'password_or_otp',
    adminPasswordHash: '',
    adminPasswordSalt: DEFAULT_ADMIN_SALT,
    adminOtpPhone: phoneDisplay || '+91 91234 56789',
    adminOtpEmail: email || 'director@sunilnidhicoaching.in',
    requireStudentAuth: true,
    allowStudentPasswordLogin: true,
    allowStudentOtpLogin: true,
    showDemoLoginHelpers: true,
    sessionTimeoutMinutes: 30
  };
}
