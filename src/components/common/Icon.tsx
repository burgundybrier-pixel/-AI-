// A의 app.js icon() 함수를 그대로 옮긴 SVG 아이콘

const PATHS = {
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>),
  bell: (<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>),
  bag: (<><path d="M6 8h12l1 13H5L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>),
  heart: (<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" />),
  home: (<><path d="m3 11 9-8 9 8v10H3V11Z" /><path d="M9 21v-6h6v6" /></>),
  user: (<><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  back: (<path d="m15 18-6-6 6-6" />),
  sliders: (<><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="1.7" fill="white" /><circle cx="15" cy="12" r="1.7" fill="white" /><circle cx="10" cy="18" r="1.7" fill="white" /></>),
  chevron: (<path d="m9 18 6-6-6-6" />),
  spark: (<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" />),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 25 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}
