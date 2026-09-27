import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { VehiculesPage } from "./vehicules-page";

describe("VehiculesPage", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculesPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it("renders vehicules returned by the API", async () => {
    const fixture = TestBed.createComponent(VehiculesPage);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne((req) => req.url === "/api/v1/vehicules");
    request.flush({
      content: [
        {
          chargeUtileKg: 9000,
          heuresMoteur: 12,
          id: "33333333-3333-3333-3333-333333333333",
          immatriculation: "AB-123-CD",
          kilometrage: 40_000,
          ptacKg: 19_000,
          statut: "DISPONIBLE",
          type: "TRACTEUR",
        },
      ],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 1,
      totalPages: 1,
    });

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("AB-123-CD");
    expect(compiled.textContent).toContain("Tracteur");
    http.verify();
  });

  it("shows an error when the backend is unreachable", async () => {
    const fixture = TestBed.createComponent(VehiculesPage);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((req) => req.url === "/api/v1/vehicules")
      .error(new ProgressEvent("error"));

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Backend injoignable");
    http.verify();
  });
});
