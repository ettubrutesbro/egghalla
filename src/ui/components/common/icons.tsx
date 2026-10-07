import type { SVGProps } from 'react';

/* Inline stroke icons; they inherit currentColor. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Svg = ({ size = 24, children, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const PlayIcon = (p: IconProps) => (
  <Svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 9h6" /><path d="M9 13h4" /></Svg>
);
export const LibraryIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></Svg>
);
export const InfoIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Svg>
);
export const ThumbDownIcon = (p: IconProps) => (
  <Svg {...p}><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" /></Svg>
);
export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg fill={filled ? 'currentColor' : 'none'} {...p}><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></Svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Svg size={20} strokeWidth="2.2" {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg size={22} strokeWidth="2.2" {...p}><path d="m15 18-6-6 6-6" /></Svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Svg size={20} {...p}><path d="m9 18 6-6-6-6" /></Svg>
);
export const SearchIcon = (p: IconProps) => (
  <Svg size={20} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
);
