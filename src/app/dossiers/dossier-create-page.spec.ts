import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import type { WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import type { DossierDraft } from "./dossier";
import { DossierCreatePage } from "./dossier-create-page";

const marchandisesPage = {
  content: [
    {
      actif: true,
      classeAdr: null,
      code: "MARCH-PAL",
      famille: "Palettes standard",
      gerbable: true,
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      libelle: "Palettes standard",
      numeroOnu: null,
    },
  ],
  pageNumber: 0,
  pageSize: 50,
  totalElements: 1,
  totalPages: 1,
};

describe("DossierCreatePage", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DossierCreatePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it("loads commandes and sites for the form", async () => {
    const fixture = TestBed.createComponent(DossierCreatePage);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((req) => req.url === "/api/v1/commandes")
      .flush({
        content: [
          {
            clientId: "11111111-1111-1111-1111-111111111111",
            dateSouhaitee: "2026-09-10",
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            lignes: [
              {
                marchandiseId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
                nbColis: 10,
                poidsKg: 500,
                volumeM3: 2.5,
              },
            ],
            prixNegocie: { devise: "EUR", montant: 1500 },
            reference: "CMD-2026-00001",
            statut: "CONFIRMEE",
          },
        ],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 1,
        totalPages: 1,
      });
    http
      .expectOne((req) => req.url === "/api/v1/sites")
      .flush({
        content: [
          {
            actif: true,
            code: "SITE-PARIS",
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            libelle: "Paris Nord",
          },
        ],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 1,
        totalPages: 1,
      });
    http
      .expectOne((req) => req.url === "/api/v1/marchandises")
      .flush(marchandisesPage);

    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.componentInstance as unknown as {
      commandeSelectOptions: () => readonly { label: string }[];
      marchandiseSelectOptions: () => readonly { label: string }[];
      siteSelectOptions: () => readonly { label: string }[];
    };
    expect(
      page
        .commandeSelectOptions()
        .some((option) => option.label.includes("CMD-2026-00001"))
    ).toBe(true);
    expect(
      page
        .siteSelectOptions()
        .some((option) => option.label.includes("SITE-PARIS"))
    ).toBe(true);
    expect(
      page
        .marchandiseSelectOptions()
        .some((option) => option.label.includes("MARCH-PAL"))
    ).toBe(true);
    http.verify();
  });

  it("prefills marchandise from the first ligne when a commande is selected", async () => {
    const fixture = TestBed.createComponent(DossierCreatePage);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((req) => req.url === "/api/v1/commandes")
      .flush({
        content: [
          {
            clientId: "11111111-1111-1111-1111-111111111111",
            dateSouhaitee: "2026-09-10",
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            lignes: [
              {
                marchandiseId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
                nbColis: 12,
                poidsKg: 600,
                volumeM3: 3.2,
              },
            ],
            prixNegocie: { devise: "EUR", montant: 1500 },
            reference: "CMD-2026-00001",
            statut: "CONFIRMEE",
          },
        ],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 1,
        totalPages: 1,
      });
    http
      .expectOne((req) => req.url === "/api/v1/sites")
      .flush({
        content: [],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 0,
        totalPages: 0,
      });
    http
      .expectOne((req) => req.url === "/api/v1/marchandises")
      .flush(marchandisesPage);

    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.componentInstance as unknown as {
      draft: WritableSignal<DossierDraft>;
    };
    page.draft.update((current) => ({
      ...current,
      commandeId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    }));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(page.draft().lignes[0]?.marchandiseId).toBe(
      "dddddddd-dddd-dddd-dddd-dddddddddddd"
    );

    const compiled = fixture.nativeElement as HTMLElement;
    const poidsInput = compiled.querySelector("#poidsKg-0") as HTMLInputElement;
    expect(poidsInput.value).toBe("600");

    http.verify();
  });

  it("shows French validation messages after an empty submit", async () => {
    const fixture = TestBed.createComponent(DossierCreatePage);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((req) => req.url === "/api/v1/commandes")
      .flush({
        content: [
          {
            clientId: "11111111-1111-1111-1111-111111111111",
            dateSouhaitee: "2026-09-10",
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            lignes: [
              {
                marchandiseId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
                nbColis: 10,
                poidsKg: 500,
                volumeM3: 2.5,
              },
            ],
            prixNegocie: { devise: "EUR", montant: 1500 },
            reference: "CMD-2026-00001",
            statut: "CONFIRMEE",
          },
        ],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 1,
        totalPages: 1,
      });
    http
      .expectOne((req) => req.url === "/api/v1/sites")
      .flush({
        content: [
          {
            actif: true,
            code: "SITE-PARIS",
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            libelle: "Paris Nord",
          },
        ],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 1,
        totalPages: 1,
      });
    http
      .expectOne((req) => req.url === "/api/v1/marchandises")
      .flush(marchandisesPage);

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector("form");
    expect(form).not.toBeNull();
    form?.requestSubmit();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.textContent).toContain("Certains champs sont à corriger.");
    expect(compiled.textContent).toContain(
      "La commande confirmée est obligatoire."
    );
    expect(compiled.textContent).toContain(
      "Le site de chargement est obligatoire."
    );
    expect(compiled.textContent).toContain(
      "Le site de déchargement est obligatoire."
    );
    expect(compiled.textContent).toContain(
      "Ligne 1 : choisissez une marchandise du catalogue."
    );
    http.verify();
  });
});
