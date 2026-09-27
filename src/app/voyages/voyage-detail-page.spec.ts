import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { VoyageDetailPage } from "./voyage-detail-page";

const VOYAGE_ID = "55555555-5555-5555-5555-555555555555";

const EMPTY_PAGE = {
  content: [],
  pageNumber: 0,
  pageSize: 100,
  totalElements: 0,
  totalPages: 0,
};

function flushDetailPageRequest(
  req: ReturnType<HttpTestingController["match"]>[number]
): void {
  const { url } = req.request;
  if (url.includes("/dossiers") || url.includes("/sites")) {
    req.flush(EMPTY_PAGE);
    return;
  }
  if (
    url.includes("/vehicules") ||
    url.includes("/remorques") ||
    url.includes("/chauffeurs")
  ) {
    req.flush({ ...EMPTY_PAGE, pageSize: 50 });
    return;
  }
  if (url.includes("/ia/itineraires/geometrie")) {
    req.flush({ geometrie: [] });
    return;
  }
  if (url.includes("/voyages/") && url.endsWith("/evenements")) {
    req.flush([]);
    return;
  }
  if (url.includes("/voyages/")) {
    req.flush({
      affectations: [],
      arriveePrevue: "2026-01-01T12:00:00Z",
      departPrevu: "2026-01-01T08:00:00Z",
      dossierIds: [],
      id: VOYAGE_ID,
      portee: "NATIONAL",
      reference: "V-TEST",
      remorqueId: null,
      statut: "PLANIFIE",
      tauxRemplissage: 0,
      trajet: {
        distanceTotaleKm: 0,
        dureeConduiteMin: 0,
        dureeTotaleMin: 0,
        etapes: [],
      },
      typeVoyage: "SIMPLE",
      vehiculeId: "11111111-1111-1111-1111-111111111111",
    });
    return;
  }
  if (req.request.method === "GET") {
    req.flush([]);
    return;
  }
  req.flush({});
}

describe("VoyageDetailPage", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoyageDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it("requests fuel stops for the voyage", () => {
    const fixture = TestBed.createComponent(VoyageDetailPage);
    fixture.componentRef.setInput("id", VOYAGE_ID);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    const priseRequest = http.expectOne(
      (req) =>
        req.url === "/api/v1/prises-carburant" &&
        req.params.get("voyageId") === VOYAGE_ID
    );
    expect(priseRequest.request.method).toBe("GET");
    priseRequest.flush({
      content: [],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 0,
      totalPages: 0,
    });

    for (const req of http.match(() => true)) {
      flushDetailPageRequest(req);
    }

    http.verify();
  });
});
