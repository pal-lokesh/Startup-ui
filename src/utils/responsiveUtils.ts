/**
 * Responsive Utility Functions
 * Provides helper functions for responsive design calculations
 */

// Screen breakpoints (matches theme breakpoints)
export const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1440,
  xxl: 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Calculate responsive value using clamp()
 * @param min Minimum value (in rem or px)
 * @param preferred Preferred value (in vw, vh, or rem)
 * @param max Maximum value (in rem or px)
 * @returns CSS clamp() string
 */
export const clamp = (min: string, preferred: string, max: string): string => {
  return `clamp(${min}, ${preferred}, ${max})`;
};

/**
 * Calculate responsive spacing
 * @param base Base spacing multiplier
 * @returns Responsive spacing string
 */
export const getResponsiveSpacing = (base: number): string => {
  return clamp(`${base * 0.5}rem`, `${base}vw`, `${base * 1.5}rem`);
};

/**
 * Calculate responsive font size
 * @param min Minimum font size (px)
 * @param preferred Preferred font size (vw)
 * @param max Maximum font size (px)
 * @returns Responsive font size string
 */
export const getResponsiveFontSize = (
  min: number,
  preferred: number,
  max: number
): string => {
  return clamp(`${min}px`, `${preferred}vw`, `${max}px`);
};

/**
 * Calculate responsive icon size
 * @param min Minimum size (px)
 * @param max Maximum size (px)
 * @returns Responsive icon size string
 */
export const getResponsiveIconSize = (min: number, max: number): string => {
  const preferred = ((min + max) / 2) * 0.125; // Convert to vw approximation
  return clamp(`${min}px`, `${preferred}vw`, `${max}px`);
};

/**
 * Get responsive padding object for Material-UI sx prop
 * @param base Base padding multiplier
 * @returns Responsive padding object
 */
export const getResponsivePadding = (base: number) => {
  return {
    xs: `${base * 0.5}rem`,
    sm: clamp(`${base * 0.75}rem`, `${base * 1.25}vw`, `${base * 1.25}rem`),
    md: clamp(`${base}rem`, `${base * 1.5}vw`, `${base * 1.5}rem`),
    lg: clamp(`${base * 1.25}rem`, `${base * 2}vw`, `${base * 2}rem`),
  };
};

/**
 * Get responsive margin object for Material-UI sx prop
 * @param base Base margin multiplier
 * @returns Responsive margin object
 */
export const getResponsiveMargin = (base: number) => {
  return {
    xs: `${base * 0.5}rem`,
    sm: clamp(`${base * 0.75}rem`, `${base * 1.25}vw`, `${base * 1.25}rem`),
    md: clamp(`${base}rem`, `${base * 1.5}vw`, `${base * 1.5}rem`),
    lg: clamp(`${base * 1.25}rem`, `${base * 2}vw`, `${base * 2}rem`),
  };
};

/**
 * Get responsive container max width
 * @param breakpoint Breakpoint key
 * @returns Container max width
 */
export const getContainerWidth = (breakpoint: Breakpoint = 'xl'): string => {
  const widths = {
    xs: '100%',
    sm: clamp('480px', '90vw', '768px'),
    md: clamp('768px', '85vw', '1024px'),
    lg: clamp('1024px', '80vw', '1440px'),
    xl: clamp('1440px', '90vw', '1920px'),
    xxl: clamp('1920px', '95vw', '2560px'),
  };
  return widths[breakpoint];
};

/**
 * Calculate device pixel ratio aware sizes
 * @param baseSize Base size in pixels
 * @param scale Scale factor for high-DPI displays
 * @returns Responsive size string
 */
export const getDPRAwareSize = (
  baseSize: number,
  scale: number = 1.5
): string => {
  return `clamp(${baseSize}px, ${baseSize * scale}vw, ${baseSize * scale}px)`;
};

/**
 * Get aspect ratio based on screen size
 * @returns Aspect ratio string for images
 */
export const getResponsiveAspectRatio = (): string => {
  return 'clamp(16 / 9, 100vw / 100vh, 21 / 9)';
};

/**
 * Media query helpers for breakpoints
 */
export const mediaQueries = {
  xs: `@media (min-width: ${BREAKPOINTS.xs}px)`,
  sm: `@media (min-width: ${BREAKPOINTS.sm}px)`,
  md: `@media (min-width: ${BREAKPOINTS.md}px)`,
  lg: `@media (min-width: ${BREAKPOINTS.lg}px)`,
  xl: `@media (min-width: ${BREAKPOINTS.xl}px)`,
  xxl: `@media (min-width: ${BREAKPOINTS.xxl}px)`,
  maxXs: `@media (max-width: ${BREAKPOINTS.sm - 1}px)`,
  maxSm: `@media (max-width: ${BREAKPOINTS.md - 1}px)`,
  maxMd: `@media (max-width: ${BREAKPOINTS.lg - 1}px)`,
  maxLg: `@media (max-width: ${BREAKPOINTS.xl - 1}px)`,
  landscape: `@media (orientation: landscape)`,
  portrait: `@media (orientation: portrait)`,
  highDPI: `@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)`,
};

/**
 * Get responsive grid columns based on breakpoint
 * @param breakpoint Current breakpoint
 * @returns Number of columns
 */
export const getGridColumns = (breakpoint: Breakpoint): number => {
  const columns = {
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    xxl: 5,
  };
  return columns[breakpoint] || 1;
};

