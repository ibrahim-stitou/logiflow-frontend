import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { SessionUtilisateur } from "../auth/session";
import {
  paletteEntityQueryReady,
  paletteEntitySourcesForRoles,
  paletteItemsFromPage,
  siteToPaletteItem,
} from "./palette-entity-search";
import { PaletteEntitySearchStore } from "./palette-entity-search-store";

describe("paletteEntityQueryReady", () => {
  it("requires at least two characters", () => {
    expect(paletteEntityQueryReady("")).toBe(false);
    expect(paletteEntityQueryReady("l")).toBe(false);
    expect(paletteEntityQueryReady("ly")).toBe(true);
  });
});

describe("paletteEntitySourcesForRoles", () => {
  it("includes sites for COMMERCIAL but not utilisateurs", () => {
    const sources = paletteEntitySourcesForRoles(["COMMERCIAL"]);
    expect(sources.map((source) => source.id)).toEqual(
      expect.arrayContaining(["sites", "commandes"])
    );
    expect(sources.map((source) => source.id)).not.toContain("utilisateurs");
  });

  it("includes utilisateurs for ADMINISTRATEUR", () => {
    const sources = paletteEntitySourcesForRoles(["ADMINISTRATEUR"]);
    expect(sources.map((source) => source.id)).toContain("utilisateurs");
  });
});

describe("paletteItemsFromPage", () => {
  it("maps sites from a server search page", () => {
    const source = paletteEntitySourcesForRoles(["EXPLOITANT"]).find(
      (entry) => entry.id === "sites"
    );
    expect(source).toBeTruthy();
    const items = paletteItemsFromPage(
      source!,
      {
        content: [
          {
            actif: true,
            adresse: null,
            clientId: null,
            code: "SITE-DEMO-LYON",
            contraintesAcces: null,
            id: "11111111-1111-1111-1111-111111111111",
            libelle: "Lyon",
            localisation: { latitude: 45.75, longitude: 4.85 },
          },
        ],
        pageNumber: 0,
        pageSize: 8,
        totalElements: 1,
        totalPages: 1,
      },
      "lyon"
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.path).toBe("/sites/11111111-1111-1111-1111-111111111111");
    expect(items[0]?.section).toBe("Références");
  });

  it("maps dossiers from a server search page", () => {
    const source = paletteEntitySourcesForRoles(["EXPLOITANT"]).find(
      (entry) => entry.id === "dossiers"
    );
    expect(source).toBeTruthy();
    const items = paletteItemsFromPage(
      source!,
      {
        content: [
          {
            commandeId: "1",
            id: "22222222-2222-2222-2222-222222222222",
            reference: "DT-2026-00001",
            statut: "CREE",
            typeTransport: "NATIONAL",
          },
        ],
        pageNumber: 0,
        pageSize: 8,
        totalElements: 1,
        totalPages: 1,
      },
      "00001"
    );

    expect(items.map((item) => item.label)).toEqual(["DT-2026-00001"]);
    expect(source?.serverSearch).toBe(true);
  });
});

describe("siteToPaletteItem", () => {
  it("builds a référence row", () => {
    const source = paletteEntitySourcesForRoles(["EXPLOITANT"]).find(
      (entry) => entry.id === "sites"
    );
    expect(source).toBeTruthy();
    const item = siteToPaletteItem(source!, {
      actif: true,
      adresse: null,
      clientId: null,
      code: "SITE-DEMO-CASA",
      contraintesAcces: null,
      id: "44444444-4444-4444-4444-444444444444",
      libelle: "Casablanca",
      localisation: { latitude: 33.57, longitude: -7.59 },
    });

    expect(item.kind).toBe("entity");
    expect(item.badge).toBe("Site");
    expect(item.label).toBe("SITE-DEMO-CASA — Casablanca");
  });
});

describe("PaletteEntitySearchStore", () => {
  let http: HttpTestingController;
  let store: PaletteEntitySearchStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PaletteEntitySearchStore,
        {
          provide: SessionUtilisateur,
          useValue: {
            connecter: async () => {},
            deconnecter: async () => {},
            hasAnyRole: () => true,
            isSignedIn: () => true,
            jetonAcces: async () => null,
            utilisateur: () => ({
              login: "admin",
              nom: null,
              roles: ["ADMINISTRATEUR"],
            }),
          },
        },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(PaletteEntitySearchStore);
  });

  afterEach(() => {
    http.verify();
    store.clear();
  });

  it("debounces and loads site matches", async () => {
    store.setQuery("lyon");
    expect(store.loading()).toBe(true);

    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, 250);
    });

    const siteRequest = http.expectOne(
      (req) => req.url === "/api/v1/sites" && req.params.get("q") === "lyon"
    );
    siteRequest.flush({
      content: [
        {
          actif: true,
          adresse: null,
          clientId: null,
          code: "SITE-DEMO-LYON",
          contraintesAcces: null,
          id: "11111111-1111-1111-1111-111111111111",
          libelle: "Lyon",
          localisation: { latitude: 45.75, longitude: 4.85 },
        },
      ],
      pageNumber: 0,
      pageSize: 8,
      totalElements: 1,
      totalPages: 1,
    });

    for (const path of [
      "clients",
      "marchandises",
      "vehicules",
      "remorques",
      "chauffeurs",
      "commandes",
      "dossiers",
      "voyages",
      "utilisateurs",
    ]) {
      const request = http.expectOne(
        (req) => req.url === `/api/v1/${path}` && req.params.get("q") === "lyon"
      );
      request.flush({
        content: [],
        pageNumber: 0,
        pageSize: 8,
        totalElements: 0,
        totalPages: 0,
      });
    }

    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, 0);
    });

    expect(store.loading()).toBe(false);
    expect(store.items().some((item) => item.label.includes("LYON"))).toBe(
      true
    );
  });

  it("clears results for short queries", () => {
    store.setQuery("ly");
    expect(store.loading()).toBe(true);
    store.setQuery("l");
    expect(store.loading()).toBe(false);
    expect(store.items()).toEqual([]);
    http.expectNone(() => true);
  });
});
