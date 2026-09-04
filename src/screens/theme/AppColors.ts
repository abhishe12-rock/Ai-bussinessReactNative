/**
 * ROYAL PURPLE MODERN DESIGN SYSTEM
 * Accurately matching the reference mobile UI mockup.
 */

export const AppColors = {
  // Canvas & Surfaces
  background: '#F6F8FC',       // Clean, modern light slate canvas
  surface: '#FFFFFF',          // Crisp pure white card surface
  surfaceElevated: '#FFFFFF',
  surfaceSoft: '#F1F4F9',      // Subtle elevated fill & pill containers
  surfaceInput: '#FFFFFF',     // Clean white input fields
  surfaceTint: '#EEECFE',      // Translucent primary tint

  // Hairline Borders & Dividers
  border: '#EAEFF5',           // Soft divider & card border
  borderSubtle: '#F1F5F9',     // Ultra-light inner border
  borderFocus: '#5B4DF8',      // Active focus border
  borderAccent: '#C7D2FE',

  // Modern Typography Hierarchy
  textPrimary: '#1E1B4B',      // Deep royal navy for sharp contrast
  textSecondary: '#64748B',    // Balanced slate body
  textMuted: '#94A3B8',        // Refined captions, metadata & placeholders
  textInverse: '#FFFFFF',      // White text on primary buttons & banners

  // Core Brand: Royal Indigo-Purple from the mockup
  primary: '#5B4DF8',          // Vibrant Royal Purple
  primaryLight: '#7C6EF8',     // Light purple
  primaryDark: '#4535D9',      // Pressed state
  primarySoft: '#EEECFE',      // Soft purple badge / avatar background
  primaryGradientStart: '#5B4DF8',
  primaryGradientMid: '#6B58F9',
  primaryGradientEnd: '#7C3AED',

  secondary: '#3B82F6',        // Electric Blue
  secondarySoft: '#EFF6FF',

  // Module Accent Spectrum (matches mockup icons)
  accentAi: '#8B5CF6',         // Violet
  accentAiSoft: '#F5F3FF',

  accentSales: '#10B981',      // Emerald Mint
  accentSalesSoft: '#ECFDF5',

  accentInventory: '#0EA5E9',  // Sky Blue / Cyan
  accentInventorySoft: '#F0F9FF',

  accentFinance: '#F59E0B',    // Amber
  accentFinanceSoft: '#FFFBEB',

  accentOrders: '#F97316',     // Coral Orange
  accentOrdersSoft: '#FFF7ED',

  accentRepairs: '#8B5CF6',    // Purple
  accentRepairsSoft: '#F5F3FF',

  accentEmployee: '#6366F1',   // Indigo
  accentEmployeeSoft: '#EEF2FF',

  // Compatibility aliases
  teal: '#0EA5E9',
  tealSoft: '#F0F9FF',
  violet: '#7C3AED',
  violetSoft: '#F5F3FF',

  // Semantic Status Tones (matching mockup badges)
  success: '#10B981',          // Active / Paid green
  successSoft: '#ECFDF5',
  warning: '#F59E0B',          // Pending / Due amber
  warningSoft: '#FFFBEB',
  danger: '#EF4444',           // Inactive / Unpaid red
  dangerSoft: '#FEF2F2',
  error: '#EF4444',
  errorSoft: '#FEF2F2',
  info: '#3B82F6',             // Processing blue
  infoSoft: '#EFF6FF',

  // Pastel Avatar Colors from Mockup
  pastelPink: '#FEE2E2',
  pastelPinkText: '#EF4444',
  pastelBlue: '#E0E7FF',
  pastelBlueText: '#4F46E5',
  pastelAmber: '#FEF3C7',
  pastelAmberText: '#D97706',
  pastelPurple: '#EDE9FE',
  pastelPurpleText: '#7C3AED',
  pastelEmerald: '#D1FAE5',
  pastelEmeraldText: '#059669',

  // Universal Constants
  white: '#FFFFFF',
  black: '#000000',
  card: '#FFFFFF',
  input: '#FFFFFF',
};

export const AppRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const AppShadows = {
  subtle: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  glow: {
    shadowColor: '#5B4DF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  glowViolet: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  glowCyan: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  glowSuccess: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
};