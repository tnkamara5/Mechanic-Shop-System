// Utility functions for cleaning and validating user input

export const cleanMileage = (input: string): number | null => {
  if (!input || typeof input !== 'string') return null;

  // Remove whitespace
  let cleaned = input.trim();

  // Handle "k" or "K" suffix (e.g., "110k" becomes "110000")
  if (cleaned.toLowerCase().endsWith('k')) {
    const numberPart = cleaned.slice(0, -1).trim();
    const parsed = parseFloat(numberPart.replace(/[,\s]/g, ''));
    return isNaN(parsed) ? null : Math.round(parsed * 1000);
  }

  // Remove commas and spaces
  cleaned = cleaned.replace(/[,\s]/g, '');

  // Parse as number
  const parsed = parseFloat(cleaned);

  // Validate range (reasonable mileage: 0 to 999,999)
  if (isNaN(parsed) || parsed < 0 || parsed > 999999) {
    return null;
  }

  return Math.round(parsed);
};

export const formatMileage = (mileage: number): string => {
  return mileage.toLocaleString();
};

export const cleanPhoneNumber = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Handle various formats:
  // (555) 123-4567 -> 5551234567
  // 555-123-4567 -> 5551234567
  // +1 555 123 4567 -> 5551234567

  // Remove leading 1 if it exists (US country code)
  const cleaned = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;

  return cleaned;
};

export const formatPhoneNumber = (phone: string): string => {
  // Format as (XXX) XXX-XXXX
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
};

export const cleanVin = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  // Remove spaces and convert to uppercase
  let cleaned = input.replace(/\s/g, '').toUpperCase();

  // Remove invalid characters (VINs don't contain I, O, Q)
  cleaned = cleaned.replace(/[^A-HJ-NPR-Z0-9]/g, '');

  return cleaned;
};

export const validateVin = (vin: string): boolean => {
  if (!vin || vin.length !== 17) return false;

  // VINs cannot contain I, O, or Q
  const forbiddenChars = /[IOQ]/;
  if (forbiddenChars.test(vin)) return false;

  // Must be alphanumeric
  const validChars = /^[A-HJ-NPR-Z0-9]+$/;
  return validChars.test(vin);
};

export const cleanYear = (input: string): number | null => {
  if (!input || typeof input !== 'string') return null;

  const cleaned = input.trim();
  const parsed = parseInt(cleaned, 10);

  const currentYear = new Date().getFullYear();

  // Handle 2-digit years (convert to 4-digit)
  if (parsed >= 0 && parsed <= 99) {
    // Assume 00-30 is 2000-2030, 31-99 is 1931-1999
    const fullYear = parsed <= 30 ? 2000 + parsed : 1900 + parsed;
    return fullYear >= 1900 && fullYear <= currentYear + 1 ? fullYear : null;
  }

  // 4-digit years
  if (parsed >= 1900 && parsed <= currentYear + 1) {
    return parsed;
  }

  return null;
};