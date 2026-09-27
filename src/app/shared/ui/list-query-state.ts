import { type DestroyRef, effect, type WritableSignal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ActivatedRoute, ParamMap, Router } from "@angular/router";

const PAGE_PARAM = "page";
const STATUT_PARAM = "statut";
const Q_PARAM = "q";

const TRACKED_PARAMS = [PAGE_PARAM, STATUT_PARAM, Q_PARAM] as const;

export function parseListPage(paramMap: ParamMap): number {
  const raw = paramMap.get(PAGE_PARAM);
  if (!raw) {
    return 0;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 0;
  }
  return parsed - 1;
}

export function parseListStatut(
  paramMap: ParamMap,
  allowed?: readonly string[]
): string | null {
  const raw = paramMap.get(STATUT_PARAM);
  if (!raw) {
    return null;
  }
  if (allowed && !allowed.includes(raw)) {
    return null;
  }
  return raw;
}

export function parseListSearch(paramMap: ParamMap): string {
  return paramMap.get(Q_PARAM)?.trim() ?? "";
}

export function buildListQueryParams(input: {
  page: number;
  q?: string;
  statut?: string | null;
}): Record<string, string | null> {
  const params: Record<string, string | null> = {};
  params[PAGE_PARAM] = input.page > 0 ? String(input.page + 1) : null;
  params[STATUT_PARAM] = input.statut ?? null;
  params[Q_PARAM] =
    input.q !== undefined && input.q.length > 0 ? input.q : null;
  return params;
}

function paramMapsMatch(
  current: ParamMap,
  next: Record<string, string | null>
): boolean {
  for (const key of TRACKED_PARAMS) {
    const currentValue = current.get(key);
    const nextValue = next[key];
    if ((currentValue ?? null) !== (nextValue ?? null)) {
      return false;
    }
  }
  return true;
}

export interface ListQuerySignals {
  page: WritableSignal<number>;
  q?: WritableSignal<string>;
  searchDraft?: WritableSignal<string>;
  statut?: WritableSignal<string | null>;
}

export interface ListQueryConfig {
  searchResetsPage?: boolean;
  statutValues?: readonly string[];
}

/** Mirror list toolbar state in the URL (`page`, `statut`, `q`). */
export function connectListQueryState(
  route: ActivatedRoute,
  router: Router,
  destroyRef: DestroyRef,
  signals: ListQuerySignals,
  config: ListQueryConfig = {}
): void {
  let applyingFromRoute = false;

  const applyFromParams = (paramMap: ParamMap): void => {
    applyingFromRoute = true;
    signals.page.set(parseListPage(paramMap));
    if (signals.statut) {
      signals.statut.set(parseListStatut(paramMap, config.statutValues));
    }
    const query = parseListSearch(paramMap);
    if (signals.q) {
      signals.q.set(query);
    }
    if (signals.searchDraft) {
      signals.searchDraft.set(query);
    }
    queueMicrotask(() => {
      applyingFromRoute = false;
    });
  };

  applyFromParams(route.snapshot.queryParamMap);

  route.queryParamMap
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((paramMap) => {
      applyFromParams(paramMap);
    });

  if (signals.q && config.searchResetsPage) {
    effect(() => {
      signals.q?.();
      if (!applyingFromRoute) {
        signals.page.set(0);
      }
    });
  }

  effect(() => {
    const nextParams = buildListQueryParams({
      page: signals.page(),
      q: signals.q?.(),
      statut: signals.statut?.(),
    });
    if (paramMapsMatch(route.snapshot.queryParamMap, nextParams)) {
      return;
    }
    void router.navigate([], {
      queryParams: nextParams,
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  });
}
