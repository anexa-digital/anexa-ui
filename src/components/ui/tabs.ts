// Tabs of every screen look the same: a bar with a visible base line and the chosen tab underlined in the accent.
// Each screen keeps its own elements (a Link when the tab lives in the URL, a button otherwise).
export const tabBarClass = "flex flex-wrap gap-0.5 border-b border-[var(--line-strong)]";

export const tabClass = (active: boolean) =>
  `-mb-px h-8 border-b-2 px-3 whitespace-nowrap ${active ? "border-[var(--accent)] font-medium text-[var(--ink)]" : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`;
