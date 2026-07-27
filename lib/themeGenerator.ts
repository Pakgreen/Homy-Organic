import { siteConfig } from '@/config/site.config';

/**
 * Generate dynamic CSS from site config
 * This ensures all theme colors come from config, not hardcoded
 */
export function generateThemeCSS(): string {
  const theme = siteConfig.theme;
  
  // Extract color names from Tailwind classes
  const getPrimaryColor = () => {
    const primary = theme.primary.bg;
    if (primary.includes('blue-600')) return '#2563eb';
    if (primary.includes('black')) return '#000000';
    if (primary.includes('red-600')) return '#dc2626';
    if (primary.includes('green-600')) return '#16a34a';
    if (primary.includes('pink-600')) return '#db2777';
    if (primary.includes('purple-600')) return '#7c3aed';
    return '#2563eb';
  };

  const getPrimaryDark = () => {
    const primary = theme.primary.bg;
    if (primary.includes('blue-600')) return '#1d4ed8';
    if (primary.includes('black')) return '#1f2937';
    if (primary.includes('red-600')) return '#b91c1c';
    if (primary.includes('green-600')) return '#15803d';
    if (primary.includes('pink-600')) return '#be185d';
    if (primary.includes('purple-600')) return '#6d28d9';
    return '#1d4ed8';
  };

  return `
    :root {
      --primary-color: ${getPrimaryColor()};
      --primary-color-dark: ${getPrimaryDark()};
    }

    .btn-primary {
      background-color: var(--primary-color) !important;
      color: white !important;
    }

    .btn-primary:hover {
      background-color: var(--primary-color-dark) !important;
    }

    .input:focus {
      border-color: var(--primary-color) !important;
      ring-color: var(--primary-color) !important;
    }
  `;
}
