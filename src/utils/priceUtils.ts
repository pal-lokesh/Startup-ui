/**
 * Utility functions for price parsing and filtering
 */

/**
 * Parse price range string (e.g., "₹5,000 - ₹25,000" or "5000-25000") to get min and max
 * @param priceRange Price range string
 * @returns Object with min and max prices, or null if parsing fails
 */
export function parsePriceRange(priceRange: string): { min: number; max: number } | null {
  if (!priceRange) return null;

  // Remove currency symbols and spaces
  const cleaned = priceRange.replace(/[₹,\s]/g, '');
  
  // Try to match patterns like "5000-25000" or "5000 - 25000" or "5000 to 25000"
  const patterns = [
    /(\d+)\s*-\s*(\d+)/,  // "5000-25000" or "5000 - 25000"
    /(\d+)\s+to\s+(\d+)/i, // "5000 to 25000"
    /(\d+)\s*to\s*(\d+)/i, // "5000to25000"
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      if (!isNaN(min) && !isNaN(max) && min <= max) {
        return { min, max };
      }
    }
  }

  // Try to match single price (e.g., "₹5,000")
  const singlePriceMatch = cleaned.match(/^(\d+)$/);
  if (singlePriceMatch) {
    const price = parseInt(singlePriceMatch[1], 10);
    if (!isNaN(price)) {
      return { min: price, max: price };
    }
  }

  return null;
}

/**
 * Get the minimum price from a price range
 * @param priceRange Price range string
 * @returns Minimum price or 0 if parsing fails
 */
export function getMinPrice(priceRange: string): number {
  const parsed = parsePriceRange(priceRange);
  return parsed ? parsed.min : 0;
}

/**
 * Get the maximum price from a price range
 * @param priceRange Price range string
 * @returns Maximum price or Infinity if parsing fails
 */
export function getMaxPrice(priceRange: string): number {
  const parsed = parsePriceRange(priceRange);
  return parsed ? parsed.max : Infinity;
}

/**
 * Get the average price from a price range (for sorting)
 * @param priceRange Price range string
 * @returns Average price or 0 if parsing fails
 */
export function getAveragePrice(priceRange: string): number {
  const parsed = parsePriceRange(priceRange);
  if (!parsed) return 0;
  return (parsed.min + parsed.max) / 2;
}

/**
 * Check if a price or price range falls within a budget range
 * @param price Single price (for inventory/plates)
 * @param priceRange Price range string (for themes)
 * @param minBudget Minimum budget
 * @param maxBudget Maximum budget
 * @returns true if price/range falls within budget
 */
export function isWithinBudget(
  price: number | undefined,
  priceRange: string | undefined,
  minBudget: number,
  maxBudget: number
): boolean {
  // For single price (inventory/plates)
  if (price !== undefined && priceRange === undefined) {
    return price >= minBudget && price <= maxBudget;
  }

  // For price range (themes)
  if (priceRange) {
    const parsed = parsePriceRange(priceRange);
    if (!parsed) return true; // If can't parse, include it
    // Check if any part of the range overlaps with budget
    return parsed.max >= minBudget && parsed.min <= maxBudget;
  }

  // If no price info, include it
  return true;
}

/**
 * Format price for display
 * @param price Price number
 * @returns Formatted price string with rupee symbol
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

