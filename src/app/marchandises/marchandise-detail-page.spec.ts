import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { MarchandiseDetailPage } from "./marchandise-detail-page";

describe("MarchandiseDetailPage", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarchandiseDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it("renders the marchandise returned by the API", async () => {
    const fixture = TestBed.createComponent(MarchandiseDetailPage);
    fixture.componentRef.setInput("id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne(
        (req) =>
          req.url ===
          "/api/v1/marchandises/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
      )
      .flush({
        actif: true,
        classeAdr: null,
        code: "PAL-EUR",
        famille: "Palettes",
        gerbable: true,
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        libelle: "Palette EUR",
        numeroOnu: null,
      });

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("PAL-EUR");
    expect(compiled.textContent).toContain("Désactiver");
    http.verify();
  });
});
