// Node configuration constants
export const NODE_CONFIG = {
  // Default node dimensions (updated to w-60)
  DEFAULT_WIDTH: 240,  // w-60 = 240px
  DEFAULT_HEIGHT: 128, // h-32 = 128px
  
  // Alternative sizes
  COMPACT: {
    width: 192,  // w-48 = 192px
    height: 96,  // h-24 = 96px
  },
  
  LARGE: {
    width: 288,  // w-72 = 288px
    height: 160, // h-40 = 160px
  },
  
  // Responsive breakpoints
  RESPONSIVE: {
    sm: { width: 192, height: 96 },
    md: { width: 240, height: 128 },
    lg: { width: 288, height: 160 },
  }
};

// CSS classes for different node sizes
export const NODE_SIZE_CLASSES = {
  compact: 'w-48 h-24',
  default: 'w-60 h-32',  // Updated default
  large: 'w-72 h-40',
} as const;

export type NodeSize = keyof typeof NODE_SIZE_CLASSES;

// Glow effect classes for different status types
export const NODE_GLOW_CLASSES = {
  uploading: 'shadow-blue-500/40',
  ready: 'shadow-green-500/40',
  error: 'shadow-red-500/40',
  configuring: 'shadow-yellow-500/40',
  empty: 'shadow-gray-400/30',
} as const;
