import type { ReactNode } from "react";

// The app's own icons: thin strokes in currentColor on a 24-unit grid, so they take the color and size of their place.
// Few and drawn here (no icon library to install and keep up to date); add one as a new entry of PATHS.
const PATHS = {
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  keyboard: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),
  chart: <path d="M4 19V5M4 19h16M8 15l4-5 3 3 5-7" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.6c2 .6 3.2 2.3 3.5 5.4" />
    </>
  ),
  folder: <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </>
  ),
  approval: (
    <>
      <path d="M12 3l2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.2L12 21l-2.4-1.8-3 .2-.9-2.9-2.4-1.8 1-2.8-1-2.8 2.4-1.8.9-2.9 3 .2z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  tasks: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M8.5 11l2 2 4-4M8.5 17h7" />
    </>
  ),
  unassigned: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20c.8-3.5 3.4-5.5 6.5-5.5 1.4 0 2.7.4 3.7 1.1M17 14.5a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9v.4M19 20.5v.01" />
    </>
  ),
  authorize: (
    <>
      <path d="M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  messages: (
    <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  quotes: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 15.5h6M9 8.5h2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16M8 14h2M12 14h2M8 17h2" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8 4v10l-8 4-8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10M8 5l8 4" />
    </>
  ),
  artwork: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4" />
    </>
  ),
  overdue: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9v4.5l2.5 1.5M9.5 2.5h5M19 5.5l1.5 1.5" />
    </>
  ),
  index: (
    <>
      <path d="M4 18a8 8 0 0 1 16 0" />
      <path d="M12 18l-4-5M6.5 13.5l-1-.8M12 10V9M17.5 13.5l1-.8" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6M15.5 15.5l3 3M18.5 15.5l-3 3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </>
  ),
  running: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v4h-4M9 12l2 2 4-4" />
    </>
  ),
  parity: (
    <>
      <path d="M12 4v16M7 20h10M5 8h14" />
      <path d="M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z" />
    </>
  ),
  // Cost models and what they hold.
  model: (
    <>
      <path d="M12 3l8 4.5-8 4.5-8-4.5z" />
      <path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" />
    </>
  ),
  concept: <path d="M17 5H7l5 7-5 7h10" />,
  tariff: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M4 15h16M10 4v16" />
    </>
  ),
  parameter: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="currentColor" />
      <circle cx="15" cy="12" r="2" fill="currentColor" />
      <circle cx="8" cy="17" r="2" fill="currentColor" />
    </>
  ),
  rate: (
    <>
      <path d="M4 8h13M14 5l3 3-3 3" />
      <path d="M20 16H7M10 13l-3 3 3 3" />
    </>
  ),
  draft: (
    <>
      <path d="M4 20l4.5-1L19 8.5a2.1 2.1 0 0 0-3-3L5.5 16z" />
      <path d="M14 7l3 3" />
    </>
  ),
  golden: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />,
  inForce: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  machine: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5l1.6 2.3 2.7-.7.7 2.7 2.7.7-.7 2.7 2.3 1.6-2.3 1.6.7 2.7-2.7.7-.7 2.7-2.7-.7L12 21.5l-1.6-2.3-2.7.7-.7-2.7-2.7-.7.7-2.7L2.5 12l2.3-1.6-.7-2.7 2.7-.7.7-2.7 2.7.7z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name]}
    </svg>
  );
}

/** The same icon placed inside another SVG (a diagram): a nested <svg> at x, y with the given size. */
export function IconGlyph({ name, x, y, size = 16 }: { name: IconName; x: number; y: number; size?: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}
