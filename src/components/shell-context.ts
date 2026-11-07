import { createContext, useContext } from "react";

import type { Layout } from "../lib/theme";
import type { NavSection } from "./nav-menu";

/** What the shell decided for its parts: the layout in force and the sections of the menu. */
export type ShellState = { layout: Layout; sections: NavSection[] };
export const ShellContext = createContext<ShellState>({ layout: "top", sections: [] });
export const useShell = () => useContext(ShellContext);
