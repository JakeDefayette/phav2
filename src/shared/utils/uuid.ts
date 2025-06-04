/**
 * Cross-platform UUID generator that works in both browser and Node.js environments
 */

/**
 * Generate a UUID v4 string
 * Uses crypto.randomUUID() in Node.js or crypto.getRandomValues() in browsers
 */
export function generateUUID(): string {
  // Check if we're in a Node.js environment
  if (
    typeof window === 'undefined' &&
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  // Browser environment - use crypto.getRandomValues()
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    // Generate random bytes
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

    // Convert to hex string with dashes
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-');
  }

  // Fallback for environments without crypto support
  // This is less secure but will work everywhere
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Export as default for convenience
export default generateUUID;
