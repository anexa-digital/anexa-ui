import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ThemeMenu } from "./ui/theme-menu";
import { ToastProvider } from "./ui/toast";

/**
 * The frame of every screen: a header with the app's name, its menu and whatever the app puts at the right (the
 * company in use, the person, «Cerrar sesión»), the page, and a footer (the status bar). Toasts live here.
 */
export function AppShell({ name, nav, right, footer, children }: { name: ReactNode; nav: ReactNode; right?: ReactNode; footer?: ReactNode; children?: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-11 items-center gap-3 border-b border-[var(--line-strong)] bg-[var(--surface)] px-3 print:hidden md:gap-5 md:px-4">
          <span className="font-semibold text-[var(--accent)]">{name}</span>
          {nav}
          <div className="ml-auto flex shrink-0 items-center gap-3 whitespace-nowrap">
            <ThemeMenu />
            {right}
          </div>
        </header>
        <main className="flex-1 p-4 print:p-0">{children ?? <Outlet />}</main>
        {footer}
      </div>
    </ToastProvider>
  );
}
