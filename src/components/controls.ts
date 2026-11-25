// Compact controls of every screen, the customer portal's included: class names only, nothing else to import.
// Heights, radii and borders come from the skin's tokens (styles/base.css), so one class fits every skin and density.
// Fields and buttons stand on their own ground, with a border that is seen (--line-strong, 3:1 on the surface).
export const inputClass = "h-[var(--control-h)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--field)] px-2 disabled:opacity-60";
export const buttonClass = "h-[var(--control-h)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--raised)] px-2 disabled:opacity-50";
export const primaryClass = "h-[var(--control-h)] rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 font-medium text-[var(--on-accent)] disabled:opacity-50";
export const dangerClass = "h-[var(--control-h)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--raised)] px-2 text-[var(--bad)] disabled:opacity-50";
// Filters and pickers in a toolbar: a field's look at a button's height.
export const selectClass = "h-[var(--control-h)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--field)] px-1 disabled:opacity-60";
// A square button that holds one icon or glyph (close, move, pin), at the small control height.
export const iconButtonClass = "flex h-[var(--control-h-sm)] w-[var(--control-h-sm)] items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-30";
// A clock (`<input type="time">`), in the figures' face. Its width follows the font: 11 characters («12:30 p. m.», the
// longest a browser writes) plus the field's padding and the browser's clock button. A width in px clips «PM» as
// soon as the font or the control grows (another skin, a phone).
export const timeInputClass = `${inputClass} num w-[calc(11ch+3.5rem)] shrink-0`;
