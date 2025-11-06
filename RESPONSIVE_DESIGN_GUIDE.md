# Responsive Design System Guide

This application uses a comprehensive responsive design system that automatically adapts to any screen size, resolution, pixel density, and aspect ratio.

## Features

✅ **Viewport-Based Scaling** - Uses `vw`, `vh`, and `clamp()` for fluid scaling  
✅ **Breakpoint System** - 6 breakpoints (xs: 0px, sm: 480px, md: 768px, lg: 1024px, xl: 1440px, xxl: 1920px)  
✅ **Fluid Typography** - Text scales smoothly across all screen sizes  
✅ **Responsive Spacing** - Margins and paddings adjust dynamically  
✅ **High-DPI Support** - Optimized for Retina and high-resolution displays  
✅ **Orientation Aware** - Adapts to portrait and landscape modes  
✅ **4K/Ultrawide Support** - Scales beautifully on large displays  

## How It Works

### 1. Viewport Meta Tag

The HTML viewport tag is configured for optimal scaling:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
```

### 2. Responsive Theme

The Material-UI theme is configured with:
- Custom breakpoints for major screen sizes
- Fluid typography using `clamp()` functions
- Responsive component overrides
- Dynamic spacing and sizing

**Location:** `src/theme/responsiveTheme.ts`

### 3. Global CSS

Comprehensive CSS file with:
- CSS variables for consistent scaling
- Responsive grid system
- Utility classes
- Image optimization
- High-DPI support

**Location:** `src/styles/responsive.css`

### 4. Utility Functions

Helper functions for responsive calculations:
- `clamp()` - Generate clamp() CSS values
- `getResponsiveSpacing()` - Dynamic spacing
- `getResponsiveFontSize()` - Fluid typography
- `getResponsiveIconSize()` - Scalable icons
- `getContainerWidth()` - Responsive containers

**Location:** `src/utils/responsiveUtils.ts`

### 5. React Hooks

Custom hooks for responsive behavior:
- `useBreakpoint()` - Get current breakpoint
- `useScreenSize()` - Get screen dimensions
- `useIsMobile()` - Check if mobile
- `useIsTablet()` - Check if tablet
- `useIsDesktop()` - Check if desktop
- `useDevicePixelRatio()` - Get DPI
- `useOrientation()` - Get orientation
- `useResponsiveValue()` - Get responsive values

**Location:** `src/hooks/useResponsive.ts`

## Usage Examples

### Using Responsive Theme in Components

```tsx
import { Box, Typography } from '@mui/material';

// Automatic responsive scaling
<Box sx={{ 
  padding: { 
    xs: 'clamp(0.5rem, 2vw, 1rem)', 
    sm: 'clamp(1rem, 2vw, 1.5rem)', 
    md: 'clamp(1.5rem, 3vw, 2rem)' 
  }
}}>
  <Typography variant="h1">Responsive Heading</Typography>
</Box>
```

### Using Utility Functions

```tsx
import { getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsiveUtils';

const spacing = getResponsiveSpacing(2); // Returns clamp(1rem, 2vw, 3rem)
const fontSize = getResponsiveFontSize(14, 1.5, 18); // Returns clamp(14px, 1.5vw, 18px)
```

### Using React Hooks

```tsx
import { useBreakpoint, useIsMobile, useScreenSize } from '../hooks/useResponsive';

function MyComponent() {
  const breakpoint = useBreakpoint();
  const isMobile = useIsMobile();
  const { width, height, aspectRatio } = useScreenSize();
  
  return (
    <Box sx={{
      fontSize: isMobile ? 'clamp(1rem, 3vw, 1.25rem)' : 'clamp(1.25rem, 2vw, 1.5rem)',
      width: width < 768 ? '100%' : '50%'
    }}>
      Content adapts to screen size
    </Box>
  );
}
```

### Using CSS Classes

```tsx
<div className="responsive-container">
  <div className="responsive-grid">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </div>
</div>
```

### Material-UI SX Prop with Breakpoints

```tsx
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 'clamp(0.5rem, 2vw, 1rem)', md: 'clamp(1rem, 2vw, 2rem)' },
  padding: {
    xs: 'clamp(0.5rem, 2vw, 1rem)',
    sm: 'clamp(1rem, 2vw, 1.5rem)',
    md: 'clamp(1.5rem, 3vw, 2rem)',
    lg: 'clamp(2rem, 4vw, 3rem)'
  }
}}>
  Content
</Box>
```

## Breakpoint Reference

| Breakpoint | Min Width | Typical Device |
|------------|-----------|----------------|
| xs         | 0px       | Mobile (portrait) |
| sm         | 480px     | Mobile (landscape) / Small tablets |
| md         | 768px     | Tablets |
| lg         | 1024px    | Desktop / Small laptops |
| xl         | 1440px    | Large desktop / Laptops |
| xxl        | 1920px    | 4K / Ultrawide monitors |

## CSS Variables

The following CSS variables are available globally:

```css
--base-font-size          /* Base font size scaling */
--spacing-xs to --spacing-xxl  /* Responsive spacing */
--container-xs to --container-xl  /* Container widths */
--border-radius-sm/md/lg  /* Border radius values */
--icon-xs to --icon-xl    /* Icon sizes */
```

## Best Practices

1. **Always use `clamp()` for fluid scaling**
   ```tsx
   // ✅ Good
   fontSize: 'clamp(1rem, 2vw, 1.5rem)'
   
   // ❌ Avoid fixed sizes
   fontSize: '16px'
   ```

2. **Use breakpoint objects in Material-UI sx prop**
   ```tsx
   // ✅ Good
   sx={{ padding: { xs: '1rem', md: '2rem' } }}
   
   // ❌ Avoid single values
   sx={{ padding: '1rem' }}
   ```

3. **Prefer viewport units for responsive elements**
   ```tsx
   // ✅ Good
   width: 'clamp(100px, 20vw, 300px)'
   
   // ❌ Avoid percentages only
   width: '50%'
   ```

4. **Use responsive hooks for conditional rendering**
   ```tsx
   // ✅ Good
   const isMobile = useIsMobile();
   return isMobile ? <MobileView /> : <DesktopView />;
   ```

5. **Optimize images for high-DPI displays**
   ```tsx
   <img 
     src="image.jpg" 
     srcSet="image@2x.jpg 2x, image@3x.jpg 3x"
     style={{ maxWidth: '100%', height: 'auto' }}
   />
   ```

## Responsive Grid System

The CSS grid system automatically adjusts columns:

- **Mobile (xs)**: 1 column
- **Small (sm)**: 2 columns
- **Tablet (md)**: 2 columns
- **Desktop (lg)**: 3 columns
- **Large (xl)**: 4 columns
- **Ultrawide (xxl)**: 5 columns

```tsx
<div className="responsive-grid">
  {/* Items automatically arrange based on screen size */}
</div>
```

## Testing Responsive Design

1. **Browser DevTools**
   - Use device emulation
   - Test different screen sizes
   - Check orientation changes

2. **Real Devices**
   - Test on actual phones, tablets, and desktops
   - Check different pixel densities
   - Test various aspect ratios

3. **Screen Sizes to Test**
   - Mobile: 375px, 414px (iPhone sizes)
   - Tablet: 768px, 1024px (iPad sizes)
   - Desktop: 1366px, 1440px, 1920px
   - Ultrawide: 2560px, 3440px

## Troubleshooting

**Text too small on mobile?**
- Increase minimum value in `clamp()`
- Example: `fontSize: 'clamp(14px, 2vw, 18px)'` → `fontSize: 'clamp(16px, 2vw, 18px)'`

**Layout breaks on large screens?**
- Add maximum container width
- Use `maxWidth` with clamp

**Images not scaling?**
- Ensure `maxWidth: '100%'` and `height: 'auto'`
- Use responsive image classes

**Spacing too tight/loose?**
- Adjust CSS variable values
- Or use custom spacing with `getResponsiveSpacing()`

## Performance Considerations

- CSS `clamp()` is hardware-accelerated
- Viewport units (vw, vh) are efficient
- Media queries are cached by browsers
- Responsive images reduce bandwidth

## Browser Support

✅ Chrome/Edge (90+)  
✅ Firefox (88+)  
✅ Safari (14+)  
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Resources

- [CSS clamp() MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [Material-UI Responsive Design](https://mui.com/material-ui/customization/breakpoints/)
- [Viewport Units](https://css-tricks.com/fun-viewport-units/)

