import { useState, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { BREAKPOINTS, Breakpoint } from '../utils/responsiveUtils';

/**
 * Custom hook to get current breakpoint
 * @returns Current breakpoint key
 */
export const useBreakpoint = (): Breakpoint => {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const sm = useMediaQuery(theme.breakpoints.only('sm'));
  const md = useMediaQuery(theme.breakpoints.only('md'));
  const lg = useMediaQuery(theme.breakpoints.only('lg'));
  const xl = useMediaQuery(theme.breakpoints.up('xl'));

  if (xl) return 'xxl';
  if (lg) return 'xl';
  if (md) return 'lg';
  if (sm) return 'md';
  if (xs) return 'sm';
  return 'xs';
};

/**
 * Custom hook to get screen dimensions
 * @returns Object with width, height, and aspect ratio
 */
export const useScreenSize = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    aspectRatio: typeof window !== 'undefined' 
      ? window.innerWidth / window.innerHeight 
      : 1,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        aspectRatio: window.innerWidth / window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
};

/**
 * Custom hook to check if device is mobile
 * @returns Boolean indicating if screen is mobile
 */
export const useIsMobile = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};

/**
 * Custom hook to check if device is tablet
 * @returns Boolean indicating if screen is tablet
 */
export const useIsTablet = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('md', 'lg'));
};

/**
 * Custom hook to check if device is desktop
 * @returns Boolean indicating if screen is desktop
 */
export const useIsDesktop = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('lg'));
};

/**
 * Custom hook to get device pixel ratio
 * @returns Device pixel ratio
 */
export const useDevicePixelRatio = (): number => {
  const [dpr, setDpr] = useState(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDpr(window.devicePixelRatio || 1);
    }
  }, []);

  return dpr;
};

/**
 * Custom hook to check orientation
 * @returns 'landscape' | 'portrait'
 */
export const useOrientation = (): 'landscape' | 'portrait' => {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight
      ? 'landscape'
      : 'portrait'
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
};

/**
 * Custom hook to get responsive values based on breakpoint
 * @param values Object with breakpoint keys and corresponding values
 * @returns Value for current breakpoint
 */
export const useResponsiveValue = <T,>(
  values: Partial<Record<Breakpoint, T>> & { default: T }
): T => {
  const breakpoint = useBreakpoint();
  return values[breakpoint] ?? values.default;
};

