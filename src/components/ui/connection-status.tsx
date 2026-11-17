import type { ReactNode } from "react";

import { t } from "../../i18n";
import { Icon, type IconName } from "./icons";
import { Tooltip } from "./tooltip";

// Small, always-visible states for a status bar: the link to the server, and each device a workplace depends on.
// Color plus a word, never color alone.

export type LinkState = "online" | "reconnecting" | "offline";

const LINK_KEY: Record<LinkState, string> = { online: "connection.online", reconnecting: "connection.reconnecting", offline: "connection.offline" };
const LINK_COLOR: Record<LinkState, string> = { online: "text-[var(--ok)]", reconnecting: "text-[var(--warn)]", offline: "text-[var(--bad)]" };

/** How a link's state follows from its last answers: one failure is a hiccup, several in a row are an outage. */
export function linkStateOf(failures: number, offlineAfter = 3): LinkState {
  if (failures <= 0) return "online";
  return failures >= offlineAfter ? "offline" : "reconnecting";
}

/**
 * The link to the server and, where the app works ahead of it, how much is waiting to be sent. `pending` counts
 * what is stored locally and not yet confirmed; zero hides it.
 */
export function ConnectionStatus({ state, pending = 0, label, className = "" }: { state: LinkState; pending?: number; label?: string; className?: string }) {
  const text = label ?? t(LINK_KEY[state]);
  return (
    <span role="status" data-state={state} className={`inline-flex items-center gap-1.5 whitespace-nowrap ${LINK_COLOR[state]} ${className}`}>
      <i aria-hidden className="led" />
      <span className="text-[var(--ink)]">{text}</span>
      {pending > 0 && <span className="num text-[var(--muted)]">· {t("connection.pending", { count: pending })}</span>}
    </span>
  );
}

export type DeviceState = "ready" | "busy" | "attention" | "down" | "off";

const DEVICE_KEY: Record<DeviceState, string> = { ready: "device.ready", busy: "device.busy", attention: "device.attention", down: "device.down", off: "device.off" };
const DEVICE_COLOR: Record<DeviceState, string> = {
  ready: "text-[var(--ok)]",
  busy: "text-[var(--accent)]",
  attention: "text-[var(--warn)]",
  down: "text-[var(--bad)]",
  off: "text-[var(--muted)]",
};

/**
 * One device of the workplace (a printer, a scale, a reader) with its state. The detail (the last error, the
 * queue) opens on hover and on focus, so it is reachable by keyboard.
 */
export function DeviceStatus({
  name,
  state,
  icon,
  detail,
  stateLabel,
  className = "",
}: {
  name: string;
  state: DeviceState;
  icon?: IconName;
  detail?: ReactNode;
  /** The app's own word for the state when the generic one does not say enough («Sin papel»). */
  stateLabel?: string;
  className?: string;
}) {
  const word = stateLabel ?? t(DEVICE_KEY[state]);
  const chip = (
    <span
      tabIndex={detail ? 0 : undefined}
      data-state={state}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] ${DEVICE_COLOR[state]} ${className}`}
    >
      {icon ? <Icon name={icon} className="h-3.5 w-3.5" /> : <i aria-hidden className="led" />}
      <span className="text-[var(--ink)]">{name}</span>
      <span className="text-[var(--muted)]">{word}</span>
    </span>
  );
  return detail ? (
    <Tooltip text={detail} placement="top">
      {chip}
    </Tooltip>
  ) : (
    chip
  );
}
