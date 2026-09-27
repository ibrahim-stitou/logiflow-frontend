import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import type { PageResponse } from "../api/page-response";
import { SessionUtilisateur } from "../auth/session";
import {
  PALETTE_ENTITY_CLIENT_SCAN_SIZE,
  PALETTE_ENTITY_PAGE_SIZE,
  type PaletteEntitySource,
  paletteEntityQueryReady,
  paletteEntitySourcesForRoles,
  paletteItemsFromPage,
} from "./palette-entity-search";
import type { PaletteItem } from "./palette-items";

const PALETTE_ENTITY_DEBOUNCE_MS = 200;

/** Debounced API lookup of entity refs for the App Shell palette. */
@Injectable({ providedIn: "root" })
export class PaletteEntitySearchStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionUtilisateur);

  private searchGeneration = 0;
  private debounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  readonly loading = signal(false);
  readonly items = signal<readonly PaletteItem[]>([]);

  setQuery(query: string): void {
    this.clearDebounceTimer();
    const trimmed = query.trim();

    if (!paletteEntityQueryReady(trimmed)) {
      this.searchGeneration += 1;
      this.loading.set(false);
      this.items.set([]);
      return;
    }

    this.loading.set(true);
    const generation = ++this.searchGeneration;
    this.debounceTimer = globalThis.setTimeout(() => {
      this.debounceTimer = null;
      void this.runSearch(trimmed, generation);
    }, PALETTE_ENTITY_DEBOUNCE_MS);
  }

  clear(): void {
    this.clearDebounceTimer();
    this.searchGeneration += 1;
    this.loading.set(false);
    this.items.set([]);
  }

  private clearDebounceTimer(): void {
    if (this.debounceTimer !== null) {
      globalThis.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private async runSearch(query: string, generation: number): Promise<void> {
    const roles = this.session.utilisateur()?.roles ?? [];
    const sources = paletteEntitySourcesForRoles(roles);

    try {
      const pages = await Promise.all(
        sources.map((source) => this.fetchSource(source, query))
      );
      if (generation !== this.searchGeneration) {
        return;
      }
      this.items.set(pages.flat());
    } catch {
      if (generation === this.searchGeneration) {
        this.items.set([]);
      }
    } finally {
      if (generation === this.searchGeneration) {
        this.loading.set(false);
      }
    }
  }

  private fetchSource(
    source: PaletteEntitySource,
    query: string
  ): Promise<PaletteItem[]> {
    const params: Record<string, string | number> = source.serverSearch
      ? { page: 0, q: query, size: PALETTE_ENTITY_PAGE_SIZE }
      : { page: 0, size: PALETTE_ENTITY_CLIENT_SCAN_SIZE };

    return firstValueFrom(
      this.http.get<PageResponse<unknown>>(
        `${environment.apiBaseUrl}/${source.id}`,
        { params }
      )
    ).then((page) => paletteItemsFromPage(source, page, query));
  }
}
