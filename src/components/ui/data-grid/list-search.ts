import { PAGE_SIZES } from "../pager";
import { parseFilters } from "./list-filters";
import { fromSortParam } from "./sort";

/**
 * What a server list keeps in the URL, so a shared link opens the same view: page, page size, order,
 * filters (JSON) and grouping. Defaults are left out, so the plain link stays plain.
 */
export type ListSearch = { page?: number; size?: number; sort?: string; filters?: string; group?: string };

export function validateListSearch(search: Record<string, unknown>, defaultSize: number): ListSearch {
  const out: ListSearch = {};
  const page = Number(search.page);
  if (Number.isInteger(page) && page > 1) out.page = page;
  const size = Number(search.size);
  if (PAGE_SIZES.includes(size) && size !== defaultSize) out.size = size;
  if (typeof search.sort === "string" && fromSortParam(search.sort).length) out.sort = search.sort;
  if (parseFilters(search.filters).length) out.filters = search.filters as string;
  if (typeof search.group === "string" && search.group) out.group = search.group;
  return out;
}

/** The changes a grid asks for, as the next URL search: any change other than paging goes back to page 1. */
export function nextListSearch<S extends ListSearch>(search: S, changes: Partial<S>, keepPage = false): S {
  const next = { ...search, ...(keepPage ? {} : { page: undefined }), ...changes };
  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined && value !== "")) as S;
}
