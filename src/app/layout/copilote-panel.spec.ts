import { OverlayContainer } from "@angular/cdk/overlay";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AUTH_DEMO_TEST_PROVIDERS } from "../core/auth/auth-test-providers";
import type { EtatCopilote } from "../ia/copilote";
import { CopiloteStore, type MessageVue } from "../ia/copilote-store";
import { CopiloteBouton } from "./copilote-bouton";
import { CopiloteSheetService } from "./copilote-sheet.service";

const ETAT_OK: EtatCopilote = {
  base: "UP",
  fournisseur: "api.groq.com",
  llm: "UP",
  modele: "llama-3.3-70b-versatile",
  operationnel: true,
  serviceIa: true,
};

function message(partiel: Partial<MessageVue>): MessageVue {
  return {
    contenu: "",
    creeLe: "2026-09-23T10:00:00Z",
    erreur: null,
    id: "x",
    note: null,
    outils: [],
    role: "assistant",
    sources: [],
    statut: "complet",
    ...partiel,
  };
}

describe("CopilotePanel", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopiloteBouton],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...AUTH_DEMO_TEST_PROVIDERS,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(CopiloteSheetService).fermer();
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  async function ouvrir(etat: EtatCopilote = ETAT_OK) {
    const bouton = TestBed.createComponent(CopiloteBouton);
    bouton.detectChanges();
    (bouton.nativeElement as HTMLElement).querySelector("button")?.click();
    bouton.detectChanges();
    await bouton.whenStable();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne("/api/v1/ia/copilote/conversations").flush([
      {
        creeLe: "2026-09-23T10:00:00Z",
        id: "c1",
        modifieLe: "2026-09-23T10:00:00Z",
        titre: "Consommation carburant",
      },
    ]);
    http.expectOne("/api/v1/ia/copilote/etat").flush(etat);
    await bouton.whenStable();
    bouton.detectChanges();

    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    return { compiled: overlay, fixture: bouton, http };
  }

  it("opens as a right-side sheet with history, suggestions and service status", async () => {
    const { compiled, http } = await ouvrir();

    expect(compiled.querySelector("#app-copilote-panel")).not.toBeNull();
    expect(compiled.querySelector("[data-slot='sheet-content']")).not.toBeNull();
    expect(
      compiled.querySelector(".copilote-historique")?.textContent
    ).toContain("Consommation carburant");
    expect(compiled.textContent).toContain("Quels voyages sont en cours ?");
    expect(compiled.querySelector(".copilote-etat--ok")?.textContent).toContain(
      "En ligne"
    );
    expect(compiled.querySelector(".copilote-bandeau")).toBeNull();
    http.verify();
  });

  it("warns when the LLM API key is rejected", async () => {
    const { compiled } = await ouvrir({
      ...ETAT_OK,
      llm: "CLE_INVALIDE",
      operationnel: false,
    });

    expect(
      compiled.querySelector(".copilote-etat--hors_ligne")?.textContent
    ).toContain("Clé API invalide");
    expect(compiled.querySelector(".copilote-bandeau")?.textContent).toContain(
      "LLM_API_KEY"
    );
  });

  it("shows send status on user messages and renders answers safely", async () => {
    const { compiled, fixture } = await ouvrir();
    TestBed.inject(CopiloteStore).messages.set([
      message({ contenu: "Question 1", id: "u1", role: "user" }),
      message({
        contenu: "**VOY-1** <script>alert(1)</script>",
        id: "m1",
        outils: [
          {
            libelle: "Recherche des voyages",
            nom: "rechercher_voyages",
            statut: "fin",
          },
        ],
        sources: [{ id: "v1", reference: "VOY-1", type: "VOYAGE" }],
      }),
      message({
        contenu: "Question 2",
        id: "u2",
        role: "user",
        statut: "erreur",
      }),
    ]);
    fixture.detectChanges();

    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const statuts = [
      ...overlay.querySelectorAll(".copilote-envoi-statut"),
    ].map((e) => e.textContent?.trim());
    expect(statuts).toEqual(["Envoyé", "Non envoyé"]);
    const markdown = overlay.querySelector(".copilote-markdown");
    expect(markdown?.querySelector("strong")?.textContent).toBe("VOY-1");
    expect(markdown?.querySelector("script")).toBeNull();
    expect(
      overlay.querySelector("a.copilote-source")?.getAttribute("href")
    ).toBe("/voyages/v1");
    expect(
      overlay.querySelector('button[aria-label="Réponse utile"]')
    ).not.toBeNull();
  });

  it("closes when the sheet close control is clicked", async () => {
    const { compiled, fixture } = await ouvrir();
    expect(compiled.querySelector("#app-copilote-panel")).not.toBeNull();

    const close = compiled.querySelector(
      '[data-testid="z-close-header-button"]'
    ) as HTMLButtonElement | null;
    expect(close).not.toBeNull();
    close?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 250));
    fixture.detectChanges();

    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    expect(overlay.querySelector("#app-copilote-panel")).toBeNull();
    expect(TestBed.inject(CopiloteStore).ouvert()).toBe(false);
  });
});
