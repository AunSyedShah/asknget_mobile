/**
 * Design tokens taken from the Figma "Mobile App" page (see the brief).
 * Values marked "inferred" were read from the exported PNGs, not from Figma
 * variables; check them against the Figma file before the design review.
 */

export const colors = {
  brand: '#FF7043',
  brandLight: '#FDA184',
  cream: '#F8F4F0',
  peach: '#FFF2E9',
  ink: '#303030',
  success: '#4CAF50',
  white: '#FFFFFF',
  muted: '#7A7A7A', // inferred
  border: '#E6E0DA', // inferred
  danger: '#D32F2F', // inferred (the red "Remove" link)
} as const;

/** Background behind screens: peach to cream. Inferred stops. */
export const screenGradient = [colors.brandLight, colors.peach, colors.cream] as const;

export const radius = { sm: 6, md: 8, lg: 12, xl: 20 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Poppins for headings and buttons, Geist for body text (inferred from the frames). */
export const fontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
} as const;

/** Body text is 12 to 16 px in the design. */
export const fontSize = { caption: 12, body: 14, bodyLg: 16, title: 20, display: 28 } as const;

export const gutter = 16;
