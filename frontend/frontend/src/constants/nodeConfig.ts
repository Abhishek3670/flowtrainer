// Node configuration constants
export const NODE_CONFIG = {
  // Default node dimensions
  DEFAULT_WIDTH: 192,  // w-48 = 192px
  DEFAULT_HEIGHT: 128, // h-32 = 128px
  
  // Alternative sizes
  COMPACT: {
    width: 160,  // w-40 = 160px
    height: 96,  // h-24 = 96px
  },
  
  LARGE: {
    width: 224,  // w-56 = 224px
    height: 160, // h-40 = 160px
  },
  
  // Responsive breakpoints
  RESPONSIVE: {
    sm: { width: 160, height: 96 },
    md: { width: 192, height: 128 },
    lg: { width: 224, height: 160 },
  }
};

// CSS classes for different node sizes
export const NODE_SIZE_CLASSES = {
  default: 'w-48 h-32',
  compact: 'w-40 h-24',
  large: 'w-56 h-40',
} as const;

export type NodeSize = keyof typeof NODE_SIZE_CLASSES;
