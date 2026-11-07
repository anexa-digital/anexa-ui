import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { lookup, t } from "../i18n";
import type { Liveness, Readiness } from "../lib/api";
import { Dialog } from "./ui/dialog";

const HEALTH_REFRESH = 30_000;

/** How the app reads its API's health; readiness answers even when the database is down. */
export type HealthSource = { liveness: () => Promise<Liveness>; readiness: () => Promise<Readiness> };

// Same keys as a system panel of Inicio would use: one request serves both.
const useLiveness = (health: HealthSource) => useQuery({ queryKey: ["health"], queryFn: () => health.liveness(), refetchInterval: HEALTH_REFRESH });
const useReadiness = (health: HealthSource) => useQuery({ queryKey: ["health", "ready"], queryFn: () => health.readiness(), refetchInterval: HEALTH_REFRESH });

const DATABASE_LABEL: Record<Readiness["database"], string> = {
  ok: "system.ok",
  unavailable: "system.unavailable",
  not_migrated: "system.notMigrated",
};

// The deployment, told apart at a glance: production stays quiet, the others stand out.
const DEPLOYMENT_TONE: Record<string, string> = {
  prod: "border-[var(--line-strong)] text-[var(--ink)]",
  production: "border-[var(--line-strong)] text-[var(--ink)]",
  staging: "border-[var(--warn)] bg-[var(--warn-soft)] text-[var(--warn)]",
  test: "border-[var(--accent-2)] text-[var(--accent-2)]",
  dev: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]",
  local: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]",
};

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) {
  const color = tone === "ok" ? "text-[var(--ok)]" : tone === "bad" ? "text-[var(--bad)]" : "";
  return (
    <div className="flex justify-between gap-8 border-b border-[var(--line)] py-1.5 last:border-b-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}

/** API, database, schema, version and deployment of the running system: a panel and the status bar's dialog. */
export function SystemRows({ health }: { health: HealthSource }) {
  const liveness = useLiveness(health);
  const readiness = useReadiness(health);
  if (liveness.isPending) return <p className="text-[var(--muted)]">{t("system.loading")}</p>;
  if (liveness.isError) return <p className="text-[var(--bad)]">{t("system.apiUnreachable")}</p>;
  return (
    <div>
      <Row label={t("system.api")} value={t("system.ok")} tone="ok" />
      <Row
        label={t("system.database")}
        value={readiness.data ? t(DATABASE_LABEL[readiness.data.database]) : t("system.loading")}
        tone={readiness.data?.database === "ok" ? "ok" : readiness.data ? "bad" : undefined}
      />
      {readiness.data?.schema_revision !== undefined && <Row label={t("system.schemaRevision")} value={readiness.data.schema_revision ?? "—"} />}
      {liveness.data.version && <Row label={t("system.version")} value={liveness.data.version} />}
      {liveness.data.commit && <Row label={t("system.commit")} value={liveness.data.commit} />}
      {liveness.data.environment && <Row label={t("system.environment")} value={lookup(`system.deployment.${liveness.data.environment}`) ?? liveness.data.environment} />}
    </div>
  );
}

/** The deployment (with its color), version and short commit; it needs no session, so the login shows it too. */
export function DeploymentChip({ health }: { health: HealthSource }) {
  const liveness = useLiveness(health);
  const deployment = liveness.data?.environment;
  if (!liveness.data) return null;
  return (
    <span className="flex items-center gap-3">
      {deployment && (
        <span className={`rounded-sm border px-1.5 font-medium uppercase tracking-wide ${DEPLOYMENT_TONE[deployment] ?? DEPLOYMENT_TONE.dev}`}>
          {lookup(`system.deployment.${deployment}`) ?? deployment}
        </span>
      )}
      {liveness.data.version && (
        <span className="tabular-nums">
          v{liveness.data.version}
          {liveness.data.commit && <span className="opacity-70"> · {liveness.data.commit.slice(0, 7)}</span>}
        </span>
      )}
    </span>
  );
}

/**
 * The bar under every screen: deployment, version and health of the system, and a short code at the right (the
 * company in use). A click opens the full system status.
 */
export function StatusBar({ health, code }: { health: HealthSource; code?: string }) {
  const liveness = useLiveness(health);
  const readiness = useReadiness(health);
  const [open, setOpen] = useState(false);
  const healthy = liveness.isSuccess && readiness.data?.database === "ok";
  const known = liveness.isSuccess || liveness.isError;
  return (
    <footer className="sticky bottom-0 z-20 flex h-[var(--control-h-sm)] shrink-0 items-center gap-3 border-t border-[var(--line-strong)] bg-[var(--surface)] px-3 text-[11px] text-[var(--muted)] print:hidden">
      <button type="button" onClick={() => setOpen(true)} title={t("statusBar.open")} className="flex h-5 items-center gap-3 rounded-[var(--radius-sm)] px-1 hover:text-[var(--ink)]">
        <span aria-hidden className={`h-2 w-2 rounded-[var(--radius-pill)] ${!known ? "bg-[var(--line-strong)]" : healthy ? "bg-[var(--ok)]" : "bg-[var(--bad)]"}`} />
        <span className="sr-only">{healthy ? t("statusBar.healthy") : t("statusBar.unhealthy")}</span>
        <DeploymentChip health={health} />
      </button>
      {code && <span className="ml-auto font-medium tracking-wide">{code}</span>}
      <Dialog open={open} title={t("system.title")} onClose={() => setOpen(false)}>
        <SystemRows health={health} />
      </Dialog>
    </footer>
  );
}
