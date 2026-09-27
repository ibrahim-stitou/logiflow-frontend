import type { HttpRequest } from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AUTH_DEMO_TEST_PROVIDERS } from "../core/auth/auth-test-providers";
import { VehiculeDetailPage } from "./vehicule-detail-page";

const VEHICULE_ID = "33333333-3333-3333-3333-333333333333";
const ESSAIS_MAX = 50;

/**
 * Attend qu'une requête soit émise : les sections de la page (documents, maintenance) ne sont
 * rendues, et ne chargent leurs données, qu'une fois le véhicule reçu ; le nombre de cycles
 * nécessaires varie selon la machine.
 */
async function requeteAttendue(
  http: HttpTestingController,
  critere: (req: HttpRequest<unknown>) => boolean
): Promise<TestRequest> {
  for (let essai = 0; essai < ESSAIS_MAX; essai += 1) {
    const [trouvee] = http.match(critere);
    if (trouvee) {
      return trouvee;
    }
    // biome-ignore lint/performance/noAwaitInLoops: attente volontairement séquentielle (un cycle à la fois).
    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();
  }
  return http.expectOne(critere);
}

describe("VehiculeDetailPage", () => {
  beforeEach(async () => {
    // Session démo partagée entre les tests (sessionStorage) : on part d'un état vierge pour
    // que l'affichage des sections dépendant du rôle (maintenance) soit déterministe.
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [VehiculeDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...AUTH_DEMO_TEST_PROVIDERS,
      ],
    }).compileComponents();
  });

  it("renders the vehicule returned by the API", async () => {
    const fixture = TestBed.createComponent(VehiculeDetailPage);
    fixture.componentRef.setInput("id", VEHICULE_ID);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    (
      await requeteAttendue(
        http,
        (req) => req.url === `/api/v1/vehicules/${VEHICULE_ID}`
      )
    ).flush({
      chargeUtileKg: 9000,
      heuresMoteur: 12,
      id: VEHICULE_ID,
      immatriculation: "AB-123-CD",
      kilometrage: 40_000,
      ptacKg: 19_000,
      statut: "DISPONIBLE",
      type: "TRACTEUR",
    });

    (
      await requeteAttendue(
        http,
        (req) =>
          req.url === "/api/v1/scores-sante/dernier" &&
          req.params.get("vehiculeId") === VEHICULE_ID
      )
    ).flush(null);

    (
      await requeteAttendue(
        http,
        (req) =>
          req.url === "/api/v1/documents" &&
          req.params.get("typeEntite") === "VEHICULE" &&
          req.params.get("entiteId") === VEHICULE_ID
      )
    ).flush([]);

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("AB-123-CD");
    expect(compiled.textContent).toContain("Compteurs");
    expect(compiled.textContent).toContain("Score de santé");
    expect(compiled.textContent).not.toContain("Chargement impossible.");
    expect(compiled.textContent).toContain("Aucun document");
    http.verify();
  });
});
