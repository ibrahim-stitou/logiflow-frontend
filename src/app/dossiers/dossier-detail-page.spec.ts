import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AUTH_DEMO_TEST_PROVIDERS } from "../core/auth/auth-test-providers";
import { DossierDetailPage } from "./dossier-detail-page";

describe("DossierDetailPage", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DossierDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...AUTH_DEMO_TEST_PROVIDERS,
      ],
    }).compileComponents();
  });

  it("loads a dossier by id", async () => {
    const fixture = TestBed.createComponent(DossierDetailPage);
    fixture.componentRef.setInput("id", "22222222-2222-2222-2222-222222222222");
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne(
        (req) =>
          req.url === "/api/v1/dossiers/22222222-2222-2222-2222-222222222222"
      )
      .flush({
        carrosserieRequise: null,
        commandeId: "11111111-1111-1111-1111-111111111111",
        contientAdr: false,
        documents: [],
        familleMarchandise: "Palettes standard",
        groupable: true,
        id: "22222222-2222-2222-2222-222222222222",
        lignesMarchandise: [
          {
            classeAdr: null,
            gerbable: true,
            marchandiseId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
            nbColis: 10,
            numeroOnu: null,
            poidsKg: 500,
            volumeM3: 2.5,
          },
        ],
        nbPalettes: 10,
        poidsBrutKg: 500,
        reference: "DT-2026-00001",
        segments: [
          {
            fenetre: {
              debut: "2026-09-07T06:00:00.000Z",
              fin: "2026-09-07T08:00:00.000Z",
            },
            ordre: 0,
            realiseLe: null,
            siteId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            type: "CHARGEMENT",
          },
          {
            fenetre: {
              debut: "2026-09-08T12:00:00.000Z",
              fin: "2026-09-08T14:00:00.000Z",
            },
            ordre: 1,
            realiseLe: null,
            siteId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            type: "DECHARGEMENT",
          },
        ],
        statut: "CREE",
        temperatureRequise: null,
        typeTransport: "NATIONAL",
        volumeM3: 2.5,
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
          {
            actif: true,
            code: "SITE-LYON",
            id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            libelle: "Lyon Sud",
          },
        ],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 2,
        totalPages: 1,
      });
    http
      .expectOne((req) => req.url === "/api/v1/marchandises")
      .flush({
        content: [
          {
            actif: true,
            classeAdr: null,
            code: "MARCH-PAL",
            famille: "Palettes",
            gerbable: true,
            id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
            libelle: "Palettes",
            numeroOnu: null,
          },
        ],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 1,
        totalPages: 1,
      });
    http
      .expectOne((req) => req.url === "/api/v1/commandes")
      .flush({
        content: [
          {
            clientId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            dateSouhaitee: "2026-09-10",
            id: "11111111-1111-1111-1111-111111111111",
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

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("DT-2026-00001");
    expect(compiled.textContent).toContain("CMD-2026-00001 — 10/09/2026");
    expect(compiled.textContent).not.toContain(
      "11111111-1111-1111-1111-111111111111"
    );
    expect(compiled.textContent).toContain("MARCH-PAL — Palettes");
    expect(compiled.textContent).toContain("SITE-PARIS — Paris Nord");
    expect(compiled.textContent).toContain("SITE-LYON — Lyon Sud");
    expect(compiled.textContent).not.toContain(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    );
    http.verify();
  });
});
