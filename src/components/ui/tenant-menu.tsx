import { t } from "../../i18n";
import { Icon } from "./icons";
import { Menu } from "./menu";

/** The company in use, in the header: a menu to switch when the person belongs to several, plain text otherwise. */
export function TenantMenu<T extends { id: string; name: string }>({ tenants, current, onSwitch, disabled }: { tenants: T[]; current: string | null; onSwitch: (id: string) => void; disabled?: boolean }) {
  const active = tenants.find((tenant) => tenant.id === current);
  if (tenants.length <= 1) {
    return (
      <span className="flex items-center gap-1.5 text-[var(--muted)]">
        <Icon name="building" className="h-4 w-4" />
        <span className="text-[var(--ink)]">{active?.name ?? tenants[0]?.name}</span>
      </span>
    );
  }
  return (
    <Menu
      label={t("ui.switchTenant")}
      align="right"
      items={tenants.map((tenant) => ({ id: tenant.id, label: tenant.name, checked: tenant.id === current, disabled, run: () => onSwitch(tenant.id) }))}
      className="flex h-[var(--control-h)] items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5 text-[var(--ink)] hover:bg-[var(--row-hover)]"
    >
      <Icon name="building" className="h-4 w-4 text-[var(--muted)]" />
      <span className="max-w-48 truncate">{active?.name ?? t("ui.tenant")}</span>
    </Menu>
  );
}
